import type { ReactNode } from "react";

import logoBranca from "../../assets/logo-volta-branca.png";
import logoColorida from "../../assets/logo-volta-colorida.png";

type VarianteLogo = "escura" | "clara";

interface LogoVoltaProps {
  readonly altura?: number;
  readonly rotulo?: string;
  readonly variante?: VarianteLogo;
}

const PROPORCAO: Readonly<Record<VarianteLogo, number>> = {
  clara: 1228 / 336,
  escura: 806 / 236,
};

export function LogoVolta({
  altura = 32,
  rotulo = "VOLTA",
  variante = "escura",
}: LogoVoltaProps): ReactNode {
  const largura = Math.round(altura * PROPORCAO[variante]);

  return (
    <img
      src={variante === "clara" ? logoBranca : logoColorida}
      alt={rotulo}
      width={largura}
      height={altura}
      draggable={false}
      style={{ display: "block" }}
    />
  );
}
