import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { MaterialBadge } from "../../components/MaterialBadge";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import { StatusBadge } from "../../components/StatusBadge";
import { useCooperativas } from "../../hooks/useCooperativas";
import { useOcorrencia } from "../../hooks/useOcorrencia";
import { atualizarOcorrencia } from "../../services/ocorrencias";
import { MATERIAIS, METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import type { StatusOcorrencia } from "../../types/ocorrencia";
import {
  formatarDataHora,
  formatarPorcentagem,
} from "../../utils/formatacao";
import "./styles.css";

type AcaoAberta = "reclassificar" | "encaminhar" | null;

export default function OcorrenciaDetalhe(): ReactNode {
  const { id } = useParams();
  const navegar = useNavigate();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useOcorrencia(id, chaveRecarga);
  const {
    dados: cooperativas,
    carregando: carregandoCoops,
  } = useCooperativas();

  const [acaoAberta, setAcaoAberta] = useState<AcaoAberta>(null);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  if (!id) {
    return (
      <Alerta variante="erro" titulo="Rota inválida">
        Nenhum identificador de ocorrência foi informado.
      </Alerta>
    );
  }

  async function reclassificar(novoMaterial: Material): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarOcorrencia(dados.id, { material: novoMaterial });
      setMensagemSucesso(
        `Classificação atualizada para ${METADADOS_MATERIAL[novoMaterial].rotulo}.`,
      );
      setAcaoAberta(null);
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error
          ? excecao.message
          : "Falha ao atualizar classificação.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function encaminhar(cooperativaId: string): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarOcorrencia(dados.id, {
        cooperativaId,
        status: "encaminhada",
      });
      setMensagemSucesso("Ocorrência encaminhada à cooperativa parceira.");
      setAcaoAberta(null);
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error
          ? excecao.message
          : "Falha ao encaminhar.",
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
      setMensagemSucesso("Ocorrência finalizada.");
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível finalizar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <Spinner rotulo="Carregando ocorrência…" />;
  }

  if (erro || !dados) {
    return (
      <Alerta
        variante="erro"
        titulo="Não conseguimos abrir esta ocorrência"
        acao={
          <Button
            variante="sutil"
            onClick={() => setChaveRecarga((v) => v + 1)}
          >
            Tentar novamente
          </Button>
        }
      >
        {erro ?? "Ocorrência inexistente."}
      </Alerta>
    );
  }

  const cooperativaAtual =
    dados.cooperativaId && cooperativas
      ? cooperativas.find((c) => c.id === dados.cooperativaId) ?? null
      : null;

  const acoesDisponiveis: readonly StatusOcorrencia[] = [
    "classificada",
    "encaminhada",
  ];

  return (
    <section aria-labelledby="titulo-detalhe">
      <Link to="/ocorrencias" className="detalhe__voltar">
        ← Voltar para ocorrências
      </Link>

      <header className="detalhe__cabecalho">
        <div>
          <h1 id="titulo-detalhe">{dados.codigo}</h1>
          <p className="detalhe__descricao">{dados.descricao}</p>
        </div>
        <StatusBadge status={dados.status} />
      </header>

      {mensagemSucesso ? (
        <Alerta variante="sucesso">{mensagemSucesso}</Alerta>
      ) : null}
      {erroAcao ? <Alerta variante="erro">{erroAcao}</Alerta> : null}

      <div className="detalhe__conteudo">
        <img
          src={dados.fotoUrl}
          alt={`Foto do resíduo em ${dados.localizacao.setor}`}
          className="detalhe__foto"
        />

        <dl className="detalhe__meta">
          <div>
            <dt>Local</dt>
            <dd>
              {dados.localizacao.setor} — {dados.localizacao.unidade}
            </dd>
          </div>
          <div>
            <dt>Registrada em</dt>
            <dd>{formatarDataHora(dados.criadaEm)}</dd>
          </div>
          <div>
            <dt>Atualizada em</dt>
            <dd>{formatarDataHora(dados.atualizadaEm)}</dd>
          </div>
          <div>
            <dt>Cooperativa</dt>
            <dd>
              {cooperativaAtual ? (
                <Link
                  to={`/cooperativas/${cooperativaAtual.id}/chat`}
                >
                  {cooperativaAtual.nome}
                </Link>
              ) : (
                "Ainda não encaminhada"
              )}
            </dd>
          </div>
        </dl>

        <section
          aria-labelledby="titulo-classificacao"
          className="detalhe__ia card"
        >
          <h2 id="titulo-classificacao" className="detalhe__ia-titulo">
            Classificação da IA
          </h2>
          {dados.classificacao ? (
            <>
              <p className="detalhe__ia-linha">
                Material:{" "}
                {dados.material ? (
                  <MaterialBadge material={dados.material} />
                ) : (
                  "—"
                )}
              </p>
              <p className="detalhe__ia-linha">
                Confiança:{" "}
                <strong>
                  {formatarPorcentagem(dados.classificacao.confianca)}
                </strong>
              </p>
              <p className="detalhe__ia-linha">
                Recomendação: {dados.classificacao.recomendacao}
              </p>
              <p className="detalhe__ia-linha">
                Analisada em: {formatarDataHora(dados.classificacao.analisadaEm)}
              </p>
            </>
          ) : (
            <p>Ainda aguardando classificação.</p>
          )}
        </section>

        <div className="detalhe__acoes">
          <Button
            variante="secundario"
            onClick={() => setAcaoAberta("reclassificar")}
            disabled={!acoesDisponiveis.includes(dados.status)}
          >
            Alterar classificação
          </Button>
          <Button
            variante="secundario"
            onClick={() => setAcaoAberta("encaminhar")}
            disabled={dados.status === "finalizada"}
          >
            Encaminhar cooperativa
          </Button>
          <Button
            variante="primario"
            onClick={finalizar}
            carregando={salvando}
            disabled={dados.status === "finalizada"}
          >
            Finalizar ocorrência
          </Button>
        </div>
      </div>

      <Modal
        aberto={acaoAberta === "reclassificar"}
        onFechar={() => setAcaoAberta(null)}
        titulo="Corrigir classificação"
      >
        <p>Escolha o material correto:</p>
        <ul className="detalhe__opcoes-material">
          {MATERIAIS.map((material) => (
            <li key={material}>
              <button
                type="button"
                className="detalhe__opcao-material"
                onClick={() => reclassificar(material)}
                disabled={salvando}
              >
                <MaterialBadge material={material} />
                <span>{METADADOS_MATERIAL[material].rotulo}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        aberto={acaoAberta === "encaminhar"}
        onFechar={() => setAcaoAberta(null)}
        titulo="Escolher cooperativa parceira"
      >
        {carregandoCoops ? (
          <Spinner rotulo="Carregando cooperativas…" />
        ) : cooperativas && cooperativas.length > 0 ? (
          <ul className="detalhe__opcoes-coop">
            {cooperativas.map((cooperativa) => (
              <li key={cooperativa.id}>
                <button
                  type="button"
                  className="detalhe__opcao-coop"
                  onClick={() => encaminhar(cooperativa.id)}
                  disabled={salvando}
                >
                  <strong>{cooperativa.nome}</strong>
                  <span>
                    {cooperativa.cidade}/{cooperativa.estado} — {cooperativa.telefone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma cooperativa disponível.</p>
        )}
      </Modal>

      <button
        type="button"
        className="detalhe__link"
        onClick={() => navegar("/ocorrencias")}
      >
        Voltar à listagem
      </button>
    </section>
  );
}
