# Migração: Polling → Supabase Realtime

## Contexto

O sistema de sorteios originalmente utilizava **polling a cada 2 segundos** para manter os dados atualizados na tela. Isso causava:

- Consumo desnecessário de rede e banco de dados
- Atualizações com até 2 segundos de atraso
- Requisições constantes mesmo quando não havia nenhuma mudança

Este documento descreve como foi feita a migração para **atualizações em tempo real** usando o Supabase Realtime.

---

## Como era antes (Polling)

Os hooks `useNumbers` e `useRaffleStatus` usavam `setInterval` para buscar dados periodicamente:

```typescript
// hooks/useNumbers.ts — ANTES
useEffect(() => {
  refresh();
  const interval = setInterval(refresh, 2000); // chamada a cada 2s
  return () => clearInterval(interval);
}, [refresh]);
```

```typescript
// hooks/useRaffleStatus.ts — ANTES
useEffect(() => {
  refresh();
  const interval = setInterval(refresh, 2000); // chamada a cada 2s
  return () => clearInterval(interval);
}, [refresh]);
```

Isso gerava GET /api/numbers e GET /api/status a cada 2 segundos, mesmo sem nenhuma mudança no banco.

---

## Tecnologia escolhida: Supabase Broadcast

O Supabase Realtime oferece três mecanismos:

| Mecanismo | Como funciona | Requisitos |
|---|---|---|
| `postgres_changes` | Escuta o WAL (Write Ahead Log) do PostgreSQL | JWT válido + Replication habilitada |
| `Presence` | Rastreia usuários online | Nenhum especial |
| **`Broadcast`** | **Pub/Sub via WebSocket** | **Nenhum — funciona com qualquer chave** |

### Por que Broadcast foi escolhido?

Durante a migração, identificamos que a chave `sb_publishable_*` (novo formato da Supabase) **não é um JWT**, o que impede o mecanismo `postgres_changes` de autorizar a subscription via WebSocket.

O **Broadcast** não depende de autorização JWT nem de replicação do banco — é um canal pub/sub simples e confiável, ideal para notificações leves como "algo mudou, busque os dados".

Posteriormente, a **anon key JWT** foi obtida e adicionada ao `.env.local`, o que também habilita o `postgres_changes` como mecanismo de backup.

---

## Arquitetura implementada

```
┌─────────────────────┐         ┌──────────────────────┐
│   Página Sorteio    │         │    Painel do Admin    │
│  (app/sorteio/[id]) │         │   (app/admin/page)    │
│                     │         │                       │
│  1. POST /api/reserve         │  useNumbers hook      │
│  2. refresh() local │         │  useRaffleStatus hook │
│  3. notifyRaffleChanged()     │  ↑ escutam broadcast  │
└──────────┬──────────┘         └──────────┬────────────┘
           │                               │
           ▼                               │
┌─────────────────────────────────────────────────────────┐
│              Supabase Realtime                          │
│              Canal: "raffle-live"                       │
│              Evento: "data-changed"                     │
│                                                         │
│  Publisher: qualquer página que faça uma mutação        │
│  Subscribers: todos os clientes conectados              │
└─────────────────────────────────────────────────────────┘
           │
           ▼
  Todos os clientes recebem o evento
  → refresh() chamado instantaneamente
  → GET /api/numbers ou /api/status atualiza o estado React
```

---

## Arquivos modificados

### 1. `package.json`
Adicionada a dependência:
```
@supabase/supabase-js
```

### 2. `.env.local`
Adicionadas as variáveis de ambiente:
```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt-anon-key>
```

> ⚠️ As variáveis precisam ter o prefixo `NEXT_PUBLIC_` para serem acessíveis no browser (client-side). O servidor Next.js as carrega na inicialização — é necessário reiniciar após alterações.

### 3. `lib/supabase.ts` *(novo arquivo)*

Inicializa o client Supabase e expõe a função de broadcast:

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

// Canal persistente para envio de notificações
let _notifyChannel: ReturnType<typeof supabase.channel> | null = null;

function getNotifyChannel() {
  if (!_notifyChannel) {
    _notifyChannel = supabase.channel("raffle-live");
    _notifyChannel.subscribe();
  }
  return _notifyChannel;
}

