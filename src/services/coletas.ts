import type { ColetaApi } from "../types/api";
import { aoEncerrarSessao, ErroHttp, requisitar } from "./http";

/**
 * Coletas da volta-api (GET /collections), liberadas só para ADMIN e MANAGER.
 * Sem permissão, a lista vem vazia.
 */

let coletas: Promise<readonly ColetaApi[]> | null = null;

aoEncerrarSessao(() => {
  coletas = null;
});

/** Coletas da empresa; guardadas por sessão e compartilhadas, então a chamada não é cancelável. */
export function listarColetas(): Promise<readonly ColetaApi[]> {
  if (coletas === null) {
    coletas = requisitar<readonly ColetaApi[]>("/collections").catch(
      (excecao: unknown) => {
        coletas = null;
        if (excecao instanceof ErroHttp && excecao.status === 403) return [];
        throw excecao;
      },
    );
  }
  return coletas;
}
