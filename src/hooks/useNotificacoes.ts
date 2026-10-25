import { useEffect, useSyncExternalStore } from "react";

import {
  assinarNotificacoes,
  lerNotificacoesLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  montarNotificacoes,
} from "../services/notificacoes";
import { metaRecuperacaoAtual } from "../services/configuracoes";
import {
  assinarMudancas,
  garantirCarregado,
  lerOcorrencias,
  quantidadeAguardando,
} from "../services/ocorrencias";
import type { Notificacao } from "../types/notificacao";

/** Notificações da unidade, com o estado de leitura vivendo fora do componente. */
export function useNotificacoes(): readonly Notificacao[] {
  useEffect(() => {
    garantirCarregado();
  }, []);
  const lidas = useSyncExternalStore(assinarNotificacoes, lerNotificacoesLidas);
  const pendentes = useSyncExternalStore(assinarMudancas, quantidadeAguardando);
  const ocorrencias = useSyncExternalStore(assinarMudancas, lerOcorrencias);
  return montarNotificacoes(lidas, pendentes, ocorrencias, metaRecuperacaoAtual());
}

interface AcoesNotificacoes {
  readonly marcarComoLida: (id: string) => void;
  readonly marcarTodasComoLidas: (ids: readonly string[]) => void;
}

const ACOES: AcoesNotificacoes = { marcarComoLida, marcarTodasComoLidas };

export function useAcoesNotificacoes(): AcoesNotificacoes {
  return ACOES;
}
