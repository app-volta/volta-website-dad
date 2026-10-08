import { useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { ModalAcao } from "../../components/ModalAcao";
import {
  MATERIAIS_CADASTRO,
  ROTULOS_MATERIAL_ACEITO,
} from "../../types/cooperativa";
import type { MaterialAceito, NovaCooperativa } from "../../types/cooperativa";
import { validarLicenca } from "../../utils/cooperativas";
import { mascararCnpj } from "../../utils/formatacao";
import { validarCnpj } from "../../utils/validadores";
import "./modal.css";

interface ModalAdicionarProps {
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (dados: NovaCooperativa) => void;
  readonly aoFechar: () => void;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

export function ModalAdicionar({
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalAdicionarProps): ReactNode {
  const idFormulario = useId();
  const idNome = useId();
  const idCnpj = useId();
  const idRotuloLicenca = useId();
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const cnpjRef = useRef<HTMLInputElement | null>(null);

  const [nome, setNome] = useState<string>("");
  const [cnpj, setCnpj] = useState<string>("");
  const [materiais, setMateriais] = useState<readonly MaterialAceito[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState<boolean>(false);
  const [tentou, setTentou] = useState<boolean>(false);

  const erroNome =
    nome.trim().length < 3 ? "Informe o nome da cooperativa." : null;
  const erroCnpj = validarCnpj(cnpj);
  const erroMateriais =
    materiais.length === 0 ? "Escolha ao menos um material." : null;
  const erroLicenca = validarLicenca(arquivo);

  function alternarMaterial(material: MaterialAceito): void {
    setMateriais((atuais) =>
      atuais.includes(material)
        ? atuais.filter((item) => item !== material)
        : [...atuais, material],
    );
  }

  function escolherArquivo(evento: ChangeEvent<HTMLInputElement>): void {
    setArquivo(evento.target.files?.[0] ?? null);
    evento.target.value = "";
  }

  function soltarArquivo(evento: DragEvent<HTMLLabelElement>): void {
    evento.preventDefault();
    setArrastando(false);
    const solto = evento.dataTransfer.files[0];
    if (solto) setArquivo(solto);
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (salvando) return;
    setTentou(true);
    if (erroNome) {
      nomeRef.current?.focus();
      return;
    }
    if (erroCnpj) {
      cnpjRef.current?.focus();
      return;
    }
    if (erroMateriais || erroLicenca) return;
    aoConfirmar({ nome, cnpj, materiais, licenca: arquivo });
  }

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="ciclo"
      tom="verde"
      largura={526}
      titulo="Adicionar cooperativa"
      subtitulo="Ela entra em homologação até a licença ser validada."
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
            type="submit"
            form={idFormulario}
            className="modal-acao__botao modal-acao__botao--primario"
            disabled={salvando}
          >
            {salvando ? "Enviando…" : "Enviar pra homologação"}
          </button>
        </>
      }
    >
      <form id={idFormulario} className="coops-form" onSubmit={enviar} noValidate>
        <Campo
          id={idNome}
          rotulo="Nome"
          icone="predio"
          erro={tentou ? erroNome : null}
        >
          <input
            ref={nomeRef}
            id={idNome}
            type="text"
            value={nome}
            placeholder="Ex.: Cooperativa Reciclar"
            maxLength={80}
            autoComplete="off"
            aria-invalid={tentou && erroNome ? true : undefined}
            aria-describedby={tentou && erroNome ? `${idNome}-erro` : undefined}
            onChange={(evento) => setNome(evento.target.value)}
          />
        </Campo>

        <Campo
          id={idCnpj}
          rotulo="CNPJ"
          icone="documento"
          erro={tentou ? erroCnpj : null}
        >
          <input
            ref={cnpjRef}
            id={idCnpj}
            type="text"
            inputMode="numeric"
            value={cnpj}
            placeholder="00.000.000/0001-00"
            autoComplete="off"
            aria-invalid={tentou && erroCnpj ? true : undefined}
            aria-describedby={tentou && erroCnpj ? `${idCnpj}-erro` : undefined}
            onChange={(evento) => setCnpj(mascararCnpj(evento.target.value))}
          />
        </Campo>

        <fieldset className="coops-form__grupo">
          <legend className="coops-form__rotulo">Materiais aceitos</legend>
          <div className="coops-form__chips">
            {MATERIAIS_CADASTRO.map((material) => (
              <label key={material} className="coops-form__chip">
                <input
                  type="checkbox"
                  checked={materiais.includes(material)}
                  onChange={() => alternarMaterial(material)}
                />
                <span>{ROTULOS_MATERIAL_ACEITO[material]}</span>
              </label>
            ))}
          </div>
          {tentou && erroMateriais ? (
            <p className="coops-form__erro">{erroMateriais}</p>
          ) : null}
        </fieldset>

        <div className="coops-form__grupo">
          <span className="coops-form__rotulo" id={idRotuloLicenca}>
            Licença ambiental
          </span>
          <label
            className={`coops-form__drop${arrastando ? " coops-form__drop--ativa" : ""}`}
            onDragOver={(evento) => {
              evento.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltarArquivo}
          >
            <input
              type="file"
              accept="application/pdf,.pdf"
              aria-labelledby={idRotuloLicenca}
              onChange={escolherArquivo}
            />
            <span className="coops-form__drop-icone" aria-hidden="true">
              <Icone nome="upload" tamanho={18} />
            </span>
            <span className="coops-form__drop-textos">
              <strong>{arquivo ? arquivo.name : "Envie o PDF da licença"}</strong>
              <small>
                {arquivo
                  ? `${formatarTamanho(arquivo.size)} · clique para trocar`
                  : "ou arraste aqui · até 10 MB"}
              </small>
            </span>
          </label>
          {erroLicenca ? <p className="coops-form__erro">{erroLicenca}</p> : null}
          {arquivo ? (
            <button
              type="button"
              className="coops-form__remover"
              onClick={() => setArquivo(null)}
            >
              Remover arquivo
            </button>
          ) : null}
        </div>

        {erro ? (
          <Alerta variante="erro" titulo="Não foi possível cadastrar">
            {erro}
          </Alerta>
        ) : null}
      </form>
    </ModalAcao>
  );
}

interface CampoProps {
  readonly id: string;
  readonly rotulo: string;
  readonly icone: NomeIcone;
  readonly erro: string | null;
  readonly children: ReactNode;
}

function Campo({ id, rotulo, icone, erro, children }: CampoProps): ReactNode {
  return (
    <div className="coops-form__grupo">
      <label className="coops-form__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <div className={`coops-form__campo${erro ? " coops-form__campo--erro" : ""}`}>
        <span className="coops-form__campo-icone" aria-hidden="true">
          <Icone nome={icone} tamanho={16} />
        </span>
        {children}
      </div>
      {erro ? (
        <p className="coops-form__erro" id={`${id}-erro`}>
          {erro}
        </p>
      ) : null}
    </div>
  );
}
