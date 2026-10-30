import { useEffect, useState } from "react";

import { listarSetores } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";

/** Setores onde a pessoa pode registrar uma ocorrência. */
export function useSetores(): EstadoRequisicao<readonly string[]> {
  const [estado, setEstado] = useState<EstadoRequisicao<readonly string[]>>({
    dados: null,
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    const controle = new AbortController();

    listarSetores(controle.signal)
      .then((setores) => {
        if (!controle.signal.aborted) {
          setEstado({ dados: setores, carregando: false, erro: null });
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
              : "Não foi possível carregar os setores.",
        }));
      });

    return () => controle.abort();
  }, []);

  return estado;
}
