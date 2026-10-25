import { useId } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "onChange"> {
  readonly rotulo: string;
  readonly erro?: string | null;
  readonly ajuda?: string;
  readonly onChange: (valor: string) => void;
}

export function TextArea({
  rotulo,
  erro,
  ajuda,
  value,
  onChange,
  required,
  rows = 4,
  ...resto
}: TextAreaProps): ReactNode {
  const idBase = useId();
  const idInput = `${idBase}-textarea`;
  const idAjuda = ajuda ? `${idBase}-ajuda` : undefined;
  const idErro = erro ? `${idBase}-erro` : undefined;
  const describedBy = [idAjuda, idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className="campo">
      <label htmlFor={idInput} className="campo__rotulo">
        {rotulo}
        {required ? (
          <span aria-hidden="true" className="campo__obrigatorio">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={idInput}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        aria-invalid={Boolean(erro) || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={
          erro ? "campo__textarea campo__textarea--erro" : "campo__textarea"
        }
        rows={rows}
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
