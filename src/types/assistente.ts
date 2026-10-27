import type { Trecho } from "./notificacao";

export type AutorMensagem = "assistente" | "usuario";

export interface AcaoMensagem {
  readonly rotulo: string;
  /** Rota aberta ao clicar no botão da mensagem. */
  readonly destino: string;
}

export interface MensagemAssistente {
  readonly id: string;
  readonly autor: AutorMensagem;
  readonly trechos: readonly Trecho[];
  readonly acao?: AcaoMensagem;
}
