import type { AtualizacaoPerfilApi, UsuarioApi } from "../types/api";
import type { Usuario } from "../types/usuario";
import { aguardar, requisitar, USAR_MOCKS } from "./http";

/**
 * Perfil da própria pessoa. Com a volta-api, grava em PUT /users/me; no mock
 * só confirma, e quem chama atualiza a sessão local.
 */

/** O que a pessoa pode alterar no próprio perfil. */
export interface AlteracoesPerfil {
  readonly nome: string;
}

/** O que a API confirma depois de gravar. */
export type PerfilGravado = Pick<Usuario, "nome" | "cargo">;

export async function atualizarPerfil(
  atual: Usuario,
  alteracoes: AlteracoesPerfil,
  sinal?: AbortSignal,
): Promise<PerfilGravado> {
  if (USAR_MOCKS) {
    await aguardar(350, sinal);
    return { nome: alteracoes.nome, cargo: atual.cargo ?? null };
  }

  // O PUT substitui nome e cargo juntos: sem reenviar o cargo, ele seria apagado.
  const corpo: AtualizacaoPerfilApi = {
    name: alteracoes.nome,
    position: atual.cargo ?? null,
  };
  const gravado = await requisitar<UsuarioApi>("/users/me", {
    metodo: "PUT",
    corpo,
    sinal,
  });
  return { nome: gravado.name, cargo: gravado.position };
}
