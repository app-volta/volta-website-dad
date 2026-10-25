import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import "./styles.css";

export interface OpcaoAba {
  readonly valor: string;
  readonly rotulo: string;
  readonly quantidade?: number;
}

interface FiltroTabsProps {
  readonly opcoes: readonly OpcaoAba[];
  readonly selecionada: string;
  readonly onMudar: (valor: string) => void;
  readonly rotuloLista: string;
}

/**
 * Aba com role=tablist + navegação por seta horizontal (WAI-ARIA APG).
 * aria-selected reflete a aba ativa; a inativa recebe tabIndex=-1 para
 * pular do foco via Tab e ser navegada apenas com as setas.
 */
export function FiltroTabs({
  opcoes,
  selecionada,
  onMudar,
  rotuloLista,
}: FiltroTabsProps): ReactNode {
  const idBase = useId();
  const referencias = useRef<Array<HTMLButtonElement | null>>([]);

  function tratarTecla(
    evento: KeyboardEvent<HTMLButtonElement>,
    indice: number,
  ): void {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const total = opcoes.length;
    const proximo =
      evento.key === "ArrowRight"
        ? (indice + 1) % total
        : (indice - 1 + total) % total;
    referencias.current[proximo]?.focus();
    onMudar(opcoes[proximo].valor);
  }

  return (
    <div className="filtro-tabs" role="tablist" aria-label={rotuloLista}>
      {opcoes.map((opcao, indice) => {
        const ativa = opcao.valor === selecionada;
        const idAba = `${idBase}-tab-${opcao.valor}`;
        return (
          <button
            type="button"
            key={opcao.valor}
            id={idAba}
            role="tab"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            className={ativa ? "filtro-tabs__aba filtro-tabs__aba--ativa" : "filtro-tabs__aba"}
            onClick={() => onMudar(opcao.valor)}
            onKeyDown={(evento) => tratarTecla(evento, indice)}
            ref={(elemento) => {
              referencias.current[indice] = elemento;
            }}
          >
            {opcao.rotulo}
            {typeof opcao.quantidade === "number" ? (
              <span className="filtro-tabs__contador" aria-hidden="true">
                {opcao.quantidade}
              </span>
            ) : null}
            {typeof opcao.quantidade === "number" ? (
              <span className="sr-only">
                ({opcao.quantidade}
                {opcao.quantidade === 1 ? " item" : " itens"})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
