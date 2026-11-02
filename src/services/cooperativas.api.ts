import type { CooperativaApi, NovaCooperativaApi } from "../types/api";
import type { Cooperativa, NovaCooperativa } from "../types/cooperativa";
import { distanciaEmKm, maisProximasPrimeiro } from "../utils/geo";
import type { Coordenadas } from "../utils/geo";
import { validarCnpj } from "../utils/validadores";
import { volumeDaCooperativa, volumesPorCooperativa } from "../utils/volumeCooperativas";
import {
  cooperativaDaApi,
  especialidadesDosMateriais,
} from "./adaptadores";
import { listarColetas } from "./coletas";
import {
  invalidarCooperativas,
  listarCooperativasDaApi,
} from "./cooperativasBrutas";
import { requisitar } from "./http";
import { listarOcorrencias } from "./ocorrencias.api";
import {
  listarCooperativasProximas,
  origemDaEmpresa,
  registrarLocalizacao,
} from "./ranking";

/**
 * Cooperativas na volta-api (GET e POST /cooperatives). Só o perfil ADMIN
 * lista e cadastra; para os demais a API responde 403. O volume mensal vem das
 * coletas (GET /collections) e o que a API não guarda (contato, distância,
 * capacidade, licença) fica vazio.
 */

/**
 * Distância de cada cooperativa até a empresa. A API de ranking (Redis) é a
 * fonte; a cooperativa que não está no índice dela (ainda sem localização
 * salvo lá) tem a distância calculada das coordenadas da volta-api. Sem saber
 * de onde a empresa envia, não há distância.
 */
async function distanciasAteAEmpresa(
  cooperativas: readonly CooperativaApi[],
): Promise<ReadonlyMap<string, number>> {
  const origem = await origemDaEmpresa().catch(() => null);
  if (!origem) return new Map();

  const doRedis = await listarCooperativasProximas(origem)
    .then((itens) => new Map(itens.map((item) => [item.cooperativeId, item.distanceKm])))
    .catch(() => new Map<string, number>());

  return new Map(
    cooperativas.map((c) => [
      c.id,
      doRedis.get(c.id) ??
        distanciaEmKm(origem, { latitude: c.latitude, longitude: c.longitude }),
    ]),
  );
}

/**
 * De onde a unidade envia o resíduo: o centro do mapa. Nula quando a empresa
 * ainda não tem coordenadas (então o mapa se ajusta às cooperativas).
 */
export function obterOrigemDoMapa(): Promise<Coordenadas | null> {
  return origemDaEmpresa().catch(() => null);
}

export async function listarCooperativas(
  sinal?: AbortSignal,
): Promise<readonly Cooperativa[]> {
  const [cooperativas, coletas, ocorrencias] = await Promise.all([
    listarCooperativasDaApi(),
    // O volume é um complemento: sem coletas ou ocorrências, a lista sai com zeros.
    listarColetas().catch(() => []),
    listarOcorrencias(sinal).catch(() => []),
  ]);
  const [volumes, distancias] = [
    volumesPorCooperativa(coletas, ocorrencias),
    await distanciasAteAEmpresa(cooperativas),
  ];
  return maisProximasPrimeiro(
    cooperativas.map((dto) =>
      cooperativaDaApi(
        dto,
        volumeDaCooperativa(volumes, dto.id),
        distancias.get(dto.id) ?? null,
      ),
    ),
  );
}

export async function obterCooperativa(
  id: string,
  sinal?: AbortSignal,
): Promise<Cooperativa> {
  const encontrada = (await listarCooperativas(sinal)).find((c) => c.id === id);
  if (!encontrada) throw new Error("Cooperativa não encontrada.");
  return encontrada;
}

function validarLocalizacao(dados: NovaCooperativa): { latitude: number; longitude: number } {
  const { latitude, longitude } = dados;
  if (latitude === undefined || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Informe a latitude da sede, entre -90 e 90.");
  }
  if (longitude === undefined || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Informe a longitude da sede, entre -180 e 180.");
  }
  return { latitude, longitude };
}

/**
 * Cadastra a cooperativa (POST /cooperatives). A licença em PDF não é enviada:
 * a API ainda não recebe documentos.
 */
export async function adicionarCooperativa(
  dados: NovaCooperativa,
  sinal?: AbortSignal,
): Promise<Cooperativa> {
  const nome = dados.nome.trim();
  if (nome.length < 3) throw new Error("Informe o nome da cooperativa.");
  const erroCnpj = validarCnpj(dados.cnpj);
  if (erroCnpj) throw new Error(erroCnpj);
  if (dados.materiais.length === 0) {
    throw new Error("Escolha ao menos um material aceito.");
  }
  const { latitude, longitude } = validarLocalizacao(dados);

  const corpo: NovaCooperativaApi = {
    name: nome,
    cnpj: dados.cnpj,
    latitude,
    longitude,
    specialties: especialidadesDosMateriais(dados.materiais),
  };
  const criada = await requisitar<CooperativaApi>("/cooperatives", {
    metodo: "POST",
    corpo,
    sinal,
  });
  invalidarCooperativas();
  // A localização também vai para o índice do Redis; se ele estiver fora do ar, o
  // cadastro segue valendo e a distância sai das coordenadas da volta-api.
  await registrarLocalizacao(criada.id, { latitude, longitude }).catch(() => undefined);
  const todas = await listarCooperativas(sinal);
  return (
    todas.find((c) => c.id === criada.id) ??
    cooperativaDaApi(criada, volumeDaCooperativa(new Map(), criada.id))
  );
}
