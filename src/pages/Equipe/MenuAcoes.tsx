import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as TecladoReact, ReactNode } from "react";

import { Icone } from "../../components/Icone";

export interface ItemMenuAcao {
  readonly rotulo: string;
  readonly aoClicar: () => void;
  readonly perigo?: boolean;
}

interface MenuAcoesProps {
  readonly rotulo: string;
  readonly itens: readonly ItemMenuAcao[];
}

interface Posicao {
  readonly topo: number;
  readonly direita: number;
}

/**
 * Menu de ações da linha. Fica em `position: fixed` para não ser cortado pela
 * rolagem da tabela, e fecha ao rolar, redimensionar, clicar fora ou apertar Esc.
 */
export function MenuAcoes({ rotulo, itens }: MenuAcoesProps): ReactNode {
  const idMenu = useId();
  const gatilho = useRef<HTMLButtonElement | null>(null);
  const menu = useRef<HTMLDivElement | null>(null);
  const [aberto, setAberto] = useState<boolean>(false);
  const [posicao, setPosicao] = useState<Posicao>({ topo: 0, direita: 0 });

  function abrir(): void {
    const caixa = gatilho.current?.getBoundingClientRect();
    if (caixa) {
      setPosicao({
        topo: caixa.bottom + 6,
        direita: window.innerWidth - caixa.right,
      });
    }
    setAberto(true);
  }

  function fechar(devolverFoco: boolean): void {
    setAberto(false);
    if (devolverFoco) gatilho.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    menu.current?.querySelector<HTMLElement>("button")?.focus();

    function aoPressionar(evento: MouseEvent): void {
      const alvo = evento.target as Node;
      if (!menu.current?.contains(alvo) && !gatilho.current?.contains(alvo)) {
        setAberto(false);
      }
    }
    function aoFechar(): void {
      setAberto(false);
    }

    document.addEventListener("mousedown", aoPressionar);
    window.addEventListener("scroll", aoFechar, true);
    window.addEventListener("resize", aoFechar);
    return () => {
      document.removeEventListener("mousedown", aoPressionar);
      window.removeEventListener("scroll", aoFechar, true);
      window.removeEventListener("resize", aoFechar);
    };
  }, [aberto]);

  function aoTeclarNoMenu(evento: TecladoReact<HTMLDivElement>): void {
    const botoes = Array.from(
      menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement);

    if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      fechar(true);
    } else if (evento.key === "ArrowDown") {
      evento.preventDefault();
      botoes[(atual + 1) % botoes.length]?.focus();
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      botoes[(atual - 1 + botoes.length) % botoes.length]?.focus();
    } else if (evento.key === "Home") {
      evento.preventDefault();
      botoes[0]?.focus();
    } else if (evento.key === "End") {
      evento.preventDefault();
      botoes[botoes.length - 1]?.focus();
    } else if (evento.key === "Tab") {
      setAberto(false);
    }
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className="eq__menu-gatilho"
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => (aberto ? fechar(false) : abrir())}
      >
        <Icone nome="reticencias" tamanho={18} />
      </button>
      {aberto ? (
        <div
          ref={menu}
          id={idMenu}
          role="menu"
          aria-label={rotulo}
          className="eq__menu"
          style={{ top: `${posicao.topo}px`, right: `${posicao.direita}px` }}
          onKeyDown={aoTeclarNoMenu}
        >
          {itens.map((item) => (
            <button
              key={item.rotulo}
              type="button"
              role="menuitem"
              className={`eq__menu-item${item.perigo ? " eq__menu-item--perigo" : ""}`}
              onClick={() => {
                fechar(true);
                item.aoClicar();
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
