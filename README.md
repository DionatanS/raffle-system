# 🎲 Sistema de Sorteio Interno

> **Desenvolvido com Inteligência Artificial (Claude - Cursor AI)** para entrega rápida e ágil. O sistema está entrando em **fase de teste**. Caso o volume de requisições à API seja elevado, algumas comunicações em tempo real serão migradas de **polling** para **WebSockets**, garantindo melhor performance e menor carga no servidor.

---

## 🔐 Credenciais de Acesso — RH

| Campo    | Valor (padrão)     | Variável de Ambiente |
|----------|-------------------|----------------------|
| Usuário  | `rh.admin`        | `RH_USER`            |
| Senha    | `Rh@Sorteio2026!` | `RH_PASS`            |

> ⚠️ **Guarde em local seguro.** Essas credenciais dão acesso total ao painel de gerenciamento dos sorteios.
>
> **Configuração:** As credenciais podem ser definidas via variáveis de ambiente no arquivo `.env.local`. Se não definidas, os valores padrão acima serão usados (não recomendado para produção).

---

## 📋 Visão Geral

Sistema web interno para realização de sorteios entre colaboradores. O RH cria o sorteio, gera um link único e repassa para os participantes. Cada participante escolhe um número, e o RH realiza o sorteio quando ao menos 90% dos números estiverem preenchidos.

---

## 🗂️ Arquitetura

### Stack Tecnológica

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Framework    | Next.js 14 (App Router)           |
| Linguagem    | TypeScript                        |
| Banco        | SQLite via `better-sqlite3`       |
| Estilização  | TailwindCSS                       |
| Tempo real   | Polling a cada 2 segundos         |
| Autenticação | Cookie de sessão `httpOnly`       |

### Estrutura de Pastas

```
raffle-system/
├── app/
│   ├── page.tsx                  → Redireciona para /login
│   ├── login/page.tsx            → Tela de login do RH
│   ├── admin/page.tsx            → Painel do RH
│   ├── sorteio/
│   │   ├── page.tsx              → Redireciona para /sorteio/[id] atual
│   │   └── [id]/page.tsx         → Página do participante (link único por sorteio)
│   └── api/
│       ├── auth/login/route.ts   → POST: autenticação do RH
│       ├── auth/logout/route.ts  → POST: logout do RH
│       ├── init/route.ts         → POST: cria novo sorteio
│       ├── numbers/route.ts      → GET: lista todos os números
│       ├── reserve/route.ts      → POST: reserva um número
│       ├── draw/route.ts         → POST: realiza o sorteio
│       ├── status/route.ts       → GET: status atual do sorteio
│       ├── cancel/route.ts       → POST: cancela o sorteio em andamento
│       └── history/route.ts      → GET: histórico de sorteios realizados
├── components/
│   └── Modal.tsx                 → Modal reutilizável para entrada de nome
├── hooks/
│   ├── useNumbers.ts             → Busca números com polling (2s)
│   ├── useReserveNumber.ts       → Reserva de número
│   ├── useDraw.ts                → Realiza o sorteio
│   ├── useRaffleStatus.ts        → Status com polling (2s)
│   └── useHistory.ts             → Histórico com polling (2s)
├── services/
│   └── raffleService.ts          → Centraliza todas as chamadas à API
├── lib/
│   └── db.ts                     → Inicialização e funções do banco SQLite
├── types/
│   └── raffle.ts                 → Tipos TypeScript globais
├── middleware.ts                  → Proteção de rotas /admin
└── raffle.db                     → Banco de dados SQLite (gerado automaticamente)
```

---

## 🗃️ Banco de Dados

Arquivo: `raffle.db` (SQLite, criado automaticamente na raiz do projeto)

### Tabela `raffle_numbers`
Armazena os números de cada sorteio ativo.

| Coluna        | Tipo     | Descrição                         |
|---------------|----------|-----------------------------------|
| `id`          | INTEGER  | Chave primária                    |
| `number`      | INTEGER  | Número do bilhete (único)         |
| `name`        | TEXT     | Nome do participante (ou NULL)    |
| `is_reserved` | INTEGER  | `0` = disponível, `1` = reservado |

### Tabela `raffle_config`
Controla o estado global do sorteio.

| Coluna          | Tipo    | Descrição                                      |
|-----------------|---------|------------------------------------------------|
| `id`            | INTEGER | Chave primária                                 |
| `status`        | TEXT    | `idle` / `active` / `finished`                 |
| `winner_number` | INTEGER | Número sorteado (ou NULL)                      |
| `winner_name`   | TEXT    | Nome do ganhador (ou NULL)                     |
| `raffle_id`     | INTEGER | ID incremental do sorteio (muda a cada novo)   |

### Tabela `raffle_history`
Histórico permanente de todos os sorteios realizados.

| Coluna               | Tipo    | Descrição                         |
|----------------------|---------|-----------------------------------|
| `id`                 | INTEGER | Chave primária                    |
| `raffle_id`          | INTEGER | ID do sorteio                     |
| `winner_number`      | INTEGER | Número vencedor                   |
| `winner_name`        | TEXT    | Nome do vencedor                  |
| `total_participants` | INTEGER | Total de números reservados       |
| `created_at`         | TEXT    | Data/hora do sorteio              |

---

## 🔄 Fluxo de Funcionamento

