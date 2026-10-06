import type { ClassificacaoIA } from "./classificacao";
import type { Material } from "./material";

export type StatusOcorrencia =
  | "aguardando_classificacao"
  | "classificada"
  | "aprovada"
  | "encaminhada"
  | "recusada"
  | "finalizada";

export type PrioridadeOcorrencia = "alta" | "media" | "baixa";

export type QualidadeMaterial = "A" | "B" | "C";

export type TipoEvento =
  | "registro"
  | "ia"
  | "classificacao"
  | "encaminhamento"
  | "observacao"
  | "aprovacao"
  | "recusa";

export interface EventoOcorrencia {
  readonly id: string;
  readonly tipo: TipoEvento;
  readonly autor: string;
  readonly texto: string;
  readonly em: string;
  readonly rotuloTempo?: string;
}

export interface Localizacao {
  readonly setor: string;
  readonly unidade: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface Ocorrencia {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly pesoKg: number;
  readonly prioridade: PrioridadeOcorrencia;
  readonly fotoUrl: string;
  readonly localizacao: Localizacao;
  readonly material: Material | null;
  readonly status: StatusOcorrencia;
  readonly classificacao: ClassificacaoIA | null;
  readonly cooperativaId: string | null;
  readonly criadaEm: string;
  readonly atualizadaEm: string;
  readonly criadaPor: string;
  readonly criadaPorNome: string;
  readonly qualidade: QualidadeMaterial;
  readonly perigoso: boolean;
  readonly setorDestino: string | null;
  readonly motivoRecusa: string | null;
  readonly ultimaAlteracao: string | null;
  readonly historico: readonly EventoOcorrencia[];
}

export interface NovaOcorrencia {
  readonly descricao: string;
  readonly prioridade: PrioridadeOcorrencia;
  readonly autorNome: string;
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
  classificada: "Aguardando aprovação",
  aprovada: "Aprovada",
  encaminhada: "Encaminhada",
  recusada: "Recusada",
  finalizada: "Finalizada",
};
