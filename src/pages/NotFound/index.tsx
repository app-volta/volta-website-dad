import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import "../../components/Button/styles.css";
import { LogoVolta } from "../../components/LogoVolta";
import { Rodape } from "../../components/Rodape";
import "./styles.css";

export default function NotFound(): ReactNode {
  const localizacao = useLocation();
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header className="nao-encontrado__topo">
        <LogoVolta altura={36} />
      </header>
      <main
        id="conteudo"
        aria-labelledby="titulo-404"
        className="nao-encontrado"
        tabIndex={-1}
      >
        <div className="nao-encontrado__ilustracao" aria-hidden="true">
          ♻
        </div>
        <h1 id="titulo-404" className="nao-encontrado__titulo">
          Página não encontrada
        </h1>
        <p className="nao-encontrado__texto">
          Não achamos nada em <code>{localizacao.pathname}</code>. O link pode
          estar quebrado ou a página foi removida.
        </p>
        <nav aria-label="Voltar">
          <Link to="/" className="botao botao--primario nao-encontrado__link">
            Voltar para a Home
          </Link>
        </nav>
      </main>
      <Rodape />
    </>
  );
}
