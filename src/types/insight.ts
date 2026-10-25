import type { Trecho } from "./notificacao";

/** "VOLTA notou": uma observação curta sobre os registros recentes. */
export interface InsightVolta {
  readonly texto: string;
}

/** "Dica do VOLTA": o que merece atenção, com o atalho para agir. */
export interface DicaVolta {
  readonly trechos: readonly Trecho[];
  readonly destino: string;
  readonly rotuloDestino: string;
}
