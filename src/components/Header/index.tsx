import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../Button";
import "./styles.css";

const ITENS_NAV: readonly {
  readonly rotulo: string;
  readonly caminho: string;
}[] = [
  { rotulo: "Início", caminho: "/" },
  { rotulo: "Registrar", caminho: "/registrar" },
  { rotulo: "Ocorrências", caminho: "/ocorrencias" },
  { rotulo: "Cooperativas", caminho: "/cooperativas" },
  { rotulo: "Perfil", caminho: "/perfil" },
];

export function Header(): ReactNode {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  function fazerLogout(): void {
    sair();
    navegar("/login");
  }

  return (
    <header className="cabecalho" role="banner">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <div className="cabecalho__linha">
        <NavLink to="/" className="cabecalho__marca" aria-label="VOLTA — Início">
          <span className="cabecalho__logo" aria-hidden="true">
            ♻
          </span>
          <span>VOLTA</span>
        </NavLink>
        {usuario ? (
          <div className="cabecalho__usuario">
            <span className="sr-only">Usuário logado:</span>
            <span className="cabecalho__nome">{usuario.nome}</span>
            <Button variante="sutil" onClick={fazerLogout}>
              Sair
            </Button>
          </div>
        ) : null}
      </div>
      {usuario ? (
        <nav aria-label="Navegação principal" className="cabecalho__nav">
          <ul className="cabecalho__lista">
            {ITENS_NAV.map((item) => (
              <li key={item.caminho}>
                <NavLink
                  to={item.caminho}
                  end={item.caminho === "/"}
                  className={({ isActive }) =>
                    isActive
                      ? "cabecalho__link cabecalho__link--ativo"
                      : "cabecalho__link"
                  }
                >
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
