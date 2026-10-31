import { useEffect, useState } from "react";

import { ErroHttp } from "../services/http";
import { obterOcorrencia, semelhantesNaSemana } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";
import type { Ocorrencia } from "../types/ocorrencia";

/** Estado da busca, com `naoEncontrada` quando a ocorrência não existe (ou é de outra unidade). */
export interface EstadoOcorrencia extends EstadoRequisicao<Ocorrencia> {
  readonly naoEncontrada: boolean;
}

export function useOcorrencia(
  id: string | undefined,
  chaveRecarga = 0,
): EstadoOcorrencia {
  const [estado, setEstado] = useState<EstadoOcorrencia>({
    dados: null,
    carregando: Boolean(id),
    erro: null,
    naoEncontrada: false,
  });

  useEffect(() => {
    if (!id) {
      setEstado({
        dados: null,
        carregando: false,
        erro: "Identificador da ocorrência ausente.",
        naoEncontrada: true,
      });
      return;
    }

    const controle = new AbortController();
    setEstado((atual) => ({
      ...atual,
      carregando: true,
      erro: null,
      naoEncontrada: false,
    }));

    obterOcorrencia(id, controle.signal)
      .then((item) => {
        if (!controle.signal.aborted) {
          setEstado({
            dados: item,
            carregando: false,
            erro: null,
            naoEncontrada: false,
          });
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
          naoEncontrada: excecao instanceof ErroHttp && excecao.status === 404,
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
