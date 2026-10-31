import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { SkeletonList } from "../../../components/SkeletonList";
import { useOcorrenciasPorSetor } from "../../../hooks/useOcorrenciasPorSetor";

/** A posição no ranking segue a mesma ordem de cores dos outros cartões de Relatórios. */
const CORES = ["ambar", "azul", "roxo", "verde", "turquesa"] as const;

function resumo(total: number, setores: number): string {
  const ocorrencias = total === 1 ? "ocorrência" : "ocorrências";
  const rotuloSetores = setores === 1 ? "setor" : "setores";
  return `${total.toLocaleString("pt-BR")} ${ocorrencias} em ${setores} ${rotuloSetores}`;
}

/**
 * Gráfico de barras "Ocorrências por setor", com os números do BI (Databricks)
 * da empresa de quem está logado. Mostra carregando, erro (com nova tentativa)
 * e a ausência de dados.
 */
export function OcorrenciasPorSetor(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useOcorrenciasPorSetor(chaveRecarga);

  const setores = dados ?? [];
  const total = setores.reduce((soma, item) => soma + item.ocorrencias, 0);
  const maior = Math.max(...setores.map((item) => item.ocorrencias), 1);

  return (
    <section
      className="rel__cartao"
      aria-labelledby="rel-bi-setores"
      aria-busy={carregando}
    >
      <h2 id="rel-bi-setores" className="rel__cartao-titulo">
        Ocorrências por setor
      </h2>
      <p className="rel__bi-fonte">
        Fonte: BI (Databricks)
        {dados && dados.length > 0 ? ` · ${resumo(total, dados.length)}` : null}
      </p>

      {erro ? (
        <Alerta
          variante="erro"
          titulo="Não foi possível carregar o gráfico do BI"
          acao={
            <button
              type="button"
              className="rel__exportar"
              onClick={() => setChaveRecarga((v) => v + 1)}
              disabled={carregando}
            >
              Tentar novamente
            </button>
          }
        >
          {erro}
        </Alerta>
      ) : null}

      {!dados && carregando ? (
        <SkeletonList quantidade={4} rotulo="Carregando ocorrências por setor" />
      ) : null}

      {dados && dados.length === 0 ? (
        <p className="rel__vazio">
          O BI ainda não tem ocorrências da sua empresa.
        </p>
      ) : null}

      {dados && dados.length > 0 ? (
        <ol className="rel__ranking" aria-label="Ocorrências por setor">
          {dados.map((item, indice) => (
            <li key={item.setor} className="rel__ranking-item">
              <span className="rel__posicao" data-cor={CORES[indice % CORES.length]}>
                {indice + 1}
              </span>
              <b className="rel__ranking-nome" title={item.setor}>
                {item.setor}
              </b>
              <span className="rel__trilho" aria-hidden="true">
                <span style={{ width: `${(item.ocorrencias / maior) * 100}%` }} />
              </span>
              <b className="rel__ranking-valor">
                {item.ocorrencias.toLocaleString("pt-BR")}
                <span className="sr-only">
                  {item.ocorrencias === 1 ? " ocorrência" : " ocorrências"}
                </span>
              </b>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
