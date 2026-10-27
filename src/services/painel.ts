import type { Ocorrencia } from "../types/ocorrencia";
import type { PainelInicio } from "../types/painel";
import { calcularPainel } from "../utils/painel";
import { USAR_MOCKS } from "./http";

/**
 * Números do Início. Com a volta-api, saem das ocorrências já carregadas
 * (nenhuma chamada a mais); no mock, são os valores fixos do protótipo, que
 * não dependem das poucas ocorrências de exemplo.
 */

const PAINEL_MOCK: PainelInicio = {
  ocorrenciasMes: 52,
  ocorrenciasVariacao: 12,
  sparkOcorrencias: [32, 36, 40, 38, 44, 48, 52],
  recuperadoMesKg: 1147,
  recuperadoVariacaoPct: 8,
  sparkRecuperado: [720, 810, 860, 920, 980, 1050, 1147],
  taxaAprovacao: 94,
  taxaVariacaoPontos: 3,
  sparkTaxa: [88, 90, 89, 91, 92, 93, 94],
  textoEspera: "média de 2,4 h pra aprovar",
  sparkPendentes: [6, 4, 7, 5, 8, 3, 4],
  porMaterial: [
    { material: "papelao", kg: 542 },
    { material: "plastico", kg: 318 },
    { material: "metal", kg: 176 },
    { material: "vidro", kg: 111 },
  ],
  outrosKg: 0,
  semanas: [
    { rotulo: "S1", valor: 108, meta: 140 },
    { rotulo: "S2", valor: 128, meta: 140 },
    { rotulo: "S3", valor: 141, meta: 140 },
    { rotulo: "S4", valor: 134, meta: 140 },
    { rotulo: "S5", valor: 155, meta: 140 },
    { rotulo: "S6", valor: 162, meta: 140 },
    { rotulo: "S7", valor: 178, meta: 140 },
    { rotulo: "S8", valor: 191, meta: 140 },
  ],
  meses: [
    { rotulo: "Jan", valor: 320, meta: 420 },
    { rotulo: "Fev", valor: 410, meta: 420 },
    { rotulo: "Mar", valor: 485, meta: 420 },
  ],
  atividades: [
    {
      id: "ativ-1",
      autor: "Ana Souza",
      acao: "aprovou #0481 · Sucata metálica",
      tempo: "há 5 min",
      cor: "var(--metal-bg)",
    },
    {
      id: "ativ-2",
      autor: "Carla Mendes",
      acao: "registrou #0482 · Plástico",
      tempo: "há 32 min",
      cor: "var(--plastico-bg)",
    },
    {
      id: "ativ-3",
      autor: "Rafael Lima",
      acao: "encaminhou #0479 pra Qualidade",
      tempo: "ontem",
      cor: "var(--vidro-bg)",
    },
    {
      id: "ativ-4",
      autor: "João Pereira",
      acao: "adicionou uma observação em #0475",
      tempo: "ontem",
      cor: "var(--papelao-bg)",
    },
  ],
};

/** Ocorrências que a pessoa registrou. O protótipo mostra um número fixo. */
export function contarRegistradasPor(
  ocorrencias: readonly Ocorrencia[],
  usuarioId: string,
): number {
  return USAR_MOCKS
    ? 12
    : ocorrencias.filter((o) => o.criadaPor === usuarioId).length;
}

/** Se o painel vem de dados reais (e portanto pode estar vazio) ou do protótipo. */
export const PAINEL_COM_DADOS_REAIS: boolean = !USAR_MOCKS;

export function montarPainel(
  ocorrencias: readonly Ocorrencia[],
  metaMensalKg: number,
): PainelInicio {
  return USAR_MOCKS ? PAINEL_MOCK : calcularPainel(ocorrencias, metaMensalKg);
}
