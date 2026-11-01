import type { ReactNode } from "react";

import { Icone } from "../Icone";
import { AcaoDoEstado, EstadoPainel } from "../EstadoPainel";

interface EstadoForaDoArProps {
  readonly aoTentarDeNovo: () => void;
}

/** A API não respondeu ou demorou demais e a tela não tem nada para mostrar. */
export function EstadoForaDoAr({ aoTentarDeNovo }: EstadoForaDoArProps): ReactNode {
  return (
    <EstadoPainel
      pose="preocupado"
      tom="alerta"
      tag="Fora do ar"
      titulo="O VOLTA não respondeu"
      texto="Não é nada com você: o serviço está fora do ar ou demorou demais pra responder. Tente de novo em alguns minutos."
    >
      <AcaoDoEstado aoClicar={aoTentarDeNovo}>
        <Icone nome="ciclo" tamanho={16} />
        Tentar de novo
      </AcaoDoEstado>
    </EstadoPainel>
  );
}
