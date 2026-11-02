import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AcaoDoEstado, EstadoPainel } from "../../components/EstadoPainel";
import { CartoesResumo } from "../../components/CartoesResumo";
import type { CartaoResumo } from "../../components/CartoesResumo";
import { EstadoForaDoAr } from "../../components/EstadoForaDoAr";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useMetaRecuperacao, usePreferenciasDaMeta } from "../../hooks/useMeta";
import { useDadosReais } from "../../hooks/useModo";
import { useRelatorio } from "../../hooks/useRelatorio";
import type { MetasSalvas } from "../../types/configuracao";
import { PERIODOS_RELATORIO } from "../../types/relatorio";
import type { PeriodoRelatorio, RelatorioPgrs } from "../../types/relatorio";
import { baixarCsv } from "../../utils/exportarCsv";
import { diasDeOperacaoDoMes, metaDoDiaKg } from "../../utils/metas";
import {
  montarCsvRelatorio,
  ROTULOS_PERIODO,
  TEXTO_PERIODO,
} from "../../utils/relatorio";
import type { MetasDoRelatorio } from "../../utils/relatorio";
import { CartaoPgrs } from "./CartaoPgrs";
import { GraficoMateriais } from "./GraficoMateriais";
import { OcorrenciasPorSetor } from "./OcorrenciasPorSetor";
import { DestinacaoCooperativas, RankingSetores } from "./Rankings";
import "./styles.css";

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
}

/** A tela de metas volta para cá com o que gravou; vira o aviso "Metas salvas". */
function avisoDasMetas(estado: unknown): Aviso | null {
  const metas = (estado as { metasSalvas?: MetasSalvas } | null)?.metasSalvas;
  if (!metas) return null;
  return {
    titulo: "Metas salvas",
    descricao: `${metas.mesKg.toLocaleString("pt-BR")} kg no mês · ${metas.diaKg.toLocaleString("pt-BR")} kg por dia`,
  };
}

function montarCartoes(relatorio: RelatorioPgrs): readonly CartaoResumo[] {
  return [
    {
      rotulo: "Ocorrências",
      valor: relatorio.ocorrencias.toLocaleString("pt-BR"),
      icone: "bandeira",
      tom: "ambar",
    },
    {
      rotulo: "Recuperado",
      valor: relatorio.recuperadoKg.toLocaleString("pt-BR"),
      unidade: "kg",
      icone: "ciclo",
      tom: "verde",
    },
    {
      rotulo: "Taxa de aprovação",
      valor: relatorio.taxaAprovacao === null ? "—" : String(relatorio.taxaAprovacao),
      unidade: relatorio.taxaAprovacao === null ? undefined : "%",
      icone: "check-circulo",
      tom: "azul",
    },
    {
      rotulo: "Desviado de aterro",
      valor: relatorio.desvioAterro === null ? "—" : String(relatorio.desvioAterro),
      unidade: relatorio.desvioAterro === null ? undefined : "%",
      icone: "alvo",
      tom: "roxo",
    },
  ];
}