```
RH faz login (/login)
        ↓
Acessa o painel (/admin)
        ↓
Define quantidade de números → clica em "Criar Sorteio"
        ↓
Sistema gera link único: /sorteio/{raffle_id}
        ↓
RH copia e compartilha o link com os participantes
        ↓
Participantes acessam o link, escolhem um número e informam o nome
        ↓
Quando ≥ 90% dos números estão reservados, botão "Sortear" é liberado
        ↓
RH clica em "Sortear Ganhador"
        ↓
Ganhador é exibido para todos (participantes e RH)
        ↓
Resultado salvo no histórico → sorteio encerrado
        ↓
RH pode iniciar novo sorteio
```

---

## 🌐 Rotas da API

| Método | Rota                  | Descrição                                         |
|--------|-----------------------|---------------------------------------------------|
| POST   | `/api/auth/login`     | Login do RH. Body: `{ usuario, senha }`           |
| POST   | `/api/auth/logout`    | Logout — remove o cookie de sessão                |
| POST   | `/api/init`           | Cria novo sorteio. Body: `{ total: number }`      |
| GET    | `/api/numbers`        | Retorna todos os números ordenados por `number`   |
| POST   | `/api/reserve`        | Reserva número. Body: `{ number, name }`          |
| POST   | `/api/draw`           | Sorteia um ganhador aleatório entre os reservados |
| GET    | `/api/status`         | Retorna status atual, ganhador e `raffle_id`      |
| POST   | `/api/cancel`         | Cancela o sorteio em andamento                    |
| GET    | `/api/history`        | Retorna histórico de todos os sorteios            |

---

## 🔐 Autenticação e Segurança

- Login via formulário com `usuario` + `senha`
- Sessão mantida por **cookie `httpOnly`** com validade de 8 horas
- Cookie com flag `secure` em produção e `sameSite: strict`
- Middleware Next.js protege todas as rotas `/admin/*` — redireciona para `/login` se não autenticado
- Sem JWT, sem banco de sessões — simples e eficiente para uso interno

---

## ⏱️ Tempo Real (Polling)

O sistema utiliza **polling a cada 2 segundos** para manter todos os clientes sincronizados:

- `useNumbers` → atualiza a grade de números
- `useRaffleStatus` → detecta início/fim do sorteio
- `useHistory` → atualiza o histórico no painel do RH

> **Nota sobre escalabilidade:** Em caso de alto volume de usuários simultâneos, o polling pode ser substituído por **WebSockets** (ex.: `socket.io`) nas comunicações de status e atualização de números em tempo real, reduzindo significativamente o número de requisições à API.

---

## 🖥️ Páginas

### `/login`
- Tela de autenticação do RH
- Campos: usuário e senha
- Redireciona para `/admin` após login bem-sucedido

### `/admin`
- Painel exclusivo do RH (protegido por middleware)
- Criar sorteio com quantidade de números configurável
- Visualizar lista de participantes e números reservados em tempo real
- Barra de progresso de preenchimento (mínimo 90% para sortear)
- Copiar link do sorteio ativo
- Cancelar sorteio em andamento (com confirmação)
- Realizar o sorteio e ver o ganhador
- Iniciar novo sorteio após encerramento
- Histórico de sorteios anteriores

### `/sorteio/[id]`
- Página do participante — acessada via link único
- Grade visual de números disponíveis e reservados
- Clique em número disponível → modal para informar o nome
- Após reserva: número bloqueado para todos em tempo real
- Exibe ganhador ao final do sorteio com mensagem personalizada
- Valida se o `id` da URL corresponde ao sorteio ativo (evita links antigos)
- Usa `localStorage` com chave `sorteio_escolha_{raffle_id}` — evita reservas duplicadas por participante e garante que participar de um sorteio anterior não interfere no atual

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build para produção

```bash
npm run build
npm start
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as credenciais do RH:

```env
RH_USER=rh.admin
RH_PASS=Rh@Sorteio2026!
```

> **Nota:** O arquivo `.env.local` está no `.gitignore` e não será commitado. Use `.env.example` como referência.

Se as variáveis não forem definidas, o sistema usa valores padrão (não recomendado para produção).

### Outras Configurações

O banco de dados `raffle.db` é criado automaticamente na raiz do projeto na primeira execução.

Para produção, recomenda-se:
- Configurar `NODE_ENV=production` para ativar o flag `secure` nos cookies
- Utilizar um processo supervisor (ex.: `pm2`) para manter o servidor ativo
- Configurar proxy reverso (ex.: Nginx) com HTTPS
- **Definir variáveis de ambiente** no servidor (não usar valores padrão)

---

## 🤖 Sobre o Desenvolvimento

Este sistema foi **desenvolvido com auxílio de Inteligência Artificial (Claude, via Cursor AI)** com o objetivo de acelerar a entrega e garantir uma base de código limpa e funcional em tempo reduzido.

O projeto está em **fase de teste inicial**. Feedbacks sobre bugs, usabilidade e performance são bem-vindos para orientar as próximas iterações.

**Roadmap pós-teste:**
- [ ] Migração de polling para WebSockets em rotas de alta frequência
- [x] Variáveis de ambiente para credenciais do RH
- [ ] Autenticação com hash de senha (bcrypt)
- [ ] Suporte a múltiplos usuários RH com permissões
- [ ] Deploy automatizado com CI/CD
