import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import { LogoVolta } from "../LogoVolta";
import "./styles.css";

interface ItemNav {
  readonly rotulo: string;
  readonly caminho: string;
  readonly icone: NomeIcone;
}

const GRUPOS: readonly {
  readonly titulo: string;
  readonly itens: readonly ItemNav[];
}[] = [
  {
    titulo: "OPERAÇÃO",
    itens: [
      { rotulo: "Início", caminho: "/", icone: "casa" },
      { rotulo: "Registrar", caminho: "/registrar", icone: "mais" },
      { rotulo: "Cooperativas", caminho: "/cooperativas", icone: "folha" },
      { rotulo: "Ocorrências", caminho: "/ocorrencias", icone: "grafico" },
    ],
  },
  {
    titulo: "CONTA",
    itens: [{ rotulo: "Perfil", caminho: "/perfil", icone: "usuario" }],
  },
];

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

const ROTULO_PAPEL = {
  responsavel_pgrs: "Responsável — PGRS",
  operador: "Operador",
} as const;

export function Sidebar(): ReactNode {
  const { usuario } = useAuth();

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="sidebar__logo">
          <LogoVolta altura={32} />
        </div>

        <nav className="sidebar__nav" aria-label="Menu">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="sidebar__grupo">
              <p className="sidebar__grupo-titulo">{grupo.titulo}</p>
              <ul className="sidebar__lista">
                {grupo.itens.map((item) => (
                  <li key={item.caminho}>
                    <NavLink
                      to={item.caminho}
                      end={item.caminho === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "sidebar__link sidebar__link--ativo"
                          : "sidebar__link"
                      }
                    >
                      <span className="sidebar__link-icone">
                        <Icone nome={item.icone} tamanho={20} />
                      </span>
                      <span>{item.rotulo}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {usuario ? (
          <div className="sidebar__usuario">
            <span className="sidebar__avatar" aria-hidden="true">
              {iniciais(usuario.nome)}
            </span>
            <div className="sidebar__usuario-info">
              <span className="sidebar__usuario-nome">{usuario.nome}</span>
              <span className="sidebar__usuario-papel">
                {ROTULO_PAPEL[usuario.papel]}
              </span>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
