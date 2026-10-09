import { useSyncExternalStore } from "react";

import {
  assinarNotificacoes,
  lerNotificacoesLidas,
  montarNotificacoes,
} from "../services/notificacoes";
import {
  assinarMudancas,
  quantidadeAguardando,
} from "../services/ocorrencias";
import type { Notificacao } from "../types/notificacao";

/** Notificações da unidade, com o estado de leitura vivendo fora do componente. */
export function useNotificacoes(): readonly Notificacao[] {
  const lidas = useSyncExternalStore(assinarNotificacoes, lerNotificacoesLidas);
  const pendentes = useSyncExternalStore(assinarMudancas, quantidadeAguardando);
  return montarNotificacoes(lidas, pendentes);
}
