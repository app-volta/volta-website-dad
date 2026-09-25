import type {
  CredenciaisLogin,
  DadosCadastro,
  SessaoAutenticada,
  Usuario,
} from "../types/usuario";
import { aguardar } from "./http";

/**
 * MOCK: substitua por chamada real quando o backend estiver disponível.
 * Motivo: enquanto o backend não expõe /auth, este mock garante que o fluxo
 * completo (login → rota privada → contexto) já funcione em desenvolvimento.
 */

const USUARIO_DEMO: Usuario = {
  id: "user-1",
  nome: "Breno Gomes",
  email: "breno@volta.eco",
  papel: "responsavel_pgrs",
  unidade: "Frigorífico JBS — Lins/SP",
};

export async function autenticar(
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

export async function cadastrar(
  dados: DadosCadastro,
  sinal?: AbortSignal,
): Promise<SessaoAutenticada> {
  await aguardar(900, sinal);
  const usuario: Usuario = {
    id: `user-${Math.random().toString(36).slice(2, 9)}`,
    nome: dados.nome,
    email: dados.email,
    papel: dados.papel,
    unidade: dados.unidade,
  };
  return {
    usuario,
    token: `token-${usuario.id}`,
    expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
  };
}
