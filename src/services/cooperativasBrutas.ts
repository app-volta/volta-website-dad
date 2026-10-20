import type { CooperativaApi } from "../types/api";
import { criarCache } from "./cache";
import { ErroHttp, requisitar } from "./http";

/**
 * Lista crua de GET /cooperatives, separada para as ocorrências e os
 * relatórios poderem consultar nomes sem depender da tela de cooperativas.
 * Só o perfil ADMIN lista; os demais recebem 403.
 */

const cooperativas = criarCache(() =>
  requisitar<readonly CooperativaApi[]>("/cooperatives"),
);

/** Cooperativas da API; a chamada é compartilhada entre as telas, então não é cancelável. */
export const listarCooperativasDaApi = cooperativas.obter;

/** Esquece o que foi guardado, para a próxima consulta refletir um cadastro novo. */
export const invalidarCooperativas = cooperativas.invalidar;

/** Nome de cada cooperativa pelo id; vazio quando a pessoa não tem permissão para listá-las. */
export async function nomesDasCooperativas(): Promise<ReadonlyMap<string, string>> {
  try {
    const lista = await listarCooperativasDaApi();
    return new Map(lista.map((c) => [c.id, c.name]));
  } catch (excecao) {
    if (excecao instanceof ErroHttp && excecao.status === 403) return new Map();
    throw excecao;
  }
}
