import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { Icone } from "../../components/Icone";
import {
  lerQuilos,
  percentualDaMeta,
  validarMeta,
} from "../../utils/configuracoes";

interface CartaoMetaProps {
  readonly metaKg: number;
  readonly recuperadoKg: number;
  /** Devolve true quando a meta foi salva. */
  readonly aoSalvar: (metaKg: number) => Promise<boolean>;
}

export function CartaoMeta({
  metaKg,
  recuperadoKg,
  aoSalvar,
}: CartaoMetaProps): ReactNode {
  const idCampo = useId();
  const [editando, setEditando] = useState<boolean>(false);
  const [texto, setTexto] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);

  const percentual = percentualDaMeta(recuperadoKg, metaKg);
  const valorExibido = editando ? texto : metaKg.toLocaleString("pt-BR");

  function aoFocar(): void {
    setTexto(String(metaKg));
    setErro(null);
    setEditando(true);
  }

  async function aoSair(): Promise<void> {
    const novaMeta = lerQuilos(texto);
    const mensagem = Number.isNaN(novaMeta)
      ? "Informe a meta em quilos."
      : validarMeta(novaMeta);
    setEditando(false);
    if (mensagem) {
      setErro(mensagem);
      return;
    }
    if (novaMeta !== metaKg) await aoSalvar(novaMeta);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>): void {
    if (evento.key === "Enter") evento.currentTarget.blur();
    if (evento.key === "Escape") {
      setTexto(String(metaKg));
      evento.currentTarget.blur();
    }
  }

  return (
    <section className="cfg__cartao" aria-labelledby="cfg-meta-titulo">
      <div className="cfg__cabecalho">
        <h3 id="cfg-meta-titulo" className="cfg__titulo">
          Meta de recuperação
        </h3>
        <span className="cfg__selo">{percentual}% atingido</span>
      </div>

      <div className="cfg__meta-linha">
        <label
          className={`cfg__meta-campo${erro ? " cfg__meta-campo--erro" : ""}`}
          htmlFor={idCampo}
        >
          <span className="cfg__meta-icone" aria-hidden="true">
            <Icone nome="alvo" tamanho={16} />
          </span>
          <span className="sr-only">Meta de recuperação em quilos por mês</span>
          <input
            id={idCampo}
            type="text"
            inputMode="numeric"
            value={valorExibido}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? `${idCampo}-erro` : `${idCampo}-ajuda`}
            onFocus={aoFocar}
            onChange={(evento) => setTexto(evento.target.value)}
            onBlur={() => void aoSair()}
            onKeyDown={aoTeclar}
          />
          <span className="cfg__meta-unidade">kg/mês</span>
        </label>
        <p className="cfg__ajuda" id={`${idCampo}-ajuda`}>
          Usada na Home do app e no relatório PGRS.
        </p>
      </div>
      {erro ? (
        <p className="cfg__erro" id={`${idCampo}-erro`}>
          {erro}
        </p>
      ) : null}

      <div
        className="cfg__barra"
        role="progressbar"
        aria-label="Meta de recuperação atingida"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percentual, 100)}
      >
        <span style={{ width: `${Math.min(percentual, 100)}%` }} />
      </div>
    </section>
  );
}
