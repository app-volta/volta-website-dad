import type { ReactNode } from "react";

import mascoteOficial from "../../assets/mascote.png";

interface MascoteProps {
  readonly tamanho?: number;
  readonly altura?: number;
  readonly rotulo?: string;
}

export function Mascote({
  tamanho = 56,
  altura: alturaProp,
  rotulo = "Assistente VOLTA",
}: MascoteProps): ReactNode {
  const altura = alturaProp ?? Math.round((tamanho / 100) * 120);

  return (
    <img
      src={mascoteOficial}
      width={tamanho}
      height={altura}
      alt={rotulo}
      draggable={false}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}
