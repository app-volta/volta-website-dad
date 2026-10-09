import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { CartoesResumo } from "../../components/CartoesResumo";
import type { CartaoResumo } from "../../components/CartoesResumo";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useRelatorio } from "../../hooks/useRelatorio";
import { gerarPgrs } from "../../services/relatorios";
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
      valor: String(relatorio.taxaAprovacao),
      unidade: "%",
      icone: "check-circulo",
      tom: "azul",
    },
    {
      rotulo: "Desviado de aterro",
      valor: String(relatorio.desvioAterro),
      unidade: "%",
      icone: "alvo",
      tom: "roxo",
    },
  ];
}

export default function Relatorios(): ReactNode {
  const { usuario } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("mes");
  const { dados, carregando, erro } = useRelatorio(periodo);

  const [gerando, setGerando] = useState<boolean>(false);
  const [ultimo, setUltimo] = useState<ArquivoGerado | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [erroGeracao, setErroGeracao] = useState<string | null>(null);

  function exportarCsv(relatorio: RelatorioPgrs): void {
    baixarCsv(
      `relatorio-${relatorio.periodo}.csv`,
      montarCsvRelatorio(relatorio),
    );
  }

  async function gerar(relatorio: RelatorioPgrs): Promise<void> {
    setGerando(true);
    setErroGeracao(null);
    try {
      const { geradoEm } = await gerarPgrs(relatorio.periodo);
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
      setErroGeracao("Não foi possível gerar o PGRS. Tente de novo em instantes.");
    } finally {
      setGerando(false);
    }
  }

  function baixarUltimo(): void {
    if (ultimo) baixarCsv(ultimo.nome, ultimo.conteudo);
  }

  return (
    <section className="rel" aria-label="Relatórios PGRS">
      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível carregar">
          {erro}
        </Alerta>
      ) : null}
      {erroGeracao ? (
        <Alerta variante="erro" titulo="PGRS não gerado">
          {erroGeracao}
        </Alerta>
      ) : null}

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
      ) : dados ? (
        <div className="rel__conteudo" aria-busy={carregando}>
          <CartoesResumo rotulo="Indicadores do período" cartoes={montarCartoes(dados)} />

          <div className="rel__linha">
            <section className="rel__cartao" aria-labelledby="rel-materiais">
              <h3 id="rel-materiais" className="rel__cartao-titulo">
                Recuperado por material {TEXTO_PERIODO[dados.periodo]}
              </h3>
              <GraficoMateriais itens={dados.porMaterial} />
            </section>
            <CartaoPgrs
              periodo={dados.periodo}
              gerando={gerando}
              temUltimo={ultimo !== null}
              aoGerar={() => void gerar(dados)}
              aoBaixarUltimo={baixarUltimo}
            />
          </div>

          <div className="rel__linha rel__linha--base">
            <section className="rel__cartao" aria-labelledby="rel-setores">
              <h3 id="rel-setores" className="rel__cartao-titulo">
                Setores que mais geram resíduo
              </h3>
              <RankingSetores setores={dados.setores} />
            </section>
            <section className="rel__cartao rel__cartao--destino" aria-labelledby="rel-destino">
              <h3 id="rel-destino" className="rel__cartao-titulo">
                Destinação por cooperativa
              </h3>
              <DestinacaoCooperativas destinos={dados.destinacao} />
            </section>
          </div>
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
