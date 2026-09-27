import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Icone } from "../Icone";
import "./styles.css";

interface TopbarProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly notificacoes?: number;
}

export function Topbar({
  titulo,
  subtitulo,
  comCta = true,
  notificacoes = 1,
}: TopbarProps): ReactNode {
  return (
    <header className="topbar" role="banner">
      <div className="topbar__titulos">
        <h1 className="topbar__titulo">{titulo}</h1>
        {subtitulo ? <p className="topbar__subtitulo">{subtitulo}</p> : null}
      </div>
      <div className="topbar__acoes">
        <button
          type="button"
          className="topbar__sino"
          aria-label={
            notificacoes > 0
              ? `Notificações (${notificacoes} não lidas)`
              : "Notificações"
          }
        >
          <Icone nome="sino" tamanho={20} />
          {notificacoes > 0 ? (
            <span className="topbar__badge" aria-hidden="true" />
          ) : null}
        </button>
        {comCta ? (
          <Link to="/registrar" className="topbar__cta">
            <Icone nome="mais" tamanho={16} />
            <span>Nova ocorrência</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
