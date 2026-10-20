import type { MetricaEsgApi, ScoreEsgApi } from "../types/api";
import { aoEncerrarSessao, ErroHttp, requisitar } from "./http";

/**
 * Indicadores ESG da volta-api (GET /esg/metrics e GET /esg/score), liberados
 * só para ADMIN e MANAGER. Quem não tem permissão (ou a API ainda sem dados)
 * recebe lista vazia / nulo: o relatório calcula o que faltar das ocorrências.
 */

let metricas: Promise<readonly MetricaEsgApi[]> | null = null;
let score: Promise<number | null> | null = null;

aoEncerrarSessao(() => {
  metricas = null;
  score = null;
});

function semPermissao(excecao: unknown): boolean {
  return excecao instanceof ErroHttp && excecao.status === 403;
}

/**
 * Métricas mensais da empresa, uma por mês (AAAA-MM). A resposta é guardada
 * por sessão e compartilhada, por isso a chamada não é cancelável.
 */
export function listarMetricasEsg(): Promise<readonly MetricaEsgApi[]> {
  if (metricas === null) {
    metricas = requisitar<readonly MetricaEsgApi[]>("/esg/metrics")
      .catch((excecao: unknown) => {
        metricas = null;
        if (semPermissao(excecao)) return [];
        throw excecao;
      });
  }
  return metricas;
}

/** Score ESG da empresa; nulo quando a API não o calcula ou a pessoa não pode vê-lo. */
export function obterScoreEsg(): Promise<number | null> {
  if (score === null) {
    score = requisitar<ScoreEsgApi>("/esg/score")
      .then((resposta) => resposta.score)
      .catch((excecao: unknown) => {
        score = null;
        if (semPermissao(excecao) || (excecao instanceof ErroHttp && excecao.status === 404)) {
          return null;
        }
        throw excecao;
      });
  }
  return score;
}
