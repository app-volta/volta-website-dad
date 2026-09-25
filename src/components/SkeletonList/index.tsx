import type { ReactNode } from "react";

import "./styles.css";

interface SkeletonListProps {
  readonly quantidade?: number;
  readonly rotulo?: string;
}

/** Placeholder de lista enquanto os dados carregam. */
export function SkeletonList({
  quantidade = 3,
  rotulo = "Carregando lista",
}: SkeletonListProps): ReactNode {
  const itens = Array.from({ length: quantidade }, (_, indice) => indice);
  return (
    <div
      className="skeleton-lista"
      role="status"
      aria-live="polite"
      aria-label={rotulo}
    >
      {itens.map((indice) => (
        <div key={indice} className="skeleton-lista__item" aria-hidden="true">
          <div className="skeleton-lista__foto" />
          <div className="skeleton-lista__linhas">
            <span className="skeleton-lista__linha skeleton-lista__linha--curta" />
            <span className="skeleton-lista__linha" />
            <span className="skeleton-lista__linha skeleton-lista__linha--media" />
          </div>
        </div>
      ))}
    </div>
  );
}
