import type { ReactNode } from "react";

import { EmBreve } from "../../components/EmBreve";

export default function Configuracoes(): ReactNode {
  return (
    <EmBreve
      icone="engrenagem"
      titulo="Configurações"
      descricao="Em breve você vai personalizar notificações, integrações com cooperativas parceiras e preferências de exibição da plataforma."
    />
  );
}
