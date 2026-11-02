import type { TokenApi, UsuarioApi } from "../types/api";
import type {
  CredenciaisLogin,
  SessaoAutenticada,
  Usuario,
} from "../types/usuario";
import { usuarioDaApi } from "./adaptadores";
import { aguardar, requisitar, USAR_MOCKS } from "./http";

/**
 * Autenticação. Com VITE_USAR_MOCKS=false conversa com a volta-api
 * (POST /auth/login e GET /users/me); no resto do tempo usa o mock local, que
 * mantém o fluxo completo (login → rota privada → contexto) sem backend.
 */

const USUARIO_DEMO: Usuario = {
  id: "user-1",
  nome: "Breno Gomes",
  email: "breno@volta.eco",
  papel: "responsavel_pgrs",
  unidade: "Frigorífico JBS — Lins/SP",
};

async function autenticarMock(
  credenciais: CredenciaisLogin,
  sinal?: AbortSignal,
): Promise<SessaoAutenticada> {
  await aguardar(700, sinal);
  if (!credenciais.email || !credenciais.senha) {
    throw new Error("Preencha e-mail e senha.");
  }
  if (credenciais.senha.length < 6) {
    throw new Error("Senha inválida (mínimo 6 caracteres).");
  }
  return {
    usuario: { ...USUARIO_DEMO, email: credenciais.email },
    token: "token-mock-volta",
    expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
  };
}

async function autenticarNaApi(
  credenciais: CredenciaisLogin,
  sinal?: AbortSignal,
): Promise<SessaoAutenticada> {
  const acesso = await requisitar<TokenApi>("/auth/login", {
    metodo: "POST",
    corpo: { email: credenciais.email, password: credenciais.senha },
    token: null,
    sinal,
  });

  // O token ainda não está na sessão: ele vai explícito nesta chamada.
  const eu = await requisitar<UsuarioApi>("/users/me", {
    token: acesso.token,
    sinal,
  });

  return {
    usuario: usuarioDaApi(eu),
    token: acesso.token,
    expiraEm: new Date(Date.now() + acesso.expiresIn).toISOString(),
    primeiroAcesso: acesso.firstLogin === true,
  };
}

export function autenticar(
  credenciais: CredenciaisLogin,
  sinal?: AbortSignal,
): Promise<SessaoAutenticada> {
  return USAR_MOCKS
    ? autenticarMock(credenciais, sinal)
    : autenticarNaApi(credenciais, sinal);
}
