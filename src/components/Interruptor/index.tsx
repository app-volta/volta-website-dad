import type { ReactNode } from "react";

import "./styles.css";

interface InterruptorProps {
  readonly rotulo: string;
  readonly ligado: boolean;
  readonly aoAlterar: (ligado: boolean) => void;
  /** Texto à direita do botão em vez da linha com o rótulo à esquerda. */
  readonly compacto?: boolean;
}

/** Interruptor de liga e desliga: um checkbox nativo com papel de switch. */
export function Interruptor({
  rotulo,
  ligado,
  aoAlterar,
  compacto = false,
}: InterruptorProps): ReactNode {
  return (
    <label className={`interruptor${compacto ? " interruptor--compacto" : ""}`}>
      <span className="interruptor__rotulo">{rotulo}</span>
      <input
        type="checkbox"
        role="switch"
        className="interruptor__entrada"
        checked={ligado}
        onChange={(evento) => aoAlterar(evento.target.checked)}
      />
      <span className="interruptor__trilho" aria-hidden="true" />
    </label>
  );
}
