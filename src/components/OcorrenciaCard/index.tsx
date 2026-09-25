import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Ocorrencia } from "../../types/ocorrencia";
import { formatarDataHora } from "../../utils/formatacao";
import { MaterialBadge } from "../MaterialBadge";
import { StatusBadge } from "../StatusBadge";
import "./styles.css";

interface OcorrenciaCardProps {
  readonly ocorrencia: Ocorrencia;
}

/**
 * Componente puro de apresentação — recebe a ocorrência via props e renderiza,
 * sem chamar serviços ou mudar estado. Facilita testes e reuso na Home e na
 * listagem.
 */
export function OcorrenciaCard({ ocorrencia }: OcorrenciaCardProps): ReactNode {
  return (
    <article className="ocorrencia-card" aria-labelledby={`occ-${ocorrencia.id}`}>
      <img
        className="ocorrencia-card__foto"
        src={ocorrencia.fotoUrl}
        alt={`Foto do resíduo registrado no setor ${ocorrencia.localizacao.setor}`}
        loading="lazy"
        width={480}
        height={280}
      />
      <div className="ocorrencia-card__conteudo">
        <div className="ocorrencia-card__topo">
          <h3
            id={`occ-${ocorrencia.id}`}
            className="ocorrencia-card__codigo"
          >
            {ocorrencia.codigo}
          </h3>
          <StatusBadge status={ocorrencia.status} />
        </div>
        <p className="ocorrencia-card__descricao">{ocorrencia.descricao}</p>
        <dl className="ocorrencia-card__meta">
          <div>
            <dt>Setor</dt>
            <dd>
              {ocorrencia.localizacao.setor} — {ocorrencia.localizacao.unidade}
            </dd>
          </div>
          <div>
            <dt>Criada em</dt>
            <dd>{formatarDataHora(ocorrencia.criadaEm)}</dd>
          </div>
        </dl>
        <div className="ocorrencia-card__rodape">
          {ocorrencia.material ? (
            <MaterialBadge material={ocorrencia.material} compacto />
          ) : (
            <span className="ocorrencia-card__aguardando">
              Aguardando classificação
            </span>
          )}
          <Link
            to={`/ocorrencias/${ocorrencia.id}`}
            className="ocorrencia-card__link"
            aria-label={`Abrir detalhes da ocorrência ${ocorrencia.codigo}`}
          >
            Ver detalhes →
          </Link>
        </div>
      </div>
    </article>
  );
}
