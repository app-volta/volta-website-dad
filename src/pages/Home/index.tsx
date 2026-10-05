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
import { useAuth } from "../../context/AuthContext";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import type { Material } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import "./styles.css";

type Prioridade = "alta" | "media" | "baixa";
type JanelaGrafico = "semanas" | "trimestre";

interface ItemFila {
  readonly id: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly prioridade: Prioridade;
  readonly material: Material | null;
}

interface AtividadeEquipe {
  readonly iniciais: string;
  readonly cor: string;
  readonly texto: ReactNode;
  readonly tempo: string;
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

function tempoRelativo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(delta / 60000);
  if (minutos < 60) return `há ${Math.max(minutos, 1)} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas}h hoje`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  return `${dias} dias`;
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

const DADOS_RECUPERACAO: Readonly<
  Record<JanelaGrafico, readonly { rotulo: string; valor: number; meta: number }[]>
> = {
  semanas: [
    { rotulo: "S1", valor: 108, meta: 140 },
    { rotulo: "S2", valor: 128, meta: 140 },
    { rotulo: "S3", valor: 141, meta: 140 },
    { rotulo: "S4", valor: 134, meta: 140 },
    { rotulo: "S5", valor: 155, meta: 140 },
    { rotulo: "S6", valor: 162, meta: 140 },
    { rotulo: "S7", valor: 178, meta: 140 },
    { rotulo: "S8", valor: 191, meta: 140 },
  ],
  trimestre: [
    { rotulo: "Jan", valor: 320, meta: 420 },
    { rotulo: "Fev", valor: 410, meta: 420 },
    { rotulo: "Mar", valor: 485, meta: 420 },
  ],
};

const MATERIAIS_MES = [
  { material: "papelao" as const, rotulo: "Papelão", kg: 542 },
  { material: "plastico" as const, rotulo: "Plástico", kg: 318 },
  { material: "metal" as const, rotulo: "Metal", kg: 176 },
  { material: "vidro" as const, rotulo: "Vidro", kg: 111 },
];

const ATIVIDADES: readonly AtividadeEquipe[] = [
  {
    iniciais: "AS",
    cor: "var(--metal-bg)",
    texto: (
      <>
        <strong>Ana Souza</strong> aprovou #0481 · Sucata metálica
      </>
    ),
    tempo: "há 5 min",
  },
  {
    iniciais: "CM",
    cor: "var(--plastico-bg)",
    texto: (
      <>
        <strong>Carla Mendes</strong> registrou #0482 · Plástico
      </>
    ),
    tempo: "há 32 min",
  },
  {
    iniciais: "RL",
    cor: "var(--vidro-bg)",
    texto: (
      <>
        <strong>Rafael Lima</strong> encaminhou #0479 pra Qualidade
      </>
    ),
    tempo: "ontem",
  },
  {
    iniciais: "JP",
    cor: "var(--papelao-bg)",
    texto: (
      <>
        <strong>João Pereira</strong> adicionou uma observação em #0475
      </>
    ),
    tempo: "ontem",
  },
];

export default function Home(): ReactNode {
  const { usuario } = useAuth();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [janela, setJanela] = useState<JanelaGrafico>("semanas");
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const primeiroNome = usuario?.nome.split(" ")[0] ?? "você";

  const fila = useMemo<readonly ItemFila[]>(() => {
    if (!dados) return [];
    return dados
      .filter(
        (o) =>
          o.status === "classificada" ||
          o.status === "aguardando_classificacao",
      )
      .slice(0, 4)
      .map((o) => ({
        id: o.id,
        titulo: o.descricao.split(".")[0] ?? o.descricao,
        subtitulo: `${o.localizacao.setor} · ${o.codigo} · ${tempoRelativo(o.criadaEm)}`,
        prioridade: inferirPrioridade(o),
        material: o.material,
      }));
  }, [dados]);

  const pendentes = fila.length;
  const totalMes = MATERIAIS_MES.reduce((acc, m) => acc + m.kg, 0);
  const metaMes = 1500;
  const progressoMeta = Math.min((totalMes / metaMes) * 100, 100);

  const fatiasDonut = MATERIAIS_MES.map((m) => ({
    rotulo: m.rotulo,
    valor: m.kg,
    cor: COR_MATERIAL[m.material],
  }));

  return (
    <div className="home-v2">
      <section className="home-hero" aria-labelledby="home-hero-titulo">
        <svg
          className="home-hero__padrao"
          viewBox="0 0 500 300"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="hero-seta-ponta"
              viewBox="0 0 14 14"
              refX="4"
              refY="7"
              markerUnits="strokeWidth"
              markerWidth="2.2"
              markerHeight="2.2"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 7 L 0 14 Z" fill="#FFFFFF" />
            </marker>
          </defs>
          <circle
            cx="380"
            cy="150"
            r="150"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            opacity="0.18"
          />
          <path
            d="M 110 230 C 130 100 260 40 360 90 C 430 115 455 180 410 240"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
            markerEnd="url(#hero-seta-ponta)"
          />
        </svg>
        <div className="home-hero__conteudo">
          <h2 id="home-hero-titulo" className="home-hero__titulo">
            {saudacao()}, {primeiroNome}! Tem {pendentes || 4} ocorrências
            esperando você.
          </h2>
          <p className="home-hero__texto">
            A unidade já recuperou <strong>{totalMes.toLocaleString("pt-BR")} kg</strong>{" "}
            este mês — <strong>{Math.round(progressoMeta)}%</strong> da meta.
            Aprovando a fila de hoje, vocês passam de 80%.
          </p>
          <div className="home-hero__acoes">
            <Link to="/ocorrencias?status=aguardando" className="home-hero__botao home-hero__botao--primario">
              <Icone nome="grafico" tamanho={16} />
              Revisar fila
            </Link>
            <Link to="/registrar" className="home-hero__botao home-hero__botao--secundario">
              <Icone nome="camera" tamanho={16} />
              Registrar ocorrência
            </Link>
          </div>
        </div>
        <aside className="home-hero__dica" aria-label="Dica do assistente VOLTA">
          <p>
            <strong>VOLTA notou:</strong> o Setor B2 registrou papelão molhado 3 vezes essa semana. Que tal uma área coberta perto da câmara fria?
          </p>
        </aside>
        <div className="home-hero__mascote" aria-hidden="true">
          <Mascote tamanho={130} />
        </div>
      </section>

      <ul className="home-kpis" aria-label="Indicadores do mês">
        <li>
          <KpiCard
            icone="grafico"
            rotulo="Ocorrências no mês"
            valor="52"
            delta="+12 vs. mês passado"
            direcao="sobe"
            sparkline={[32, 36, 40, 38, 44, 48, 52]}
          />
        </li>
        <li>
          <KpiCard
            icone="sino"
            rotulo="Aguardando aprovação"
            valor={pendentes || 4}
            delta="média de 2,4 h pra aprovar"
            direcao="neutro"
            sparkline={[6, 4, 7, 5, 8, 3, 4]}
          />
        </li>
        <li>
          <KpiCard
            icone="reciclagem"
            rotulo="Recuperado no mês"
            valor={
              <>
                {totalMes.toLocaleString("pt-BR")} <small>kg</small>
              </>
            }
            delta={`+8% · ${Math.round(progressoMeta)}% da meta`}
            direcao="sobe"
            sparkline={[720, 810, 860, 920, 980, 1050, 1147]}
          />
        </li>
        <li>
          <KpiCard
            icone="check"
            rotulo="Taxa de aprovação"
            valor={
              <>
                94 <small>%</small>
              </>
            }
            delta="+3 pontos"
            direcao="sobe"
            sparkline={[88, 90, 89, 91, 92, 93, 94]}
          />
        </li>
      </ul>

      <div className="home-cols">
        <section className="home-painel" aria-labelledby="titulo-recuperacao">
          <header className="home-painel__cabecalho">
            <h2 id="titulo-recuperacao" className="home-painel__titulo">
              Recuperação semanal
            </h2>
            <div className="home-toggle" role="tablist" aria-label="Período">
              <button
                type="button"
                role="tab"
                aria-selected={janela === "semanas"}
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
                role="tab"
                aria-selected={janela === "trimestre"}
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
            pontos={DADOS_RECUPERACAO[janela]}
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
              centroTitulo={totalMes.toLocaleString("pt-BR")}
              centroRotulo="kg no mês"
            />
            <ul className="home-donut__lista">
              {MATERIAIS_MES.map((m) => (
                <li key={m.material} className="home-donut__item">
                  <span
                    className="home-donut__ponto"
                    style={{ background: COR_MATERIAL[m.material] }}
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
                {pendentes || 4} PENDENTES
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

          {carregando ? (
            <SkeletonList quantidade={4} rotulo="Carregando fila de aprovação" />
          ) : fila.length > 0 ? (
            <ul className="home-fila">
              {fila.map((item) => (
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
                    <button
                      type="button"
                      className="home-fila__botao home-fila__botao--primario"
                    >
                      <Icone nome="check" tamanho={14} />
                      Aprovar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !erro && (
              <p className="lista-vazia">Nenhuma ocorrência aguardando aprovação.</p>
            )
          )}
        </section>

        <aside className="home-painel" aria-labelledby="titulo-atividade">
          <header className="home-painel__cabecalho">
            <h2 id="titulo-atividade" className="home-painel__titulo">
              Atividade da equipe
            </h2>
          </header>
          <ul className="home-timeline">
            {ATIVIDADES.map((a) => (
              <li key={`${a.iniciais}-${a.tempo}`} className="home-timeline__item">
                <span
                  className="home-timeline__avatar"
                  style={{ background: a.cor }}
                  aria-hidden="true"
                >
                  {a.iniciais}
                </span>
                <div className="home-timeline__corpo">
                  <p className="home-timeline__texto">{a.texto}</p>
                  <span className="home-timeline__tempo">{a.tempo}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="home-dica">
            <div className="home-dica__mascote" aria-hidden="true">
              <Mascote tamanho={56} />
            </div>
            <div className="home-dica__texto">
              <p className="home-dica__titulo">
                <span aria-hidden="true">✦</span> Dica do VOLTA
              </p>
              <p>
                A licença da <strong>Recicla Vida</strong> vence em 12 dias. Peça a renovação antes de mandar mais material.
              </p>
              <Link to="/cooperativas" className="home-painel__link">
                Ver cooperativa
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
