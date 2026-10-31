import type { OcorrenciasDoSetor } from "../types/bi";
import * as api from "./bi.api";
import * as mock from "./bi.mock";
import { USAR_MOCKS } from "./http";

/**
 * BI (Databricks). Escolhe entre o mock local e a volta-api conforme
 * VITE_USAR_MOCKS; hooks e telas importam daqui.
 */
interface ServicoBi {
  readonly listarOcorrenciasPorSetor: (
    sinal?: AbortSignal,
  ) => Promise<readonly OcorrenciasDoSetor[]>;
}

const servico: ServicoBi = USAR_MOCKS ? mock : api;

export const { listarOcorrenciasPorSetor } = servico;
