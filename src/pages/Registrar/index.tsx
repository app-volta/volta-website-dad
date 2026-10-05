import { useReducer, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import mascoteCompleto from "../../assets/mascote-completo.svg";
import { useAuth } from "../../context/AuthContext";
import { criarOcorrencia } from "../../services/ocorrencias";
import { METADADOS_MATERIAL } from "../../types/material";
import { formatarPorcentagem } from "../../utils/formatacao";
import {
  combinar,
  validarDescricao,
  validarFoto,
  validarObrigatorio,
} from "../../utils/validadores";
import {
  estadoInicial,
  redutor,
  type Prioridade,
} from "./reducer";
import "./styles.css";

const PRIORIDADES: readonly {
  readonly valor: Prioridade;
  readonly rotulo: string;
}[] = [
  { valor: "alta", rotulo: "Alta" },
  { valor: "media", rotulo: "Média" },
  { valor: "baixa", rotulo: "Baixa" },
];

const SETORES: readonly string[] = [
  "Frigorífico — Setor B2",
  "Embalagens B",
  "Caldeira",
  "Pátio Norte",
  "Laboratório",
  "Expedição",
];

interface Deteccao {
  readonly esquerda: number;
  readonly topo: number;
  readonly largura: number;
  readonly altura: number;
  readonly acrescimo: number | null;
  readonly rotulo: string | null;
}

// A IA é um mock: as caixas são posições ilustrativas, não detecção real.
const DETECCOES: readonly Deteccao[] = [
  { esquerda: 9.4, topo: 42.1, largura: 33.6, altura: 43.3, acrescimo: 6, rotulo: null },
  { esquerda: 44.2, topo: 26.2, largura: 37.5, altura: 59, acrescimo: 3, rotulo: null },
  { esquerda: 79, topo: 60, largura: 17.7, altura: 27.4, acrescimo: null, rotulo: "umidade" },
];

function lerArquivo(arquivo: File, aoLer: (base64: string) => void): void {
  const leitor = new FileReader();
  leitor.onload = () => {
    if (typeof leitor.result === "string") aoLer(leitor.result);
  };
  leitor.readAsDataURL(arquivo);
}

export default function Registrar(): ReactNode {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [estado, despachar] = useReducer(
    redutor,
    usuario?.unidade ?? "Frigorífico — Setor B2",
    estadoInicial,
  );
  const [arrastando, setArrastando] = useState<boolean>(false);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const inputCamera = useRef<HTMLInputElement | null>(null);

  function selecionarFoto(evento: ChangeEvent<HTMLInputElement>): void {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    lerArquivo(arquivo, (foto) => despachar({ tipo: "definir_foto", foto }));
    evento.target.value = "";
  }

  function soltarFoto(evento: DragEvent<HTMLDivElement>): void {
    evento.preventDefault();
    setArrastando(false);
    const arquivo = evento.dataTransfer.files?.[0];
    if (!arquivo || !arquivo.type.startsWith("image/")) return;
    lerArquivo(arquivo, (foto) => despachar({ tipo: "definir_foto", foto }));
  }

  function trocarFoto(): void {
    despachar({ tipo: "editar_novamente" });
    inputArquivo.current?.click();
  }

  async function analisar(): Promise<void> {
    const descricaoInformada = estado.descricao.trim().length > 0;
    const validacao = combinar({
      foto: validarFoto(estado.fotoBase64),
      descricao: descricaoInformada ? validarDescricao(estado.descricao) : null,
      setor: validarObrigatorio(estado.setor, "o setor", 80),
    });
    if (!validacao.valido) {
      despachar({ tipo: "definir_erros", erros: validacao.erros });
      return;
    }
    despachar({ tipo: "iniciar_envio" });
    try {
      const criada = await criarOcorrencia({
        descricao: descricaoInformada
          ? estado.descricao
          : `Resíduo registrado em ${estado.setor}`,
        prioridade: estado.prioridade,
        autorNome: usuario?.nome ?? "Equipe",
        localizacao: { setor: estado.setor, unidade: usuario?.unidade ?? "-" },
        fotoBase64: estado.fotoBase64 ?? "",
      });
      if (!criada.classificacao) throw new Error("Análise vazia.");
      despachar({
        tipo: "envio_sucesso",
        classificacao: criada.classificacao,
        codigo: criada.codigo,
      });
    } catch (excecao) {
      despachar({
        tipo: "envio_erro",
        mensagem:
          excecao instanceof Error ? excecao.message : "Falha ao analisar.",
      });
    }
  }

  if (estado.etapa === "sucesso") {
    return (
      <div className="registrar__sucesso">
        <span className="registrar__sucesso-icone" aria-hidden="true">
          <Icone nome="check" tamanho={28} />
        </span>
        <h2>Relatório gerado!</h2>
        <p>
          A ocorrência <strong>{estado.codigoGerado}</strong> foi registrada.
        </p>
        <div className="registrar__sucesso-acoes">
          <Button
            variante="secundario"
            onClick={() =>
              despachar({
                tipo: "reiniciar",
                setor: usuario?.unidade ?? "Frigorífico — Setor B2",
              })
            }
          >
            Registrar outra
          </Button>
          <Button variante="primario" onClick={() => navegar("/ocorrencias")}>
            Ver ocorrências
          </Button>
        </div>
      </div>
    );
  }

  const emAnalise = estado.etapa === "analise";
  const concluida = emAnalise && estado.classificacao !== null;
  const analisando = emAnalise && estado.classificacao === null;
  const passo = estado.etapa === "detalhes" ? 1 : 2;
  const rotuloPrioridade =
    PRIORIDADES.find((p) => p.valor === estado.prioridade)?.rotulo ?? "";
  const confiancaPct = estado.classificacao
    ? Math.round(estado.classificacao.confianca * 100)
    : 0;
  const materialRotulo = estado.classificacao
    ? METADADOS_MATERIAL[estado.classificacao.material].rotulo
    : "";

  return (
    <div className="registrar">
      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={selecionarFoto}
      />
      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={selecionarFoto}
      />

      <div
        className="registrar__progresso"
        role="progressbar"
        aria-valuenow={passo * 50}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Passo ${passo} de 2`}
      >
        <span className="registrar__etapa registrar__etapa--cheia" />
        <span
          className={
            passo === 2
              ? "registrar__etapa registrar__etapa--cheia"
              : "registrar__etapa"
          }
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {analisando ? "A IA está analisando a foto." : null}
        {concluida ? "Análise concluída." : null}
      </p>

      {estado.erroEnvio ? (
        <Alerta variante="erro" titulo="Falha na análise">
          {estado.erroEnvio}
        </Alerta>
      ) : null}

      <div className="registrar__linha">
        <div
          className={
            arrastando
              ? "registrar__foto registrar__foto--arrastando"
              : "registrar__foto"
          }
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
                  <Icone nome={concluida ? "check" : "brilho"} tamanho={12} />
                  {concluida ? "Análise concluída" : "Analisando…"}
                </span>
              ) : null}
              <button
                type="button"
                className="registrar__trocar"
                onClick={trocarFoto}
              >
                <Icone nome="galeria" tamanho={15} />
                Trocar
              </button>
              {concluida && estado.classificacao
                ? DETECCOES.map((d) => (
                    <span
                      key={`${d.esquerda}-${d.topo}`}
                      className="registrar__deteccao"
                      aria-hidden="true"
                      style={{
                        left: `${d.esquerda}%`,
                        top: `${d.topo}%`,
                        width: `${d.largura}%`,
                        height: `${d.altura}%`,
                      }}
                    >
                      <span className="registrar__deteccao-rotulo">
                        {d.rotulo ??
                          `${materialRotulo.toLowerCase()} · ${Math.min(
                            99,
                            confiancaPct + (d.acrescimo ?? 0),
                          )}%`}
                      </span>
                    </span>
                  ))
                : null}
            </>
          ) : (
            <div className="registrar__foto-vazio">
              <span className="registrar__foto-icone" aria-hidden="true">
                <Icone nome="camera" tamanho={30} />
              </span>
              <p className="registrar__foto-titulo">
                Arraste a foto do resíduo aqui
              </p>
              <p className="registrar__foto-desc">
                ou escolha um arquivo · a IA identifica tipo, contaminação e
                quantidade
              </p>
              <div className="registrar__foto-botoes">
                <button
                  type="button"
                  className="registrar__botao registrar__botao--primario"
                  onClick={() => inputArquivo.current?.click()}
                >
                  <Icone nome="upload" tamanho={16} /> Enviar foto
                </button>
                <button
                  type="button"
                  className="registrar__botao registrar__botao--suave"
                  onClick={() => inputCamera.current?.click()}
                >
                  <Icone nome="camera" tamanho={16} /> Usar câmera
                </button>
              </div>
              {estado.erroCampo.foto ? (
                <p role="alert" className="registrar__erro-campo">
                  {estado.erroCampo.foto}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {estado.etapa === "detalhes" ? (
          <section className="registrar__painel" aria-labelledby="reg-titulo">
            <h2 id="reg-titulo" className="registrar__painel-titulo">
              Detalhes da ocorrência
            </h2>

            <div className="registrar__campo">
              <label htmlFor="reg-desc" className="registrar__rotulo">
                Descrição <span className="registrar__opcional">· opcional</span>
              </label>
              <textarea
                id="reg-desc"
                className={
                  estado.erroCampo.descricao
                    ? "registrar__textarea registrar__textarea--erro"
                    : "registrar__textarea"
                }
                placeholder="Ex.: caixas de papelão molhadas ao lado da câmara fria"
                value={estado.descricao}
                onChange={(e) =>
                  despachar({
                    tipo: "definir_descricao",
                    descricao: e.target.value,
                  })
                }
                aria-invalid={Boolean(estado.erroCampo.descricao) || undefined}
                aria-describedby={
                  estado.erroCampo.descricao ? "reg-desc-erro" : undefined
                }
              />
              {estado.erroCampo.descricao ? (
                <p id="reg-desc-erro" role="alert" className="registrar__erro-campo">
                  {estado.erroCampo.descricao}
                </p>
              ) : null}
            </div>

            <div className="registrar__campo">
              <label htmlFor="reg-setor" className="registrar__rotulo">
                Onde está?
              </label>
              <div className="registrar__select">
                <Icone nome="pin" tamanho={17} />
                <select
                  id="reg-setor"
                  value={estado.setor}
                  onChange={(e) =>
                    despachar({ tipo: "definir_setor", setor: e.target.value })
                  }
                >
                  {SETORES.includes(estado.setor) ? null : (
                    <option value={estado.setor}>{estado.setor}</option>
                  )}
                  {SETORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Icone nome="seta-baixo" tamanho={14} />
              </div>
            </div>

            <fieldset className="registrar__campo registrar__prioridades">
              <legend className="registrar__rotulo">Prioridade</legend>
              <div className="registrar__prio-grid">
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    className={
                      estado.prioridade === p.valor
                        ? `registrar__prio registrar__prio--${p.valor} registrar__prio--ativa`
                        : `registrar__prio registrar__prio--${p.valor}`
                    }
                    onClick={() =>
                      despachar({
                        tipo: "definir_prioridade",
                        prioridade: p.valor,
                      })
                    }
                    aria-pressed={estado.prioridade === p.valor}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="registrar__toggle-linha">
              <div>
                <p className="registrar__toggle-titulo">
                  Avisar quem cuida do descarte
                </p>
                <p className="registrar__toggle-sub">
                  A pessoa recebe assim que a análise concluir.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={estado.avisarResponsavel}
                onClick={() => despachar({ tipo: "alternar_avisar" })}
                className={
                  estado.avisarResponsavel
                    ? "registrar__toggle registrar__toggle--on"
                    : "registrar__toggle"
                }
                aria-label="Avisar quem cuida do descarte"
              >
                <span className="registrar__toggle-bolinha" />
              </button>
            </div>

            <div className="registrar__analisar">
              <button
                type="button"
                className="registrar__botao registrar__botao--primario registrar__botao--largo"
                onClick={analisar}
                disabled={!estado.fotoBase64}
              >
                <Icone nome="brilho" tamanho={16} /> Analisar com IA
              </button>
              {estado.fotoBase64 ? null : (
                <p className="registrar__dica">
                  Adicione uma foto pra liberar a análise
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="registrar__painel" aria-labelledby="reg-titulo">
            <div className="registrar__painel-topo">
              <h2 id="reg-titulo" className="registrar__painel-titulo">
                O que a IA encontrou
              </h2>
              {concluida ? (
                <span
                  className={`registrar__chip-prio registrar__chip-prio--${estado.prioridade}`}
                >
                  {rotuloPrioridade.toUpperCase()}
                </span>
              ) : null}
            </div>

            <div
              className={
                analisando
                  ? "registrar__ia-grid registrar__ia-grid--carregando"
                  : "registrar__ia-grid"
              }
            >
              <div className="registrar__ia-card" data-cor="papelao">
                <p className="registrar__ia-rotulo">Tipo</p>
                {concluida ? (
                  <p className="registrar__ia-valor">{materialRotulo}</p>
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="vidro">
                <p className="registrar__ia-rotulo">Contaminação</p>
                {concluida ? (
                  <p className="registrar__ia-valor">Baixa</p>
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="plastico">
                <p className="registrar__ia-rotulo">Quantidade</p>
                {concluida ? (
                  <p className="registrar__ia-valor">≈ 38 kg</p>
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="metal">
                <p className="registrar__ia-rotulo">Caixas</p>
                {concluida ? (
                  <p className="registrar__ia-valor">11 un.</p>
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
            </div>

            {analisando ? (
              <div className="registrar__olhando">
                <img
                  src={mascoteCompleto}
                  alt=""
                  width={118}
                  height={179}
                  className="registrar__olhando-mascote"
                />
                <p>O VOLTA está olhando a foto com atenção…</p>
              </div>
            ) : null}

            {concluida && estado.classificacao ? (
              <>
                <div className="registrar__confianca">
                  <span>Confiança da IA</span>
                  <div className="registrar__confianca-barra">
                    <span
                      style={{ width: `${estado.classificacao.confianca * 100}%` }}
                    />
                  </div>
                  <strong>
                    {formatarPorcentagem(estado.classificacao.confianca)}
                  </strong>
                </div>

                <div className="registrar__recomenda">
                  <img
                    src={mascoteCompleto}
                    alt=""
                    width={84}
                    height={127}
                    className="registrar__recomenda-mascote"
                  />
                  <div>
                    <p className="registrar__recomenda-titulo">
                      <Icone nome="brilho" tamanho={14} /> VOLTA recomenda
                    </p>
                    <p className="registrar__recomenda-texto">
                      {estado.classificacao.recomendacao}
                    </p>
                  </div>
                </div>

                <div className="registrar__acoes">
                  <button
                    type="button"
                    className="registrar__botao registrar__botao--primario registrar__botao--largo"
                    onClick={() => despachar({ tipo: "confirmar" })}
                  >
                    Confirmar e registrar
                  </button>
                  <button
                    type="button"
                    className="registrar__botao registrar__botao--contorno"
                    onClick={() => despachar({ tipo: "editar_novamente" })}
                  >
                    Editar dados
                  </button>
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
