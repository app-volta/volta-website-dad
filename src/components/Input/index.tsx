import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import "./styles.css";

interface AcaoDireita {
  readonly icone: NomeIcone;
  readonly rotulo: string;
  readonly aoClicar: () => void;
}

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  readonly rotulo: string;
  readonly erro?: string | null;
  readonly ajuda?: string;
  readonly onChange: (valor: string) => void;
  readonly iconeEsquerdo?: NomeIcone;
  readonly acaoDireita?: AcaoDireita;
}

/**
 * Campo de texto com rótulo ligado por `htmlFor`, ajuda e erro ligados por `aria-describedby`
 * e `aria-invalid` quando há erro (a mensagem usa `role=alert`). Aceita ícone e uma ação nas laterais.
 * `onChange` recebe o texto digitado, não o evento.
 */
export function Input({
  rotulo,
  erro,
  ajuda,
  value,
  onChange,
  required,
  type = "text",
  iconeEsquerdo,
  acaoDireita,
  ...resto
}: InputProps): ReactNode {
  const idBase = useId();
  const idInput = `${idBase}-input`;
  const idAjuda = ajuda ? `${idBase}-ajuda` : undefined;
  const idErro = erro ? `${idBase}-erro` : undefined;
  const describedBy = [idAjuda, idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={idInput}>
        {rotulo}
        {required ? (
          <span aria-hidden="true" className="campo__obrigatorio">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div
        className={
          erro
            ? "campo__wrapper campo__wrapper--erro"
            : "campo__wrapper"
        }
      >
        {iconeEsquerdo ? (
          <span className="campo__icone-esq" aria-hidden="true">
            <Icone nome={iconeEsquerdo} tamanho={18} />
          </span>
        ) : null}
        <input
          id={idInput}
          type={type}
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          aria-invalid={Boolean(erro) || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={
            iconeEsquerdo ? "campo__input campo__input--com-icone" : "campo__input"
          }
          required={required}
          {...resto}
        />
        {acaoDireita ? (
          <button
            type="button"
            className="campo__acao-dir"
            onClick={acaoDireita.aoClicar}
            aria-label={acaoDireita.rotulo}
          >
            <Icone nome={acaoDireita.icone} tamanho={18} />
          </button>
        ) : null}
      </div>
      {ajuda ? (
        <p id={idAjuda} className="campo__ajuda">
          {ajuda}
        </p>
      ) : null}
      {erro ? (
        <p id={idErro} role="alert" className="campo__erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
