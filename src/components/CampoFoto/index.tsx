import { useId, useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";

import "./styles.css";

interface CampoFotoProps {
  readonly rotulo: string;
  readonly ajuda?: string;
  readonly valor: string | null;
  readonly onMudar: (base64: string | null) => void;
  readonly erro?: string | null;
}

/**
 * Campo para captura/seleção de foto. Converte para base64 antes de subir
 * para o serviço mock — no back real trocar por FormData/upload direto.
 */
export function CampoFoto({
  rotulo,
  ajuda,
  valor,
  onMudar,
  erro,
}: CampoFotoProps): ReactNode {
  const idBase = useId();
  const idInput = `${idBase}-arquivo`;
  const idAjuda = ajuda ? `${idBase}-ajuda` : undefined;
  const idErro = erro ? `${idBase}-erro` : undefined;
  const referenciaInput = useRef<HTMLInputElement | null>(null);

  function processarArquivo(evento: ChangeEvent<HTMLInputElement>): void {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      onMudar(null);
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result;
      if (typeof resultado === "string") onMudar(resultado);
    };
    leitor.readAsDataURL(arquivo);
  }

  function abrirSeletor(): void {
    referenciaInput.current?.click();
  }

  return (
    <div className="campo campo-foto">
      <label htmlFor={idInput} className="campo__rotulo">
        {rotulo}
      </label>
      <input
        id={idInput}
        ref={referenciaInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={processarArquivo}
        aria-describedby={[idAjuda, idErro].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(erro) || undefined}
        className="campo-foto__input"
      />
      <button
        type="button"
        className="campo-foto__botao"
        onClick={abrirSeletor}
      >
        {valor ? "Trocar foto" : "Selecionar foto"}
      </button>
      {valor ? (
        <img
          src={valor}
          alt="Pré-visualização da foto selecionada do resíduo"
          className="campo-foto__preview"
        />
      ) : null}
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
