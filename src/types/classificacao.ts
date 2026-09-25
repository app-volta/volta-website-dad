import type { Material } from "./material";

export interface ClassificacaoIA {
  readonly material: Material;
  readonly confianca: number;
  readonly recomendacao: string;
  readonly analisadaEm: string;
}
