import type { ReactNode } from "react";

import "./styles.css";

interface SpinnerProps {
  readonly rotulo?: string;
  readonly compacto?: boolean;
}

/** Indicador de carregamento anunciado por leitores de tela via aria-live. */
export function Spinner({
  rotulo = "Carregando…",
  compacto = false,
}: SpinnerProps): ReactNode {
  return (
    <div
      className={compacto ? "spinner spinner--compacto" : "spinner"}
      role="status"
      aria-live="polite"
    >
      <span className="spinner__circulo" aria-hidden="true" />
      <span className="spinner__texto">{rotulo}</span>
    </div>
  );
}
