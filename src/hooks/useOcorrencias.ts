import { useEffect, useState } from "react";

import { listarOcorrencias } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";
import type { Ocorrencia } from "../types/ocorrencia";

/**
 * Busca a lista de ocorrências e devolve estado tipado com loading/erro.
 * Os três valores ficam num único estado, para nunca ficarem fora de sincronia.
 * Cancela a requisição no cleanup para não atualizar estado em componente
 * já desmontado — evita warnings de React 18 StrictMode e memory leaks.
 */
export function useOcorrencias(
  chaveRecarga = 0,
): EstadoRequisicao<readonly Ocorrencia[]> {
  const [estado, setEstado] = useState<EstadoRequisicao<readonly Ocorrencia[]>>({
    dados: null,
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    const controle = new AbortController();
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));

    listarOcorrencias(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) {
          setEstado({ dados: lista, carregando: false, erro: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setEstado((atual) => ({
          ...atual,
          carregando: false,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Não foi possível carregar ocorrências.",
        }));
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  return estado;
}
