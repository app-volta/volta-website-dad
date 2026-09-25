import { useEffect, useState } from "react";

import { obterOcorrencia } from "../services/ocorrencias";
import type { EstadoRequisicao } from "../types/comum";
import type { Ocorrencia } from "../types/ocorrencia";

export function useOcorrencia(
  id: string | undefined,
  chaveRecarga = 0,
): EstadoRequisicao<Ocorrencia> {
  const [dados, setDados] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState<boolean>(Boolean(id));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDados(null);
      setCarregando(false);
      setErro("Identificador da ocorrência ausente.");
      return;
    }

    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    obterOcorrencia(id, controle.signal)
      .then((item) => {
        if (!controle.signal.aborted) setDados(item);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Falha ao carregar a ocorrência.",
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [id, chaveRecarga]);

  return { dados, carregando, erro };
}
