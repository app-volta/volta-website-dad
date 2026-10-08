import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import { ModalAcao } from "../../components/ModalAcao";
import type { Cooperativa } from "../../types/cooperativa";
import { rotuloLicenca } from "../../utils/cooperativas";
import "./modal.css";

interface ModalDocumentosProps {
  readonly coop: Cooperativa;
  readonly aoFechar: () => void;
}

export function ModalDocumentos({
  coop,
  aoFechar,
}: ModalDocumentosProps): ReactNode {
  const licenca = [
    rotuloLicenca(coop, new Date(), true),
    coop.licencaDocumento,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ModalAcao
      aberto
      icone="documento"
      tom="azul"
      largura={480}
      titulo={`Documentos de ${coop.nome}`}
      subtitulo="O que a VOLTA tem registrado desta cooperativa."
      aoFechar={aoFechar}
      rodape={
        <button
          type="button"
          className="modal-acao__botao modal-acao__botao--contorno"
          onClick={aoFechar}
        >
          Fechar
        </button>
      }
    >
      <ul className="coops-docs">
        <li className="coops-docs__item">
          <span className="coops-docs__icone" aria-hidden="true">
            <Icone nome="escudo" tamanho={18} />
          </span>
          <div>
            <p className="coops-docs__titulo">Licença ambiental</p>
            <p className="coops-docs__texto">{licenca}</p>
          </div>
        </li>
        <li className="coops-docs__item">
          <span className="coops-docs__icone" aria-hidden="true">
            <Icone nome="predio" tamanho={18} />
          </span>
          <div>
            <p className="coops-docs__titulo">CNPJ</p>
            <p className="coops-docs__texto">{coop.cnpj}</p>
          </div>
        </li>
      </ul>
    </ModalAcao>
  );
}
