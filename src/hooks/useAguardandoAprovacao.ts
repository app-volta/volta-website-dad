import { useEffect, useSyncExternalStore } from "react";

import {
  assinarMudancas,
  garantirCarregado,
  quantidadeAguardando,
} from "../services/ocorrencias";

/** Quantidade de ocorrências aguardando aprovação; muda assim que alguém aprova ou recusa. */
export function useAguardandoAprovacao(): number {
  useEffect(() => {
    garantirCarregado();
  }, []);
  return useSyncExternalStore(assinarMudancas, quantidadeAguardando);
}
