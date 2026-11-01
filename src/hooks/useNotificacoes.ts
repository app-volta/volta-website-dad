import { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "../context/AuthContext";
import {
  assinarNotificacoes,
  lerNotificacoesLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  montarNotificacoes,
} from "../services/notificacoes";
import { avisosDaMeta } from "../utils/metas";
import { useMetaRecuperacao, usePreferenciasDaMeta } from "./useMeta";
import {
  assinarMudancas,
  garantirCarregado,
  lerOcorrencias,
  quantidadeAguardando,
} from "../services/ocorrencias";
import type { Notificacao } from "../types/notificacao";

/** Notificações da unidade, com o estado de leitura vivendo fora do componente. */
export function useNotificacoes(): readonly Notificacao[] {
  const { usuario } = useAuth();
  useEffect(() => {
    garantirCarregado();
  }, []);
  const lidas = useSyncExternalStore(assinarNotificacoes, lerNotificacoesLidas);
  const pendentes = useSyncExternalStore(assinarMudancas, quantidadeAguardando);
  const ocorrencias = useSyncExternalStore(assinarMudancas, lerOcorrencias);
  const metaKg = useMetaRecuperacao();
  const preferenciasDaMeta = usePreferenciasDaMeta();
  const podeRevisar =
    usuario?.perfil === "ADMIN" || usuario?.perfil === "MANAGER";
  return montarNotificacoes(
    lidas,
    pendentes,
    ocorrencias,
    metaKg,
    podeRevisar,
    avisosDaMeta(ocorrencias, metaKg, preferenciasDaMeta),
  );
}

interface AcoesNotificacoes {
  readonly marcarComoLida: (id: string) => void;
  readonly marcarTodasComoLidas: (ids: readonly string[]) => void;
}

const ACOES: AcoesNotificacoes = { marcarComoLida, marcarTodasComoLidas };

export function useAcoesNotificacoes(): AcoesNotificacoes {
  return ACOES;
}
