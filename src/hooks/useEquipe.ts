import { useEffect, useState } from "react";

import {
  alterarPapel,
  cancelarConvite,
  convidarPessoa,
  listarEquipe,
  reenviarConvite,
} from "../services/equipe";
import type { EstadoLista } from "../types/comum";
import type { MembroEquipe } from "../types/equipe";
import { foiProibido } from "../utils/erros";

interface Resultado {
  readonly chave: number;
  readonly dados: readonly MembroEquipe[] | null;
  readonly erro: string | null;
  readonly semPermissao: boolean;
}

/**
 * `chaveRecarga` busca a equipe de novo quando muda, sem apagar a lista que já
 * está na tela. "Carregando" é derivado: vale enquanto o resultado é de outra chave.
 */
export function useEquipe(
  chaveRecarga = 0,
): EstadoLista<readonly MembroEquipe[]> {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controle = new AbortController();

    listarEquipe(controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) {
          setResultado({ chave: chaveRecarga, dados, erro: null, semPermissao: false });
        }
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        const proibido = foiProibido(excecao);
        setResultado({
          chave: chaveRecarga,
          dados: null,
          semPermissao: proibido,
          erro: proibido
            ? null
            : excecao instanceof Error
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
    semPermissao: atual ? (resultado?.semPermissao ?? false) : false,
  };
}

interface AcoesEquipe {
  readonly convidar: typeof convidarPessoa;
  readonly reenviar: typeof reenviarConvite;
  readonly cancelar: typeof cancelarConvite;
  readonly alterarPapel: typeof alterarPapel;
}

const ACOES: AcoesEquipe = {
  convidar: convidarPessoa,
  reenviar: reenviarConvite,
  cancelar: cancelarConvite,
  alterarPapel,
};

export function useAcoesEquipe(): AcoesEquipe {
  return ACOES;
}
