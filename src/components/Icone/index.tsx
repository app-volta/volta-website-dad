import type { ReactNode, SVGProps } from "react";

export type NomeIcone =
  | "casa"
  | "mais"
  | "folha"
  | "grafico"
  | "usuario"
  | "sino"
  | "camera"
  | "galeria"
  | "seta-direita"
  | "seta-esquerda"
  | "seta-baixo"
  | "check"
  | "editar"
  | "lupa"
  | "mensagem"
  | "enviar"
  | "sair"
  | "caminhao"
  | "fechar"
  | "papelao"
  | "plastico"
  | "metal"
  | "vidro"
  | "reciclagem"
  | "pin"
  | "olho"
  | "cadeado"
  | "google"
  | "estrela"
  | "chip"
  | "relatorio"
  | "equipe"
  | "engrenagem"
  | "upload";

interface IconeProps extends SVGProps<SVGSVGElement> {
  readonly nome: NomeIcone;
  readonly tamanho?: number;
  readonly rotulo?: string;
}

const CAMINHOS: Readonly<Record<NomeIcone, ReactNode>> = {
  casa: (
    <path d="M3 11 L12 3 L21 11 V20 A1 1 0 0 1 20 21 H14 V14 H10 V21 H4 A1 1 0 0 1 3 20 Z" />
  ),
  mais: <path d="M12 5 V19 M5 12 H19" />,
  folha: (
    <path d="M20 4 C10 4 4 10 4 20 C13 20 20 15 20 4 Z M4 20 L12 12" />
  ),
  grafico: (
    <path d="M4 20 V10 M10 20 V4 M16 20 V13 M22 20 H2" />
  ),
  usuario: (
    <path d="M12 12 A4 4 0 1 0 12 4 A4 4 0 0 0 12 12 Z M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21" />
  ),
  sino: (
    <path d="M6 16 V11 A6 6 0 0 1 18 11 V16 L20 18 H4 Z M10 21 A2 2 0 0 0 14 21" />
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
      <path d="M8 7 L10 4 H14 L16 7" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  galeria: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15 L8 10 L13 15 L16 12 L21 17" />
      <circle cx="8" cy="10" r="1.5" />
    </>
  ),
  "seta-direita": <path d="M5 12 H19 M13 6 L19 12 L13 18" />,
  "seta-esquerda": <path d="M19 12 H5 M11 6 L5 12 L11 18" />,
  "seta-baixo": <path d="M6 9 L12 15 L18 9" />,
  check: <path d="M4 12 L10 18 L20 6" />,
  editar: (
    <path d="M4 20 L4 16 L16 4 L20 8 L8 20 Z M14 6 L18 10" />
  ),
  lupa: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20 L15.5 15.5" />
    </>
  ),
  mensagem: (
    <path d="M4 5 H20 A1 1 0 0 1 21 6 V16 A1 1 0 0 1 20 17 H8 L4 21 V6 A1 1 0 0 1 4 5 Z" />
  ),
  enviar: <path d="M3 3 L21 12 L3 21 L6 12 L3 3 Z M6 12 H21" />,
  sair: (
    <path d="M10 4 H5 A1 1 0 0 0 4 5 V19 A1 1 0 0 0 5 20 H10 M14 8 L18 12 L14 16 M18 12 H8" />
  ),
  caminhao: (
    <>
      <rect x="2" y="8" width="12" height="9" rx="1" />
      <path d="M14 11 H18 L21 14 V17 H14 Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  fechar: <path d="M6 6 L18 18 M18 6 L6 18" />,
  papelao: (
    <>
      <path d="M6 8 H18 L17 20 H7 Z" />
      <path d="M9 8 V6 H15 V8" />
      <path d="M10 12 H14" />
    </>
  ),
  plastico: (
    <>
      <path d="M10 3 H14 V6 A2 2 0 0 1 15 8 L15 19 A2 2 0 0 1 13 21 H11 A2 2 0 0 1 9 19 L9 8 A2 2 0 0 1 10 6 Z" />
      <path d="M10 10 H14" />
    </>
  ),
  metal: (
    <>
      <rect x="7" y="5" width="10" height="15" rx="1" />
      <path d="M9 9 H15 M9 13 H15" />
    </>
  ),
  vidro: (
    <>
      <path d="M9 3 H15 V8 L17 12 V19 A2 2 0 0 1 15 21 H9 A2 2 0 0 1 7 19 V12 L9 8 Z" />
      <path d="M9 3 H15" />
    </>
  ),
  reciclagem: (
    <path d="M7 8 L4 13 L7 18 M4 13 H14 M14 6 L17 3 L20 6 M17 3 V13 M20 18 L17 21 L14 18 M17 13 V21" />
  ),
  pin: (
    <>
      <path d="M12 21 C8 15 5 12 5 9 A7 7 0 1 1 19 9 C19 12 16 15 12 21 Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  olho: (
    <>
      <path d="M2 12 C4 6 7.5 4 12 4 C16.5 4 20 6 22 12 C20 18 16.5 20 12 20 C7.5 20 4 18 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  cadeado: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11 V7 A4 4 0 0 1 16 7 V11" />
    </>
  ),
  google: (
    <path d="M12 11 V13.5 H17 C16.7 15 15.4 17 12 17 A5 5 0 1 1 12 7 C13.5 7 14.6 7.5 15.4 8.2 L17.2 6.4 C15.9 5.2 14.1 4.5 12 4.5 A7.5 7.5 0 1 0 12 19.5 C16.5 19.5 19.5 16.5 19.5 12 C19.5 11.6 19.5 11.3 19.4 11 Z" />
  ),
  estrela: (
    <path d="M12 3 L14.5 9 L21 9.7 L16 14 L17.5 20.5 L12 17 L6.5 20.5 L8 14 L3 9.7 L9.5 9 Z" />
  ),
  chip: <circle cx="12" cy="12" r="4" />,
  relatorio: (
    <>
      <path d="M8 3 H16 V6 H8 Z" />
      <path d="M6 6 H18 A1 1 0 0 1 19 7 V20 A1 1 0 0 1 18 21 H6 A1 1 0 0 1 5 20 V7 A1 1 0 0 1 6 6 Z" />
      <path d="M9 11 H15 M9 15 H15 M9 18 H13" />
    </>
  ),
  equipe: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 20 C3 16 6 14 9 14 C12 14 15 16 15 20" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M15.5 14.2 C19 14.5 21 16.5 21 20" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2 V5 M12 19 V22 M4.2 4.2 L6.3 6.3 M17.7 17.7 L19.8 19.8 M2 12 H5 M19 12 H22 M4.2 19.8 L6.3 17.7 M17.7 6.3 L19.8 4.2" />
    </>
  ),
  upload: (
    <path d="M12 16 V4 M6 10 L12 4 L18 10 M4 20 H20" />
  ),
};

export function Icone({
  nome,
  tamanho = 20,
  rotulo,
  ...resto
}: IconeProps): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      role={rotulo ? "img" : "presentation"}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : "true"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...resto}
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
