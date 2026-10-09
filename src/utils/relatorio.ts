import { METADADOS_MATERIAL } from "../types/material";
import type { PeriodoRelatorio, RelatorioPgrs } from "../types/relatorio";
import { montarCsv } from "./exportarCsv";

export const ROTULOS_PERIODO: Readonly<Record<PeriodoRelatorio, string>> = {
  mes: "Mês",
  trimestre: "Trimestre",
  ano: "Ano",
};

/** Complemento dos títulos: "Recuperado por material deste mês". */
export const TEXTO_PERIODO: Readonly<Record<PeriodoRelatorio, string>> = {
  mes: "deste mês",
  trimestre: "deste trimestre",
  ano: "deste ano",
};

interface CabecalhoPgrs {
  readonly unidade: string;
  readonly geradoEm: string;
}

/**
 * CSV com os indicadores do período. Quando recebe o cabeçalho, serve de
 * arquivo do PGRS e abre com a unidade, o período e a data de geração.
 */
export function montarCsvRelatorio(
  relatorio: RelatorioPgrs,
  cabecalho?: CabecalhoPgrs,
): string {
  const linhas: (string | number)[][] = [];
  if (cabecalho) {
    linhas.push(
      ["Cabeçalho", "Unidade", cabecalho.unidade, ""],
      ["Cabeçalho", "Período", ROTULOS_PERIODO[relatorio.periodo], ""],
      ["Cabeçalho", "Gerado em", cabecalho.geradoEm, ""],
    );
  }
  linhas.push(
    ["Indicador", "Ocorrências", relatorio.ocorrencias, "un"],
    ["Indicador", "Recuperado", relatorio.recuperadoKg, "kg"],
    ["Indicador", "Taxa de aprovação", relatorio.taxaAprovacao, "%"],
    ["Indicador", "Desviado de aterro", relatorio.desvioAterro, "%"],
  );
  for (const item of relatorio.porMaterial) {
    linhas.push(["Material", METADADOS_MATERIAL[item.material].rotulo, item.kg, "kg"]);
  }
  for (const setor of relatorio.setores) {
    linhas.push(["Setor", setor.nome, setor.kg, "kg"]);
  }
  for (const destino of relatorio.destinacao) {
    linhas.push(["Destinação", destino.nome, destino.percentual, "%"]);
  }
  return montarCsv(["Seção", "Item", "Valor", "Unidade"], linhas);
}
