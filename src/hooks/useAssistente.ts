import { useSyncExternalStore } from "react";

import {
  assinarConversa,
  iniciarConversa,
  lerConversa,
  perguntar,
  SUGESTOES_ASSISTENTE,
} from "../services/assistente";
import type { MensagemAssistente } from "../types/assistente";

interface Assistente {
  readonly mensagens: readonly MensagemAssistente[];
  readonly pensando: boolean;
  readonly sugestoes: readonly string[];
  readonly iniciar: () => Promise<void>;
  readonly perguntar: (pergunta: string) => Promise<void>;
}

/** Conversa com o assistente VOLTA. O estado vive fora do componente e dura até recarregar a página. */
export function useAssistente(): Assistente {
  const { mensagens, pensando } = useSyncExternalStore(assinarConversa, lerConversa);
  return {
    mensagens,
    pensando,
    sugestoes: SUGESTOES_ASSISTENTE,
    iniciar: iniciarConversa,
    perguntar,
  };
}
