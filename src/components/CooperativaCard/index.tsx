import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Cooperativa } from "../../types/cooperativa";
import {
  formatarDistanciaKm,
  formatarPorcentagem,
} from "../../utils/formatacao";
import { MaterialBadge } from "../MaterialBadge";
import "./styles.css";

interface CooperativaCardProps {
  readonly cooperativa: Cooperativa;
}

export function CooperativaCard({
  cooperativa,
}: CooperativaCardProps): ReactNode {
  return (
    <article
      className="cooperativa-card"
      aria-labelledby={`coop-${cooperativa.id}`}
    >
      <header className="cooperativa-card__topo">
        <h3 id={`coop-${cooperativa.id}`} className="cooperativa-card__nome">
          {cooperativa.nome}
        </h3>
        <span
          className="cooperativa-card__avaliacao"
          aria-label={`Avaliação de ${formatarPorcentagem(
            cooperativa.avaliacao / 5,
          )}`}
        >
          <span aria-hidden="true">★</span> {cooperativa.avaliacao.toFixed(1)}
        </span>
      </header>
      <p className="cooperativa-card__local">
        {cooperativa.cidade} / {cooperativa.estado} —{" "}
        {formatarDistanciaKm(cooperativa.distanciaKm)}
      </p>
      <ul className="cooperativa-card__materiais" aria-label="Materiais aceitos">
        {cooperativa.materiaisAceitos.map((material) => (
          <li key={material}>
            <MaterialBadge material={material} compacto />
          </li>
        ))}
      </ul>
      <div className="cooperativa-card__acoes">
        <a
          href={`tel:${cooperativa.telefone.replace(/\D/g, "")}`}
          className="cooperativa-card__telefone"
        >
          {cooperativa.telefone}
        </a>
        <Link
          to={`/cooperativas/${cooperativa.id}/chat`}
          className="cooperativa-card__chat"
        >
          Abrir chat →
        </Link>
      </div>
    </article>
  );
}
