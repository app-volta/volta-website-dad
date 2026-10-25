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

export interface PosicaoNoRanking {
  readonly posicao: number;
  readonly totalDeEmpresas: number;
  /** De 0 a 1000. */
  readonly pontos: number;
}

export interface RelatorioPgrs {
  readonly periodo: PeriodoRelatorio;
  readonly ocorrencias: number;
  readonly recuperadoKg: number;
  /** Percentual de ocorrências aprovadas entre as analisadas; nulo sem nenhuma analisada. */
  readonly taxaAprovacao: number | null;
  /** Percentual do resíduo que deixou de ir para o aterro; nulo sem base para calcular. */
  readonly desvioAterro: number | null;
  readonly porMaterial: readonly RecuperadoPorMaterial[];
  readonly setores: readonly GeracaoPorSetor[];
  readonly destinacao: readonly DestinacaoCooperativa[];
  /** Score ESG da empresa (GET /esg/score); ausente no protótipo e sem permissão. */
  readonly scoreEsg?: number | null;
  /** Posição da empresa no ranking (volta-api-redis); ausente no protótipo ou sem pontuação. */
  readonly posicaoNoRanking?: PosicaoNoRanking | null;
}

export interface PgrsGerado {
  readonly geradoEm: string;
}
