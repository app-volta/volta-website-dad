import type { ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import "./styles.css";

interface EmBreveProps {
  readonly icone: NomeIcone;
  readonly titulo: string;
  readonly descricao: string;
}

export function EmBreve({
  icone,
  titulo,
  descricao,
}: EmBreveProps): ReactNode {
  return (
    <section className="em-breve" aria-labelledby="em-breve-titulo">
      <div className="em-breve__icone" aria-hidden="true">
        <Icone nome={icone} tamanho={32} />
      </div>
      <h2 id="em-breve-titulo" className="em-breve__titulo">
        {titulo}
      </h2>
      <p className="em-breve__descricao">{descricao}</p>
      <span className="em-breve__chip">Em breve</span>
    </section>
  );
}
