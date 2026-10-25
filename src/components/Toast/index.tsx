import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Icone } from "../Icone";
import "./styles.css";

interface ToastProps {
  readonly aberto: boolean;
  readonly titulo: string;
  readonly descricao?: string;
  readonly duracaoMs?: number;
  readonly aoFechar: () => void;
}

export function Toast({
  aberto,
  titulo,
  descricao,
  duracaoMs = 4500,
  aoFechar,
}: ToastProps): ReactNode {
  const fechar = useRef(aoFechar);

  useEffect(() => {
    fechar.current = aoFechar;
  });

  useEffect(() => {
    if (!aberto) return;
    const temporizador = window.setTimeout(() => fechar.current(), duracaoMs);
    return () => window.clearTimeout(temporizador);
  }, [aberto, duracaoMs]);

  if (!aberto) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__icone" aria-hidden="true">
        <Icone nome="check" tamanho={18} />
      </span>
      <div>
        <p className="toast__titulo">{titulo}</p>
        {descricao ? <p className="toast__descricao">{descricao}</p> : null}
      </div>
    </div>
  );
}
