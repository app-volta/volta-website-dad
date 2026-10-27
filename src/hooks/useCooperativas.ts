import { useEffect, useState } from "react";

import {
  adicionarCooperativa,
  listarCooperativas,
  obterCooperativa,
} from "../services/cooperativas";
import type { EstadoRequisicao } from "../types/comum";
import type { Cooperativa, NovaCooperativa } from "../types/cooperativa";

/** `chaveRecarga` busca a lista de novo quando muda, sem apagar a que já está na tela. */
export function useCooperativas(
  chaveRecarga = 0,
): EstadoRequisicao<readonly Cooperativa[]> {
  const [dados, setDados] = useState<readonly Cooperativa[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    listarCooperativas(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) setDados(lista);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Falha ao carregar cooperativas.",
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [chaveRecarga]);

  return { dados, carregando, erro };
}

interface ResultadoCooperativa {
  readonly id: string;
  readonly dados: Cooperativa | null;
  readonly erro: string | null;
}

/** Uma cooperativa pelo identificador. Sem identificador, devolve erro em vez de buscar. */
export function useCooperativa(id: string | undefined): EstadoRequisicao<Cooperativa> {
  const [resultado, setResultado] = useState<ResultadoCooperativa | null>(null);

  useEffect(() => {
    if (!id) return;
    const controle = new AbortController();
    obterCooperativa(id, controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) setResultado({ id, dados, erro: null });
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setResultado({
          id,
          dados: null,
          erro:
            excecao instanceof Error
              ? excecao.message
              : "Falha ao carregar a cooperativa.",
        });
      });
    return () => controle.abort();
  }, [id]);

  if (!id) {
    return { dados: null, carregando: false, erro: "Identificador da cooperativa ausente." };
  }
  const atual = resultado !== null && resultado.id === id ? resultado : null;
  return { dados: atual?.dados ?? null, carregando: atual === null, erro: atual?.erro ?? null };
}

interface AcoesCooperativas {
  readonly adicionar: (nova: NovaCooperativa, sinal?: AbortSignal) => Promise<Cooperativa>;
}

const ACOES: AcoesCooperativas = { adicionar: adicionarCooperativa };

export function useAcoesCooperativas(): AcoesCooperativas {
  return ACOES;
}
