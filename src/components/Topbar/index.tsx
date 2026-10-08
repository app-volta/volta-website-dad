import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useNotificacoes } from "../../hooks/useNotificacoes";
import { Icone } from "../Icone";
import { Mascote } from "../Mascote";
import { Notificacoes } from "../Notificacoes";
import "./styles.css";

interface TopbarProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly comBusca?: boolean;
  readonly aoAbrirAssistente?: () => void;
  readonly aoAbrirBusca?: () => void;
}

export function Topbar({
  titulo,
  subtitulo,
  comCta = true,
  comBusca = true,
  aoAbrirAssistente,
  aoAbrirBusca,
}: TopbarProps): ReactNode {
  const idNotificacoes = useId();
  const areaSino = useRef<HTMLDivElement | null>(null);
  const botaoSino = useRef<HTMLButtonElement | null>(null);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState<boolean>(false);

  const notificacoes = useNotificacoes();
  const naoLidas = notificacoes.filter((item) => !item.lida).length;

  useEffect(() => {
    if (!notificacoesAbertas) return;

    function aoPressionar(evento: MouseEvent): void {
      if (!areaSino.current?.contains(evento.target as Node)) {
        setNotificacoesAbertas(false);
      }
    }
    function aoTeclar(evento: KeyboardEvent): void {
      if (evento.key === "Escape") {
        setNotificacoesAbertas(false);
        botaoSino.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoPressionar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoPressionar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [notificacoesAbertas]);

  return (
    <header className="topbar" role="banner">
      <div className="topbar__titulos">
        <h1 className="topbar__titulo">{titulo}</h1>
        {subtitulo ? <p className="topbar__subtitulo">{subtitulo}</p> : null}
      </div>

      {comBusca ? (
        <button
          type="button"
          className="topbar__busca"
          aria-label="Buscar na plataforma"
          aria-keyshortcuts="Control+K"
          onClick={aoAbrirBusca}
        >
          <span className="topbar__busca-lupa" aria-hidden="true">
            <Icone nome="lupa" tamanho={18} />
          </span>
          <span className="topbar__busca-texto">
            Buscar ocorrência, setor, cooperativa
          </span>
          <kbd className="topbar__busca-atalho" aria-hidden="true">
            Ctrl K
          </kbd>
        </button>
      ) : null}

      <div className="topbar__acoes">
        <button
          type="button"
          className="topbar__assistente"
          aria-label="Abrir assistente VOLTA"
          onClick={aoAbrirAssistente}
        >
          <Mascote tamanho={18} altura={28} rotulo="" />
        </button>

        <div ref={areaSino} className="topbar__sino-area">
          <button
            ref={botaoSino}
            type="button"
            className="topbar__sino"
            aria-haspopup="dialog"
            aria-expanded={notificacoesAbertas}
            aria-controls={notificacoesAbertas ? idNotificacoes : undefined}
            aria-label={
              naoLidas > 0
                ? `Notificações (${naoLidas} não lidas)`
                : "Notificações"
            }
            onClick={() => setNotificacoesAbertas((aberto) => !aberto)}
          >
            <Icone nome="sino" tamanho={20} />
            {naoLidas > 0 ? (
              <span className="topbar__badge" aria-hidden="true">
                {naoLidas}
              </span>
            ) : null}
          </button>
          {notificacoesAbertas ? (
            <div id={idNotificacoes}>
              <Notificacoes
                notificacoes={notificacoes}
                aoNavegar={() => setNotificacoesAbertas(false)}
              />
            </div>
          ) : null}
        </div>

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
