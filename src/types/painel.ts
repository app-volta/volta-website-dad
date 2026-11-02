import type { Material } from "./material";

export interface PontoRecuperacao {
  readonly rotulo: string;
  readonly valor: number;
  /** Meta do período; ausente quando a empresa ainda não definiu uma. */
  readonly meta?: number;
}

export interface RecuperadoDoMaterial {
  readonly material: Material;
  readonly kg: number;
}

/** Uma linha de "Atividade da equipe": quem fez o quê, e há quanto tempo. */
export interface AtividadeEquipe {
  readonly id: string;
  readonly autor: string;
  readonly acao: string;
  readonly tempo: string;
  /** Variável CSS da cor do avatar. */
  readonly cor: string;
}

/** Números e séries da tela Início. */
export interface PainelInicio {
  readonly ocorrenciasMes: number;
  /** Diferença para o mês passado, em ocorrências; nula sem mês anterior para comparar. */
  readonly ocorrenciasVariacao: number | null;
  readonly sparkOcorrencias: readonly number[] | null;
  readonly recuperadoMesKg: number;
  /** Diferença para o mês passado, em %; nula sem mês anterior para comparar. */
  readonly recuperadoVariacaoPct: number | null;
  readonly sparkRecuperado: readonly number[] | null;
  /** Percentual de aprovadas entre as analisadas; nulo sem nenhuma analisada. */
  readonly taxaAprovacao: number | null;
  /** Diferença para o mês passado, em pontos percentuais. */
  readonly taxaVariacaoPontos: number | null;
  readonly sparkTaxa: readonly number[] | null;
  /** Complemento do cartão "Aguardando aprovação". */
  readonly textoEspera: string;
  readonly sparkPendentes: readonly number[] | null;
  readonly porMaterial: readonly RecuperadoDoMaterial[];
  /** Recuperado de materiais fora das quatro categorias do painel (madeira, orgânico...). */
  readonly outrosKg: number;
  readonly semanas: readonly PontoRecuperacao[];
  readonly meses: readonly PontoRecuperacao[];
  readonly atividades: readonly AtividadeEquipe[];
}
