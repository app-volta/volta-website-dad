import type { MetricaEsgApi, ScoreEsgApi } from "../types/api";
import { criarCache } from "./cache";
import { ErroHttp, requisitar } from "./http";

/**
 * Indicadores ESG da volta-api (GET /esg/metrics e GET /esg/score), liberados
 * só para ADMIN e MANAGER. Quem não tem permissão recebe lista vazia / nulo: o
 * relatório calcula o que faltar das ocorrências.
 */

function semPermissao(excecao: unknown): boolean {
  return excecao instanceof ErroHttp && excecao.status === 403;
}

const metricas = criarCache(() =>
  requisitar<readonly MetricaEsgApi[]>("/esg/metrics").catch(
    (excecao: unknown): readonly MetricaEsgApi[] => {
      if (semPermissao(excecao)) return [];
      throw excecao;
    },
  ),
);

const score = criarCache(() =>
  requisitar<ScoreEsgApi>("/esg/score")
    .then((resposta): number | null => resposta.score)
    .catch((excecao: unknown): number | null => {
      if (semPermissao(excecao) || (excecao instanceof ErroHttp && excecao.status === 404)) {
        return null;
      }
      throw excecao;
    }),
);

/** Métricas mensais da empresa, uma por mês (AAAA-MM); a chamada é compartilhada, então não é cancelável. */
export const listarMetricasEsg = metricas.obter;

/** Score ESG da empresa; nulo quando a API não o calcula ou a pessoa não pode vê-lo. */
export const obterScoreEsg = score.obter;
