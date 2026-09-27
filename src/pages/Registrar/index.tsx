import { useReducer, useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import { Spinner } from "../../components/Spinner";
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
  { valor: "baixa", rotulo: "Baixa" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
];

const SETORES: readonly string[] = [
  "Frigorífico — Setor B2",
  "Embalagens B",
  "Caldeira",
  "Pátio Norte",
  "Laboratório",
  "Expedição",
];

export default function Registrar(): ReactNode {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [estado, despachar] = useReducer(
    redutor,
    usuario?.unidade ?? "Frigorífico — Setor B2",
    estadoInicial,
  );
  const inputArquivo = useRef<HTMLInputElement | null>(null);

  function selecionarFoto(evento: ChangeEvent<HTMLInputElement>): void {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      despachar({ tipo: "definir_foto", foto: null });
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const res = leitor.result;
      if (typeof res === "string") {
        despachar({ tipo: "definir_foto", foto: res });
      }
    };
    leitor.readAsDataURL(arquivo);
  }

  async function analisar(): Promise<void> {
    const validacao = combinar({
      foto: validarFoto(estado.fotoBase64),
      descricao: validarDescricao(estado.descricao),
      setor: validarObrigatorio(estado.setor, "o setor", 80),
    });
    if (!validacao.valido) {
      despachar({ tipo: "definir_erros", erros: validacao.erros });
      return;
    }
    despachar({ tipo: "iniciar_envio" });
    try {
      const criada = await criarOcorrencia({
        descricao: estado.descricao,
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

  const progresso =
    estado.etapa === "detalhes"
      ? 50
      : estado.etapa === "analise" && estado.classificacao
        ? 100
        : 90;

  if (estado.etapa === "sucesso") {
    return (
      <div className="registrar__sucesso card">
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

  return (
    <div className="registrar">
      <div
        className="registrar__progresso"
        role="progressbar"
        aria-valuenow={progresso}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Passo ${estado.etapa === "detalhes" ? 1 : 2} de 2`}
      >
        <span
          className="registrar__progresso-barra"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {estado.erroEnvio ? (
        <Alerta variante="erro" titulo="Falha na análise">
          {estado.erroEnvio}
        </Alerta>
      ) : null}

      {estado.etapa === "detalhes" ? (
        <div className="registrar__linha">
          <div className="registrar__foto card">
            <input
              ref={inputArquivo}
              type="file"
              accept="image/*"
              capture="environment"
              className="registrar__foto-input"
              onChange={selecionarFoto}
              aria-label="Selecionar foto do resíduo"
            />
            {estado.fotoBase64 ? (
              <img
                src={estado.fotoBase64}
                alt="Foto anexada do resíduo"
                className="registrar__foto-preview"
              />
            ) : (
              <div className="registrar__foto-vazio">
                <span className="registrar__foto-icone" aria-hidden="true">
                  <Icone nome="camera" tamanho={32} />
                </span>
                <p className="registrar__foto-titulo">
                  Tire ou envie uma foto do resíduo
                </p>
                <p className="registrar__foto-desc">
                  A IA identifica o tipo, a contaminação e a quantidade
                  estimada.
                </p>
              </div>
            )}
            <div className="registrar__foto-botoes">
              <button
                type="button"
                className="registrar__botao registrar__botao--primario"
                onClick={() => inputArquivo.current?.click()}
              >
                <Icone nome="camera" tamanho={16} /> Câmera
              </button>
              <button
                type="button"
                className="registrar__botao registrar__botao--outline"
                onClick={() => inputArquivo.current?.click()}
              >
                Galeria
              </button>
            </div>
            {estado.erroCampo.foto ? (
              <p role="alert" className="registrar__erro-campo">
                {estado.erroCampo.foto}
              </p>
            ) : null}
          </div>

          <div className="registrar__campos">
            <div className="campo">
              <label htmlFor="reg-desc" className="campo__rotulo">
                Descrição da ocorrência
              </label>
              <textarea
                id="reg-desc"
                className={
                  estado.erroCampo.descricao
                    ? "campo__textarea campo__textarea--erro"
                    : "campo__textarea"
                }
                placeholder="Ex.: caixas de papelão molhadas acumuladas ao lado da câmara fria, cerca de dez unidades..."
                value={estado.descricao}
                onChange={(e) =>
                  despachar({
                    tipo: "definir_descricao",
                    descricao: e.target.value,
                  })
                }
                aria-describedby={
                  estado.erroCampo.descricao ? "reg-desc-erro" : undefined
                }
              />
              {estado.erroCampo.descricao ? (
                <p id="reg-desc-erro" role="alert" className="campo__erro">
                  {estado.erroCampo.descricao}
                </p>
              ) : null}
            </div>

            <div className="campo">
              <label htmlFor="reg-setor" className="campo__rotulo">
                Onde está?
              </label>
              <div className="registrar__select">
                <Icone nome="pin" tamanho={16} />
                <select
                  id="reg-setor"
                  value={estado.setor}
                  onChange={(e) =>
                    despachar({ tipo: "definir_setor", setor: e.target.value })
                  }
                >
                  {SETORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Icone nome="seta-baixo" tamanho={14} />
              </div>
            </div>

            <fieldset className="registrar__prioridades">
              <legend className="campo__rotulo">Prioridade estimada</legend>
              <div className="registrar__prio-grid">
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    className={
                      estado.prioridade === p.valor
                        ? `registrar__prio registrar__prio--${p.valor} registrar__prio--ativa`
                        : "registrar__prio"
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
                  A pessoa recebe o aviso assim que a análise concluir.
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
                aria-label={
                  estado.avisarResponsavel
                    ? "Desativar aviso"
                    : "Ativar aviso"
                }
              >
                <span className="registrar__toggle-bolinha" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {estado.etapa === "analise" ? (
        <div className="registrar__linha">
          <div className="registrar__foto card registrar__foto--verde">
            <span className="registrar__foto-badge">
              <Icone nome="check" tamanho={12} /> Análise concluída
            </span>
            <div className="registrar__foto-icone-grande" aria-hidden="true">
              <Icone nome="camera" tamanho={44} />
            </div>
            <p className="registrar__local-info">Local informado</p>
            <p className="registrar__local-valor">{estado.setor}</p>
          </div>

          <div className="registrar__ia card">
            <div className="registrar__ia-topo">
              <h3>O que a IA encontrou</h3>
              <span
                className={`chip registrar__prio-chip registrar__prio-chip--${estado.prioridade}`}
              >
                {PRIORIDADES.find((p) => p.valor === estado.prioridade)?.rotulo.toUpperCase()}
              </span>
            </div>
            {estado.classificacao ? (
              <>
                <div className="registrar__ia-grid">
                  <div className="registrar__ia-card" data-cor="papelao">
                    <p className="registrar__ia-rotulo">Tipo</p>
                    <p className="registrar__ia-valor">
                      {METADADOS_MATERIAL[estado.classificacao.material].rotulo}
                    </p>
                  </div>
                  <div className="registrar__ia-card" data-cor="vidro">
                    <p className="registrar__ia-rotulo">Contaminação</p>
                    <p className="registrar__ia-valor">Baixa</p>
                  </div>
                  <div className="registrar__ia-card" data-cor="plastico">
                    <p className="registrar__ia-rotulo">Quantidade</p>
                    <p className="registrar__ia-valor">≈ 38 kg</p>
                  </div>
                  <div className="registrar__ia-card" data-cor="metal">
                    <p className="registrar__ia-rotulo">Volume</p>
                    <p className="registrar__ia-valor">11 caixas</p>
                  </div>
                </div>

                <div className="registrar__ia-confianca">
                  <p>Confiança da IA</p>
                  <div className="registrar__ia-barra">
                    <span
                      style={{
                        width: `${estado.classificacao.confianca * 100}%`,
                      }}
                    />
                  </div>
                  <span className="registrar__ia-pct">
                    {formatarPorcentagem(estado.classificacao.confianca)}
                  </span>
                </div>

                <div className="registrar__ia-rec">
                  <div className="registrar__ia-rec-topo">
                    <Icone nome="check" tamanho={14} />
                    <strong>Recomendação</strong>
                  </div>
                  <p>{estado.classificacao.recomendacao}</p>
                </div>
              </>
            ) : (
              <div className="registrar__ia-load">
                <Spinner rotulo="A IA está analisando a foto…" />
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="registrar__acoes-rodape">
        {estado.etapa === "detalhes" ? (
          <Button
            variante="primario"
            larguraTotal
            onClick={analisar}
          >
            <Icone nome="mais" tamanho={16} /> Analisar com IA
          </Button>
        ) : (
          <>
            <Button
              variante="secundario"
              onClick={() => despachar({ tipo: "editar_novamente" })}
            >
              Editar dados
            </Button>
            <Button
              variante="primario"
              onClick={() => despachar({ tipo: "confirmar" })}
              disabled={!estado.classificacao}
            >
              Confirmar e gerar relatório
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
