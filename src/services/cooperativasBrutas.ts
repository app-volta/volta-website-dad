import type { CooperativaApi, CooperativaParaPontuacaoApi } from "../types/api";
import { criarCache } from "./cache";
import { ErroHttp, requisitar } from "./http";

/**
 * Lista crua de cooperativas, separada para as ocorrências e os relatórios
 * poderem consultar nomes sem depender da tela de cooperativas. GET
 * /cooperatives é só do perfil ADMIN; os demais perfis leem a versão enxuta de
 * GET /cooperatives/scoring-data (sem CNPJ), que basta para consultar.
 */

/** A versão enxuta no formato da lista completa; o CNPJ, que ela não traz, fica vazio. */
function daLeituraEnxuta(dto: CooperativaParaPontuacaoApi): CooperativaApi {
  return {
    id: dto.id,
    name: dto.name,
    cnpj: "",
    latitude: dto.latitude,
    longitude: dto.longitude,
    averageRating: dto.averageRating,
    specialties: dto.specialties.join(","),
  };
}

const cooperativas = criarCache(async (): Promise<readonly CooperativaApi[]> => {
  try {
    return await requisitar<readonly CooperativaApi[]>("/cooperatives");
  } catch (excecao) {
    if (!(excecao instanceof ErroHttp && excecao.status === 403)) throw excecao;
    const enxuta = await requisitar<readonly CooperativaParaPontuacaoApi[]>(
      "/cooperatives/scoring-data",
    );
    return enxuta.map(daLeituraEnxuta);
  }
});

/** Cooperativas da API; a chamada é compartilhada entre as telas, então não é cancelável. */
export const listarCooperativasDaApi = cooperativas.obter;

/** Esquece o que foi guardado, para a próxima consulta refletir um cadastro novo. */
export const invalidarCooperativas = cooperativas.invalidar;

/** Nome de cada cooperativa pelo id; vazio quando a pessoa não pode nem ler a lista enxuta. */
export async function nomesDasCooperativas(): Promise<ReadonlyMap<string, string>> {
  try {
    const lista = await listarCooperativasDaApi();
    return new Map(lista.map((c) => [c.id, c.name]));
  } catch (excecao) {
    if (excecao instanceof ErroHttp && excecao.status === 403) return new Map();
    throw excecao;
  }
}
