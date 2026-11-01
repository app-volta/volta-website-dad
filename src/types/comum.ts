export interface EstadoRequisicao<T> {
  readonly dados: T | null;
  readonly carregando: boolean;
  readonly erro: string | null;
}

/** Uma lista que a API pode recusar por perfil (403): a tela mostra "acesso restrito" em vez de um erro. */
export interface EstadoLista<T> extends EstadoRequisicao<T> {
  readonly semPermissao: boolean;
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
