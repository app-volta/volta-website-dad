import type { ReactNode } from "react";

import "./styles.css";

interface RodapeProps {
  readonly className?: string;
}

/** Rodapé da página (landmark contentinfo). Fica fora do <main>, no fim de cada página. */
export function Rodape({ className }: RodapeProps): ReactNode {
  const ano = new Date().getFullYear();
  return (
    <footer className={className ? `rodape ${className}` : "rodape"}>
      <p className="rodape__texto">
        © {ano} VOLTA · Reciclagem industrial inteligente
      </p>
    </footer>
  );
}
