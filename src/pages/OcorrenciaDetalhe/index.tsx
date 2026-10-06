import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import mascoteCompleto from "../../assets/mascote-completo.svg";
import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { Spinner } from "../../components/Spinner";
import { useOcorrencia } from "../../hooks/useOcorrencia";
import { METADADOS_MATERIAL } from "../../types/material";
import type { Ocorrencia, TipoEvento } from "../../types/ocorrencia";
import {
  contaminacao,
  recomendacaoVolta,
  relatorioAutomatico,
} from "../../utils/analiseOcorrencia";
import { DETECCOES, rotuloDeteccao } from "../../utils/deteccoes";
import { formatarPorcentagem, formatarRegistro } from "../../utils/formatacao";
import {
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  aguardaAprovacao,
  categoriaDe,
} from "../../utils/statusOcorrencia";
import "./styles.css";

type EstadoPasso = "feito" | "pendente" | "recusado";

const ICONE_EVENTO: Readonly<
  Record<TipoEvento, { readonly icone: NomeIcone; readonly tom: string }>
> = {
  registro: { icone: "camera", tom: "verde" },
  ia: { icone: "brilho", tom: "azul" },
  classificacao: { icone: "editar", tom: "ambar" },
  encaminhamento: { icone: "seta-direita", tom: "azul" },
  observacao: { icone: "mais", tom: "roxo" },
  aprovacao: { icone: "check", tom: "verde" },
  recusa: { icone: "fechar", tom: "rosa" },
};

function passosDe(ocorrencia: Ocorrencia): readonly {
  readonly rotulo: string;
  readonly estado: EstadoPasso;
}[] {
  const categoria = categoriaDe(ocorrencia.status);
  const terceiro: EstadoPasso =
    categoria === "aguardando"
      ? "pendente"
      : categoria === "recusadas"
        ? "recusado"
        : "feito";
  return [
    { rotulo: "Registrada", estado: "feito" },
    { rotulo: "Análise IA", estado: "feito" },
    {
      rotulo: categoria === "recusadas" ? "Recusada" : "Aprovação",
      estado: terceiro,
    },
  ];
}

