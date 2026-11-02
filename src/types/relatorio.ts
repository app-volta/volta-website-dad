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

export interface OcorrenciasDoSetor {
  readonly nome: string;
  readonly ocorrencias: number;
}

export interface DestinacaoCooperativa {
  readonly cooperativaId: string;
  readonly nome: string;
  readonly percentual: number;
  /** Quilos destinados à cooperativa no período; ausente quando só se sabe a parcela. */
  readonly kg?: number;
  /** Materiais das ocorrências que a cooperativa coletou. */
  readonly materiais?: readonly Material[];
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
  /** Quantas ocorrências cada setor registrou no período, do setor com mais para o com menos. */
  readonly ocorrenciasPorSetor: readonly OcorrenciasDoSetor[];
  readonly destinacao: readonly DestinacaoCooperativa[];
  /** Score ESG da empresa (GET /esg/score); ausente no protótipo e sem permissão. */
  readonly scoreEsg?: number | null;
  /** Posição da empresa no ranking (volta-api-redis); ausente no protótipo ou sem pontuação. */
  readonly posicaoNoRanking?: PosicaoNoRanking | null;
  /** O período anterior, do mesmo tamanho, para o documento comparar; ausente quando não há base. */
  readonly anterior?: PeriodoAnterior | null;
  /** Todos os setores que geraram resíduo aprovado, do maior para o menor (o documento junta os menores). */
  readonly setoresRecuperados?: readonly GeracaoPorSetor[];
  /** As ocorrências aprovadas mais recentes do período, para a amostra do documento. */
  readonly aprovadasRecentes?: readonly OcorrenciaDoRelatorio[];
  /** O que mais se repetiu no período (mesmo setor e mesmo tipo de resíduo, ao menos duas vezes). */
  readonly recorrencia?: RecorrenciaNoPeriodo | null;
}

export interface RecorrenciaNoPeriodo {
  readonly setor: string;
  readonly titulo: string;
  readonly vezes: number;
}

/** O que o período anterior teve, para os "vs. setembro" do documento. */
export interface PeriodoAnterior {
  /** "setembro de 2026", "o trimestre anterior" ou "2025": como o texto cita o período. */
  readonly rotulo: string;
  readonly ocorrencias: number;
  readonly recuperadoKg: number;
  readonly taxaAprovacao: number | null;
}

/** Uma ocorrência aprovada na amostra do documento do PGRS. */
export interface OcorrenciaDoRelatorio {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly setor: string;
  readonly material: Material | null;
  readonly pesoKg: number;
  readonly registradaPor: string;
}
