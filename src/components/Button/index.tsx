import type { ButtonHTMLAttributes, ReactNode } from "react";

import "./styles.css";

export type VarianteBotao = "primario" | "secundario" | "sutil" | "perigo";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: VarianteBotao;
  readonly carregando?: boolean;
  readonly larguraTotal?: boolean;
  readonly children: ReactNode;
}

/** Botão semântico único — nada de <div onClick>. */
export function Button({
  variante = "primario",
  carregando = false,
  larguraTotal = false,
  disabled,
  children,
  type = "button",
  className,
  ...resto
}: ButtonProps): ReactNode {
  const desativado = disabled || carregando;
  const classe = [
    "botao",
    `botao--${variante}`,
    larguraTotal ? "botao--largo" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classe}
      disabled={desativado}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? (
        <span className="botao__spinner" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
