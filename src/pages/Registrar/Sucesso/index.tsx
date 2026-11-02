import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Button } from "../../../components/Button";
import { Icone } from "../../../components/Icone";
import { descreverPeso } from "../../../utils/formatacao";
import { DE_ONDE_VEM_O_PESO } from "../constantes";
import type { PesoDaOcorrencia } from "../reducer";

interface SucessoProps {
  readonly codigo: string | null;
  readonly peso: PesoDaOcorrencia;
  /** A foto chegou ao serviço de imagens; se não, a tela avisa que ela só existe neste navegador. */
  readonly fotoGuardada: boolean;
  readonly aoRegistrarOutra: () => void;
  readonly aoVerOcorrencias: () => void;
}

/** O que a pessoa vê depois que a ocorrência é registrada. */
export function Sucesso({
  codigo,
  peso,
  fotoGuardada,
  aoRegistrarOutra,
  aoVerOcorrencias,
}: SucessoProps): ReactNode {
  return (
    <div className="registrar__sucesso">
      <span className="registrar__sucesso-icone" aria-hidden="true">
        <Icone nome="check" tamanho={28} />
      </span>
      <h2>Relatório gerado!</h2>
      <p>
        A ocorrência <strong>{codigo}</strong> foi registrada.
      </p>
      <p className="registrar__sucesso-peso">
        {peso.kg === null
          ? "Peso não informado."
          : `Peso aproximado: ${descreverPeso(peso.kg)} · ${DE_ONDE_VEM_O_PESO[peso.origem]}`}
      </p>
      {fotoGuardada ? null : (
        <Alerta variante="info" titulo="A foto não foi guardada">
          O serviço de imagens não respondeu, então a ocorrência ficou sem foto
          para as outras pessoas. Neste navegador ela aparece até você
          recarregar a página.
        </Alerta>
      )}
      <div className="registrar__sucesso-acoes">
        <Button variante="secundario" onClick={aoRegistrarOutra}>
          Registrar outra
        </Button>
        <Button variante="primario" onClick={aoVerOcorrencias}>
          Ver ocorrências
        </Button>
      </div>
    </div>
  );
}
