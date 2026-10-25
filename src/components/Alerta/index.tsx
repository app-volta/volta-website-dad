import type { ReactNode } from "react";

import "./styles.css";

export type VarianteAlerta = "erro" | "sucesso" | "info";

interface AlertaProps {
  readonly variante: VarianteAlerta;
  readonly titulo?: string;
  readonly children: ReactNode;
  readonly acao?: ReactNode;
}

/** Mensagem sinalizada como live region — sucesso via status, erro via alert. */
export function Alerta({
  variante,
  titulo,
  children,
  acao,
}: AlertaProps): ReactNode {
  const role = variante === "erro" ? "alert" : "status";
  return (
    <div className={`alerta alerta--${variante}`} role={role}>
      <div className="alerta__conteudo">
        {titulo ? <strong className="alerta__titulo">{titulo}</strong> : null}
        <div>{children}</div>
      </div>
      {acao ? <div className="alerta__acao">{acao}</div> : null}
    </div>
  );
}
