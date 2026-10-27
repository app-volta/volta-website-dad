import type { ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import "./modais.css";

interface OpcaoRadioProps {
  readonly nome: string;
  readonly valor: string;
  readonly rotulo: string;
  readonly detalhe?: string;
  readonly avatar?: string;
  readonly selecionado: boolean;
  readonly aoSelecionar: (valor: string) => void;
}

export function OpcaoRadio({
  nome,
  valor,
  rotulo,
  detalhe,
  avatar,
  selecionado,
  aoSelecionar,
}: OpcaoRadioProps): ReactNode {
  return (
    <label
      className={
        selecionado ? "opcao-radio opcao-radio--ativa" : "opcao-radio"
      }
    >
      <input
        type="radio"
        className="opcao-radio__input"
        name={nome}
        value={valor}
        checked={selecionado}
        onChange={() => aoSelecionar(valor)}
      />
      {avatar ? (
        <span className="opcao-radio__avatar" aria-hidden="true">
          {avatar}
        </span>
      ) : null}
      <span className="opcao-radio__textos">
        <strong>{rotulo}</strong>
        {detalhe ? <small>{detalhe}</small> : null}
      </span>
      <span className="opcao-radio__marca" aria-hidden="true">
        <Icone nome="check" tamanho={12} />
      </span>
    </label>
  );
}
