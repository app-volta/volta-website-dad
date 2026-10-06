import type { ReactNode } from "react";

import "./modais.css";

type TomSegmento = "ambar" | "rosa" | "verde";

interface OpcaoSegmentada {
  readonly valor: string;
  readonly rotulo: string;
  readonly detalhe?: string;
  readonly tom?: TomSegmento;
}

interface SegmentadoProps {
  readonly legenda: string;
  readonly nome: string;
  readonly opcoes: readonly OpcaoSegmentada[];
  readonly valor: string;
  readonly aoMudar: (valor: string) => void;
}

export function Segmentado({
  legenda,
  nome,
  opcoes,
  valor,
  aoMudar,
}: SegmentadoProps): ReactNode {
  return (
    <fieldset className="campo-modal">
      <legend className="campo-modal__rotulo">{legenda}</legend>
      <div className="segmentado">
        {opcoes.map((opcao) => {
          const ativa = opcao.valor === valor;
          return (
            <label
              key={opcao.valor}
              className={
                ativa
                  ? `segmentado__opcao segmentado__opcao--ativa segmentado__opcao--${opcao.tom ?? "verde"}`
                  : "segmentado__opcao"
              }
            >
              <input
                type="radio"
                className="opcao-radio__input"
                name={nome}
                value={opcao.valor}
                checked={ativa}
                onChange={() => aoMudar(opcao.valor)}
              />
              <strong>{opcao.rotulo}</strong>
              {opcao.detalhe ? <small>{opcao.detalhe}</small> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
