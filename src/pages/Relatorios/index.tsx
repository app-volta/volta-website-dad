import { useState } from "react";
import type { ReactNode } from "react";

import { AcaoDoEstado, EstadoPainel } from "../../components/EstadoPainel";
import { CartoesResumo } from "../../components/CartoesResumo";
import type { CartaoResumo } from "../../components/CartoesResumo";
import { EstadoForaDoAr } from "../../components/EstadoForaDoAr";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useAcoesRelatorio, useRelatorio } from "../../hooks/useRelatorio";
import { PERIODOS_RELATORIO } from "../../types/relatorio";
import type { PeriodoRelatorio, RelatorioPgrs } from "../../types/relatorio";
import { baixarCsv } from "../../utils/exportarCsv";
import {
  montarCsvRelatorio,
  ROTULOS_PERIODO,
  TEXTO_PERIODO,
} from "../../utils/relatorio";
import { CartaoPgrs } from "./CartaoPgrs";
import { GraficoMateriais } from "./GraficoMateriais";
import { OcorrenciasPorSetor } from "./OcorrenciasPorSetor";
import { DestinacaoCooperativas, RankingSetores } from "./Rankings";
import "./styles.css";

interface ArquivoGerado {
  readonly nome: string;
  readonly conteudo: string;
}

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
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
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("mes");
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useRelatorio(periodo, chaveRecarga);
  const acoes = useAcoesRelatorio();

  const [gerando, setGerando] = useState<boolean>(false);
  const [ultimo, setUltimo] = useState<ArquivoGerado | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [falhouAoGerar, setFalhouAoGerar] = useState<boolean>(false);

  function exportarCsv(relatorio: RelatorioPgrs): void {
    baixarCsv(
      `relatorio-${relatorio.periodo}.csv`,
      montarCsvRelatorio(relatorio),
    );
  }

  async function gerar(relatorio: RelatorioPgrs): Promise<void> {
    setGerando(true);
    setFalhouAoGerar(false);
    try {
      const { geradoEm } = await acoes.gerarPgrs(relatorio.periodo);
      const arquivo: ArquivoGerado = {
        nome: `pgrs-${relatorio.periodo}-${geradoEm.slice(0, 10)}.csv`,
        conteudo: montarCsvRelatorio(relatorio, {
          unidade: usuario?.unidade ?? "Unidade",
          geradoEm,
        }),
      };
      baixarCsv(arquivo.nome, arquivo.conteudo);
      setUltimo(arquivo);
      setAviso({
        titulo: "Relatório PGRS gerado",
        descricao: `${arquivo.nome} foi baixado.`,
      });
    } catch {
      setFalhouAoGerar(true);
    } finally {
      setGerando(false);
    }
  }

  function baixarUltimo(): void {
    if (ultimo) baixarCsv(ultimo.nome, ultimo.conteudo);
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
              gerando={gerando}
              temUltimo={ultimo !== null}
              aoGerar={() => void gerar(dados)}
              aoBaixarUltimo={baixarUltimo}
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
      <Toast
        aberto={falhouAoGerar}
        variante="erro"
        titulo="Não geramos o relatório"
        descricao="Tente de novo em alguns instantes."
        duracaoMs={6000}
        aoFechar={() => setFalhouAoGerar(false)}
      />
    </section>
  );
}
