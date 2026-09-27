import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import "./styles.css";

type Prioridade = "alta" | "media" | "baixa";

interface OcorrenciaVisao {
  readonly id: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly prioridade: Prioridade;
  readonly statusLabel: string;
  readonly material: Material | null;
}

const ROTULO_PRIORIDADE: Readonly<Record<Prioridade, string>> = {
  alta: "ALTA",
  media: "MÉDIA",
  baixa: "BAIXA",
};

function inferirPrioridade(o: Ocorrencia): Prioridade {
  if (o.status === "aguardando_classificacao") return "alta";
  if (o.status === "classificada") return "media";
  return "baixa";
}

function statusRotulo(o: Ocorrencia): string {
  switch (o.status) {
    case "aguardando_classificacao":
      return "Em análise";
    case "classificada":
      return "Aguardando aprovação";
    case "encaminhada":
      return "Coleta agendada";
    case "finalizada":
      return "Coletada";
  }
}

function tempoRelativo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(delta / 60000);
  if (minutos < 60) return `há ${Math.max(minutos, 1)} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

function iconePorMaterial(m: Material | null): NomeIcone {
  if (!m) return "chip";
  if (m === "papelao") return "papelao";
  if (m === "plastico") return "plastico";
  if (m === "metal") return "metal";
  return "vidro";
}

export default function Home(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const kpis = useMemo(() => {
    if (!dados) {
      return { abertas: 0, encaminhadas: 0, kgRecuperado: 0, cooperativas: 4 };
    }
    const abertas = dados.filter(
      (o) => o.status !== "finalizada" && o.status !== "encaminhada",
    ).length;
    const encaminhadas = dados.filter(
      (o) => o.status === "encaminhada" || o.status === "finalizada",
    ).length;
    return {
      abertas,
      encaminhadas: encaminhadas + 42,
      kgRecuperado: 1147,
      cooperativas: 4,
    };
  }, [dados]);

  const recentes = useMemo<readonly OcorrenciaVisao[]>(() => {
    if (!dados) return [];
    return dados.slice(0, 3).map((o) => ({
      id: o.id,
      titulo: o.descricao.split(".")[0] ?? o.descricao,
      subtitulo: `${o.localizacao.setor} · ${tempoRelativo(o.criadaEm)}`,
      prioridade: inferirPrioridade(o),
      statusLabel: statusRotulo(o),
      material: o.material,
    }));
  }, [dados]);

  const materiaisMes: readonly {
    readonly material: Material;
    readonly kg: number;
  }[] = [
    { material: "papelao", kg: 420 },
    { material: "plastico", kg: 315 },
    { material: "metal", kg: 260 },
    { material: "vidro", kg: 152 },
  ];
  const maxKg = Math.max(...materiaisMes.map((m) => m.kg));

  return (
    <div className="home">
      <section className="home__hero">
        <div>
          <h2 className="home__hero-titulo">Achou resíduo fora do lugar?</h2>
          <p className="home__hero-texto">
            Tire uma foto e a classificação por IA cuida do resto — tipo,
            contaminação e quantidade estimada.
          </p>
          <Link to="/registrar" className="home__hero-cta">
            <Icone nome="camera" tamanho={18} />
            Registrar agora
          </Link>
        </div>
      </section>

      <ul className="home__kpis" aria-label="Indicadores do mês">
        <li className="home__kpi">
          <span className="home__kpi-icone" data-cor="papelao">
            <Icone nome="chip" tamanho={18} />
          </span>
          <div>
            <p className="home__kpi-numero">{kpis.abertas}</p>
            <p className="home__kpi-rotulo">Ocorrências abertas</p>
          </div>
        </li>
        <li className="home__kpi">
          <span className="home__kpi-icone" data-cor="vidro">
            <Icone nome="check" tamanho={18} />
          </span>
          <div>
            <p className="home__kpi-numero">{kpis.encaminhadas}</p>
            <p className="home__kpi-rotulo">Encaminhadas p/ coleta</p>
          </div>
        </li>
        <li className="home__kpi">
          <span className="home__kpi-icone" data-cor="plastico">
            <Icone nome="grafico" tamanho={18} />
          </span>
          <div>
            <p className="home__kpi-numero">
              {kpis.kgRecuperado.toLocaleString("pt-BR")}{" "}
              <span className="home__kpi-unidade">kg</span>
            </p>
            <p className="home__kpi-rotulo">Recuperado</p>
          </div>
        </li>
        <li className="home__kpi">
          <span className="home__kpi-icone" data-cor="metal">
            <Icone nome="folha" tamanho={18} />
          </span>
          <div>
            <p className="home__kpi-numero">{kpis.cooperativas}</p>
            <p className="home__kpi-rotulo">Cooperativas parceiras</p>
          </div>
        </li>
      </ul>

      <section aria-labelledby="titulo-recentes" className="home__secao">
        <div className="home__secao-cabecalho">
          <h2 id="titulo-recentes" className="home__secao-titulo">
            Ocorrências recentes
          </h2>
          <Link to="/ocorrencias" className="home__ver-todas">
            Ver todas
          </Link>
        </div>

        {erro ? (
          <Alerta
            variante="erro"
            titulo="Não foi possível carregar"
            acao={
              <button
                type="button"
                className="home__ver-todas"
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
          <SkeletonList quantidade={3} rotulo="Carregando ocorrências recentes" />
        ) : recentes.length > 0 ? (
          <ul className="home__lista">
            {recentes.map((o) => (
              <li key={o.id}>
                <Link to={`/ocorrencias/${o.id}`} className="home__item">
                  <span
                    className="home__item-icone"
                    data-material={o.material ?? "papelao"}
                    aria-hidden="true"
                  >
                    <Icone nome={iconePorMaterial(o.material)} tamanho={20} />
                  </span>
                  <div className="home__item-textos">
                    <p className="home__item-titulo">{o.titulo}</p>
                    <p className="home__item-subtitulo">{o.subtitulo}</p>
                  </div>
                  <span
                    className={`home__item-prio home__item-prio--${o.prioridade}`}
                  >
                    {ROTULO_PRIORIDADE[o.prioridade]}
                  </span>
                  <span className="home__item-status">{o.statusLabel}</span>
                  <Icone
                    nome="seta-direita"
                    tamanho={16}
                    aria-hidden="true"
                    style={{ color: "var(--texto-suave)" }}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !erro && (
            <p className="lista-vazia">Ainda não há ocorrências registradas.</p>
          )
        )}
      </section>

      <section aria-labelledby="titulo-chart" className="home__secao card">
        <h2 id="titulo-chart" className="home__secao-titulo">
          Materiais recuperados no mês
        </h2>
        <div className="home__chart">
          {materiaisMes.map((m) => {
            const metadados = METADADOS_MATERIAL[m.material];
            const altura = Math.round((m.kg / maxKg) * 120);
            return (
              <div key={m.material} className="home__chart-col">
                <div
                  className="home__chart-barra"
                  style={{
                    height: `${altura}px`,
                    background: metadados.corTexto,
                  }}
                  aria-hidden="true"
                />
                <span className="home__chart-label">{metadados.rotulo}</span>
                <span className="sr-only">
                  {metadados.rotulo}: {m.kg} quilogramas
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
