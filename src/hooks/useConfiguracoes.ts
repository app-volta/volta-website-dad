import { useCallback, useEffect, useState } from "react";

import { obterConfiguracoes, salvarConfiguracoes } from "../services/configuracoes";
import type {
  Configuracoes,
  ParcialConfiguracoes,
} from "../types/configuracao";
import { mesclarConfiguracoes } from "../utils/configuracoes";

interface EstadoConfiguracoes {
  readonly dados: Configuracoes | null;
  readonly carregando: boolean;
  readonly erro: string | null;
  /** Aplica na hora e confirma no serviço; devolve false se o serviço recusar. */
  readonly atualizar: (parcial: ParcialConfiguracoes) => Promise<boolean>;
  readonly limparErro: () => void;
}

export function useConfiguracoes(): EstadoConfiguracoes {
  const [dados, setDados] = useState<Configuracoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    obterConfiguracoes(controle.signal)
      .then((configuracoes) => {
        if (!controle.signal.aborted) setDados(configuracoes);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Falha ao carregar as configurações.",
        );
      });
    return () => controle.abort();
  }, []);

  const atualizar = useCallback(
    async (parcial: ParcialConfiguracoes): Promise<boolean> => {
      setErro(null);
      setDados((atual) => (atual ? mesclarConfiguracoes(atual, parcial) : atual));
      try {
        setDados(await salvarConfiguracoes(parcial));
        return true;
      } catch (excecao: unknown) {
        setErro(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível salvar a alteração.",
        );
        // Volta ao que está salvo, desfazendo a alteração feita na hora.
        setDados(await obterConfiguracoes());
        return false;
      }
    },
    [],
  );

  const limparErro = useCallback(() => setErro(null), []);

  return { dados, carregando: dados === null && erro === null, erro, atualizar, limparErro };
}
