import { useEffect, useState } from "react";

import { listarEquipe } from "../services/equipe";
import type { EstadoRequisicao } from "../types/comum";
import type { MembroEquipe } from "../types/equipe";

interface Resultado {
  readonly chave: number;
  readonly dados: readonly MembroEquipe[] | null;
  readonly erro: string | null;
}

/**
 * `chaveRecarga` busca a equipe de novo quando muda, sem apagar a lista que já
 * está na tela. "Carregando" é derivado: vale enquanto o resultado é de outra chave.
 */
export function useEquipe(
  chaveRecarga = 0,
): EstadoRequisicao<readonly MembroEquipe[]> {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controle = new AbortController();

    listarEquipe(controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) {
          setResultado({ chave: chaveRecarga, dados, erro: null });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setResultado({
          chave: chaveRecarga,
          dados: null,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Falha ao carregar a equipe.",
        });
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  const atual = resultado?.chave === chaveRecarga;
  return {
    dados: resultado?.dados ?? null,
    carregando: !atual,
    erro: atual ? (resultado?.erro ?? null) : null,
  };
}
