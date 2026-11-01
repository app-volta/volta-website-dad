import { useEffect, useState } from "react";

import { gerarPgrs, obterRelatorio } from "../services/relatorios";
import type { EstadoRequisicao } from "../types/comum";
import type { PeriodoRelatorio, RelatorioPgrs } from "../types/relatorio";

interface Resultado {
  readonly periodo: PeriodoRelatorio;
  readonly chave: number;
  readonly dados: RelatorioPgrs | null;
  readonly erro: string | null;
}

/**
 * Troca de período mantém o relatório anterior na tela até o novo chegar, e
 * `chaveRecarga` busca de novo (o "Tentar de novo" da tela).
 * "Carregando" é derivado: vale enquanto o último resultado é de outro período ou chave.
 */
export function useRelatorio(
  periodo: PeriodoRelatorio,
  chaveRecarga = 0,
): EstadoRequisicao<RelatorioPgrs> {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controle = new AbortController();

    obterRelatorio(periodo, controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) {
          setResultado({ periodo, chave: chaveRecarga, dados, erro: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setResultado({
          periodo,
          chave: chaveRecarga,
          dados: null,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Falha ao carregar o relatório.",
        });
      });

    return () => controle.abort();
  }, [periodo, chaveRecarga]);

  const atual = resultado?.periodo === periodo && resultado.chave === chaveRecarga;
  return {
    dados: resultado?.dados ?? null,
    carregando: !atual,
    erro: atual ? (resultado?.erro ?? null) : null,
  };
}

interface AcoesRelatorio {
  readonly gerarPgrs: typeof gerarPgrs;
}

const ACOES: AcoesRelatorio = { gerarPgrs };

export function useAcoesRelatorio(): AcoesRelatorio {
  return ACOES;
}
