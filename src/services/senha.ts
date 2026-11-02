import { aguardar, ErroHttp, requisitar, USAR_MOCKS } from "./http";
import { MENSAGEM_SENHA_ATUAL_INCORRETA } from "./mensagensApi";

/**
 * Senhas na volta-api: recuperação por e-mail (POST /auth/forgot-password,
 * /auth/verify-code e /auth/reset-password, sem login) e troca da própria senha
 * (PUT /users/me/password). Sem a API, a demonstração aceita um código fixo.
 */

/** A demonstração (sem API) não envia e-mail: este é o código que ela aceita. */
export const CODIGO_DA_DEMONSTRACAO = "1234";

const MENSAGEM_CODIGO_INVALIDO = "O código não confere ou já venceu. Peça um novo.";
const MENSAGEM_SENHA_IGUAL = "A nova senha precisa ser diferente da atual.";

/**
 * Pede o código de 4 dígitos por e-mail. A API responde igual com e-mail
 * cadastrado ou não, então a tela segue em frente nos dois casos.
 */
export async function pedirCodigoDeSenha(
  email: string,
  sinal?: AbortSignal,
): Promise<void> {
  if (USAR_MOCKS) {
    await aguardar(600, sinal);
    return;
  }
  await requisitar<unknown>("/auth/forgot-password", {
    metodo: "POST",
    corpo: { email: email.trim() },
    token: null,
    sinal,
  });
}

/** Confere o código sem gastá-lo: ele só vale de novo na redefinição. */
export async function conferirCodigoDeSenha(
  email: string,
  codigo: string,
  sinal?: AbortSignal,
): Promise<void> {
  if (USAR_MOCKS) {
    await aguardar(400, sinal);
    if (codigo !== CODIGO_DA_DEMONSTRACAO) {
      throw new ErroHttp(MENSAGEM_CODIGO_INVALIDO, 400);
    }
    return;
  }
  await requisitar<void>("/auth/verify-code", {
    metodo: "POST",
    corpo: { email: email.trim(), code: codigo },
    token: null,
    sinal,
  });
}

export async function redefinirSenha(
  email: string,
  codigo: string,
  novaSenha: string,
  sinal?: AbortSignal,
): Promise<void> {
  if (USAR_MOCKS) {
    await aguardar(600, sinal);
    if (codigo !== CODIGO_DA_DEMONSTRACAO) {
      throw new ErroHttp(MENSAGEM_CODIGO_INVALIDO, 400);
    }
    return;
  }
  await requisitar<void>("/auth/reset-password", {
    metodo: "POST",
    corpo: { email: email.trim(), code: codigo, newPassword: novaSenha },
    token: null,
    sinal,
  });
}

/**
 * Troca a senha de quem está logado. Se a senha atual não confere, a API
 * responde 400; o erro volta com a mensagem ligada ao campo `senhaAtual`.
 */
export async function trocarSenha(
  senhaAtual: string,
  novaSenha: string,
  sinal?: AbortSignal,
): Promise<void> {
  if (USAR_MOCKS) {
    await aguardar(500, sinal);
    if (senhaAtual === novaSenha) throw new ErroHttp(MENSAGEM_SENHA_IGUAL, 422);
    return;
  }
  try {
    await requisitar<void>("/users/me/password", {
      metodo: "PUT",
      corpo: { currentPassword: senhaAtual, newPassword: novaSenha },
      sinal,
    });
  } catch (excecao) {
    if (
      excecao instanceof ErroHttp &&
      excecao.status === 400 &&
      excecao.message === MENSAGEM_SENHA_ATUAL_INCORRETA
    ) {
      throw new ErroHttp(excecao.message, 400, { senhaAtual: excecao.message });
    }
    throw excecao;
  }
}
