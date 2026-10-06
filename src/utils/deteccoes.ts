export interface Deteccao {
  readonly esquerda: number;
  readonly topo: number;
  readonly largura: number;
  readonly altura: number;
  readonly acrescimo: number | null;
  readonly rotulo: string | null;
}

// A IA é um mock: as caixas são posições ilustrativas, não detecção real.
export const DETECCOES: readonly Deteccao[] = [
  { esquerda: 9.4, topo: 42.1, largura: 33.6, altura: 43.3, acrescimo: 6, rotulo: null },
  { esquerda: 44.2, topo: 26.2, largura: 37.5, altura: 59, acrescimo: 3, rotulo: null },
  { esquerda: 79, topo: 60, largura: 17.7, altura: 27.4, acrescimo: null, rotulo: "umidade" },
];

export function rotuloDeteccao(
  deteccao: Deteccao,
  material: string,
  confiancaPct: number,
): string {
  if (deteccao.rotulo) return deteccao.rotulo;
  const pct = Math.min(99, confiancaPct + (deteccao.acrescimo ?? 0));
  return `${material.toLowerCase()} · ${pct}%`;
}
