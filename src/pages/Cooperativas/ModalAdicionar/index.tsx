import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import type { NomeIcone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import {
  MATERIAIS_CADASTRO,
  ROTULOS_MATERIAL_ACEITO,
} from "../../../types/cooperativa";
import type {
  FormularioCooperativa,
  MaterialAceito,
  NovaCooperativa,
} from "../../../types/cooperativa";
import {
  lerCoordenada,
  validarLatitude,
  validarLicenca,
  validarLongitude,
  validarMateriais,
  validarNomeCooperativa,
} from "../../../utils/cooperativas";
import { mascararCnpj } from "../../../utils/formatacao";
import { validarCnpj } from "../../../utils/validadores";
import ".././modal.css";

interface ModalAdicionarProps {
  /** Cadastro na volta-api: pede a localização da sede e não recebe a licença em PDF. */
  readonly cadastroNaApi?: boolean;
  readonly salvando: boolean;
  readonly erro: string | null;
  /** CNPJ que a API recusou por já estar cadastrado: o campo avisa até a pessoa mudá-lo. */
  readonly cnpjRecusado?: string | null;
  readonly aoConfirmar: (dados: NovaCooperativa) => void;
  readonly aoFechar: () => void;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

const FORMULARIO_VAZIO: FormularioCooperativa = {
  nome: "",
  cnpj: "",
  materiais: [],
  arquivo: null,
  latitude: "",
  longitude: "",
};

export function ModalAdicionar({
  cadastroNaApi = false,
  salvando,
  erro,
  cnpjRecusado = null,
  aoConfirmar,
  aoFechar,
}: ModalAdicionarProps): ReactNode {
  const idFormulario = useId();
  const idNome = useId();
  const idCnpj = useId();
  const idLatitude = useId();
  const idLongitude = useId();
  const idRotuloLicenca = useId();
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const cnpjRef = useRef<HTMLInputElement | null>(null);

  // Os campos mudam e são enviados juntos, então ficam num só objeto.
  const [formulario, setFormulario] =
    useState<FormularioCooperativa>(FORMULARIO_VAZIO);
  const [arrastando, setArrastando] = useState<boolean>(false);
  const [tentou, setTentou] = useState<boolean>(false);

  const { nome, cnpj, materiais, arquivo, latitude, longitude } = formulario;

  const erroNome = validarNomeCooperativa(nome);
  const erroCnpj = validarCnpj(cnpj);
  const cnpjJaCadastrado = cnpjRecusado !== null && cnpj === cnpjRecusado;
  const erroDoCampoCnpj =
    tentou && erroCnpj
      ? erroCnpj
      : cnpjJaCadastrado
        ? "Este CNPJ já está cadastrado. Confira o número."
        : null;

  useEffect(() => {
    if (cnpjRecusado !== null) cnpjRef.current?.focus();
  }, [cnpjRecusado]);
  const erroMateriais = validarMateriais(materiais);
  const erroLicenca = validarLicenca(arquivo);
  const erroLatitude = cadastroNaApi ? validarLatitude(latitude) : null;
  const erroLongitude = cadastroNaApi ? validarLongitude(longitude) : null;

  /** Troca só o campo editado; o spread copia o resto sem mutar o estado. */
  function atualizar<Campo extends keyof FormularioCooperativa>(
    campo: Campo,
    valor: FormularioCooperativa[Campo],
  ): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function alternarMaterial(material: MaterialAceito): void {
    setFormulario((atual) => ({
      ...atual,
      materiais: atual.materiais.includes(material)
        ? atual.materiais.filter((item) => item !== material)
        : [...atual.materiais, material],
    }));
  }

  function escolherArquivo(evento: ChangeEvent<HTMLInputElement>): void {
    atualizar("arquivo", evento.target.files?.[0] ?? null);
    evento.target.value = "";
  }

  function soltarArquivo(evento: DragEvent<HTMLLabelElement>): void {
    evento.preventDefault();
    setArrastando(false);
    const solto = evento.dataTransfer.files[0];
    if (solto) atualizar("arquivo", solto);
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
    if (erroMateriais || erroLicenca || erroLatitude || erroLongitude) return;
    aoConfirmar({
      nome,
      cnpj,
      materiais,
      licenca: arquivo,
      ...(cadastroNaApi
        ? { latitude: lerCoordenada(latitude), longitude: lerCoordenada(longitude) }
        : {}),
    });
  }

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="ciclo"
      tom="verde"
      largura={526}
      titulo="Adicionar cooperativa"
      subtitulo={
        cadastroNaApi
          ? "Ela entra na lista de cooperativas da sua empresa."
          : "Ela entra em homologação até a licença ser validada."
      }
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
            {salvando
              ? "Enviando…"
              : cadastroNaApi
                ? "Cadastrar"
                : "Enviar pra homologação"}
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
            onChange={(evento) => atualizar("nome", evento.target.value)}
          />
        </Campo>

        <Campo
          id={idCnpj}
          rotulo="CNPJ"
          icone="documento"
          erro={erroDoCampoCnpj}
        >
          <input
            ref={cnpjRef}
            id={idCnpj}
            type="text"
            inputMode="numeric"
            value={cnpj}
            placeholder="00.000.000/0001-00"
            autoComplete="off"
            aria-invalid={erroDoCampoCnpj ? true : undefined}
            aria-describedby={erroDoCampoCnpj ? `${idCnpj}-erro` : undefined}
            onChange={(evento) =>
              atualizar("cnpj", mascararCnpj(evento.target.value))
            }
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

        {cadastroNaApi ? (
          <div className="coops-form__linha">
            <Campo
              id={idLatitude}
              rotulo="Latitude"
              icone="pin"
              erro={tentou ? erroLatitude : null}
            >
              <input
                id={idLatitude}
                type="text"
                inputMode="decimal"
                value={latitude}
                placeholder="-23,561684"
                autoComplete="off"
                aria-invalid={tentou && erroLatitude ? true : undefined}
                aria-describedby={tentou && erroLatitude ? `${idLatitude}-erro` : undefined}
                onChange={(evento) => atualizar("latitude", evento.target.value)}
              />
            </Campo>
            <Campo
              id={idLongitude}
              rotulo="Longitude"
              icone="pin"
              erro={tentou ? erroLongitude : null}
            >
              <input
                id={idLongitude}
                type="text"
                inputMode="decimal"
                value={longitude}
                placeholder="-46,655981"
                autoComplete="off"
                aria-invalid={tentou && erroLongitude ? true : undefined}
                aria-describedby={tentou && erroLongitude ? `${idLongitude}-erro` : undefined}
                onChange={(evento) => atualizar("longitude", evento.target.value)}
              />
            </Campo>
          </div>
        ) : null}

        {cadastroNaApi ? null : (
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
              onClick={() => atualizar("arquivo", null)}
            >
              Remover arquivo
            </button>
          ) : null}
        </div>
        )}

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
