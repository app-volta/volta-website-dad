import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "../../components/Button";
import "./styles.css";

export default function NotFound(): ReactNode {
  const localizacao = useLocation();
  return (
    <section aria-labelledby="titulo-404" className="nao-encontrado">
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
      <Link to="/" className="nao-encontrado__link">
        <Button variante="primario">Voltar para a Home</Button>
      </Link>
    </section>
  );
}
