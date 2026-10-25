export type OrigemMensagem = "usuario" | "cooperativa";

export interface MensagemChat {
  readonly id: string;
  readonly cooperativaId: string;
  readonly origem: OrigemMensagem;
  readonly conteudo: string;
  readonly enviadaEm: string;
  readonly lida: boolean;
}

export interface NovaMensagem {
  readonly cooperativaId: string;
  readonly conteudo: string;
}
