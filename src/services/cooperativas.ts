import type { Cooperativa, NovaCooperativa } from "../types/cooperativa";
import type { Coordenadas } from "../utils/geo";
import * as api from "./cooperativas.api";
import * as mock from "./cooperativas.mock";
import { USAR_MOCKS } from "./http";

/**
 * Cooperativas. Escolhe entre o mock local e a volta-api conforme
 * VITE_USAR_MOCKS; hooks e telas importam daqui.
 */
interface ServicoCooperativas {
  readonly listarCooperativas: (
    sinal?: AbortSignal,
  ) => Promise<readonly Cooperativa[]>;
  readonly obterCooperativa: (
    id: string,
    sinal?: AbortSignal,
  ) => Promise<Cooperativa>;
  readonly adicionarCooperativa: (
    dados: NovaCooperativa,
    sinal?: AbortSignal,
  ) => Promise<Cooperativa>;
  readonly obterOrigemDoMapa: () => Promise<Coordenadas | null>;
}

const servico: ServicoCooperativas = USAR_MOCKS ? mock : api;

export const {
  listarCooperativas,
  obterCooperativa,
  adicionarCooperativa,
  obterOrigemDoMapa,
} = servico;
