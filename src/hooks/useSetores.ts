import { useEffect, useState } from "react";

import { listarSetores } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";

/** Setores onde a pessoa pode registrar uma ocorrência. */
export function useSetores(): EstadoRequisicao<readonly string[]> {
  const [dados, setDados] = useState<readonly string[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listarSetores()
      .then((setores) => {
        if (ativo) setDados(setores);
      })
      .catch((excecao: unknown) => {
        if (!ativo) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível carregar os setores.",
        );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return { dados, carregando, erro };
}
