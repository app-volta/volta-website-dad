import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import { useCooperativas } from "../../hooks/useCooperativas";
import { useOcorrencia } from "../../hooks/useOcorrencia";
import { atualizarOcorrencia } from "../../services/ocorrencias";
import { MATERIAIS, METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import type { StatusOcorrencia } from "../../types/ocorrencia";
import { formatarDataHora } from "../../utils/formatacao";
import "./styles.css";

type Acao = "reclassificar" | "encaminhar" | null;

interface Passo {
  readonly chave: StatusOcorrencia | "coleta";
  readonly rotulo: string;
}

const PASSOS: readonly Passo[] = [
  { chave: "aguardando_classificacao", rotulo: "Registrada" },
  { chave: "classificada", rotulo: "Análise IA" },
  { chave: "encaminhada", rotulo: "Aprovação" },
  { chave: "coleta", rotulo: "Coleta" },
];

function iconePorMaterial(m: Material | null): NomeIcone {
  if (!m) return "chip";
  if (m === "papelao") return "papelao";
  if (m === "plastico") return "plastico";
  if (m === "metal") return "metal";
  return "vidro";
}

function passoAtivo(status: StatusOcorrencia): number {
  switch (status) {
    case "aguardando_classificacao":
      return 0;
    case "classificada":
      return 1;
    case "encaminhada":
      return 2;
    case "finalizada":
      return 3;
  }
}

export default function OcorrenciaDetalhe(): ReactNode {
  const { id } = useParams();
  const navegar = useNavigate();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useOcorrencia(id, chaveRecarga);
  const { dados: cooperativas } = useCooperativas();
  const [acao, setAcao] = useState<Acao>(null);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  if (!id) {
    return (
      <Alerta variante="erro" titulo="Rota inválida">
        Nenhum identificador foi informado.
      </Alerta>
    );
  }

  async function reclassificar(mat: Material): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarOcorrencia(dados.id, { material: mat });
      setMsgSucesso(
        `Reclassificado como ${METADADOS_MATERIAL[mat].rotulo}.`,
      );
      setAcao(null);
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao atualizar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function encaminhar(coopId: string): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarOcorrencia(dados.id, {
        cooperativaId: coopId,
        status: "encaminhada",
      });
      setMsgSucesso("Encaminhada com sucesso.");
      setAcao(null);
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao encaminhar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function finalizar(): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarOcorrencia(dados.id, { status: "finalizada" });
      setMsgSucesso("Ocorrência finalizada.");
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao finalizar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Spinner rotulo="Carregando ocorrência…" />;

  if (erro || !dados) {
    return (
      <Alerta variante="erro" titulo="Não conseguimos abrir">
        {erro ?? "Não encontramos essa ocorrência."}
      </Alerta>
    );
  }

  const ativo = passoAtivo(dados.status);
  const materialMeta = dados.material
    ? METADADOS_MATERIAL[dados.material]
    : null;

  return (
    <div className="detalhe">
      {msgSucesso ? (
        <Alerta variante="sucesso">{msgSucesso}</Alerta>
      ) : null}
      {erroAcao ? <Alerta variante="erro">{erroAcao}</Alerta> : null}

      <div className="detalhe__linha">
        <div className="detalhe__coluna">
          <div className="card detalhe__principal">
            <div className="detalhe__meta-topo">
              <p className="detalhe__meta-registro">
                Registrada por <strong>{dados.criadaPor}</strong> ·{" "}
                {formatarDataHora(dados.criadaEm)}
              </p>
              <span
                className={`chip detalhe__status detalhe__status--${dados.status}`}
              >
                {dados.status === "aguardando_classificacao"
                  ? "EM ANÁLISE"
                  : dados.status === "classificada"
                    ? "ABERTA"
                    : dados.status === "encaminhada"
                      ? "APROVADA"
                      : "COLETADA"}
              </span>
            </div>

            <ol className="detalhe__timeline" aria-label="Progresso">
              {PASSOS.map((p, idx) => {
                const feito = idx <= ativo;
                return (
                  <li
                    key={p.chave}
                    className={
                      feito
                        ? "detalhe__passo detalhe__passo--feito"
                        : "detalhe__passo"
                    }
                    aria-current={idx === ativo ? "step" : undefined}
                  >
                    <span className="detalhe__passo-bolinha">
                      {feito ? <Icone nome="check" tamanho={12} /> : null}
                    </span>
                    <span className="detalhe__passo-label">{p.rotulo}</span>
                  </li>
                );
              })}
            </ol>

            <div className="detalhe__resumo">
              <span
                className="detalhe__resumo-icone"
                data-material={dados.material ?? "papelao"}
                aria-hidden="true"
              >
                <Icone nome={iconePorMaterial(dados.material)} tamanho={22} />
              </span>
              <div>
                <p className="detalhe__resumo-titulo">
                  {materialMeta ? materialMeta.rotulo : "Sem tipo"} · molhado
                </p>
                <p className="detalhe__resumo-linha1">
                  Contaminação baixa · umidade superficial
                </p>
                <p className="detalhe__resumo-linha2">
                  ≈ 38 kg · 11 caixas · {dados.localizacao.setor}
                </p>
              </div>
            </div>

            <h4 className="detalhe__rel-titulo">Relatório automático</h4>
            <p className="detalhe__rel-texto">
              Material com umidade superficial, ainda reciclável. Recomenda-se
              remoção em até 24h e armazenamento em área coberta até a coleta
              pela cooperativa parceira. Não descartar como rejeito.
            </p>

            <div className="detalhe__campos">
              <div>
                <p className="detalhe__campo-label">Tipo</p>
                <p className="detalhe__campo-valor">
                  {materialMeta ? materialMeta.rotulo : "Sem tipo"} (Classe A)
                </p>
              </div>
              <div>
                <p className="detalhe__campo-label">Contaminação</p>
                <p className="detalhe__campo-valor">Baixa</p>
              </div>
              <div>
                <p className="detalhe__campo-label">Quantidade</p>
                <p className="detalhe__campo-valor">≈ 38 kg</p>
              </div>
              <div>
                <p className="detalhe__campo-label">Prioridade</p>
                <p className="detalhe__campo-valor">Alta</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="detalhe__acoes" aria-label="Ações do responsável">
          <div className="card">
            <h4 className="detalhe__acoes-titulo">Ações do responsável</h4>
            <ul className="detalhe__acoes-lista">
              <li>
                <button
                  type="button"
                  onClick={() => setAcao("reclassificar")}
                  className="detalhe__acao"
                >
                  <span className="detalhe__acao-icone" data-cor="papelao">
                    <Icone nome="editar" tamanho={16} />
                  </span>
                  <span>Alterar classificação</span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setAcao("encaminhar")}
                  className="detalhe__acao"
                >
                  <span className="detalhe__acao-icone" data-cor="plastico">
                    <Icone nome="seta-direita" tamanho={16} />
                  </span>
                  <span>Encaminhar para outro setor</span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
              <li>
                <button type="button" className="detalhe__acao">
                  <span className="detalhe__acao-icone" data-cor="metal">
                    <Icone nome="mais" tamanho={16} />
                  </span>
                  <span>Adicionar observação</span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={finalizar}
                  disabled={dados.status === "finalizada" || salvando}
                  className="detalhe__acao"
                >
                  <span className="detalhe__acao-icone" data-cor="vidro">
                    <Icone nome="check" tamanho={16} />
                  </span>
                  <span>Finalizar ocorrência</span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
            </ul>
          </div>
          <Button
            variante="primario"
            larguraTotal
            onClick={() => setAcao("encaminhar")}
            disabled={dados.status === "finalizada"}
          >
            Escolher cooperativa
          </Button>
          <Button variante="sutil" onClick={() => navegar("/ocorrencias")}>
            Voltar à listagem
          </Button>
        </aside>
      </div>

      <Modal
        aberto={acao === "reclassificar"}
        onFechar={() => setAcao(null)}
        titulo="Corrigir classificação"
      >
        <p>Escolha o material correto:</p>
        <ul className="detalhe__opcoes-material">
          {MATERIAIS.map((mat) => (
            <li key={mat}>
              <button
                type="button"
                className="detalhe__opcao-material"
                onClick={() => reclassificar(mat)}
                disabled={salvando}
              >
                <span
                  className="detalhe__opcao-icone"
                  data-material={mat}
                  aria-hidden="true"
                >
                  <Icone nome={iconePorMaterial(mat)} tamanho={18} />
                </span>
                <span>{METADADOS_MATERIAL[mat].rotulo}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        aberto={acao === "encaminhar"}
        onFechar={() => setAcao(null)}
        titulo="Escolher cooperativa parceira"
      >
        {cooperativas && cooperativas.length > 0 ? (
          <ul className="detalhe__opcoes-coop">
            {cooperativas.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="detalhe__opcao-coop"
                  onClick={() => encaminhar(c.id)}
                  disabled={salvando}
                >
                  <strong>{c.nome}</strong>
                  <span>
                    {c.cidade}/{c.estado} — {c.telefone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Spinner rotulo="Carregando cooperativas…" />
        )}
      </Modal>
    </div>
  );
}
