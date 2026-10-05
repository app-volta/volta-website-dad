import type { ReactNode } from "react";

import mascoteOficial from "../../assets/mascote.png";

interface MascoteProps {
  readonly tamanho?: number;
  readonly rotulo?: string;
}

export function Mascote({
  tamanho = 56,
  rotulo = "Assistente VOLTA",
}: MascoteProps): ReactNode {
  const altura = Math.round((tamanho / 100) * 120);

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
