import type {
  ContextoDaOcorrenciaApi,
  CooperativaProximaApi,
  EmpresaApi,
  NotasDasCooperativasApi,
  PosicaoEmpresaApi,
} from "../types/api";
import type { Coordenadas } from "../utils/geo";
import type { IndicacaoDeCooperativas } from "../types/cooperativa";
import { indicacaoDaApi } from "./adaptadores";
import { criarCache } from "./cache";
import { BASE_RANKING, ErroHttp, requisitar, USAR_MOCKS } from "./http";
import type { OpcoesRequisicao } from "./http";
import { listarOcorrencias } from "./ocorrencias.api";

/**
 * Cliente da volta-api-redis: ranking de empresas, cooperativas por
 * proximidade e pontuação de cooperativas para uma ocorrência. Usa o mesmo
 * token da volta-api. Quem consome trata a falha como "sem esse dado": a API de
 * ranking é um complemento e a tela funciona sem ela. Nada disto roda no mock.
 */

/** Maior raio que a API aceita. */
export const RAIO_MAXIMO_KM = 20_000;
const LIMITE_PROXIMAS = 100;
const CASAS_DA_LOCALIZACAO = 6;
const VALIDADE_DA_ORIGEM_MS = 10 * 60_000;

const BASE: OpcoesRequisicao = { base: BASE_RANKING, semLogoutEm401: true };

/** Posição da empresa no ranking; nula quando ela ainda não tem pontuação. */
export async function obterPosicaoDaEmpresa(
  empresaId: string,
  sinal?: AbortSignal,
): Promise<PosicaoEmpresaApi | null> {
  if (USAR_MOCKS) return null;
  try {
    return await requisitar<PosicaoEmpresaApi>(
      `/api/v1/ranking/${empresaId}/position`,
      { ...BASE, sinal },
    );
  } catch (excecao) {
    if (excecao instanceof ErroHttp && excecao.status === 404) return null;
    throw excecao;
  }
}

/**
 * Coordenadas da empresa, de onde o resíduo sai. O administrador e o gestor as
 * leem em GET /companies/me; para os outros perfis, a volta-api só as expõe no
 * contexto de pontuação de uma ocorrência, então vêm da mais recente.
 */
const origem = criarCache(async (): Promise<Coordenadas | null> => {
  const empresa = await requisitar<EmpresaApi>("/companies/me").catch(() => null);
  if (typeof empresa?.latitude === "number" && typeof empresa.longitude === "number") {
    return { latitude: empresa.latitude, longitude: empresa.longitude };
  }
  const ocorrencias = await listarOcorrencias();
  const maisRecente = ocorrencias[0];
  if (!maisRecente) return null;
  const contexto = await requisitar<ContextoDaOcorrenciaApi>(
    `/incidents/${maisRecente.id}/scoring-context`,
  );
  const { latitude, longitude } = contexto.origin ?? {};
  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : null;
}, VALIDADE_DA_ORIGEM_MS);

export const origemDaEmpresa = origem.obter;

/** Cooperativas com localização no índice do Redis, da mais perto para a mais longe. */
export function listarCooperativasProximas(
  ponto: Coordenadas,
  raioKm: number = RAIO_MAXIMO_KM,
  limite: number = LIMITE_PROXIMAS,
  sinal?: AbortSignal,
): Promise<readonly CooperativaProximaApi[]> {
  const consulta = new URLSearchParams({
    latitude: String(ponto.latitude),
    longitude: String(ponto.longitude),
    radiusKm: String(raioKm),
    limit: String(limite),
  });
  return requisitar<readonly CooperativaProximaApi[]>(
    `/api/v1/cooperatives/nearby?${consulta.toString()}`,
    { ...BASE, sinal },
  );
}

/**
 * As cooperativas mais indicadas para a ocorrência, com a nota de cada uma. A
 * API de ranking consulta a volta-api em nome de quem pergunta, por isso demora
 * mais que as outras chamadas.
 */
export async function indicarCooperativas(
  ocorrenciaId: string,
  limite: number,
  sinal?: AbortSignal,
): Promise<IndicacaoDeCooperativas | null> {
  if (USAR_MOCKS) return null;
  const resposta = await requisitar<NotasDasCooperativasApi>(
    `/api/v1/incidents/${ocorrenciaId}/cooperative-scores?limit=${limite}`,
    { ...BASE, tempoLimiteMs: 30_000, sinal },
  );
  return indicacaoDaApi(resposta);
}

/** Guarda a localização da cooperativa no índice do Redis (só ADMIN). */
export function registrarLocalizacao(
  cooperativaId: string,
  ponto: Coordenadas,
): Promise<void> {
  const arredondar = (valor: number): number =>
    Number(valor.toFixed(CASAS_DA_LOCALIZACAO));
  return requisitar<void>(`/api/v1/cooperatives/${cooperativaId}/location`, {
    ...BASE,
    metodo: "PUT",
    corpo: {
      latitude: arredondar(ponto.latitude),
      longitude: arredondar(ponto.longitude),
    },
  });
}
