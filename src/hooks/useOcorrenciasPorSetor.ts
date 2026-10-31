import { useEffect, useState } from "react";

import { listarOcorrenciasPorSetor } from "../services/bi";
import type { OcorrenciasDoSetor } from "../types/bi";
import type { EstadoRequisicao } from "../types/comum";

interface ResultadoDoBi {
  /** Qual busca gerou este resultado; se for outra que a atual, ainda está carregando. */
  readonly chave: number;
  readonly dados: readonly OcorrenciasDoSetor[] | null;
  readonly erro: string | null;
}

/**
 * Ocorrências por setor da empresa da pessoa logada, lidas do BI.
 * `chaveRecarga` busca de novo quando muda, sem apagar o que já está na tela.
 */
export function useOcorrenciasPorSetor(
  chaveRecarga = 0,
): EstadoRequisicao<readonly OcorrenciasDoSetor[]> {
  const [resultado, setResultado] = useState<ResultadoDoBi | null>(null);

  useEffect(() => {
    const controle = new AbortController();

    listarOcorrenciasPorSetor(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) {
          setResultado({ chave: chaveRecarga, dados: lista, erro: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setResultado((atual) => ({
          chave: chaveRecarga,
          dados: atual?.dados ?? null,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Não foi possível carregar o gráfico do BI.",
        }));
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  const carregando = resultado === null || resultado.chave !== chaveRecarga;
  return {
    dados: resultado?.dados ?? null,
    carregando,
    erro: carregando ? null : (resultado?.erro ?? null),
  };
}
