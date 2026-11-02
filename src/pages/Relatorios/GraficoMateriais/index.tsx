import type { ReactNode } from "react";

import { GraficoBarras } from "../../../components/GraficoBarras";
import { METADADOS_MATERIAL } from "../../../types/material";
import type { Material } from "../../../types/material";
import type { RecuperadoPorMaterial } from "../../../types/relatorio";
import { formatarKg } from "../../../utils/formatacao";

/** Degradê de cada material, da ponta da barra para a base. */
const DEGRADE_MATERIAL: Readonly<Record<Material, readonly [string, string]>> = {
  papelao: ["#f0b429", "#92660c"],
  plastico: ["#5b9bf5", "#2563eb"],
  metal: ["#a78bfa", "#7c5bd6"],
  vidro: ["#2dd4bf", "#0f8f8f"],
};

interface GraficoMateriaisProps {
  readonly itens: readonly RecuperadoPorMaterial[];
}

export function GraficoMateriais({ itens }: GraficoMateriaisProps): ReactNode {
  return (
    <div className="rel__materiais">
      <GraficoBarras
        direcao="colunas"
        rotulo="Quilos recuperados por material"
        formatarValor={formatarKg}
        barras={itens.map((item) => ({
          chave: item.material,
          rotulo: METADADOS_MATERIAL[item.material].rotulo,
          valor: item.kg,
          degrade: DEGRADE_MATERIAL[item.material],
        }))}
      />
    </div>
  );
}
