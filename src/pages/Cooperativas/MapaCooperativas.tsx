import type { ReactNode } from "react";

import type { Cooperativa } from "../../types/cooperativa";
import { cooperativasNoRaio } from "../../utils/cooperativas";
import { corDaCooperativa } from "./cores";

const RAIO_KM = 10;

interface MapaCooperativasProps {
  readonly todas: readonly Cooperativa[];
  readonly selecionadaId: string | null;
  readonly aoSelecionar: (id: string) => void;
}

function Pino(): ReactNode {
  return (
    <svg viewBox="0 0 26 36" aria-hidden="true" focusable="false">
      <path
        d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23s13-13.25 13-23C26 5.82 20.18 0 13 0Z"
        fill="currentColor"
      />
      <circle cx="13" cy="13" r="5.5" fill="#fff" />
    </svg>
  );
}

/**
 * Mapa ilustrativo: as posições vêm do cadastro e o círculo marca o raio de
 * 10 km em volta da unidade (o ponto vermelho).
 */
export function MapaCooperativas({
  todas,
  selecionadaId,
  aoSelecionar,
}: MapaCooperativasProps): ReactNode {
  const total = cooperativasNoRaio(todas, RAIO_KM);

  return (
    <div
      className="coops__mapa"
      role="group"
      aria-label="Mapa ilustrativo das cooperativas"
    >
      <span className="coops__via coops__via--h1" aria-hidden="true" />
      <span className="coops__via coops__via--h2" aria-hidden="true" />
      <span className="coops__via coops__via--v1" aria-hidden="true" />
      <span className="coops__via coops__via--v2" aria-hidden="true" />
      <svg
        className="coops__raio"
        viewBox="0 0 238 238"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="119"
          cy="119"
          r="118.2"
          fill="rgba(27, 164, 99, 0.05)"
          stroke="rgba(27, 164, 99, 0.4)"
          strokeWidth="1.6"
          strokeDasharray="6.4 4.8"
        />
      </svg>
      <span className="coops__voce" aria-hidden="true" />

      {todas.map((coop) => {
        const selecionada = coop.id === selecionadaId;
        return (
          <button
            key={coop.id}
            type="button"
            className={`coops__pin${selecionada ? " coops__pin--selecionado" : ""}`}
            data-cor={corDaCooperativa(coop.id, todas)}
            style={{
              left: `${coop.posicaoMapa.x}%`,
              top: `${coop.posicaoMapa.y}%`,
            }}
            aria-label={`Ver ${coop.nome}`}
            aria-pressed={selecionada}
            onClick={() => aoSelecionar(coop.id)}
          >
            <Pino />
          </button>
        );
      })}

      <p className="coops__mapa-nota">
        {total === 1
          ? "1 cooperativa num raio de 10 km da unidade"
          : `${total} cooperativas num raio de 10 km da unidade`}
      </p>
    </div>
  );
}
