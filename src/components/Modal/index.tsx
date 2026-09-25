import { useEffect } from "react";
import type { ReactNode } from "react";

import { useFocoModal } from "../../hooks/useFocoModal";
import "./styles.css";

interface ModalProps {
  readonly aberto: boolean;
  readonly titulo: string;
  readonly onFechar: () => void;
  readonly children: ReactNode;
  readonly rotuloFechar?: string;
}

/**
 * Modal acessível: role=dialog, aria-modal, foco inicial no primeiro
 * item focável e devolução do foco ao trigger via useFocoModal.
 * ESC fecha, clique no backdrop fecha, mas cliques no conteúdo não propagam.
 */
export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
  rotuloFechar = "Fechar",
}: ModalProps): ReactNode {
  const { referenciaModal } = useFocoModal(aberto);

  useEffect(() => {
    if (!aberto) return;
    function tratarTecla(evento: KeyboardEvent): void {
      if (evento.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", tratarTecla);
    return () => window.removeEventListener("keydown", tratarTecla);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onFechar}
      aria-hidden="false"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        ref={referenciaModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__cabecalho">
          <h2 id="modal-titulo" className="modal__titulo">
            {titulo}
          </h2>
          <button
            type="button"
            className="modal__fechar"
            onClick={onFechar}
            aria-label={rotuloFechar}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal__corpo">{children}</div>
      </div>
    </div>
  );
}
