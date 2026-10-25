import type { ReactNode } from "react";

import mascoteCompleto from "../../../assets/mascote-completo.svg";
import { ModalAcao } from "../../../components/ModalAcao";

interface ModalSucessoProps {
  readonly aberto: boolean;
  readonly numero: string;
  readonly aoFechar: () => void;
}

export function ModalSucesso({
  aberto,
  numero,
  aoFechar,
}: ModalSucessoProps): ReactNode {
  return (
    <ModalAcao
      aberto={aberto}
      centralizado
      ilustracao={
        <img src={mascoteCompleto} alt="" width={140} height={212} />
      }
      titulo="Aprovada!"
      subtitulo={`#${numero} já está no relatório PGRS do mês.`}
      aoFechar={aoFechar}
    />
  );
}
