import type { ReactNode } from "react";

import { METADADOS_MATERIAL } from "../../types/material";
import type { RecuperadoPorMaterial } from "../../types/relatorio";
import { formatarKg } from "../../utils/formatacao";

/** Altura, em px, da barra do material que mais rendeu. */
const ALTURA_MAXIMA = 154;
const ALTURA_MINIMA = 12;

interface GraficoMateriaisProps {
  readonly itens: readonly RecuperadoPorMaterial[];
}

export function GraficoMateriais({ itens }: GraficoMateriaisProps): ReactNode {
  const maior = Math.max(...itens.map((item) => item.kg), 1);

  return (
    <ul className="rel__barras" aria-label="Quilos recuperados por material">
      {itens.map((item) => {
        const altura = Math.max(
          ALTURA_MINIMA,
          Math.round((item.kg / maior) * ALTURA_MAXIMA),
        );
        return (
          <li key={item.material} className="rel__barra-coluna">
            <b className="rel__barra-valor">{formatarKg(item.kg)}</b>
            <span
              className="rel__barra"
              data-material={item.material}
              style={{ height: `${altura}px` }}
              aria-hidden="true"
            />
            <span className="rel__barra-nome">
              {METADADOS_MATERIAL[item.material].rotulo}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
