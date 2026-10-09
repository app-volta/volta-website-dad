import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  assinarMudancas,
  quantidadeAguardando,
} from "../../services/ocorrencias";
import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import { LogoVolta } from "../LogoVolta";
import { Mascote } from "../Mascote";
import "./styles.css";

interface ItemNav {
  readonly rotulo: string;
  readonly caminho: string;
  readonly icone: NomeIcone;
}

interface GrupoNav {
  readonly titulo: string;
  readonly itens: readonly ItemNav[];
}

const GRUPOS: readonly GrupoNav[] = [
  {
    titulo: "OPERAÇÃO",
    itens: [
      { rotulo: "Início", caminho: "/", icone: "casa" },
      { rotulo: "Ocorrências", caminho: "/ocorrencias", icone: "lista" },
      { rotulo: "Registrar", caminho: "/registrar", icone: "mais" },
    ],
  },
  {
    titulo: "GESTÃO",
    itens: [
      { rotulo: "Cooperativas", caminho: "/cooperativas", icone: "ciclo" },
      { rotulo: "Relatórios PGRS", caminho: "/relatorios", icone: "grafico" },
      { rotulo: "Equipe", caminho: "/equipe", icone: "equipe" },
    ],
  },
  {
    titulo: "CONTA",
    itens: [
      { rotulo: "Configurações", caminho: "/configuracoes", icone: "engrenagem" },
    ],
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
  responsavel_pgrs: "Responsável PGRS",
  operador: "Operador",
} as const;

const CHIP_PAPEL = {
  responsavel_pgrs: "GESTOR",
  operador: "OPERADOR",
} as const;

/** Setas de reciclagem do Figma, bem discretas atrás do menu. */
function SetasDeFundo(): ReactNode {
  return (
    <div className="sidebar__setas" aria-hidden="true">
      <svg
        className="sidebar__seta sidebar__seta--grande"
        viewBox="0 0 261.337 272.162"
        fill="none"
        stroke="white"
        strokeLinecap="round"
      >
        <path
          strokeWidth="36"
          d="M232.732 142.249C232.56 163.526 225.739 184.217 213.223 201.425C200.708 218.632 183.124 231.495 162.934 238.212C142.744 244.929 120.959 245.164 100.629 238.884C80.2992 232.603 62.4422 220.122 49.5585 203.189C36.6747 186.255 29.4093 165.716 28.7794 144.447C28.1496 123.178 34.1868 102.245 46.0459 84.5787C57.905 66.912 74.992 53.3963 94.9147 45.924C114.837 38.4517 136.598 37.3969 157.15 42.9073"
        />
        <path
          fill="white"
          strokeWidth="12"
          strokeLinejoin="round"
          d="M161.006 6.00018L200.975 54.0696L142.018 75.7102L161.006 6.00018Z"
        />
      </svg>
      <svg
        className="sidebar__seta sidebar__seta--pequena"
        viewBox="0 0 162.924 211.98"
        fill="none"
        stroke="white"
        strokeLinecap="round"
      >
        <path
          strokeWidth="26"
          d="M59 198.976C32.6603 133.354 55.9618 73.713 103.924 36.7847"
        />
        <path
          fill="white"
          strokeWidth="8"
          strokeLinejoin="round"
          d="M89.3255 17.5L129.637 17.3206L118.522 56.0694L89.3255 17.5Z"
        />
      </svg>
    </div>
  );
}

interface SidebarProps {
  readonly aoAbrirAssistente?: () => void;
}

export function Sidebar({ aoAbrirAssistente }: SidebarProps): ReactNode {
  const { usuario } = useAuth();
  const aguardando = useSyncExternalStore(
    assinarMudancas,
    quantidadeAguardando,
  );
  const papelChip = usuario ? CHIP_PAPEL[usuario.papel] : "GESTOR";

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <aside className="sidebar" aria-label="Navegação principal">
        <SetasDeFundo />
        <div className="sidebar__topo">
          <LogoVolta altura={28} variante="clara" />
          <span className="sidebar__chip-papel" aria-label={`Papel: ${papelChip}`}>
            {papelChip}
          </span>
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
                        <Icone nome={item.icone} tamanho={18} />
                      </span>
                      <span className="sidebar__link-rotulo">
                        {item.rotulo}
                      </span>
                      {item.caminho === "/ocorrencias" && aguardando > 0 ? (
                        <span
                          className="sidebar__link-badge"
                          aria-label={`${aguardando} aguardando aprovação`}
                        >
                          {aguardando}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar__ajuda" role="group" aria-label="Assistente VOLTA">
          <div className="sidebar__ajuda-mascote" aria-hidden="true">
            <Mascote tamanho={58} altura={101} />
          </div>
          <p className="sidebar__ajuda-titulo">Precisa de ajuda?</p>
          <p className="sidebar__ajuda-texto">
            Pergunte ao VOLTA sobre a unidade.
          </p>
          <button
            type="button"
            className="sidebar__ajuda-botao"
            onClick={aoAbrirAssistente}
          >
            <Icone nome="brilho" tamanho={13} />
            <span>Abrir assistente</span>
          </button>
        </div>

        {usuario ? (
          <Link to="/perfil" className="sidebar__usuario" aria-label="Abrir perfil">
            <span className="sidebar__avatar" aria-hidden="true">
              {iniciais(usuario.nome)}
            </span>
            <div className="sidebar__usuario-info">
              <span className="sidebar__usuario-nome">{usuario.nome}</span>
              <span className="sidebar__usuario-papel">
                {ROTULO_PAPEL[usuario.papel]}
              </span>
            </div>
            <span className="sidebar__usuario-seta" aria-hidden="true">
              <Icone nome="seta-baixo" tamanho={14} />
            </span>
          </Link>
        ) : null}
      </aside>
    </>
  );
}
