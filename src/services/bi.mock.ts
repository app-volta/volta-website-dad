import type { OcorrenciasDoSetor } from "../types/bi";
import { aguardar } from "./http";

/**
 * MOCK: números de exemplo no formato do BI, para o gráfico funcionar sem
 * backend. Com VITE_USAR_MOCKS=false os dados vêm da volta-api.
 */
const OCORRENCIAS_POR_SETOR: readonly OcorrenciasDoSetor[] = [
  { setor: "Frigorífico B2", ocorrencias: 34 },
  { setor: "Expedição", ocorrencias: 27 },
  { setor: "Manutenção", ocorrencias: 19 },
  { setor: "Recebimento", ocorrencias: 12 },
  { setor: "Refeitório", ocorrencias: 7 },
];

export async function listarOcorrenciasPorSetor(
  sinal?: AbortSignal,
): Promise<readonly OcorrenciasDoSetor[]> {
  await aguardar(600, sinal);
  return OCORRENCIAS_POR_SETOR;
}
