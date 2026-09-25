import type { ClassificacaoIA } from "./classificacao";
import type { Material } from "./material";

export type StatusOcorrencia =
  | "aguardando_classificacao"
  | "classificada"
  | "encaminhada"
  | "finalizada";

export interface Localizacao {
  readonly setor: string;
  readonly unidade: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface Ocorrencia {
  readonly id: string;
  readonly codigo: string;
  readonly descricao: string;
  readonly fotoUrl: string;
  readonly localizacao: Localizacao;
  readonly material: Material | null;
  readonly status: StatusOcorrencia;
  readonly classificacao: ClassificacaoIA | null;
  readonly cooperativaId: string | null;
  readonly criadaEm: string;
  readonly atualizadaEm: string;
  readonly criadaPor: string;
}

export interface NovaOcorrencia {
  readonly descricao: string;
  readonly localizacao: Localizacao;
  readonly fotoBase64: string;
}

export interface AtualizarOcorrencia {
  readonly material?: Material;
  readonly cooperativaId?: string;
  readonly status?: StatusOcorrencia;
}

export const ROTULOS_STATUS: Readonly<Record<StatusOcorrencia, string>> = {
  aguardando_classificacao: "Aguardando classificação",
  classificada: "Classificada",
  encaminhada: "Encaminhada",
  finalizada: "Finalizada",
};
