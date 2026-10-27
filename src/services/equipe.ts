import type { MembroEquipe, NovoConvite, PapelEquipe } from "../types/equipe";
import * as api from "./equipe.api";
import * as mock from "./equipe.mock";
import { USAR_MOCKS } from "./http";

/**
 * Equipe. Escolhe entre o mock local e a volta-api conforme VITE_USAR_MOCKS;
 * hooks e telas importam daqui.
 */
interface ServicoEquipe {
  readonly listarEquipe: (
    sinal?: AbortSignal,
  ) => Promise<readonly MembroEquipe[]>;
  readonly convidarPessoa: (
    convite: NovoConvite,
    sinal?: AbortSignal,
  ) => Promise<MembroEquipe>;
  readonly reenviarConvite: (id: string, sinal?: AbortSignal) => Promise<void>;
  readonly cancelarConvite: (id: string, sinal?: AbortSignal) => Promise<void>;
  readonly alterarPapel: (id: string, papel: PapelEquipe) => Promise<MembroEquipe>;
}

const servico: ServicoEquipe = USAR_MOCKS ? mock : api;

export const {
  listarEquipe,
  convidarPessoa,
  reenviarConvite,
  cancelarConvite,
  alterarPapel,
} = servico;
