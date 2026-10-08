export type PapelEquipe = "colaborador" | "responsavel_tecnico" | "gestor";

export const PAPEIS_EQUIPE: readonly PapelEquipe[] = [
  "colaborador",
  "responsavel_tecnico",
  "gestor",
] as const;

export interface MembroEquipe {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly papel: PapelEquipe;
  /** Fica nulo até a pessoa convidada aceitar e ser alocada a um setor. */
  readonly setor: string | null;
  readonly registrosNoMes: number;
  /** Data e hora do último acesso; nula enquanto o convite não foi aceito. */
  readonly ultimaAtividade: string | null;
  readonly convitePendente: boolean;
}

export interface NovoConvite {
  readonly email: string;
  readonly papel: PapelEquipe;
}
