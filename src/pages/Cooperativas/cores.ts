import type { Cooperativa } from "../../types/cooperativa";

export type CorCooperativa = "verde" | "ambar" | "azul" | "roxo" | "turquesa";

const CORES: readonly CorCooperativa[] = [
  "verde",
  "ambar",
  "azul",
  "roxo",
  "turquesa",
];

/** Cada cooperativa mantém a cor da sua posição no catálogo, na lista e no mapa. */
export function corDaCooperativa(
  id: string,
  todas: readonly Cooperativa[],
): CorCooperativa {
  const indice = todas.findIndex((coop) => coop.id === id);
  return CORES[Math.max(indice, 0) % CORES.length];
}
