import type { ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import "./styles.css";

const ICONES: Readonly<Record<VarianteAlerta, NomeIcone>> = {
  erro: "fechar",
  sucesso: "check",
  info: "alerta",
};

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
      <span className="alerta__icone" aria-hidden="true">
        <Icone nome={ICONES[variante]} tamanho={11} />
      </span>
      <div className="alerta__conteudo">
        {titulo ? <strong className="alerta__titulo">{titulo}</strong> : null}
        <div>{children}</div>
      </div>
      {acao ? <div className="alerta__acao">{acao}</div> : null}
    </div>
  );
}
