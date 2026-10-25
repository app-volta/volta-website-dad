import type { PeriodoRelatorio, PgrsGerado, RelatorioPgrs } from "../types/relatorio";
import { USAR_MOCKS } from "./http";
import * as api from "./relatorios.api";
import * as mock from "./relatorios.mock";

/**
 * Relatórios. Escolhe entre o mock local e o cálculo sobre a volta-api
 * conforme VITE_USAR_MOCKS; hooks e telas importam daqui.
 */
interface ServicoRelatorios {
  readonly obterRelatorio: (
    periodo: PeriodoRelatorio,
    sinal?: AbortSignal,
  ) => Promise<RelatorioPgrs>;
  readonly gerarPgrs: (
    periodo: PeriodoRelatorio,
    sinal?: AbortSignal,
  ) => Promise<PgrsGerado>;
}

const servico: ServicoRelatorios = USAR_MOCKS ? mock : api;

export const { obterRelatorio, gerarPgrs } = servico;
