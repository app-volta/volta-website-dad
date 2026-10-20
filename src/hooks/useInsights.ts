import { useEffect, useState } from "react";

import { obterDica, obterInsight } from "../services/insights";
import type { DicaVolta, InsightVolta } from "../types/insight";
import { useConfiguracoes } from "./useConfiguracoes";

/**
 * Busca uma sugestão do mascote. Fica nula enquanto carrega, quando a pessoa
 * desligou os insights em Configurações ou quando a IA não tem o que sugerir.
 */
function useSugestao<T>(buscar: () => Promise<T | null>): T | null {
  const { dados } = useConfiguracoes();
  const ativo = dados?.insights === true;
  const [sugestao, setSugestao] = useState<T | null>(null);

  useEffect(() => {
    if (!ativo) return undefined;
    let descartada = false;
    buscar()
      .then((valor) => {
        if (!descartada) setSugestao(valor);
      })
      .catch(() => undefined);
    return () => {
      descartada = true;
    };
  }, [ativo, buscar]);

  return ativo ? sugestao : null;
}

export function useInsightVolta(): InsightVolta | null {
  return useSugestao(obterInsight);
}

export function useDicaVolta(): DicaVolta | null {
  return useSugestao(obterDica);
}
