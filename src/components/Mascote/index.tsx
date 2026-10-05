import type { ReactNode } from "react";

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
    <svg
      viewBox="0 0 100 120"
      width={tamanho}
      height={altura}
      role="img"
      aria-label={rotulo}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 6 L94 54 Q96 56 94 58 L76 58 L76 100 Q76 104 72 104 L28 104 Q24 104 24 100 L24 58 L6 58 Q4 56 6 54 Z"
        fill="#8BCB8D"
        stroke="#4FA058"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <g
        fill="none"
        stroke="#4FA058"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        <path d="M35 42 Q40 32 52 32 L58 32" />
        <polyline points="54,28 60,32 54,36" />
        <path d="M65 48 Q60 58 48 58 L42 58" />
        <polyline points="46,54 40,58 46,62" />
      </g>

      <circle cx="42" cy="80" r="2.2" fill="#0E3B2E" />
      <circle cx="58" cy="80" r="2.2" fill="#0E3B2E" />
      <path
        d="M43 88 Q50 92 57 88"
        fill="none"
        stroke="#0E3B2E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <rect x="30" y="106" width="12" height="10" rx="3" fill="#8BCB8D" stroke="#4FA058" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="58" y="106" width="12" height="10" rx="3" fill="#8BCB8D" stroke="#4FA058" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
