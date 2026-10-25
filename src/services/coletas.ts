import type { ColetaApi, HistoricoColetaApi } from "../types/api";
import { criarCache } from "./cache";
import { ErroHttp, requisitar } from "./http";

/**
 * Coletas da volta-api (GET /collections e GET /collections/{id}/history),
 * liberadas só para ADMIN e MANAGER. Sem permissão, a lista vem vazia.
 */

const coletas = criarCache(() =>
  requisitar<readonly ColetaApi[]>("/collections").catch(
    (excecao: unknown): readonly ColetaApi[] => {
      if (excecao instanceof ErroHttp && excecao.status === 403) return [];
      throw excecao;
    },
  ),
);

/** Coletas da empresa; a chamada é compartilhada entre as telas, então não é cancelável. */
export const listarColetas = coletas.obter;

/** Mudanças de status de uma coleta, da mais antiga para a mais recente. */
export function historicoDaColeta(
  id: string,
  sinal?: AbortSignal,
): Promise<readonly HistoricoColetaApi[]> {
  return requisitar<readonly HistoricoColetaApi[]>(`/collections/${id}/history`, {
    sinal,
  });
}
