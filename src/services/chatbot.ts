import type {
  PedidoChatApi,
  RespostaChatApi,
  SessaoChatApi,
} from "../types/api";
import { BASE_CHATBOT, requisitar } from "./http";
import type { OpcoesRequisicao } from "./http";

/**
 * Cliente do volta-chatbot (IA). Usa o mesmo token da volta-api. As respostas
 * dependem de um modelo de linguagem, então o tempo limite é bem maior que o das
 * demais chamadas, e um 401 aqui não derruba a sessão do app.
 */

const TEMPO_RESPOSTA_MS = 90_000;

const BASE: OpcoesRequisicao = {
  base: BASE_CHATBOT,
  detalheDoServidor: true,
  semLogoutEm401: true,
};

export function criarSessaoChat(sinal?: AbortSignal): Promise<SessaoChatApi> {
  return requisitar<SessaoChatApi>("/v1/sessions", {
    ...BASE,
    metodo: "POST",
    sinal,
  });
}

export function perguntarAoChatbot(
  sessaoId: string,
  mensagem: string,
  sinal?: AbortSignal,
): Promise<RespostaChatApi> {
  const corpo: PedidoChatApi = { session_id: sessaoId, message: mensagem };
  return requisitar<RespostaChatApi>("/v1/chat", {
    ...BASE,
    metodo: "POST",
    corpo,
    tempoLimiteMs: TEMPO_RESPOSTA_MS,
    sinal,
  });
}
