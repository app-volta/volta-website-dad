export interface EstadoRequisicao<T> {
  readonly dados: T | null;
  readonly carregando: boolean;
  readonly erro: string | null;
}

export interface ResultadoValidacao {
  readonly valido: boolean;
  readonly erros: Readonly<Record<string, string>>;
}

export interface ItemMenu {
  readonly rotulo: string;
  readonly caminho: string;
  readonly icone: string;
}
