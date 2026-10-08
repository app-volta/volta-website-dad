import { useEffect, useState } from "react";

import { listarCooperativas } from "../services/cooperativas";
import type { EstadoRequisicao } from "../types/comum";
import type { Cooperativa } from "../types/cooperativa";

/** `chaveRecarga` busca a lista de novo quando muda, sem apagar a que já está na tela. */
export function useCooperativas(
  chaveRecarga = 0,
): EstadoRequisicao<readonly Cooperativa[]> {
  const [dados, setDados] = useState<readonly Cooperativa[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    listarCooperativas(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) setDados(lista);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Falha ao carregar cooperativas.",
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  return { dados, carregando, erro };
}
