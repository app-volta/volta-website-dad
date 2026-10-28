import type { ClassificacaoIA, OpcaoTipoResiduo } from "../types/classificacao";
import type {
  NovaClassificacao,
  NovaOcorrencia,
  Ocorrencia,
} from "../types/ocorrencia";
import { USAR_MOCKS } from "./http";
import * as api from "./ocorrencias.api";
import * as mock from "./ocorrencias.mock";

/**
 * Ocorrências. Escolhe entre o mock local e a volta-api conforme
 * VITE_USAR_MOCKS; hooks e telas importam daqui e não sabem a diferença.
 */
export interface ServicoOcorrencias {
  readonly assinarMudancas: (ouvinte: () => void) => () => void;
  readonly quantidadeAguardando: () => number;
  readonly lerOcorrencias: () => readonly Ocorrencia[];
  readonly semelhantesNaSemana: (ocorrencia: Ocorrencia) => number;
  readonly garantirCarregado: () => void;
  readonly listarSetores: () => Promise<readonly string[]>;
  readonly listarOcorrencias: (
    sinal?: AbortSignal,
  ) => Promise<readonly Ocorrencia[]>;
  readonly obterOcorrencia: (
    id: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly analisarOcorrencia: (
    fotoBase64: string,
    sinal?: AbortSignal,
  ) => Promise<ClassificacaoIA>;
  readonly listarOpcoesDeTipo: () => Promise<readonly OpcaoTipoResiduo[]>;
  readonly criarOcorrencia: (
    entrada: NovaOcorrencia,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly aprovarOcorrencias: (
    ids: readonly string[],
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<number>;
  readonly aprovarOcorrencia: (
    id: string,
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly recusarOcorrencia: (
    id: string,
    motivo: string,
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly encaminharOcorrencia: (
    id: string,
    setor: string,
    mensagem: string,
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly registrarObservacao: (
    id: string,
    texto: string,
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
  readonly alterarClassificacao: (
    id: string,
    nova: NovaClassificacao,
    autor: string,
    sinal?: AbortSignal,
  ) => Promise<Ocorrencia>;
}

const servico: ServicoOcorrencias = USAR_MOCKS ? mock : api;

export const {
  assinarMudancas,
  quantidadeAguardando,
  lerOcorrencias,
  semelhantesNaSemana,
  garantirCarregado,
  listarSetores,
  listarOcorrencias,
  obterOcorrencia,
  analisarOcorrencia,
  listarOpcoesDeTipo,
  criarOcorrencia,
  aprovarOcorrencias,
  aprovarOcorrencia,
  recusarOcorrencia,
  encaminharOcorrencia,
  registrarObservacao,
  alterarClassificacao,
} = servico;
