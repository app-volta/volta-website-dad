import { useEffect, useSyncExternalStore } from "react";

import {
  assinarMeta,
  garantirMetaCarregada,
  metaRecuperacaoAtual,
  preferenciasDaMeta,
} from "../services/configuracoes";

/**
 * Meta de recuperação do mês em kg, a que o responsável definiu em Configurações.
 * Vale 0 enquanto a empresa não definiu uma: as telas devem esconder o percentual
 * em vez de dividir por zero.
 */
export function useMetaRecuperacao(): number {
  useEffect(() => {
    garantirMetaCarregada();
  }, []);
  return useSyncExternalStore(assinarMeta, metaRecuperacaoAtual);
}

/** O que a meta guarda neste navegador (meta do dia, dias, divisão por material e avisos); muda na hora ao salvar. */
export function usePreferenciasDaMeta(): ReturnType<typeof preferenciasDaMeta> {
  return useSyncExternalStore(assinarMeta, preferenciasDaMeta);
}
