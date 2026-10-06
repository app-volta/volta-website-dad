import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import "./styles.css";

export type TomModal = "ambar" | "azul" | "roxo" | "rosa" | "verde";

interface ModalAcaoProps {
  readonly aberto: boolean;
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly icone?: NomeIcone;
  readonly tom?: TomModal;
  readonly centralizado?: boolean;
  readonly bloqueado?: boolean;
  readonly largura?: number;
  readonly aoFechar: () => void;
  readonly children?: ReactNode;
  readonly rodape?: ReactNode;
}

const SELETOR_FOCAVEL =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function ModalAcao({
  aberto,
  titulo,
  subtitulo,
  icone,
  tom = "verde",
  centralizado = false,
  bloqueado = false,
  largura = 525,
  aoFechar,
  children,
  rodape,
}: ModalAcaoProps): ReactNode {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = painel.current?.querySelector<HTMLElement>(SELETOR_FOCAVEL);
    (primeiro ?? painel.current)?.focus();
    return () => anterior?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || bloqueado) return;
    function aoTeclar(evento: globalThis.KeyboardEvent): void {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, bloqueado, aoFechar]);

  if (!aberto) return null;

  function prenderFoco(evento: KeyboardEvent<HTMLDivElement>): void {
    if (evento.key !== "Tab" || !painel.current) return;
    const focaveis = painel.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL);
    if (focaveis.length === 0) {
      evento.preventDefault();
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  return (
    <div
      className="modal-acao__fundo"
      onClick={() => {
        if (!bloqueado) aoFechar();
      }}
    >
      <div
        ref={painel}
        className={
          centralizado ? "modal-acao modal-acao--centralizado" : "modal-acao"
        }
        style={{ maxWidth: largura }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
        onKeyDown={prenderFoco}
      >
        <header className="modal-acao__cabecalho">
          {icone ? (
            <span
              className={`modal-acao__icone modal-acao__icone--${tom}`}
              aria-hidden="true"
            >
              <Icone nome={icone} tamanho={centralizado ? 28 : 20} />
            </span>
          ) : null}
          <div>
            <h2 id={idTitulo} className="modal-acao__titulo">
              {titulo}
            </h2>
            {subtitulo ? (
              <p className="modal-acao__subtitulo">{subtitulo}</p>
            ) : null}
          </div>
        </header>

        {children ? <div className="modal-acao__corpo">{children}</div> : null}
        {rodape ? <footer className="modal-acao__rodape">{rodape}</footer> : null}
      </div>
    </div>
  );
}
