import type {
  PeriodoAnterior,
  PeriodoRelatorio,
  RelatorioPgrs,
} from "../types/relatorio";
import { intervaloAnterior, rotuloDoAnterior } from "../utils/relatorioPgrs";
import { aguardar } from "./http";

/** As quatro ocorrências aprovadas mais recentes que o documento do PGRS mostra como amostra. */
const AMOSTRA_DE_OCORRENCIAS: RelatorioPgrs["aprovadasRecentes"] = [
  { id: "occ-0481", codigo: "#0481", titulo: "Sucata metálica", setor: "Manutenção", material: "metal", pesoKg: 61, registradaPor: "João Pereira" },
  { id: "occ-0480", codigo: "#0480", titulo: "Papelão limpo", setor: "Recebimento", material: "papelao", pesoKg: 45, registradaPor: "Ana Souza" },
  { id: "occ-0476", codigo: "#0476", titulo: "Papelão molhado", setor: "Frigorífico B2", material: "papelao", pesoKg: 40, registradaPor: "Davi Liu" },
  { id: "occ-0475", codigo: "#0475", titulo: "Metal diverso", setor: "Manutenção", material: "metal", pesoKg: 33, registradaPor: "João Pereira" },
];

/** O que o período anterior teve (o rótulo "setembro de 2026" sai da data de hoje). */
const ANTERIORES: Readonly<Record<PeriodoRelatorio, Omit<PeriodoAnterior, "rotulo">>> = {
  mes: { ocorrencias: 40, recuperadoKg: 1062, taxaAprovacao: 91 },
  trimestre: { ocorrencias: 127, recuperadoKg: 3150, taxaAprovacao: 90 },
  ano: { ocorrencias: 512, recuperadoKg: 12400, taxaAprovacao: 91 },
};

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
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 47, kg: 539, materiais: ["papelao", "plastico", "metal", "vidro"] },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 31, kg: 356, materiais: ["papelao", "plastico"] },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 22, kg: 252, materiais: ["papelao"] },
    ],
    setoresRecuperados: [
      { nome: "Frigorífico B2", kg: 342 },
      { nome: "Expedição", kg: 218 },
      { nome: "Manutenção", kg: 187 },
      { nome: "Recebimento", kg: 160 },
      { nome: "Refeitório", kg: 98 },
      { nome: "Laboratório", kg: 74 },
      { nome: "Escritório", kg: 42 },
      { nome: "Pátio", kg: 26 },
    ],
    aprovadasRecentes: AMOSTRA_DE_OCORRENCIAS,
    recorrencia: { setor: "Frigorífico B2", titulo: "Papelão molhado", vezes: 3 },
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
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 45, kg: 1531, materiais: ["papelao", "plastico", "metal", "vidro"] },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 32, kg: 1089, materiais: ["papelao", "plastico"] },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 23, kg: 782, materiais: ["papelao"] },
    ],
    setoresRecuperados: [
      { nome: "Frigorífico B2", kg: 1012 },
      { nome: "Expedição", kg: 654 },
      { nome: "Manutenção", kg: 561 },
      { nome: "Recebimento", kg: 478 },
      { nome: "Refeitório", kg: 301 },
      { nome: "Laboratório", kg: 212 },
      { nome: "Escritório", kg: 118 },
      { nome: "Pátio", kg: 66 },
    ],
    aprovadasRecentes: AMOSTRA_DE_OCORRENCIAS,
    recorrencia: { setor: "Frigorífico B2", titulo: "Papelão molhado", vezes: 7 },
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
      { cooperativaId: "coop-jbs-ambiental", nome: "JBS Ambiental", percentual: 44, kg: 5931, materiais: ["papelao", "plastico", "metal", "vidro"] },
      { cooperativaId: "coop-recicla-vida", nome: "Recicla Vida", percentual: 33, kg: 4448, materiais: ["papelao", "plastico"] },
      { cooperativaId: "coop-cooperviva", nome: "Cooperviva", percentual: 23, kg: 3101, materiais: ["papelao"] },
    ],
    setoresRecuperados: [
      { nome: "Frigorífico B2", kg: 4120 },
      { nome: "Expedição", kg: 2630 },
      { nome: "Manutenção", kg: 2250 },
      { nome: "Recebimento", kg: 1910 },
      { nome: "Refeitório", kg: 1230 },
      { nome: "Laboratório", kg: 820 },
      { nome: "Escritório", kg: 360 },
      { nome: "Pátio", kg: 160 },
    ],
    aprovadasRecentes: AMOSTRA_DE_OCORRENCIAS,
    recorrencia: { setor: "Frigorífico B2", titulo: "Papelão molhado", vezes: 19 },
  },
};

export async function obterRelatorio(
  periodo: PeriodoRelatorio,
  sinal?: AbortSignal,
): Promise<RelatorioPgrs> {
  await aguardar(450, sinal);
  const rotulo = rotuloDoAnterior(periodo, intervaloAnterior(periodo, new Date()));
  return { ...RELATORIOS[periodo], anterior: { rotulo, ...ANTERIORES[periodo] } };
}
