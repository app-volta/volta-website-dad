import { useState } from "react";

export interface Paginacao<T> {
  /** Página mostrada, de 1 até `totalPaginas` (nunca passa do fim se a lista encolher). */
  readonly paginaAtual: number;
  readonly totalPaginas: number;
  /** Itens da página atual. */
  readonly visiveis: readonly T[];
  readonly irParaPagina: (pagina: number) => void;
  readonly voltarAoInicio: () => void;
}

/** Divide `itens` em páginas de `porPagina`. A lista vazia ainda tem uma página (vazia). */
export function usePagination<T>(itens: readonly T[], porPagina: number): Paginacao<T> {
  const [pagina, setPagina] = useState<number>(1);

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);
  const visiveis = itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  return {
    paginaAtual,
    totalPaginas,
    visiveis,
    irParaPagina: (destino) => setPagina(Math.min(Math.max(destino, 1), totalPaginas)),
    voltarAoInicio: () => setPagina(1),
  };
}
