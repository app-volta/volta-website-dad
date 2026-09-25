import type { MensagemChat, NovaMensagem } from "../types/chat";
import { aguardar } from "./http";

const MENSAGENS: MensagemChat[] = [
  {
    id: "msg-1",
    cooperativaId: "coop-1",
    origem: "cooperativa",
    conteudo: "Podemos coletar o papelão amanhã de manhã, tudo bem?",
    enviadaEm: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    lida: true,
  },
  {
    id: "msg-2",
    cooperativaId: "coop-1",
    origem: "usuario",
    conteudo: "Perfeito! Deixaremos os fardos prontos no pátio às 8h.",
    enviadaEm: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    lida: true,
  },
  {
    id: "msg-3",
    cooperativaId: "coop-2",
    origem: "cooperativa",
    conteudo: "Precisamos que o plástico venha sem contaminação orgânica.",
    enviadaEm: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    lida: false,
  },
];

export async function listarMensagens(
  cooperativaId: string,
  sinal?: AbortSignal,
): Promise<readonly MensagemChat[]> {
  await aguardar(400, sinal);
  return MENSAGENS.filter((m) => m.cooperativaId === cooperativaId).sort((a, b) =>
    a.enviadaEm.localeCompare(b.enviadaEm),
  );
}

export async function enviarMensagem(
  entrada: NovaMensagem,
  sinal?: AbortSignal,
): Promise<MensagemChat> {
  await aguardar(500, sinal);
  const nova: MensagemChat = {
    id: `msg-${Math.random().toString(36).slice(2, 9)}`,
    cooperativaId: entrada.cooperativaId,
    origem: "usuario",
    conteudo: entrada.conteudo,
    enviadaEm: new Date().toISOString(),
    lida: true,
  };
  MENSAGENS.push(nova);
  return nova;
}
