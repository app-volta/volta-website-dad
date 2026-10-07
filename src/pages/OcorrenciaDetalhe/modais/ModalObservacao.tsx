import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { ModalAcao } from "../../../components/ModalAcao";

const SUGESTOES: readonly string[] = [
  "Material separado",
  "Área isolada",
  "Pede pallet",
  "Urgente",
];

const LIMITE = 300;

interface ModalObservacaoProps {
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (texto: string) => void;
  readonly aoFechar: () => void;
}

export function ModalObservacao({
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalObservacaoProps): ReactNode {
  const idTexto = useId();
  const [texto, setTexto] = useState<string>("");
  const vazio = texto.trim().length === 0;

  function acrescentar(sugestao: string): void {
    setTexto((atual) => {
      const base = atual.trim();
      const novo = base ? `${base}. ${sugestao}` : sugestao;
      return novo.slice(0, LIMITE);
    });
  }

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="relatorio"
      tom="roxo"
      largura={520}
      titulo="Adicionar observação"
      subtitulo="Fica no histórico e no relatório PGRS."
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
            onClick={() => aoConfirmar(texto)}
            disabled={salvando || vazio}
          >
            {salvando ? "Salvando…" : "Salvar observação"}
          </button>
        </>
      }
    >
      <div className="campo-modal">
        <label htmlFor={idTexto} className="sr-only">
          Observação
        </label>
        <textarea
          id={idTexto}
          className="campo-modal__texto campo-modal__texto--alto"
          placeholder="Ex.: Material já separado em 2 pallets na área coberta."
          maxLength={LIMITE}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
      </div>

      <div className="sugestoes" aria-label="Sugestões rápidas">
        {SUGESTOES.map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            className="sugestoes__chip"
            onClick={() => acrescentar(sugestao)}
          >
            {sugestao}
          </button>
        ))}
      </div>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível salvar">
          {erro}
        </Alerta>
      ) : null}
    </ModalAcao>
  );
}
