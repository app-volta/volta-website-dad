import type { ReactNode } from "react";

import logoBranca from "../../assets/logo-volta-branca.png";

type VarianteLogo = "escura" | "clara";

interface LogoVoltaProps {
  readonly altura?: number;
  readonly rotulo?: string;
  readonly variante?: VarianteLogo;
}

const PROPORCAO = 1228 / 336;

export function LogoVolta({
  altura = 32,
  rotulo = "VOLTA",
  variante = "escura",
}: LogoVoltaProps): ReactNode {
  const largura = Math.round(altura * PROPORCAO);

  if (variante === "clara") {
    return (
      <img
        src={logoBranca}
        alt={rotulo}
        width={largura}
        height={altura}
        draggable={false}
        style={{ display: "block" }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={rotulo}
      style={{
        display: "block",
        width: largura,
        height: altura,
        backgroundColor: "var(--verde-escuro)",
        WebkitMaskImage: `url(${logoBranca})`,
        maskImage: `url(${logoBranca})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
      }}
    />
  );
}
