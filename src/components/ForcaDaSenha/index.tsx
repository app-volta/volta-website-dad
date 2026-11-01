import type { ReactNode } from "react";

import { avaliarSenha } from "../../utils/senha";
import "./styles.css";

interface ForcaDaSenhaProps {
  readonly senha: string;
}

/** Quatro barras e uma palavra (Fraca, Média, Forte) sobre a senha que está sendo digitada. */
export function ForcaDaSenha({ senha }: ForcaDaSenhaProps): ReactNode {
  if (senha === "") return null;
  const { pontos, nivel, rotulo } = avaliarSenha(senha);

  return (
    <div className={`forca-senha forca-senha--${nivel}`}>
      <div className="forca-senha__barras" aria-hidden="true">
        {[1, 2, 3, 4].map((posicao) => (
          <span
            key={posicao}
            className={
              posicao <= pontos
                ? "forca-senha__barra forca-senha__barra--cheia"
                : "forca-senha__barra"
            }
          />
        ))}
      </div>
      <span className="forca-senha__rotulo" aria-live="polite">
        <span className="sr-only">Força da senha: </span>
        {rotulo}
      </span>
    </div>
  );
}
