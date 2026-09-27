import type { ReactNode } from "react";

interface LogoVoltaProps {
  readonly altura?: number;
  readonly rotulo?: string;
}

export function LogoVolta({
  altura = 32,
  rotulo = "VOLTA",
}: LogoVoltaProps): ReactNode {
  const largura = Math.round((altura / 32) * 110);
  return (
    <svg
      viewBox="0 0 110 32"
      role="img"
      aria-label={rotulo}
      width={largura}
      height={altura}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* Letra V */}
        <path
          d="M2 6 L12 26 L22 6"
          fill="none"
          stroke="var(--verde-escuro)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Símbolo cíclico dentro do O */}
        <g transform="translate(24 4)">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--verde-primario)"
            strokeWidth="3"
          />
          <path
            d="M4 12 A8 8 0 0 1 20 12"
            fill="none"
            stroke="var(--verde-primario)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon
            points="19,9 22,12 19,15"
            fill="var(--verde-primario)"
          />
        </g>
        {/* Letras l, t, a */}
        <text
          x="52"
          y="24"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="26"
          fontWeight="800"
          fill="var(--verde-escuro)"
        >
          lta
        </text>
      </g>
    </svg>
  );
}
