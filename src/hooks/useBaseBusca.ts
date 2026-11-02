import { useEffect, useState } from "react";

import { listarCooperativas } from "../services/cooperativas";
import { listarOcorrencias } from "../services/ocorrencias";
import type { BaseBusca } from "../utils/busca";

const BASE_VAZIA: BaseBusca = { ocorrencias: [], cooperativas: [] };

/** Dados sobre os quais a busca rápida filtra. Vale `null` até a primeira resposta chegar. */
export function useBaseBusca(): BaseBusca | null {
  const [base, setBase] = useState<BaseBusca | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    // Só quem administra a empresa lista cooperativas na API: sem permissão, a busca segue sem elas.
    Promise.all([
      listarOcorrencias(controle.signal),
      listarCooperativas(controle.signal).catch(() => []),
    ])
      .then(([ocorrencias, cooperativas]) => {
        if (!controle.signal.aborted) setBase({ ocorrencias, cooperativas });
      })
      .catch(() => {
        if (!controle.signal.aborted) setBase(BASE_VAZIA);
      });
    return () => controle.abort();
  }, []);

  return base;
}