export default function OcorrenciaDetalhe(): ReactNode {
  const { id } = useParams();
  const { dados, carregando, erro } = useOcorrencia(id);

  if (carregando) return <Spinner rotulo="Carregando ocorrência…" />;

  if (erro || !dados) {
    return (
      <Alerta variante="erro" titulo="Não conseguimos abrir">
        {erro ?? "Não encontramos essa ocorrência."}
      </Alerta>
    );
  }

  const ocorrencia = dados;
  const categoria = categoriaDe(ocorrencia.status);
  const confianca = ocorrencia.classificacao?.confianca ?? 0;
  const material = ocorrencia.material
    ? METADADOS_MATERIAL[ocorrencia.material].rotulo
    : null;
  const tipo = `${material ?? ocorrencia.titulo} (Classe ${ocorrencia.qualidade})`;
  const decidida = !aguardaAprovacao(ocorrencia.status);

  return (
    <div className="detalhe">
      <Link to="/ocorrencias" className="detalhe__voltar">
        <Icone nome="seta-esquerda" tamanho={14} />
        Voltar pra lista
      </Link>

      <div className="detalhe__grade">
        <div className="detalhe__coluna">
          <section className="detalhe__cartao" aria-label="Andamento">
            <div className="detalhe__topo">
              <p className="detalhe__registro">
                Registrada por <strong>{ocorrencia.criadaPorNome}</strong> ·{" "}
                {formatarRegistro(ocorrencia.criadaEm)}
              </p>
              <span
                className={`detalhe__pill detalhe__status--${categoria}`}
              >
                {ROTULO_CATEGORIA[categoria]}
              </span>
            </div>

            <ol className="detalhe__passos" aria-label="Etapas da ocorrência">
              {passosDe(ocorrencia).flatMap((passo, i, todos) => {
                const no = (
                  <li
                    key={passo.rotulo}
                    className={`detalhe__passo detalhe__passo--${passo.estado}`}
                  >
                    <span className="detalhe__bolinha" aria-hidden="true">
                      {passo.estado === "feito" ? (
                        <Icone nome="check" tamanho={14} />
                      ) : passo.estado === "recusado" ? (
                        <Icone nome="fechar" tamanho={14} />
                      ) : null}
                    </span>
                    <span className="detalhe__passo-rotulo">{passo.rotulo}</span>
                  </li>
                );
                if (i === todos.length - 1) return [no];
                return [
                  no,
                  <li
                    key={`${passo.rotulo}-linha`}
                    className={
                      todos[i + 1].estado === "pendente"
                        ? "detalhe__linha-passo"
                        : "detalhe__linha-passo detalhe__linha-passo--feita"
                    }
                    aria-hidden="true"
                  />,
                ];
              })}
            </ol>
          </section>

          <section className="detalhe__cartao detalhe__analise" aria-label="Análise da IA">
            <div className="detalhe__foto-coluna">
              <div className="detalhe__foto">
                <img
                  src={ocorrencia.fotoUrl}
                  alt={`Foto da ocorrência ${ocorrencia.titulo}`}
                />
                <span className="detalhe__selo">
                  <Icone nome="brilho" tamanho={12} />
                  Análise concluída
                </span>
                {DETECCOES.map((d) => (
                  <span
                    key={`${d.esquerda}-${d.topo}`}
                    className="detalhe__deteccao"
                    aria-hidden="true"
                    style={{
                      left: `${d.esquerda}%`,
                      top: `${d.topo}%`,
                      width: `${d.largura}%`,
                      height: `${d.altura}%`,
                    }}
                  >
                    <span className="detalhe__deteccao-rotulo">
                      {rotuloDeteccao(
                        d,
                        material ?? ocorrencia.titulo,
                        Math.round(confianca * 100),
                      )}
                    </span>
                  </span>
                ))}
              </div>
              <div className="detalhe__fatos">
                <div className="detalhe__fato">
                  <p>Local</p>
                  <strong>{ocorrencia.localizacao.setor}</strong>
                </div>
                <div className="detalhe__fato">
                  <p>Confiança da IA</p>
                  <strong>{formatarPorcentagem(confianca)}</strong>
                </div>
              </div>
            </div>

            <div className="detalhe__resultado">
              <h2 className="detalhe__titulo-secao">O que a IA encontrou</h2>
              <div className="detalhe__cards">
                <div className="detalhe__card detalhe__card--tipo">
                  <p>Tipo</p>
                  <strong>{tipo}</strong>
                </div>
                <div className="detalhe__card detalhe__card--contaminacao">
                  <p>Contaminação</p>
                  <strong>{contaminacao(confianca)}</strong>
                </div>
                <div className="detalhe__card detalhe__card--quantidade">
                  <p>Quantidade</p>
                  <strong>≈ {ocorrencia.pesoKg} kg</strong>
                </div>
                <div className="detalhe__card detalhe__card--prioridade">
                  <p>Prioridade</p>
                  <strong>
                    {ROTULO_PRIORIDADE[ocorrencia.prioridade].charAt(0) +
                      ROTULO_PRIORIDADE[ocorrencia.prioridade]
                        .slice(1)
                        .toLowerCase()}
                  </strong>
                </div>
              </div>
              <h3 className="detalhe__relatorio-titulo">Relatório automático</h3>
              <p className="detalhe__relatorio">
                {relatorioAutomatico(ocorrencia)}
              </p>
            </div>
          </section>

          <section className="detalhe__cartao" aria-labelledby="detalhe-historico">
            <div className="detalhe__historico-topo">
              <h2 id="detalhe-historico" className="detalhe__titulo-secao">
                Histórico
              </h2>
              <span className="detalhe__pill detalhe__pill--neutro">
                AUDITÁVEL
              </span>
            </div>
            <ul className="detalhe__eventos">
              {ocorrencia.historico.map((evento) => {
                const visual = ICONE_EVENTO[evento.tipo];
                return (
                  <li key={evento.id} className="detalhe__evento">
                    <span
                      className={`detalhe__evento-icone detalhe__tom--${visual.tom}`}
                      aria-hidden="true"
                    >
                      <Icone nome={visual.icone} tamanho={15} />
                    </span>
                    <div>
                      <p className="detalhe__evento-texto">
                        <strong>{evento.autor}</strong> {evento.texto}
                      </p>
                      <p className="detalhe__evento-tempo">
                        {evento.rotuloTempo ?? formatarRegistro(evento.em)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="detalhe__lateral" aria-label="Ações">
          <section className="detalhe__cartao" aria-labelledby="detalhe-acoes">
            <h2 id="detalhe-acoes" className="detalhe__titulo-secao">
              Ações do responsável
            </h2>

            <ul className="detalhe__acoes">
              <li>
                <button type="button" className="detalhe__acao">
                  <span className="detalhe__acao-icone detalhe__tom--ambar" aria-hidden="true">
                    <Icone nome="editar" tamanho={15} />
                  </span>
                  <span className="detalhe__acao-textos">
                    <strong>Alterar classificação</strong>
                    {ocorrencia.ultimaAlteracao ? (
                      <small>{ocorrencia.ultimaAlteracao}</small>
                    ) : null}
                  </span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
              <li>
                <button type="button" className="detalhe__acao">
                  <span className="detalhe__acao-icone detalhe__tom--azul" aria-hidden="true">
                    <Icone nome="seta-direita" tamanho={15} />
                  </span>
                  <span className="detalhe__acao-textos">
                    <strong>Encaminhar para outro setor</strong>
                    {ocorrencia.setorDestino ? (
                      <small>Encaminhada para {ocorrencia.setorDestino}</small>
                    ) : null}
                  </span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
              <li>
                <button type="button" className="detalhe__acao">
                  <span className="detalhe__acao-icone detalhe__tom--roxo" aria-hidden="true">
                    <Icone nome="mais" tamanho={15} />
                  </span>
                  <span className="detalhe__acao-textos">
                    <strong>Adicionar observação</strong>
                  </span>
                  <Icone nome="seta-direita" tamanho={14} />
                </button>
              </li>
            </ul>

            {decidida ? (
              <p className={`detalhe__decisao detalhe__decisao--${categoria}`}>
                {categoria === "aprovadas" ? (
                  <>
                    <Icone nome="check" tamanho={15} /> Aprovada e no PGRS do mês
                  </>
                ) : categoria === "encaminhadas" ? (
                  <>
                    <Icone nome="seta-direita" tamanho={15} /> Encaminhada para{" "}
                    {ocorrencia.setorDestino ?? "outro setor"}
                  </>
                ) : (
                  <>
                    <Icone nome="fechar" tamanho={15} /> Recusada
                    {ocorrencia.motivoRecusa
                      ? ` · ${ocorrencia.motivoRecusa}`
                      : ""}
                  </>
                )}
              </p>
            ) : (
              <div className="detalhe__decidir">
                <button type="button" className="detalhe__aprovar">
                  <Icone nome="check" tamanho={16} />
                  Aprovar ocorrência
                </button>
                <button type="button" className="detalhe__recusar">
                  <Icone nome="fechar" tamanho={15} />
                  Recusar
                </button>
              </div>
            )}
          </section>

          <section className="detalhe__recomenda" aria-label="Recomendação do VOLTA">
            <img
              src={mascoteCompleto}
              alt=""
              width={84}
              height={127}
              className="detalhe__recomenda-mascote"
            />
            <div>
              <p className="detalhe__recomenda-titulo">
                <Icone nome="brilho" tamanho={14} /> VOLTA recomenda
              </p>
              <p className="detalhe__recomenda-texto">
                {recomendacaoVolta(ocorrencia)}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
