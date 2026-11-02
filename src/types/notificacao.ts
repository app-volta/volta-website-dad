/** Pedaço de um texto, com ou sem destaque em negrito. */
export interface Trecho {
  readonly texto: string;
  readonly destaque?: boolean;
}

/** "ocorrencia" e "coleta" são as que a API devolve; as demais o painel monta sozinho. */
export type TipoNotificacao =
  | "aprovacao"
  | "licenca"
  | "fila"
  | "meta"
  | "ocorrencia"
  | "coleta";

export interface Notificacao {
  readonly id: string;
  readonly tipo: TipoNotificacao;
  readonly trechos: readonly Trecho[];
  readonly quando: string;
  readonly lida: boolean;
  /** Rota aberta ao clicar na notificação. */
  readonly destino: string;
}
