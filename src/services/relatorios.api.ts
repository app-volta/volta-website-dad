import type { PeriodoRelatorio, PgrsGerado, RelatorioPgrs } from "../types/relatorio";
import { calcularRelatorio } from "../utils/relatorioPgrs";
import { listarColetas } from "./coletas";
import { nomesDasCooperativas } from "./cooperativasBrutas";
import { listarMetricasEsg, obterScoreEsg } from "./esg";
import { listarOcorrencias } from "./ocorrencias.api";

/**
 * Relatórios com a volta-api. Não existe endpoint de relatório: o PGRS é
 * calculado no app das ocorrências (GET /incidents), das coletas
 * (GET /collections) e dos indicadores ESG (GET /esg/metrics e /esg/score).
 * Só as ocorrências são indispensáveis; sem as demais, o relatório sai com o
 * que for possível calcular.
 */

function opcional<T>(promessa: Promise<T>, padrao: T): Promise<T> {
  return promessa.catch(() => padrao);
}

export async function obterRelatorio(
  periodo: PeriodoRelatorio,
  sinal?: AbortSignal,
): Promise<RelatorioPgrs> {
  const [ocorrencias, metricas, scoreEsg, coletas, nomesCooperativas] =
    await Promise.all([
      listarOcorrencias(sinal),
      opcional(listarMetricasEsg(), []),
      opcional(obterScoreEsg(), null),
      opcional(listarColetas(), []),
      opcional(nomesDasCooperativas(), new Map<string, string>()),
    ]);
  return calcularRelatorio(periodo, {
    ocorrencias,
    metricas,
    scoreEsg,
    coletas,
    nomesCooperativas,
  });
}

/** O CSV do PGRS é montado na própria tela; aqui só se marca o instante da geração. */
export function gerarPgrs(
  _periodo: PeriodoRelatorio,
  _sinal?: AbortSignal,
): Promise<PgrsGerado> {
  return Promise.resolve({ geradoEm: new Date().toISOString() });
}
