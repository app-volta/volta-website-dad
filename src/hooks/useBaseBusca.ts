import { useEffect, useState } from "react";

import { listarCooperativas } from "../services/cooperativas";
import { listarOcorrencias } from "../services/ocorrencias";
import type { BaseBusca } from "../utils/busca";

const BASE_VAZIA: BaseBusca = { ocorrencias: [], cooperativas: [] };

/** Dados sobre os quais a busca rápida filtra. Vale `null` até a primeira resposta chegar. */
export function useBaseBusca(): BaseBusca | null {
  const [base, setBase] = useState<BaseBusca | null>(null);

  useEffect(() => {
    let ativo = true;
    // Só quem administra a empresa lista cooperativas na API: sem permissão, a busca segue sem elas.
    Promise.all([
      listarOcorrencias(),
      listarCooperativas().catch(() => []),
    ])
      .then(([ocorrencias, cooperativas]) => {
        if (ativo) setBase({ ocorrencias, cooperativas });
      })
      .catch(() => {
        if (ativo) setBase(BASE_VAZIA);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return base;
}
