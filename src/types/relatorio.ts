import type { Material } from "./material";

export type PeriodoRelatorio = "mes" | "trimestre" | "ano";

export const PERIODOS_RELATORIO: readonly PeriodoRelatorio[] = [
  "mes",
  "trimestre",
  "ano",
] as const;

export interface RecuperadoPorMaterial {
  readonly material: Material;
  readonly kg: number;
}

export interface GeracaoPorSetor {
  readonly nome: string;
  readonly kg: number;
}

export interface DestinacaoCooperativa {
  readonly cooperativaId: string;
  readonly nome: string;
  readonly percentual: number;
}

export interface RelatorioPgrs {
  readonly periodo: PeriodoRelatorio;
  readonly ocorrencias: number;
  readonly recuperadoKg: number;
  /** Percentual de ocorrências aprovadas entre as analisadas. */
  readonly taxaAprovacao: number;
  /** Percentual do resíduo que deixou de ir para o aterro. */
  readonly desvioAterro: number;
  readonly porMaterial: readonly RecuperadoPorMaterial[];
  readonly setores: readonly GeracaoPorSetor[];
  readonly destinacao: readonly DestinacaoCooperativa[];
}

export interface PgrsGerado {
  readonly geradoEm: string;
}
