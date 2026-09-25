import { useEffect, useState } from "react";

import { listarOcorrencias } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";
import type { Ocorrencia } from "../types/ocorrencia";

/**
 * Busca a lista de ocorrências e devolve estado tipado com loading/erro.
 * Cancela a requisição no cleanup para não atualizar estado em componente
 * já desmontado — evita warnings de React 18 StrictMode e memory leaks.
 */
export function useOcorrencias(
  chaveRecarga = 0,
): EstadoRequisicao<readonly Ocorrencia[]> {
  const [dados, setDados] = useState<readonly Ocorrencia[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    listarOcorrencias(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) {
          setDados(lista);
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível carregar ocorrências.",
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  return { dados, carregando, erro };
}
