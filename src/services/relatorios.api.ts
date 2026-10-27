import type {
  PeriodoRelatorio,
  PgrsGerado,
  PosicaoNoRanking,
  RelatorioPgrs,
} from "../types/relatorio";
import { calcularRelatorio } from "../utils/relatorioPgrs";
import { listarColetas } from "./coletas";
import { nomesDasCooperativas } from "./cooperativasBrutas";
import { listarMetricasEsg, obterScoreEsg } from "./esg";
import { obterUsuarioAtual } from "./http";
import { listarOcorrencias } from "./ocorrencias.api";
import { obterPosicaoDaEmpresa } from "./ranking";

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

/** Posição no ranking da empresa de quem está logado; nula sem pontuação ou com a API fora do ar. */
async function posicaoDaEmpresa(sinal?: AbortSignal): Promise<PosicaoNoRanking | null> {
  const empresaId = obterUsuarioAtual()?.empresaId;
  if (!empresaId) return null;
  const posicao = await obterPosicaoDaEmpresa(empresaId, sinal);
  return posicao
    ? {
        posicao: posicao.position,
        totalDeEmpresas: posicao.totalCompanies,
        pontos: posicao.score,
      }
    : null;
}

export async function obterRelatorio(
  periodo: PeriodoRelatorio,
  sinal?: AbortSignal,
): Promise<RelatorioPgrs> {
  const [ocorrencias, metricas, scoreEsg, coletas, nomesCooperativas, posicaoNoRanking] =
    await Promise.all([
      listarOcorrencias(sinal),
      opcional(listarMetricasEsg(), []),
      opcional(obterScoreEsg(), null),
      opcional(listarColetas(), []),
      opcional(nomesDasCooperativas(), new Map<string, string>()),
      opcional(posicaoDaEmpresa(sinal), null),
    ]);
  return calcularRelatorio(periodo, {
    ocorrencias,
    metricas,
    scoreEsg,
    coletas,
    nomesCooperativas,
    posicaoNoRanking,
  });
}

/** O CSV do PGRS é montado na própria tela; aqui só se marca o instante da geração. */
export function gerarPgrs(
  _periodo: PeriodoRelatorio,
  _sinal?: AbortSignal,
): Promise<PgrsGerado> {
  return Promise.resolve({ geradoEm: new Date().toISOString() });
}
