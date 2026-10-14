import { useEffect, useSyncExternalStore } from "react";

import {
  assinarNotificacoes,
  lerNotificacoesLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  montarNotificacoes,
} from "../services/notificacoes";
import {
  assinarMudancas,
  garantirCarregado,
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
  return montarNotificacoes(lidas, pendentes);
}

interface AcoesNotificacoes {
  readonly marcarComoLida: (id: string) => void;
  readonly marcarTodasComoLidas: () => void;
}

const ACOES: AcoesNotificacoes = { marcarComoLida, marcarTodasComoLidas };

export function useAcoesNotificacoes(): AcoesNotificacoes {
  return ACOES;
}
