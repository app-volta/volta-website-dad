import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Icone } from "../Icone";
import "./styles.css";

interface TopbarProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly notificacoes?: number;
  readonly comBusca?: boolean;
}

export function Topbar({
  titulo,
  subtitulo,
  comCta = true,
  notificacoes = 3,
  comBusca = true,
}: TopbarProps): ReactNode {
  const inputBuscaRef = useRef<HTMLInputElement | null>(null);
  const [termoBusca, setTermoBusca] = useState("");

  useEffect(() => {
    if (!comBusca) return;
    function aoTeclar(evento: KeyboardEvent) {
      const foiCtrlK =
        (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k";
      if (foiCtrlK) {
        evento.preventDefault();
        inputBuscaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [comBusca]);

  function aoDigitar(evento: ChangeEvent<HTMLInputElement>): void {
    setTermoBusca(evento.target.value);
  }

  return (
    <header className="topbar" role="banner">
      <div className="topbar__titulos">
        <h1 className="topbar__titulo">{titulo}</h1>
        {subtitulo ? <p className="topbar__subtitulo">{subtitulo}</p> : null}
      </div>

      {comBusca ? (
        <label className="topbar__busca" aria-label="Buscar na plataforma">
          <span className="topbar__busca-lupa" aria-hidden="true">
            <Icone nome="lupa" tamanho={18} />
          </span>
          <input
            ref={inputBuscaRef}
            type="search"
            className="topbar__busca-input"
            placeholder="Buscar ocorrência, setor, cooperativa"
            value={termoBusca}
            onChange={aoDigitar}
          />
          <kbd className="topbar__busca-atalho" aria-hidden="true">
            Ctrl K
          </kbd>
        </label>
      ) : null}

      <div className="topbar__acoes">
        <Link
          to="/registrar"
          className="topbar__upload"
          aria-label="Enviar foto de resíduo"
        >
          <Icone nome="upload" tamanho={18} />
        </Link>

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
            <span className="topbar__badge" aria-hidden="true">
              {notificacoes}
            </span>
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
