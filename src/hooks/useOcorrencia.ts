import { useEffect, useState } from "react";

import { obterOcorrencia, semelhantesNaSemana } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";
import type { Ocorrencia } from "../types/ocorrencia";

export function useOcorrencia(
  id: string | undefined,
  chaveRecarga = 0,
): EstadoRequisicao<Ocorrencia> {
  const [estado, setEstado] = useState<EstadoRequisicao<Ocorrencia>>({
    dados: null,
    carregando: Boolean(id),
    erro: null,
  });

  useEffect(() => {
    if (!id) {
      setEstado({
        dados: null,
        carregando: false,
        erro: "Identificador da ocorrência ausente.",
      });
      return;
    }

    const controle = new AbortController();
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));

    obterOcorrencia(id, controle.signal)
      .then((item) => {
        if (!controle.signal.aborted) {
          setEstado({ dados: item, carregando: false, erro: null });
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
              : "Falha ao carregar a ocorrência.",
        }));
      });

    return () => controle.abort();
  }, [id, chaveRecarga]);

  return estado;
}

/** Quantas ocorrências parecidas a unidade teve na semana; 0 enquanto a ocorrência não chegou. */
export function useSemelhantesNaSemana(ocorrencia: Ocorrencia | null): number {
  return ocorrencia ? semelhantesNaSemana(ocorrencia) : 0;
}
