import type { ReactNode } from "react";

import { EmBreve } from "../../components/EmBreve";

export default function Relatorios(): ReactNode {
  return (
    <EmBreve
      icone="relatorio"
      titulo="Relatórios PGRS"
      descricao="Em breve você vai gerar relatórios do Plano de Gerenciamento de Resíduos Sólidos direto por aqui, filtrados por período, setor e material."
    />
  );
}
