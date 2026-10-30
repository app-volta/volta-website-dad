import { useEffect, useState } from "react";

import { listarOpcoesDeTipo } from "../services/ocorrencias";
import type { OpcaoTipoResiduo } from "../types/classificacao";
import type { EstadoRequisicao } from "../types/comum";

/** Tipos de resíduo que a pessoa pode escolher ao corrigir a análise da IA. */
export function useOpcoesDeTipo(): EstadoRequisicao<readonly OpcaoTipoResiduo[]> {
  const [estado, setEstado] = useState<
    EstadoRequisicao<readonly OpcaoTipoResiduo[]>
  >({ dados: null, carregando: true, erro: null });

  useEffect(() => {
    const controle = new AbortController();

    listarOpcoesDeTipo(controle.signal)
      .then((opcoes) => {
        if (!controle.signal.aborted) {
          setEstado({ dados: opcoes, carregando: false, erro: null });
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
              : "Não foi possível carregar os tipos de resíduo.",
        }));
      });

    return () => controle.abort();
  }, []);

  return estado;
}
