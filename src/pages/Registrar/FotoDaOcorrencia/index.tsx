import { useState } from "react";
import type { DragEvent, ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import type { ModoCamera } from "../../../utils/camera";
import type { DerivadosDoRegistro } from "../derivados";
import type { EstadoRegistrar } from "../reducer";

interface FotoDaOcorrenciaProps {
  readonly estado: EstadoRegistrar;
  readonly derivados: DerivadosDoRegistro;
  readonly modoCamera: ModoCamera;
  /** Uma foto foi solta na área (arrastada de fora do navegador). */
  readonly aoSoltarArquivo: (arquivo: File) => void;
  readonly aoEscolherArquivo: () => void;
  readonly aoUsarCamera: () => void;
  readonly aoTrocar: () => void;
  readonly aoTentarDeNovo: () => void;
  readonly aoPreencherSemIa: () => void;
}

/**
 * Coluna da foto: a área de soltar e escolher, o selo da análise e, quando a IA
 * não responde, a faixa com as saídas ("Tentar de novo" e "Preencher sem a IA").
 */
export function FotoDaOcorrencia({
  estado,
  derivados,
  modoCamera,
  aoSoltarArquivo,
  aoEscolherArquivo,
  aoUsarCamera,
  aoTrocar,
  aoTentarDeNovo,
  aoPreencherSemIa,
}: FotoDaOcorrenciaProps): ReactNode {
  const [arrastando, setArrastando] = useState<boolean>(false);
  const { emAnalise, analisando, concluida, analiseFalhou, fotoComErro } = derivados;
  const classeDaFoto = [
    "registrar__foto",
    arrastando ? "registrar__foto--arrastando" : "",
    fotoComErro ? "registrar__foto--erro" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function soltarFoto(evento: DragEvent<HTMLDivElement>): void {
    evento.preventDefault();
    setArrastando(false);
    const arquivo = evento.dataTransfer.files?.[0];
    if (arquivo) aoSoltarArquivo(arquivo);
  }

  return (
    <div className="registrar__coluna">
      <div
        className={classeDaFoto}
        onDragOver={(evento) => {
          if (estado.etapa !== "detalhes") return;
          evento.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={estado.etapa === "detalhes" ? soltarFoto : undefined}
      >
        {estado.fotoBase64 ? (
          <>
            <img
              src={estado.fotoBase64}
              alt="Foto anexada do resíduo"
              className="registrar__foto-imagem"
            />
            {analisando ? (
              <span className="registrar__scan" aria-hidden="true" />
            ) : null}
            {emAnalise ? (
              <span className="registrar__selo">
                <Icone
                  nome={concluida ? (estado.semIA ? "editar" : "check") : "brilho"}
                  tamanho={12}
                />
                {concluida
                  ? estado.semIA
                    ? "Preenchido por você"
                    : "Análise concluída"
                  : analiseFalhou
                    ? "Análise parada"
                    : "Analisando…"}
              </span>
            ) : null}
            <button
              type="button"
              className="registrar__trocar"
              onClick={aoTrocar}
            >
              <Icone nome="galeria" tamanho={15} />
              Trocar
            </button>
          </>
        ) : (
          <div className="registrar__foto-vazio">
            <span
              className={
                estado.fotoRecusada
                  ? "registrar__foto-icone registrar__foto-icone--erro"
                  : "registrar__foto-icone"
              }
              aria-hidden="true"
            >
              <Icone nome="camera" tamanho={30} />
            </span>
            <p className="registrar__foto-titulo" role={estado.fotoRecusada ? "alert" : undefined}>
              {estado.fotoRecusada
                ? "Não conseguimos usar essa foto"
                : "Arraste a foto do resíduo aqui"}
            </p>
            <p className="registrar__foto-desc">
              {estado.fotoRecusada
                ? "Tente de novo ou escolha outra imagem, com boa luz e o resíduo visível."
                : "ou escolha um arquivo · a IA identifica tipo, contaminação e quantidade"}
            </p>
            <div className="registrar__foto-botoes">
              <button
                type="button"
                className="registrar__botao registrar__botao--primario"
                onClick={aoEscolherArquivo}
              >
                <Icone nome="upload" tamanho={16} /> Enviar foto
              </button>
              {modoCamera === null ? null : (
                <button
                  type="button"
                  className="registrar__botao registrar__botao--suave"
                  onClick={aoUsarCamera}
                >
                  <Icone nome="camera" tamanho={16} /> Usar câmera
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {estado.erroCampo.foto ? (
        <p role="alert" className="registrar__erro-campo registrar__erro-campo--icone">
          <Icone nome="alerta" tamanho={13} /> {estado.erroCampo.foto}
        </p>
      ) : null}
      {emAnalise && (analiseFalhou || estado.erroEnvio) ? (
        <div className="registrar__faixa" role="alert">
          <span className="registrar__faixa-icone" aria-hidden="true">
            <Icone nome="fechar" tamanho={13} />
          </span>
          <div>
            <strong>
              {analiseFalhou
                ? "A análise da IA não respondeu"
                : "Não conseguimos enviar a ocorrência"}
            </strong>
            <span>
              {analiseFalhou
                ? "Sua foto continua aqui. Tente de novo ou preencha os dados sem a IA."
                : "Foto e dados continuam aqui. " + (estado.erroEnvio ?? "")}
            </span>
          </div>
        </div>
      ) : null}
      {analiseFalhou ? (
        <div className="registrar__faixa-acoes">
          <button
            type="button"
            className="registrar__botao registrar__botao--primario"
            onClick={aoTentarDeNovo}
          >
            <Icone nome="ciclo" tamanho={15} /> Tentar de novo
          </button>
          <button
            type="button"
            className="registrar__botao registrar__botao--contorno"
            onClick={aoPreencherSemIa}
          >
            Preencher sem a IA
          </button>
        </div>
      ) : null}
    </div>
  );
}
