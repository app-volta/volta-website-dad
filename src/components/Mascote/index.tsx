import type { ReactNode } from "react";

interface MascoteProps {
  readonly tamanho?: number;
  readonly rotulo?: string;
}

export function Mascote({
  tamanho = 56,
  rotulo = "Assistente VOLTA",
}: MascoteProps): ReactNode {
  return (
    <svg
      viewBox="0 0 64 64"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={rotulo}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 46 C14 24 32 14 50 22 L46 18 M50 22 L46 26"
        fill="none"
        stroke="#2FB25A"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="42" r="1.6" fill="#0E3B2E" />
      <circle cx="32" cy="42" r="1.6" fill="#0E3B2E" />
      <path
        d="M24 48 Q28 51 32 48"
        fill="none"
        stroke="#0E3B2E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
