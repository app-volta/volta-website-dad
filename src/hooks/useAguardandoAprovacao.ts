import { useSyncExternalStore } from "react";

import { assinarMudancas, quantidadeAguardando } from "../services/ocorrencias";

/** Quantidade de ocorrências aguardando aprovação; muda assim que alguém aprova ou recusa. */
export function useAguardandoAprovacao(): number {
  return useSyncExternalStore(assinarMudancas, quantidadeAguardando);
}
