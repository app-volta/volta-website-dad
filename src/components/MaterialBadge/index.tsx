import type { ReactNode } from "react";

import type { Material } from "../../types/material";
import { METADADOS_MATERIAL } from "../../types/material";

interface MaterialBadgeProps {
  readonly material: Material;
  readonly compacto?: boolean;
}

export function MaterialBadge({
  material,
  compacto = false,
}: MaterialBadgeProps): ReactNode {
  const metadados = METADADOS_MATERIAL[material];
  return (
    <span
      className="chip"
      style={{
        background: metadados.corFundo,
        color: metadados.corTexto,
        fontSize: compacto ? "0.78rem" : "0.9rem",
      }}
    >
      <span aria-hidden="true">{metadados.emoji}</span>
      <span>{metadados.rotulo}</span>
    </span>
  );
}
