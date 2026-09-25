import { useEffect, useRef } from "react";

/**
 * Gerencia foco em elementos modais: move para o primeiro item focável ao abrir
 * e devolve o foco ao elemento que abriu o modal quando ele fecha.
 */
export function useFocoModal(aberto: boolean): {
  referenciaModal: React.RefObject<HTMLDivElement | null>;
} {
  const referenciaModal = useRef<HTMLDivElement | null>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;

    const container = referenciaModal.current;
    if (!container) return;

    const focavel = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focavel?.focus();

    return () => {
      focoAnterior.current?.focus();
    };
  }, [aberto]);

  return { referenciaModal };
}
