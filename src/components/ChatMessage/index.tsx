import type { ReactNode } from "react";

import type { MensagemChat } from "../../types/chat";
import { formatarDataHora } from "../../utils/formatacao";
import "./styles.css";

interface ChatMessageProps {
  readonly mensagem: MensagemChat;
}

export function ChatMessage({ mensagem }: ChatMessageProps): ReactNode {
  const daCooperativa = mensagem.origem === "cooperativa";
  return (
    <li
      className={
        daCooperativa
          ? "chat-msg chat-msg--cooperativa"
          : "chat-msg chat-msg--usuario"
      }
    >
      <p className="chat-msg__conteudo">{mensagem.conteudo}</p>
      <time className="chat-msg__hora" dateTime={mensagem.enviadaEm}>
        {formatarDataHora(mensagem.enviadaEm)}
      </time>
    </li>
  );
}
