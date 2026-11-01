import { useEffect, useSyncExternalStore } from "react";

import {
  assinarMeta,
  garantirMetaCarregada,
  metaRecuperacaoAtual,
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
