import { useEffect, useReducer, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import { ModalCamera } from "../../components/ModalCamera";
import mascoteCompleto from "../../assets/mascote-completo.svg";
import { useAuth } from "../../context/AuthContext";
import { useAcoesOcorrencia } from "../../hooks/useAcoesOcorrencia";
import { useDadosReais } from "../../hooks/useModo";
import { useOpcoesDeTipo } from "../../hooks/useOpcoesDeTipo";
import { useSetores } from "../../hooks/useSetores";
import type {
  NivelContaminacao,
  OpcaoTipoResiduo,
} from "../../types/classificacao";
import { METADADOS_MATERIAL } from "../../types/material";
import { modoDaCamera } from "../../utils/camera";
import { DETECCOES, rotuloDeteccao } from "../../utils/deteccoes";
import { contaminacao } from "../../utils/analiseOcorrencia";
import { formatarConfianca, formatarPeso } from "../../utils/formatacao";
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

const SEM_SETORES: readonly string[] = [];
const SEM_OPCOES: readonly OpcaoTipoResiduo[] = [];

const NIVEIS_DE_CONTAMINACAO: readonly {
  readonly valor: NivelContaminacao;
  readonly rotulo: string;
}[] = [
  { valor: "baixa", rotulo: "Baixa" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
];

const LIMITE_DE_QUILOS = 100_000;

function lerArquivo(arquivo: File, aoLer: (base64: string) => void): void {
  const leitor = new FileReader();
  leitor.onload = () => {
    if (typeof leitor.result === "string") aoLer(leitor.result);
  };
  leitor.readAsDataURL(arquivo);
}

export default function Registrar(): ReactNode {
  const { usuario } = useAuth();
  const acoes = useAcoesOcorrencia();
  const { dados: setoresCarregados, erro: erroSetores } = useSetores();
  const setores = setoresCarregados ?? SEM_SETORES;
  const { dados: opcoesCarregadas } = useOpcoesDeTipo();
  const opcoesDeTipo = opcoesCarregadas ?? SEM_OPCOES;
  const dadosReais = useDadosReais();
  const navegar = useNavigate();
  const [estado, despachar] = useReducer(
    redutor,
    usuario?.unidade ?? "Frigorífico — Setor B2",
    estadoInicial,
  );
  const setorInicial = useRef<string>(estado.setor);

  // O setor sugerido no início pode não existir na empresa; troca pelo primeiro cadastrado.
  useEffect(() => {
    if (setores.length === 0) return;
    if (estado.setor === setorInicial.current && !setores.includes(estado.setor)) {
      despachar({ tipo: "definir_setor", setor: setores[0] });
    }
  }, [setores, estado.setor]);
  const [arrastando, setArrastando] = useState<boolean>(false);
  const [cameraAberta, setCameraAberta] = useState<boolean>(false);
  const [modoCamera] = useState(modoDaCamera);
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

  function usarCamera(): void {
    if (modoCamera === "navegador") setCameraAberta(true);
    else inputCamera.current?.click();
  }

  function trocarFoto(): void {
    despachar({ tipo: "voltar_aos_detalhes" });
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
    despachar({ tipo: "iniciar_analise" });
    try {
      const classificacao = await acoes.analisar(estado.fotoBase64 ?? "");
      despachar({ tipo: "analise_pronta", classificacao });
    } catch (excecao) {
      despachar({
        tipo: "analise_erro",
        mensagem:
          excecao instanceof Error ? excecao.message : "Falha ao analisar.",
      });
    }
  }

  /** Só aqui a ocorrência é criada: já com a foto enviada e com o que a pessoa corrigiu. */
  async function registrar(): Promise<void> {
    if (!estado.classificacao) return;
    despachar({ tipo: "iniciar_registro" });
    try {
      const criada = await acoes.criar({
        descricao:
          estado.descricao.trim().length > 0
            ? estado.descricao
            : `Resíduo registrado em ${estado.setor}`,
        prioridade: estado.prioridade,
        autorNome: usuario?.nome ?? "Equipe",
        localizacao: { setor: estado.setor, unidade: usuario?.unidade ?? "-" },
        fotoBase64: estado.fotoBase64 ?? "",
        classificacao: estado.classificacao,
      });
      despachar({
        tipo: "registro_ok",
        codigo: criada.codigo,
        // No mock a foto nunca sai do navegador; na API, "data:" quer dizer que o envio falhou.
        fotoGuardada: !dadosReais || !criada.fotoUrl.startsWith("data:"),
      });
    } catch (excecao) {
      despachar({
        tipo: "registro_erro",
        mensagem:
          excecao instanceof Error ? excecao.message : "Falha ao registrar.",
      });
    }
  }

  function escolherTipo(valor: string): void {
    const opcao = opcoesDeTipo.find((item) => item.valor === valor);
    if (!opcao) return;
    despachar({
      tipo: "ajustar_analise",
      ajuste: {
        tipoResiduoId: opcao.valor,
        material: opcao.material,
        tipoDetectado: opcao.rotulo,
      },
    });
  }

  function digitarQuantidade(texto: string): void {
    if (texto === "") {
      despachar({ tipo: "ajustar_analise", ajuste: { pesoEstimadoKg: null } });
      return;
    }
    const quilos = Number(texto);
    if (Number.isFinite(quilos) && quilos >= 0 && quilos <= LIMITE_DE_QUILOS) {
      despachar({ tipo: "ajustar_analise", ajuste: { pesoEstimadoKg: quilos } });
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
        {estado.fotoGuardada ? null : (
          <Alerta variante="info" titulo="A foto não foi guardada">
            O serviço de imagens não respondeu, então a ocorrência ficou sem foto
            para as outras pessoas. Neste navegador ela aparece até você
            recarregar a página.
          </Alerta>
        )}
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
  const confianca = estado.classificacao?.confianca ?? null;
  const confiancaPct = Math.round((confianca ?? 0) * 100);
  const materialRotulo = estado.classificacao?.material
    ? METADADOS_MATERIAL[estado.classificacao.material].rotulo
    : "";
  const tipoRotulo = estado.classificacao?.tipoDetectado ?? materialRotulo;
  const unidades = estado.classificacao?.unidades ?? null;
  const valorDoTipo =
    estado.classificacao?.tipoResiduoId ??
    opcoesDeTipo.find(
      (item) =>
        item.material !== null && item.material === estado.classificacao?.material,
    )?.valor ??
    "";
  const nivelDeContaminacao = estado.classificacao?.contaminacao ?? "";
  const quilos = estado.classificacao?.pesoEstimadoKg ?? null;

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

      <ModalCamera
        aberto={cameraAberta}
        onFechar={() => setCameraAberta(false)}
        onCapturar={(foto) => {
          despachar({ tipo: "definir_foto", foto });
          setCameraAberta(false);
        }}
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

      {erroSetores ? (
        <Alerta variante="erro" titulo="Não foi possível carregar os setores">
          {erroSetores}
        </Alerta>
      ) : null}
      {estado.erroEnvio ? (
        <Alerta
          variante="erro"
          titulo={
            estado.etapa === "detalhes"
              ? "Não foi possível analisar a foto"
              : "Não foi possível registrar"
          }
        >
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
              {concluida && estado.classificacao && confianca !== null
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
                        {rotuloDeteccao(d, materialRotulo, confiancaPct)}
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
                {modoCamera === null ? null : (
                  <button
                    type="button"
                    className="registrar__botao registrar__botao--suave"
                    onClick={usarCamera}
                  >
                    <Icone nome="camera" tamanho={16} /> Usar câmera
                  </button>
                )}
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
                <Icone nome="pin" tamanho={18} />
                <select
                  id="reg-setor"
                  value={estado.setor}
                  onChange={(e) =>
                    despachar({ tipo: "definir_setor", setor: e.target.value })
                  }
                >
                  {setores.includes(estado.setor) ? null : (
                    <option value={estado.setor}>{estado.setor}</option>
                  )}
                  {setores.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Icone nome="seta-baixo" tamanho={18} />
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
              {estado.classificacao ? (
                <button
                  type="button"
                  className="registrar__botao registrar__botao--contorno registrar__botao--largo"
                  onClick={() => despachar({ tipo: "voltar_a_analise" })}
                >
                  Voltar à análise
                </button>
              ) : null}
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
                  estado.editando ? (
                    <select
                      aria-label="Tipo de resíduo"
                      className="registrar__ia-campo"
                      value={valorDoTipo}
                      onChange={(e) => escolherTipo(e.target.value)}
                    >
                      {valorDoTipo === "" ? (
                        <option value="">{tipoRotulo || "Escolha o tipo"}</option>
                      ) : null}
                      {opcoesDeTipo.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="registrar__ia-valor">{tipoRotulo || "—"}</p>
                  )
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="vidro">
                <p className="registrar__ia-rotulo">Contaminação</p>
                {concluida ? (
                  estado.editando ? (
                    <select
                      aria-label="Nível de contaminação"
                      className="registrar__ia-campo"
                      value={nivelDeContaminacao}
                      onChange={(e) =>
                        despachar({
                          tipo: "ajustar_analise",
                          ajuste: {
                            contaminacao: (e.target.value || undefined) as
                              | NivelContaminacao
                              | undefined,
                          },
                        })
                      }
                    >
                      {nivelDeContaminacao === "" ? (
                        <option value="">Não informada</option>
                      ) : null}
                      {NIVEIS_DE_CONTAMINACAO.map((nivel) => (
                        <option key={nivel.valor} value={nivel.valor}>
                          {nivel.rotulo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="registrar__ia-valor">
                      {contaminacao(estado.classificacao)}
                    </p>
                  )
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="plastico">
                <p className="registrar__ia-rotulo">Quantidade</p>
                {concluida ? (
                  estado.editando ? (
                    <span className="registrar__ia-quilos">
                      <input
                        type="number"
                        min={0}
                        max={LIMITE_DE_QUILOS}
                        step="0.1"
                        inputMode="decimal"
                        aria-label="Quantidade em quilos"
                        className="registrar__ia-campo"
                        defaultValue={quilos ?? ""}
                        onChange={(e) => digitarQuantidade(e.target.value)}
                      />
                      <span aria-hidden="true">kg</span>
                    </span>
                  ) : (
                    <p className="registrar__ia-valor">{formatarPeso(quilos ?? 0)}</p>
                  )
                ) : (
                  <span className="registrar__ia-esqueleto" />
                )}
              </div>
              <div className="registrar__ia-card" data-cor="metal">
                <p className="registrar__ia-rotulo">
                  {unidades !== null ? "Caixas" : "Revisão"}
                </p>
                {concluida ? (
                  <p className="registrar__ia-valor">
                    {unidades !== null
                      ? `${unidades} un.`
                      : estado.classificacao?.exigeValidacao
                        ? "Pelo gestor"
                        : "—"}
                  </p>
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
                {confianca !== null ? (
                  <div className="registrar__confianca">
                    <span>Confiança da IA</span>
                    <div className="registrar__confianca-barra">
                      <span style={{ width: `${confianca * 100}%` }} />
                    </div>
                    <strong>{formatarConfianca(confianca)}</strong>
                  </div>
                ) : null}

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

                {estado.editando ? (
                  <p className="registrar__dica">
                    Corrija o que a IA errou e toque em Concluir edição.
                  </p>
                ) : null}

                <div className="registrar__acoes">
                  <button
                    type="button"
                    className="registrar__botao registrar__botao--primario registrar__botao--largo"
                    onClick={registrar}
                    disabled={estado.registrando}
                  >
                    {estado.registrando ? "Registrando…" : "Confirmar e registrar"}
                  </button>
                  <button
                    type="button"
                    className="registrar__botao registrar__botao--contorno"
                    aria-pressed={estado.editando}
                    onClick={() => despachar({ tipo: "alternar_edicao" })}
                    disabled={estado.registrando}
                  >
                    {estado.editando ? "Concluir edição" : "Editar dados"}
                  </button>
                </div>
                <button
                  type="button"
                  className="registrar__link"
                  onClick={() => despachar({ tipo: "voltar_aos_detalhes" })}
                  disabled={estado.registrando}
                >
                  Mudar descrição, setor ou prioridade
                </button>
              </>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
