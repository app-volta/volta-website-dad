import type {
  PeriodoRelatorio,
  PgrsGerado,
  RelatorioPgrs,
} from "../types/relatorio";
import { aguardar } from "./http";

/**
 * MOCK: substitua por chamada real quando o backend expuser /relatorios.
 * Os números do mês são os mesmos da Home; o trimestre bate com o "destinado
 * no trimestre" de Cooperativas (3.402 kg).
 */
const RELATORIOS: Readonly<Record<PeriodoRelatorio, RelatorioPgrs>> = {
  mes: {
    periodo: "mes",
    ocorrencias: 52,
    recuperadoKg: 1147,
    taxaAprovacao: 94,
    desvioAterro: 89,
    porMaterial: [
      { material: "papelao", kg: 542 },
      { material: "plastico", kg: 318 },
      { material: "metal", kg: 176 },
      { material: "vidro", kg: 111 },
    ],
    setores: [
      { nome: "Frigorífico B2", kg: 342 },
      { nome: "Expedição", kg: 218 },
      { nome: "Manutenção", kg: 187 },
      { nome: "Recebimento", kg: 160 },
      { nome: "Refeitório", kg: 98 },
    ],
    ocorrenciasPorSetor: [
      { nome: "Frigorífico B2", ocorrencias: 16 },
      { nome: "Expedição", ocorrencias: 12 },
      { nome: "Manutenção", ocorrencias: 9 },
      { nome: "Recebimento", ocorrencias: 8 },
      { nome: "Refeitório", ocorrencias: 4 },
      { nome: "Laboratório", ocorrencias: 3 },
    ],
    destinacao: [
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 47 },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 31 },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 22 },
    ],
  },
  trimestre: {
    periodo: "trimestre",
    ocorrencias: 148,
    recuperadoKg: 3402,
    taxaAprovacao: 93,
    desvioAterro: 88,
    porMaterial: [
      { material: "papelao", kg: 1634 },
      { material: "plastico", kg: 958 },
      { material: "metal", kg: 512 },
      { material: "vidro", kg: 298 },
    ],
    setores: [
      { nome: "Frigorífico B2", kg: 1012 },
      { nome: "Expedição", kg: 654 },
      { nome: "Manutenção", kg: 561 },
      { nome: "Recebimento", kg: 478 },
      { nome: "Refeitório", kg: 301 },
    ],
    ocorrenciasPorSetor: [
      { nome: "Frigorífico B2", ocorrencias: 44 },
      { nome: "Expedição", ocorrencias: 34 },
      { nome: "Manutenção", ocorrencias: 26 },
      { nome: "Recebimento", ocorrencias: 22 },
      { nome: "Refeitório", ocorrencias: 12 },
      { nome: "Laboratório", ocorrencias: 10 },
    ],
    destinacao: [
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 45 },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 32 },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 23 },
    ],
  },
  ano: {
    periodo: "ano",
    ocorrencias: 571,
    recuperadoKg: 13480,
    taxaAprovacao: 92,
    desvioAterro: 87,
    porMaterial: [
      { material: "papelao", kg: 6420 },
      { material: "plastico", kg: 3810 },
      { material: "metal", kg: 2050 },
      { material: "vidro", kg: 1200 },
    ],
    setores: [
      { nome: "Frigorífico B2", kg: 4120 },
      { nome: "Expedição", kg: 2630 },
      { nome: "Manutenção", kg: 2250 },
      { nome: "Recebimento", kg: 1910 },
      { nome: "Refeitório", kg: 1230 },
    ],
    ocorrenciasPorSetor: [
      { nome: "Frigorífico B2", ocorrencias: 170 },
      { nome: "Expedição", ocorrencias: 131 },
      { nome: "Manutenção", ocorrencias: 98 },
      { nome: "Recebimento", ocorrencias: 83 },
      { nome: "Refeitório", ocorrencias: 51 },
      { nome: "Laboratório", ocorrencias: 38 },
    ],
    destinacao: [
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 44 },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 33 },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 23 },
    ],
  },
};

export async function obterRelatorio(
  periodo: PeriodoRelatorio,
  sinal?: AbortSignal,
): Promise<RelatorioPgrs> {
  await aguardar(450, sinal);
  return RELATORIOS[periodo];
}

/** Simula a geração do documento do PGRS, que o backend fará de verdade. */
export async function gerarPgrs(
  _periodo: PeriodoRelatorio,
  sinal?: AbortSignal,
): Promise<PgrsGerado> {
  await aguardar(1200, sinal);
  return { geradoEm: new Date().toISOString() };
}
