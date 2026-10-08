import { useEffect, useState } from "react";

import { obterRelatorio } from "../services/relatorios";
import type { EstadoRequisicao } from "../types/comum";
import type { PeriodoRelatorio, RelatorioPgrs } from "../types/relatorio";

interface Resultado {
  readonly periodo: PeriodoRelatorio;
  readonly dados: RelatorioPgrs | null;
  readonly erro: string | null;
}

/**
 * Troca de período mantém o relatório anterior na tela até o novo chegar.
 * "Carregando" é derivado: vale enquanto o último resultado é de outro período.
 */
export function useRelatorio(
  periodo: PeriodoRelatorio,
): EstadoRequisicao<RelatorioPgrs> {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controle = new AbortController();

    obterRelatorio(periodo, controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) {
          setResultado({ periodo, dados, erro: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setResultado({
          periodo,
          dados: null,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Falha ao carregar o relatório.",
        });
      });

    return () => controle.abort();
  }, [periodo]);

  const atual = resultado?.periodo === periodo;
  return {
    dados: resultado?.dados ?? null,
    carregando: !atual,
    erro: atual ? (resultado?.erro ?? null) : null,
  };
}
