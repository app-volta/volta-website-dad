import type { CooperativaApi } from "../types/api";
import { aoEncerrarSessao, ErroHttp, requisitar } from "./http";

/**
 * Cooperativas na volta-api (GET /cooperatives). Só o perfil ADMIN lista e
 * cadastra; para os demais perfis a API responde 403.
 */

let lista: Promise<readonly CooperativaApi[]> | null = null;

aoEncerrarSessao(() => {
  lista = null;
});

/** Cooperativas da API, guardadas por sessão e compartilhadas, então a chamada não é cancelável. */
export function listarCooperativasDaApi(): Promise<readonly CooperativaApi[]> {
  if (lista === null) {
    lista = requisitar<readonly CooperativaApi[]>("/cooperatives").catch(
      (excecao: unknown) => {
        // Sem permissão não muda durante a sessão: guarda a recusa e não insiste.
        if (!(excecao instanceof ErroHttp && excecao.status === 403)) lista = null;
        throw excecao;
      },
    );
  }
  return lista;
}

/** Nome de cada cooperativa pelo id; vazio quando a pessoa não tem permissão para listá-las. */
export async function nomesDasCooperativas(): Promise<ReadonlyMap<string, string>> {
  try {
    const cooperativas = await listarCooperativasDaApi();
    return new Map(cooperativas.map((c) => [c.id, c.name]));
  } catch (excecao) {
    if (excecao instanceof ErroHttp && excecao.status === 403) return new Map();
    throw excecao;
  }
}
