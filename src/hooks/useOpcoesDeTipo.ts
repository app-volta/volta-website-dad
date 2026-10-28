import { useEffect, useState } from "react";

import { listarOpcoesDeTipo } from "../services/ocorrencias";
import type { OpcaoTipoResiduo } from "../types/classificacao";
import type { EstadoRequisicao } from "../types/comum";

/** Tipos de resíduo que a pessoa pode escolher ao corrigir a análise da IA. */
export function useOpcoesDeTipo(): EstadoRequisicao<readonly OpcaoTipoResiduo[]> {
  const [dados, setDados] = useState<readonly OpcaoTipoResiduo[] | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listarOpcoesDeTipo()
      .then((opcoes) => {
        if (ativo) setDados(opcoes);
      })
      .catch((excecao: unknown) => {
        if (!ativo) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível carregar os tipos de resíduo.",
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
