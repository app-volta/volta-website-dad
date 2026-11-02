import type { ReactNode } from "react";

import { AcaoDoEstado, EstadoPainel } from "../../components/EstadoPainel";
import { LogoVolta } from "../../components/LogoVolta";
import { Rodape } from "../../components/Rodape";
import "./styles.css";

interface NotFoundProps {
  /** Dentro do painel (com a barra lateral e o topo) o estado aparece sozinho; fora dele, com logo e rodapé. */
  readonly dentroDoPainel?: boolean;
}

export default function NotFound({
  dentroDoPainel = false,
}: NotFoundProps): ReactNode {
  const estado = (
    <EstadoPainel
      pose="pergunta"
      tag="Não encontrado"
      titulo="Essa página não existe"
      texto="O link pode estar errado ou a página mudou de lugar."
      nivelTitulo={dentroDoPainel ? "h2" : "h1"}
    >
      <AcaoDoEstado para="/">Voltar ao início</AcaoDoEstado>
      {dentroDoPainel ? (
        <AcaoDoEstado para="/ocorrencias" variante="secundaria">
          Ver ocorrências
        </AcaoDoEstado>
      ) : null}
    </EstadoPainel>
  );

  if (dentroDoPainel) return estado;

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header className="nao-encontrado__topo">
        <LogoVolta altura={36} />
      </header>
      <main id="conteudo" className="nao-encontrado" tabIndex={-1}>
        {estado}
      </main>
      <Rodape />
    </>
  );
}
