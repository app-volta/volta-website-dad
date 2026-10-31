import type { OcorrenciaPorSetorBiApi } from "../types/api";
import type { OcorrenciasDoSetor } from "../types/bi";
import { ocorrenciasPorSetorDaApi } from "./adaptadores";
import { requisitar } from "./http";

/**
 * BI na volta-api. A volta-api consulta a tabela Gold no Databricks e filtra
 * pela empresa de quem está logado (o token), então o site não manda empresa
 * nenhuma. A credencial do Databricks fica só no servidor.
 */

/** O warehouse do Databricks pode demorar a acordar na primeira consulta. */
const TEMPO_LIMITE_MS = 45_000;

export async function listarOcorrenciasPorSetor(
  sinal?: AbortSignal,
): Promise<readonly OcorrenciasDoSetor[]> {
  const linhas = await requisitar<readonly OcorrenciaPorSetorBiApi[]>(
    "/bi/occurrences-by-sector",
    { sinal, tempoLimiteMs: TEMPO_LIMITE_MS },
  );
  return ocorrenciasPorSetorDaApi(linhas);
}
