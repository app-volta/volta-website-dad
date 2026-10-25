import { useEffect, useState } from "react";

import { ErroHttp } from "../services/http";
import { indicarCooperativas } from "../services/ranking";
import type { IndicacaoDeCooperativas } from "../types/cooperativa";

const QUANTAS = 3;

interface Resultado {
  readonly ocorrenciaId: string;
  readonly indicacao: IndicacaoDeCooperativas | null;
  readonly aviso: string | null;
}

interface EstadoIndicacao {
  readonly indicacao: IndicacaoDeCooperativas | null;
  /** Motivo de negócio que a API deu para não indicar (ex.: empresa sem coordenadas). */
  readonly aviso: string | null;
}

/**
 * Cooperativas que a API de ranking indica para a ocorrência. Só busca quando
 * `ativo` (ocorrência ainda sem decisão). Se a API está fora do ar, não há
 * indicação e nada aparece; só as recusas de regra de negócio (409 e 422) viram aviso.
 */
export function useCooperativasIndicadas(
  ocorrenciaId: string | null,
  ativo: boolean,
): EstadoIndicacao {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!ocorrenciaId || !ativo) return undefined;
    const controle = new AbortController();
    indicarCooperativas(ocorrenciaId, QUANTAS, controle.signal)
      .then((indicacao) => {
        if (!controle.signal.aborted) {
          setResultado({ ocorrenciaId, indicacao, aviso: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        const aviso =
          excecao instanceof ErroHttp &&
          (excecao.status === 422 || excecao.status === 409)
            ? excecao.message
            : null;
        setResultado({ ocorrenciaId, indicacao: null, aviso });
      });
    return () => controle.abort();
  }, [ocorrenciaId, ativo]);

  const atual = ativo && resultado?.ocorrenciaId === ocorrenciaId ? resultado : null;
  return { indicacao: atual?.indicacao ?? null, aviso: atual?.aviso ?? null };
}
