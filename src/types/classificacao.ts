import type { Material } from "./material";

export type NivelContaminacao = "baixa" | "media" | "alta";

/**
 * Análise da IA sobre uma ocorrência. A volta-api devolve o nível de
 * contaminação e as recomendações, mas não informa a confiança, e o tipo de
 * resíduo pode cair fora das quatro categorias do app. Por isso `material` e
 * `confianca` aceitam null.
 */
export interface ClassificacaoIA {
  readonly material: Material | null;
  readonly confianca: number | null;
  readonly contaminacao?: NivelContaminacao;
  readonly recomendacao: string;
  /** Texto completo do relatório, quando a IA da API o gerou. */
  readonly relatorio?: string;
  readonly analisadaEm: string;
}

/** Classificação com todos os campos preenchidos, como o mock local entrega. */
export type ClassificacaoCompleta = ClassificacaoIA & {
  readonly material: Material;
  readonly confianca: number;
};
