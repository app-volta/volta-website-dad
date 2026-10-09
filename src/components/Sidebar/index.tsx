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
      { rotulo: "Ocorrências", caminho: "/ocorrencias", icone: "grafico" },
      { rotulo: "Registrar", caminho: "/registrar", icone: "mais" },
    ],
  },
  {
    titulo: "GESTÃO",
    itens: [
      { rotulo: "Cooperativas", caminho: "/cooperativas", icone: "folha" },
      { rotulo: "Relatórios PGRS", caminho: "/relatorios", icone: "relatorio" },
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
                        <Icone nome={item.icone} tamanho={20} />
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
            <Mascote tamanho={54} />
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
            <Icone nome="estrela" tamanho={14} />
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
              <Icone nome="seta-direita" tamanho={16} />
            </span>
          </Link>
        ) : null}
      </aside>
    </>
  );
}
