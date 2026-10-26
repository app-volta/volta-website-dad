import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { GraficoDonut } from "../../components/GraficoDonut";
import { GraficoLinha } from "../../components/GraficoLinha";
import { Icone } from "../../components/Icone";
import { KpiCard } from "../../components/KpiCard";
import { Mascote } from "../../components/Mascote";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useAcoesOcorrencia } from "../../hooks/useAcoesOcorrencia";
import { useMetaRecuperacao } from "../../hooks/useConfiguracoes";
import { useDicaVolta, useInsightVolta } from "../../hooks/useInsights";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { usePainel } from "../../hooks/usePainel";
import type { Material } from "../../types/material";
import { METADADOS_MATERIAL } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import { iniciais } from "../../utils/pessoa";
import { tempoRelativo } from "../../utils/painel";
import "./styles.css";

type Prioridade = "alta" | "media" | "baixa";
type JanelaGrafico = "semanas" | "trimestre";

const COR_OUTROS = "var(--texto-suave)";

interface ItemFila {
  readonly id: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly prioridade: Prioridade;
  readonly material: Material | null;
}

const ROTULO_PRIORIDADE: Readonly<Record<Prioridade, string>> = {
  alta: "ALTA",
  media: "MÉDIA",
  baixa: "BAIXA",
};

const ICONE_MATERIAL = {
  papelao: "papelao",
  plastico: "plastico",
  metal: "metal",
  vidro: "vidro",
} as const;

const COR_MATERIAL = {
  papelao: "var(--papelao-fg)",
  plastico: "var(--plastico-fg)",
  metal: "var(--metal-fg)",
  vidro: "var(--vidro-fg)",
} as const;

