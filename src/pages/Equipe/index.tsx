import type { ReactNode } from "react";

import { EmBreve } from "../../components/EmBreve";

export default function Equipe(): ReactNode {
  return (
    <EmBreve
      icone="equipe"
      titulo="Equipe"
      descricao="Em breve você vai gerenciar os responsáveis da unidade, convidar colegas e definir papéis (Gestor, Operador) sem sair da plataforma."
    />
  );
}
