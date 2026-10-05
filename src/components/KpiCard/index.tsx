import type { ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import { MiniSparkline } from "../MiniSparkline";
import "./styles.css";

interface KpiCardProps {
  readonly icone: NomeIcone;
  readonly rotulo: string;
  readonly valor: ReactNode;
  readonly delta?: string;
  readonly direcao?: "sobe" | "desce" | "neutro";
  readonly sparkline?: readonly number[];
}

export function KpiCard({
  icone,
  rotulo,
  valor,
  delta,
  direcao = "sobe",
  sparkline,
}: KpiCardProps): ReactNode {
  const sinal = direcao === "sobe" ? "↑" : direcao === "desce" ? "↓" : "·";

  return (
    <article className="kpi-card">
      <header className="kpi-card__cabecalho">
        <span className="kpi-card__icone" aria-hidden="true">
          <Icone nome={icone} tamanho={16} />
        </span>
        <span className="kpi-card__rotulo">{rotulo}</span>
      </header>
      <div className="kpi-card__corpo">
        <p className="kpi-card__valor">{valor}</p>
        {sparkline ? (
          <div className="kpi-card__spark" aria-hidden="true">
            <MiniSparkline pontos={sparkline} largura={120} altura={36} />
          </div>
        ) : null}
      </div>
      {delta ? (
        <p className={`kpi-card__delta kpi-card__delta--${direcao}`}>
          <span aria-hidden="true">{sinal}</span> {delta}
        </p>
      ) : null}
    </article>
  );
}
