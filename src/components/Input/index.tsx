import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import "./styles.css";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  readonly rotulo: string;
  readonly erro?: string | null;
  readonly ajuda?: string;
  readonly onChange: (valor: string) => void;
}

/** Input com <label> associado via htmlFor + descrição/erro via aria-describedby. */
export function Input({
  rotulo,
  erro,
  ajuda,
  value,
  onChange,
  required,
  type = "text",
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
      <input
        id={idInput}
        type={type}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        aria-invalid={Boolean(erro) || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={erro ? "campo__input campo__input--erro" : "campo__input"}
        required={required}
        {...resto}
      />
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
