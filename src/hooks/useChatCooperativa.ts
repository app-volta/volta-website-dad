import { useEffect, useState } from "react";

import { listarMensagens } from "../services/chat";
import type { MensagemChat } from "../types/chat";
import type { EstadoRequisicao } from "../types/comum";

export function useChatCooperativa(
  cooperativaId: string | undefined,
  chaveRecarga = 0,
): EstadoRequisicao<readonly MensagemChat[]> {
  const [dados, setDados] = useState<readonly MensagemChat[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(Boolean(cooperativaId));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!cooperativaId) {
      setDados(null);
      setCarregando(false);
      setErro("Cooperativa não informada.");
      return;
    }

    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    listarMensagens(cooperativaId, controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) setDados(lista);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível carregar mensagens.",
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [cooperativaId, chaveRecarga]);

  return { dados, carregando, erro };
}