export default function Relatorios(): ReactNode {
  const { usuario } = useAuth();
  const dadosReais = useDadosReais();
  const localizacao = useLocation();
  const navegar = useNavigate();
  const metaDoMesKg = useMetaRecuperacao();
  const preferenciasDaMeta = usePreferenciasDaMeta();
  const podeDefinirMetas =
    !dadosReais || usuario?.perfil === "ADMIN" || usuario?.perfil === "MANAGER";
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("mes");
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useRelatorio(periodo, chaveRecarga);

  const [aviso, setAviso] = useState<Aviso | null>(() =>
    avisoDasMetas(localizacao.state),
  );

  // O aviso já foi lido: limpa o estado da navegação para ele não voltar ao recarregar.
  useEffect(() => {
    if (avisoDasMetas(localizacao.state)) {
      navegar(localizacao.pathname, { replace: true, state: null });
    }
  }, [localizacao.pathname, localizacao.state, navegar]);

  /** As metas só entram no relatório do mês e se o aviso estiver ligado. */
  function metasDoCsv(relatorio: RelatorioPgrs): MetasDoRelatorio | undefined {
    if (
      relatorio.periodo !== "mes" ||
      metaDoMesKg <= 0 ||
      !preferenciasDaMeta.avisosDaMeta.incluirNoPgrs
    ) {
      return undefined;
    }
    return {
      metaMensalKg: metaDoMesKg,
      metaDoDiaKg: metaDoDiaKg(
        metaDoMesKg,
        diasDeOperacaoDoMes(preferenciasDaMeta.diasDeOperacao, new Date()),
        preferenciasDaMeta.metaDoDia,
      ),
      porMaterial: preferenciasDaMeta.metaPorMaterial,
    };
  }

  function exportarCsv(relatorio: RelatorioPgrs): void {
    baixarCsv(
      `relatorio-${relatorio.periodo}.csv`,
      montarCsvRelatorio(relatorio, undefined, metasDoCsv(relatorio)),
    );
  }

  /** O documento do PGRS (a pessoa o salva em PDF pelo navegador). */
  function abrirDocumento(relatorio: RelatorioPgrs): void {
    navegar(`/relatorios/pgrs?periodo=${relatorio.periodo}`);
  }

  /** O mesmo PGRS em planilha, com a unidade e a data de geração no começo. */
  function baixarCsvDoPgrs(relatorio: RelatorioPgrs): void {
    const geradoEm = new Date().toISOString();
    const nome = `pgrs-${relatorio.periodo}-${geradoEm.slice(0, 10)}.csv`;
    baixarCsv(
      nome,
      montarCsvRelatorio(
        relatorio,
        { unidade: usuario?.unidade ?? "Unidade", geradoEm },
        metasDoCsv(relatorio),
      ),
    );
    setAviso({ titulo: "CSV do PGRS baixado", descricao: `${nome} foi baixado.` });
  }

  if (erro && !dados) {
    return (
      <section className="rel" aria-label="Relatórios PGRS">
        <EstadoForaDoAr aoTentarDeNovo={() => setChaveRecarga((v) => v + 1)} />
      </section>
    );
  }

  return (
    <section className="rel" aria-label="Relatórios PGRS">
      <div className="rel__topo">
        <div className="rel__periodos" role="group" aria-label="Período do relatório">
          {PERIODOS_RELATORIO.map((item) => (
            <button
              key={item}
              type="button"
              className={`rel__periodo${periodo === item ? " rel__periodo--ativo" : ""}`}
              aria-pressed={periodo === item}
              onClick={() => setPeriodo(item)}
            >
              {ROTULOS_PERIODO[item]}
            </button>
          ))}
        </div>
        <div className="rel__acoes">
          {podeDefinirMetas ? (
            <Link to="/relatorios/metas" className="rel__exportar">
              <Icone nome="alvo" tamanho={14} />
              Definir metas
            </Link>
          ) : null}
          <button
            type="button"
            className="rel__exportar"
            disabled={!dados}
            onClick={() => dados && exportarCsv(dados)}
          >
            <Icone nome="download" tamanho={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {!dados && carregando ? (
        <SkeletonList quantidade={4} rotulo="Carregando relatório" />
      ) : dados && dados.ocorrencias === 0 ? (
        <EstadoPainel
          pose="pergunta"
          tag="Sem resultado"
          titulo="Ainda não há dados neste período"
          texto="Os números aparecem aqui quando as ocorrências forem registradas e coletadas. Experimente outro período."
        >
          <AcaoDoEstado para="/ocorrencias">Ver ocorrências</AcaoDoEstado>
        </EstadoPainel>
      ) : dados ? (
        <div className="rel__conteudo" aria-busy={carregando}>
          <CartoesResumo rotulo="Indicadores do período" cartoes={montarCartoes(dados)} />

          <div className="rel__linha">
            <section className="rel__cartao" aria-labelledby="rel-materiais">
              <h2 id="rel-materiais" className="rel__cartao-titulo">
                Recuperado por material {TEXTO_PERIODO[dados.periodo]}
              </h2>
              <GraficoMateriais itens={dados.porMaterial} />
            </section>
            <CartaoPgrs
              periodo={dados.periodo}
              scoreEsg={dados.scoreEsg ?? null}
              posicaoNoRanking={dados.posicaoNoRanking ?? null}
              aoGerar={() => abrirDocumento(dados)}
              aoBaixarCsv={() => baixarCsvDoPgrs(dados)}
            />
          </div>

          <div className="rel__linha rel__linha--base">
            <section className="rel__cartao" aria-labelledby="rel-setores">
              <h2 id="rel-setores" className="rel__cartao-titulo">
                Setores que mais geram resíduo
              </h2>
              {dados.setores.length > 0 ? (
                <RankingSetores setores={dados.setores} />
              ) : (
                <p className="rel__vazio">Nenhum peso registrado neste período.</p>
              )}
            </section>
            <section className="rel__cartao rel__cartao--destino" aria-labelledby="rel-destino">
              <h2 id="rel-destino" className="rel__cartao-titulo">
                Destinação por cooperativa
              </h2>
              {dados.destinacao.length > 0 ? (
                <DestinacaoCooperativas destinos={dados.destinacao} />
              ) : (
                <p className="rel__vazio">Nenhuma coleta neste período.</p>
              )}
            </section>
          </div>

          <OcorrenciasPorSetor
            periodo={dados.periodo}
            setores={dados.ocorrenciasPorSetor}
          />
        </div>
      ) : null}

      <Toast
        aberto={aviso !== null}
        titulo={aviso?.titulo ?? ""}
        descricao={aviso?.descricao}
        aoFechar={() => setAviso(null)}
      />
    </section>
  );
}
