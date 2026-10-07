import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import type { NovaClassificacao } from "../../../services/ocorrencias";
import { MATERIAIS, METADADOS_MATERIAL } from "../../../types/material";
import type { Material } from "../../../types/material";
import type {
  Ocorrencia,
  PrioridadeOcorrencia,
  QualidadeMaterial,
} from "../../../types/ocorrencia";
import { OpcaoRadio } from "./OpcaoRadio";
import { Segmentado } from "./Segmentado";

interface ModalClassificarProps {
  readonly ocorrencia: Ocorrencia;
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (nova: NovaClassificacao) => void;
  readonly aoFechar: () => void;
}

export function ModalClassificar({
  ocorrencia,
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalClassificarProps): ReactNode {
  const [material, setMaterial] = useState<Material | null>(ocorrencia.material);
  const [qualidade, setQualidade] = useState<QualidadeMaterial>(
    ocorrencia.qualidade,
  );
  const [prioridade, setPrioridade] = useState<PrioridadeOcorrencia>(
    ocorrencia.prioridade,
  );
  const [perigoso, setPerigoso] = useState<boolean>(ocorrencia.perigoso);

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="editar"
      tom="ambar"
      titulo="Alterar classificação"
      subtitulo="Define como esse resíduo entra no PGRS da unidade."
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={() => {
              if (material) {
                aoConfirmar({ material, qualidade, prioridade, perigoso });
              }
            }}
            disabled={salvando || material === null}
          >
            {salvando ? "Salvando…" : "Salvar classificação"}
          </button>
        </>
      }
    >
      <fieldset className="campo-modal">
        <legend className="campo-modal__rotulo">Material</legend>
        <div className="opcoes">
          {MATERIAIS.map((opcao) => (
            <OpcaoRadio
              key={opcao}
              nome="material"
              valor={opcao}
              rotulo={METADADOS_MATERIAL[opcao].rotulo}
              selecionado={material === opcao}
              aoSelecionar={() => setMaterial(opcao)}
            />
          ))}
        </div>
      </fieldset>

      <Segmentado
        legenda="Qualidade do material"
        nome="qualidade"
        valor={qualidade}
        aoMudar={(valor) => setQualidade(valor as QualidadeMaterial)}
        opcoes={[
          { valor: "A", rotulo: "A", detalhe: "limpo e seco", tom: "ambar" },
          { valor: "B", rotulo: "B", detalhe: "úmido ou sujo", tom: "ambar" },
          { valor: "C", rotulo: "C", detalhe: "contaminado", tom: "ambar" },
        ]}
      />

      <Segmentado
        legenda="Prioridade"
        nome="prioridade"
        valor={prioridade}
        aoMudar={(valor) => setPrioridade(valor as PrioridadeOcorrencia)}
        opcoes={[
          { valor: "alta", rotulo: "Alta", tom: "rosa" },
          { valor: "media", rotulo: "Média", tom: "ambar" },
          { valor: "baixa", rotulo: "Baixa", tom: "verde" },
        ]}
      />

      <div className="perigoso">
        <span className="perigoso__icone" aria-hidden="true">
          <Icone nome="alerta" tamanho={20} />
        </span>
        <div className="perigoso__textos">
          <strong id="rotulo-perigoso">Resíduo perigoso</strong>
          <small>Classe I da NBR 10004 · exige destinação especial</small>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={perigoso}
          aria-labelledby="rotulo-perigoso"
          className={
            perigoso ? "interruptor interruptor--ligado" : "interruptor"
          }
          onClick={() => setPerigoso((v) => !v)}
        >
          <span className="interruptor__bolinha" />
        </button>
      </div>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível salvar">
          {erro}
        </Alerta>
      ) : null}
    </ModalAcao>
  );
}