function inferirPrioridade(o: Ocorrencia): Prioridade {
  if (o.status === "aguardando_classificacao") return "alta";
  if (o.status === "classificada") return "media";
  return "baixa";
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Frase da saudação sobre a fila: muda quando não sobra nada para aprovar. */
function tituloDaFila(carregou: boolean, pendentes: number, podeRevisar: boolean): string {
  if (!carregou) return "Veja como está a sua unidade hoje.";
  if (pendentes === 0) {
    return podeRevisar
      ? "Tudo aprovado por aqui."
      : "Nenhuma ocorrência aguarda aprovação do gestor.";
  }
  if (!podeRevisar) {
    return `${pendentes} ${pendentes === 1 ? "ocorrência aguarda" : "ocorrências aguardam"} aprovação do gestor.`;
  }
  return pendentes === 1
    ? "Tem 1 ocorrência esperando você."
    : `Tem ${pendentes} ocorrências esperando você.`;
}

/** "+12 vs. mês passado": o sinal acompanha a direção, sem ruído quando não há o que comparar. */
function deltaDeOcorrencias(variacao: number | null): {
  readonly texto?: string;
  readonly direcao: "sobe" | "desce" | "neutro";
} {
  if (variacao === null) return { direcao: "neutro" };
  if (variacao === 0) return { texto: "igual ao mês passado", direcao: "neutro" };
  return {
    texto: `${variacao > 0 ? "+" : "−"}${Math.abs(variacao)} vs. mês passado`,
    direcao: variacao > 0 ? "sobe" : "desce",
  };
}

function deltaDePontos(pontos: number | null): {
  readonly texto?: string;
  readonly direcao: "sobe" | "desce" | "neutro";
} {
  if (pontos === null) return { direcao: "neutro" };
  if (pontos === 0) return { texto: "igual ao mês passado", direcao: "neutro" };
  const unidade = Math.abs(pontos) === 1 ? "ponto" : "pontos";
  return {
    texto: `${pontos > 0 ? "+" : "−"}${Math.abs(pontos)} ${unidade}`,
    direcao: pontos > 0 ? "sobe" : "desce",
  };
}

export default function Home(): ReactNode {
  const { usuario } = useAuth();
  const acoes = useAcoesOcorrencia();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [janela, setJanela] = useState<JanelaGrafico>("semanas");
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);
  const { painel, dadosReais } = usePainel(dados);
  const insight = useInsightVolta();
  const dica = useDicaVolta();
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [erroAprovacao, setErroAprovacao] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const primeiroNome = usuario?.nome.split(" ")[0] ?? "você";
  const podeRevisar =
    !dadosReais || usuario?.perfil === "ADMIN" || usuario?.perfil === "MANAGER";

  const fila = useMemo<readonly ItemFila[]>(() => {
    if (!dados) return [];
    return dados
      .filter(
        (o) =>
          o.status === "classificada" ||
          o.status === "aguardando_classificacao",
      )
      .map((o) => ({
        id: o.id,
        titulo: o.descricao.split(".")[0] ?? o.descricao,
        subtitulo: `${o.localizacao.setor} · ${o.codigo} · ${tempoRelativo(o.criadaEm)}`,
        prioridade: inferirPrioridade(o),
        material: o.material,
      }));
  }, [dados]);

  const pendentes = fila.length;
  const totalMes = painel.recuperadoMesKg;
  const metaMes = useMetaRecuperacao();
  const progressoMeta = Math.min((totalMes / metaMes) * 100, 100);
  // Com a API ainda carregando, os números reais ainda não existem: mostra "—".
  const aguardandoDados = dadosReais && dados === null;
  const kgNaFila = (dados ?? [])
    .filter((o) => fila.some((item) => item.id === o.id))
    .reduce((soma, o) => soma + o.pesoKg, 0);
  const projecaoMeta = Math.round(((totalMes + kgNaFila) / metaMes) * 100);
  const deltaOcorrencias = deltaDeOcorrencias(painel.ocorrenciasVariacao);
  const deltaTaxa = deltaDePontos(painel.taxaVariacaoPontos);
  const materiaisMes = [
    ...painel.porMaterial.map((m) => ({
      chave: m.material as string,
      rotulo: METADADOS_MATERIAL[m.material].rotulo,
      kg: m.kg,
      cor: COR_MATERIAL[m.material],
    })),
    ...(painel.outrosKg > 0
      ? [{ chave: "outros", rotulo: "Outros", kg: painel.outrosKg, cor: COR_OUTROS }]
      : []),
  ];
  const somaDonut = materiaisMes.reduce((soma, m) => soma + m.kg, 0);

  async function aprovar(id: string, titulo: string): Promise<void> {
    setAprovandoId(id);
    setErroAprovacao(null);
    try {
      await acoes.aprovar(id, usuario?.nome ?? "Equipe");
      setChaveRecarga((v) => v + 1);
      setAviso(`#${id.slice(-4)} · ${titulo}`);
    } catch (excecao: unknown) {
      setErroAprovacao(
        excecao instanceof Error ? excecao.message : "Falha ao aprovar a ocorrência.",
      );
    } finally {
      setAprovandoId(null);
    }
  }

  const fatiasDonut = materiaisMes.map((m) => ({
    rotulo: m.rotulo,
    valor: m.kg,
    cor: m.cor,
  }));

  return (
    <div className="home-v2">
      <section className="home-hero" aria-labelledby="home-hero-titulo">
        <svg
          className="home-hero__seta"
          viewBox="0 0 226.493 235.874"
          width="226.493"
          height="235.874"
          fill="none"
          aria-hidden="true"
        >
          <g opacity="0.13">
            <path
              d="M201.701 123.282C201.552 141.723 195.641 159.655 184.794 174.568C173.947 189.481 158.707 200.629 141.209 206.45C123.711 212.272 104.831 212.475 87.2119 207.032C69.5926 201.589 54.1166 190.773 42.9507 176.096C31.7848 161.42 25.4882 143.62 24.9423 125.187C24.3965 106.754 29.6289 88.6123 39.9068 73.3012C50.1847 57.9901 64.9935 46.2766 82.2599 39.8006C99.5262 33.3247 118.386 32.4106 136.197 37.1863"
              stroke="white"
              strokeWidth="31.2"
              strokeLinecap="round"
            />
            <path
              d="M139.539 5.20016L174.179 46.8604L123.083 65.6155L139.539 5.20016Z"
              fill="white"
              stroke="white"
              strokeWidth="10.4"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <div className="home-hero__conteudo">
          <h2 id="home-hero-titulo" className="home-hero__titulo">
            {saudacao()}, {primeiroNome}! {tituloDaFila(dados !== null, pendentes, podeRevisar)}
          </h2>
          <p className="home-hero__texto">
            A unidade já recuperou <strong>{totalMes.toLocaleString("pt-BR")} kg</strong>{" "}
            este mês — <strong>{Math.round(progressoMeta)}%</strong> da meta.
            {podeRevisar && dadosReais
              ? kgNaFila > 0 && projecaoMeta > Math.round(progressoMeta)
                ? ` Aprovando a fila de hoje, vocês chegam a ${projecaoMeta}%.`
                : ""
              : !dadosReais
                ? " Aprovando a fila de hoje, vocês passam de 80%."
                : ""}
          </p>
          <div className="home-hero__acoes">
            <Link to="/ocorrencias?status=aguardando" className="home-hero__botao home-hero__botao--primario">
              <Icone nome="grafico" tamanho={16} />
              {podeRevisar ? "Revisar fila" : "Ver ocorrências"}
            </Link>
            <Link to="/registrar" className="home-hero__botao home-hero__botao--secundario">
              <Icone nome="camera" tamanho={16} />
              Registrar ocorrência
            </Link>
          </div>
        </div>
        {insight ? (
          <div className="home-hero__dica" role="note" aria-label="Dica do assistente VOLTA">
            <p>
              <strong>VOLTA notou:</strong> {insight.texto}
            </p>
          </div>
        ) : null}
        <div className="home-hero__mascote" aria-hidden="true">
          <Mascote tamanho={122} altura={182} />
        </div>
      </section>

      <ul className="home-kpis" aria-label="Indicadores do mês">
        <li>
          <KpiCard
            icone="grafico"
            rotulo="Ocorrências no mês"
            valor={aguardandoDados ? "—" : painel.ocorrenciasMes}
            delta={deltaOcorrencias.texto}
            direcao={deltaOcorrencias.direcao}
            sparkline={painel.sparkOcorrencias ?? undefined}
          />
        </li>
        <li>
          <KpiCard
            icone="sino"
            rotulo="Aguardando aprovação"
            valor={dados ? pendentes : "—"}
            delta={dados ? painel.textoEspera : undefined}
            direcao="neutro"
            sparkline={painel.sparkPendentes ?? undefined}
          />
        </li>
        <li>
          <KpiCard
            icone="reciclagem"
            rotulo="Recuperado no mês"
            valor={
              aguardandoDados ? (
                "—"
              ) : (
                <>
                  {totalMes.toLocaleString("pt-BR")} <small>kg</small>
                </>
              )
            }
            delta={
              painel.recuperadoVariacaoPct === null
                ? `${Math.round(progressoMeta)}% da meta`
                : `${painel.recuperadoVariacaoPct >= 0 ? "+" : "−"}${Math.abs(painel.recuperadoVariacaoPct)}% · ${Math.round(progressoMeta)}% da meta`
            }
            direcao={
              painel.recuperadoVariacaoPct !== null && painel.recuperadoVariacaoPct < 0
                ? "desce"
                : "sobe"
            }
            sparkline={painel.sparkRecuperado ?? undefined}
          />
        </li>
        <li>
          <KpiCard
            icone="check"
            rotulo="Taxa de aprovação"
            valor={
              painel.taxaAprovacao === null || aguardandoDados ? (
                "—"
              ) : (
                <>
                  {painel.taxaAprovacao} <small>%</small>
                </>
              )
            }
            delta={deltaTaxa.texto}
            direcao={deltaTaxa.direcao}
            sparkline={painel.sparkTaxa ?? undefined}
          />
        </li>
      </ul>

      <div className="home-cols">
        <section className="home-painel" aria-labelledby="titulo-recuperacao">
          <header className="home-painel__cabecalho">
            <h2 id="titulo-recuperacao" className="home-painel__titulo">
              Recuperação semanal
            </h2>
            <div className="home-toggle" role="group" aria-label="Período">
              <button
                type="button"
                aria-pressed={janela === "semanas"}
                className={
                  janela === "semanas"
                    ? "home-toggle__opcao home-toggle__opcao--ativa"
                    : "home-toggle__opcao"
                }
                onClick={() => setJanela("semanas")}
              >
                8 semanas
              </button>
              <button
                type="button"
                aria-pressed={janela === "trimestre"}
                className={
                  janela === "trimestre"
                    ? "home-toggle__opcao home-toggle__opcao--ativa"
                    : "home-toggle__opcao"
                }
                onClick={() => setJanela("trimestre")}
              >
                Trimestre
              </button>
            </div>
          </header>
          <GraficoLinha
            pontos={janela === "semanas" ? painel.semanas : painel.meses}
            rotulo="Recuperação de resíduos ao longo do tempo"
          />
          <div className="home-legenda">
            <span className="home-legenda__item">
              <span className="home-legenda__ponto home-legenda__ponto--valor" />
              kg recuperados
            </span>
            <span className="home-legenda__item">
              <span className="home-legenda__ponto home-legenda__ponto--meta" />
              meta semanal proporcional
            </span>
          </div>
        </section>

        <section className="home-painel" aria-labelledby="titulo-materiais">
          <header className="home-painel__cabecalho">
            <h2 id="titulo-materiais" className="home-painel__titulo">
              Por material
            </h2>
            <Link to="/ocorrencias" className="home-painel__link">
              Ver relatório
            </Link>
          </header>
          <div className="home-donut">
            <GraficoDonut
              fatias={fatiasDonut}
              centroTitulo={somaDonut.toLocaleString("pt-BR")}
              centroRotulo="kg no mês"
            />
            <ul className="home-donut__lista">
              {materiaisMes.map((m) => (
                <li key={m.chave} className="home-donut__item">
                  <span
                    className="home-donut__ponto"
                    style={{ background: m.cor }}
                    aria-hidden="true"
                  />
                  <span className="home-donut__rotulo">{m.rotulo}</span>
                  <span className="home-donut__valor">
                    {m.kg.toLocaleString("pt-BR")} kg
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="home-meta">
            <div className="home-meta__topo">
              <span>Meta do mês</span>
              <span>
                {totalMes.toLocaleString("pt-BR")} de{" "}
                {metaMes.toLocaleString("pt-BR")} kg
              </span>
            </div>
            <div
              className="home-meta__barra"
              role="progressbar"
              aria-label="Progresso da meta de recuperação do mês"
              aria-valuenow={Math.round(progressoMeta)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="home-meta__barra-preenchida"
                style={{ width: `${progressoMeta}%` }}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="home-cols">
        <section className="home-painel" aria-labelledby="titulo-fila">
          <header className="home-painel__cabecalho">
            <div className="home-painel__titulos">
              <h2 id="titulo-fila" className="home-painel__titulo">
                Fila de aprovação
              </h2>
              <span className="home-painel__contador">
                {dados ? pendentes : "—"} {pendentes === 1 ? "PENDENTE" : "PENDENTES"}
              </span>
            </div>
            <Link to="/ocorrencias" className="home-painel__link">
              Ver todas
            </Link>
          </header>

          {erro ? (
            <Alerta
              variante="erro"
              titulo="Não foi possível carregar"
              acao={
                <button
                  type="button"
                  className="home-painel__link"
                  onClick={() => setChaveRecarga((v) => v + 1)}
                >
                  Tentar novamente
                </button>
              }
            >
              {erro}
            </Alerta>
          ) : null}

          {erroAprovacao ? (
            <Alerta variante="erro" titulo="Aprovação não concluída">
              {erroAprovacao}
            </Alerta>
          ) : null}

          {carregando ? (
            <SkeletonList quantidade={4} rotulo="Carregando fila de aprovação" />
          ) : fila.length > 0 ? (
            <ul className="home-fila">
              {fila.slice(0, 4).map((item) => (
                <li key={item.id} className="home-fila__item">
                  <span
                    className="home-fila__material"
                    data-material={item.material ?? "papelao"}
                    aria-hidden="true"
                  >
                    <Icone
                      nome={
                        item.material
                          ? ICONE_MATERIAL[item.material]
                          : "chip"
                      }
                      tamanho={18}
                    />
                  </span>
                  <div className="home-fila__textos">
                    <p className="home-fila__titulo">
                      {item.titulo}{" "}
                      <span className="home-fila__id">#{item.id.slice(-4)}</span>
                    </p>
                    <p className="home-fila__sub">{item.subtitulo}</p>
                  </div>
                  <span
                    className={`home-fila__prio home-fila__prio--${item.prioridade}`}
                  >
                    {ROTULO_PRIORIDADE[item.prioridade]}
                  </span>
                  <div className="home-fila__acoes">
                    <Link
                      to={`/ocorrencias/${item.id}`}
                      className="home-fila__botao home-fila__botao--secundario"
                    >
                      Revisar
                    </Link>
                    {podeRevisar ? (
                      <button
                        type="button"
                        className="home-fila__botao home-fila__botao--primario"
                        disabled={aprovandoId !== null}
                        onClick={() => void aprovar(item.id, item.titulo)}
                      >
                        <Icone nome="check" tamanho={14} />
                        {aprovandoId === item.id ? "Aprovando…" : "Aprovar"}
                      </button>
                    ) : (
                      <span className="home-fila__aguardando">
                        Aguardando aprovação do gestor
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !erro && (
              <div className="home-fila-vazia">
                <Mascote tamanho={78} altura={130} />
                <p className="home-fila-vazia__titulo">
                  {podeRevisar ? "Fila zerada!" : "Sem pendências."}
                </p>
                <p className="home-fila-vazia__texto">
                  {podeRevisar
                    ? "Todas as ocorrências foram revisadas."
                    : "Novas ocorrências aguardarão revisão de um gestor."}
                </p>
              </div>
            )
          )}
        </section>

        <aside className="home-painel" aria-labelledby="titulo-atividade">
          <header className="home-painel__cabecalho">
            <h2 id="titulo-atividade" className="home-painel__titulo">
              Atividade da equipe
            </h2>
          </header>
          {painel.atividades.length > 0 ? (
            <ul className="home-timeline">
              {painel.atividades.map((a) => (
                <li key={a.id} className="home-timeline__item">
                  <span
                    className="home-timeline__avatar"
                    style={{ background: a.cor }}
                    aria-hidden="true"
                  >
                    {iniciais(a.autor)}
                  </span>
                  <div className="home-timeline__corpo">
                    <p className="home-timeline__texto">
                      <strong>{a.autor}</strong> {a.acao}
                    </p>
                    <span className="home-timeline__tempo">{a.tempo}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-fila-vazia__texto">
              {dados ? "Nenhuma atividade ainda." : "Carregando atividade…"}
            </p>
          )}

          {dica ? (
            <div className="home-dica">
              <div className="home-dica__mascote" aria-hidden="true">
                <Mascote tamanho={56} />
              </div>
              <div className="home-dica__texto">
                <p className="home-dica__titulo">
                  <span aria-hidden="true">✦</span> Dica do VOLTA
                </p>
                <p>
                  {dica.trechos.map((trecho, indice) =>
                    trecho.destaque ? (
                      <strong key={indice}>{trecho.texto}</strong>
                    ) : (
                      <span key={indice}>{trecho.texto}</span>
                    ),
                  )}
                </p>
                <Link to={dica.destino} className="home-painel__link">
                  {dica.rotuloDestino}
                </Link>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <Toast
        aberto={aviso !== null}
        titulo="Ocorrência aprovada"
        descricao={aviso ?? undefined}
        aoFechar={() => setAviso(null)}
      />
    </div>
  );
}
