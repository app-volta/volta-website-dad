import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

import { Icone } from "../../Icone";
import "./styles.css";

export interface PosicaoDoMenu {
  readonly esquerda: number;
  /** Distância, em px, da borda de baixo da janela até a base do menu. */
  readonly base: number;
}

interface MenuDaContaProps {
  readonly nome: string;
  readonly email: string;
  readonly iniciais: string;
  readonly posicao: PosicaoDoMenu;
  /** O botão que abre o menu: um clique nele não conta como clique fora. */
  readonly ancora: RefObject<HTMLElement | null>;
  readonly aoFechar: () => void;
  readonly aoSair: () => void;
}

function classeDoItem({ isActive }: { readonly isActive: boolean }): string {
  return isActive ? "menu-conta__item menu-conta__item--ativo" : "menu-conta__item";
}

/**
 * Menu aberto pelo cartão da pessoa no rodapé da barra lateral. Vai para o
 * `body` porque a barra lateral corta o que passa da borda dela. Esc, Tab e um
 * clique fora fecham; as setas andam entre os itens e o foco volta a quem abriu.
 */
export function MenuDaConta({
  nome,
  email,
  iniciais,
  posicao,
  ancora,
  aoFechar,
  aoSair,
}: MenuDaContaProps): ReactNode {
  const menu = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function aoClicarFora(evento: MouseEvent): void {
      const alvo = evento.target as Node;
      if (menu.current?.contains(alvo) || ancora.current?.contains(alvo)) return;
      aoFechar();
    }
    document.addEventListener("mousedown", aoClicarFora);
    window.addEventListener("resize", aoFechar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      window.removeEventListener("resize", aoFechar);
      anterior?.focus();
    };
  }, [ancora, aoFechar]);

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>): void {
    if (evento.key === "Escape" || evento.key === "Tab") {
      if (evento.key === "Escape") evento.preventDefault();
      aoFechar();
      return;
    }
    if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
    evento.preventDefault();
    const itens = [
      ...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
    ];
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    const passo = evento.key === "ArrowDown" ? 1 : -1;
    itens[(atual + passo + itens.length) % itens.length]?.focus();
  }

  return createPortal(
    <div
      ref={menu}
      className="menu-conta"
      role="menu"
      aria-label="Menu da conta"
      style={{ left: posicao.esquerda, bottom: posicao.base }}
      onKeyDown={aoTeclar}
    >
      <div className="menu-conta__cabecalho">
        <span className="menu-conta__avatar" aria-hidden="true">
          {iniciais}
        </span>
        <div className="menu-conta__nome">
          <strong>{nome}</strong>
          <span>{email}</span>
        </div>
      </div>
      <div className="menu-conta__divisoria" role="separator" />
      <NavLink to="/perfil" role="menuitem" className={classeDoItem} onClick={aoFechar}>
        <Icone nome="usuario" tamanho={17} />
        Meu perfil
      </NavLink>
      <NavLink
        to="/configuracoes"
        role="menuitem"
        className={classeDoItem}
        onClick={aoFechar}
      >
        <Icone nome="engrenagem" tamanho={17} />
        Configurações da unidade
      </NavLink>
      <div className="menu-conta__divisoria" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="menu-conta__item menu-conta__item--sair"
        onClick={() => {
          aoFechar();
          aoSair();
        }}
      >
        <Icone nome="sair" tamanho={17} />
        Sair do painel
      </button>
    </div>,
    document.body,
  );
}
