import { NextRequest, NextResponse } from "next/server";

const RH_USER = process.env.RH_USER;
const RH_PASS = process.env.RH_PASS;
const SESSION_COOKIE = "rh_session";
const SESSION_VALUE = "autenticado_rh";

export async function POST(request: NextRequest) {
  const { usuario, senha } = await request.json();

  if (!RH_USER || !RH_PASS) {
    return NextResponse.json(
      { erro: "Configuração de autenticação não encontrada" },
      { status: 500 }
    );
  }

  if (usuario !== RH_USER || senha !== RH_PASS) {
    return NextResponse.json(
      { erro: "Usuário ou senha inválidos" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ sucesso: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}