export function notifyRaffleChanged() {
  getNotifyChannel().send({
    type: "broadcast",
    event: "data-changed",
    payload: {},
  });
}
```

**Detalhes importantes:**
- O canal `_notifyChannel` é um **singleton em nível de módulo** — é criado apenas uma vez e reutilizado em todas as chamadas
- Isso evita criar e destruir conexões WebSocket a cada mutação
- O canal fica subscrito enquanto o módulo estiver carregado (vida útil da sessão do browser)

### 4. `hooks/useNumbers.ts`

**Antes:** `setInterval(refresh, 2000)`

**Depois:** subscription ao canal Supabase Broadcast

```typescript
useEffect(() => {
  refresh(); // busca inicial ao montar o componente

  const channel = supabase
    .channel("raffle-live")
    .on("broadcast", { event: "data-changed" }, () => {
      refresh(); // chamado instantaneamente ao receber o evento
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // cleanup ao desmontar
  };
}, [refresh]);
```

### 5. `hooks/useRaffleStatus.ts`

Mesma mudança do `useNumbers` — substitui `setInterval` por subscription ao broadcast.

### 6. `app/sorteio/[id]/page.tsx`

Após reserva bem-sucedida, notifica todos os clientes:

```typescript
await reserve(numeroSelecionado, nome);
// ... atualiza estado local ...
await refresh();
notifyRaffleChanged(); // ← novo: dispara o broadcast
```

### 7. `app/admin/page.tsx`

Após cada mutação administrativa:

```typescript
// Após criar sorteio (initRaffle)
await Promise.all([refreshNumbers(), refreshStatus()]);
notifyRaffleChanged();

// Após cancelar sorteio (cancelRaffle)
await Promise.all([refreshNumbers(), refreshStatus()]);
notifyRaffleChanged();

// Após realizar sorteio (draw)
await Promise.all([refreshStatus(), refreshHistory()]);
notifyRaffleChanged();
```

---

## Como o Supabase Broadcast funciona internamente

O Broadcast é um mecanismo de **pub/sub via WebSocket** mantido pelo Supabase Realtime:

1. Cada cliente que chama `supabase.channel("raffle-live").subscribe()` se conecta ao servidor Realtime via WebSocket e entra no tópico `raffle-live`
2. Quando qualquer cliente chama `.send({ type: "broadcast", event: "data-changed" })`, o servidor entrega o evento a **todos os outros clientes** no mesmo tópico
3. Os callbacks registrados com `.on("broadcast", { event: "data-changed" }, callback)` são executados imediatamente ao receber o evento

> **Diferença entre instâncias e tópicos:** Cada chamada a `supabase.channel("raffle-live")` cria uma nova instância de canal com ID único, mas todas compartilham o mesmo tópico no servidor Realtime. Eventos enviados por qualquer instância chegam a todas as outras instâncias subscritas ao mesmo tópico.

---

## Fluxo completo de uma reserva

```
[Participante]                    [Servidor]              [Admin / Outros clientes]
     │                                │                            │
     ├── POST /api/reserve ──────────►│                            │
     │                                ├── UPDATE raffle_numbers    │
     │◄── 200 OK ─────────────────────┤                            │
     │                                │                            │
     ├── refresh() (local)            │                            │
     │    └── GET /api/numbers        │                            │
     │◄── dados atualizados ──────────┤                            │
     │                                │                            │
     ├── notifyRaffleChanged()        │                            │
     │    └── WebSocket send ─────────┼──── "data-changed" ───────►│
     │                                │                            ├── refresh()
     │                                │                            │    └── GET /api/numbers
     │                                │◄── dados atualizados ──────┤
     │                                │                            │ ← UI atualiza ⚡
```

---

## Configuração necessária no Supabase

Para que o Realtime funcione, é necessário:

1. **Dashboard → Realtime → Enabled** para as tabelas `raffle_numbers` e `raffle_config`
   - Isso adiciona as tabelas à publicação de replicação do PostgreSQL
   - Necessário apenas para `postgres_changes` (o Broadcast não depende disso)

2. **Anon key JWT** no `.env.local`
   - Obtida em: Dashboard → Settings → API → `anon` `public`
   - Deve ser um JWT válido (formato `xxxxx.yyyyy.zzzzz`)
   - Chaves no formato `sb_publishable_*` não são aceitas pelo WebSocket Realtime

---

## Comparativo final

| Critério | Polling (antes) | Supabase Broadcast (depois) |
|---|---|---|
| Latência | Até 2.000ms | < 100ms |
| Requisições em idle | 1 a cada 2s por aba | 0 |
| Requisições após mutação | Na próxima janela (0–2s) | Imediata |
| Conexões simultâneas | 0 (HTTP puro) | 1 WebSocket por aba |
| Dependência de WAL/CDC | Não | Não |
| Dependência de JWT | Não | Sim (para autenticar o WebSocket) |
| Escalabilidade | Ruim (linear com usuários) | Boa (WebSocket é eficiente) |
