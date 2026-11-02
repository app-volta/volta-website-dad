import type { ReactNode } from "react";

import { AcaoDoEstado, EstadoPainel } from "../EstadoPainel";

/** A API recusou a lista para este perfil (403): a tela explica e leva de volta ao início. */
export function EstadoSemAcesso(): ReactNode {
  return (
    <EstadoPainel
      pose="acesso-restrito"
      tag="Acesso restrito"
      titulo="Você não tem acesso a esta área"
      texto="Essa parte do painel é liberada só para alguns perfis. Se você precisa dela, fale com o administrador da unidade."
    >
      <AcaoDoEstado para="/">Voltar ao início</AcaoDoEstado>
    </EstadoPainel>
  );
}
