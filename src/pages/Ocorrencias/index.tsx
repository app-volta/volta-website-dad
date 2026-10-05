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
import type { Ocorrencia, StatusOcorrencia } from "../../types/ocorrencia";
import "./styles.css";

type FiltroAba = "todas" | "abertas" | "analise" | "coletadas";

const ABAS: readonly { readonly valor: FiltroAba; readonly rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "abertas", rotulo: "Abertas" },
  { valor: "analise", rotulo: "Em análise" },
  { valor: "coletadas", rotulo: "Coletadas" },
];

function ehDaAba(o: Ocorrencia, aba: FiltroAba): boolean {
  if (aba === "todas") return true;
  if (aba === "abertas") return o.status !== "finalizada";
  if (aba === "analise") return o.status === "aguardando_classificacao";
  return o.status === "finalizada" || o.status === "encaminhada";
}

const ROTULOS_STATUS_UI: Readonly<Record<StatusOcorrencia, string>> = {
  aguardando_classificacao: "EM ANÁLISE",
  classificada: "ABERTA",
  aprovada: "APROVADA",
  encaminhada: "ENCAMINHADA",
  recusada: "RECUSADA",
  finalizada: "COLETADA",
};

const CLASSE_STATUS: Readonly<Record<StatusOcorrencia, string>> = {
  aguardando_classificacao: "ocorrencias__chip--analise",
  classificada: "ocorrencias__chip--aberta",
  aprovada: "ocorrencias__chip--aprovada",
  encaminhada: "ocorrencias__chip--aprovada",
  recusada: "ocorrencias__chip--aberta",
  finalizada: "ocorrencias__chip--coletada",
};

function iconePorMaterial(m: Material | null): NomeIcone {
  if (!m) return "chip";
  if (m === "papelao") return "papelao";
  if (m === "plastico") return "plastico";
  if (m === "metal") return "metal";
  return "vidro";
}

function pesoEstimado(o: Ocorrencia): number {
  return 20 + (o.id.length * 7) % 60;
}

function tempoRelativo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(delta / 60000);
  if (minutos < 60) return `hoje, ${Math.max(minutos, 1)}min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hoje, ${horas}h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  return `${dias} dias`;
}

export default function Ocorrencias(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [aba, setAba] = useState<FiltroAba>("todas");
  const [busca, setBusca] = useState<string>("");
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const filtradas = useMemo(() => {
    if (!dados) return [] as readonly Ocorrencia[];
    const buscaBaixa = busca.trim().toLowerCase();
    return dados.filter((o) => {
      if (!ehDaAba(o, aba)) return false;
      if (!buscaBaixa) return true;
      return (
        o.descricao.toLowerCase().includes(buscaBaixa) ||
        o.localizacao.setor.toLowerCase().includes(buscaBaixa) ||
        (o.material ?? "").includes(buscaBaixa)
      );
    });
  }, [dados, aba, busca]);

  return (
    <section className="ocorrencias" aria-labelledby="titulo-lista">
      <h2 id="titulo-lista" className="sr-only">
        Lista de ocorrências
      </h2>
      <div className="ocorrencias__topo">
        <label className="ocorrencias__busca">
          <span className="sr-only">Buscar por material ou setor</span>
          <Icone nome="lupa" tamanho={18} />
          <input
            type="search"
            placeholder="Buscar por material ou setor"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </label>
        <div
          className="ocorrencias__abas"
          role="tablist"
          aria-label="Filtrar ocorrências"
        >
          {ABAS.map((op) => {
            const ativa = op.valor === aba;
            return (
              <button
                key={op.valor}
                type="button"
                role="tab"
                aria-selected={ativa}
                tabIndex={ativa ? 0 : -1}
                className={
                  ativa
                    ? "ocorrencias__aba ocorrencias__aba--ativa"
                    : "ocorrencias__aba"
                }
                onClick={() => setAba(op.valor)}
              >
                {op.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível carregar">
          {erro}
        </Alerta>
      ) : null}

      {carregando ? (
        <SkeletonList quantidade={5} rotulo="Carregando ocorrências" />
      ) : (
        <div className="ocorrencias__tabela-wrapper card">
          <table className="ocorrencias__tabela">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Setor</th>
                <th scope="col">Peso</th>
                <th scope="col">Data</th>
                <th scope="col">Status</th>
                <th scope="col" aria-label="Abrir" />
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="lista-vazia">
                    Nenhuma ocorrência encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((o) => {
                  const materialMeta = o.material
                    ? METADADOS_MATERIAL[o.material]
                    : null;
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link
                          to={`/ocorrencias/${o.id}`}
                          className="ocorrencias__linha"
                        >
                          <span
                            className="ocorrencias__icone-material"
                            data-material={o.material ?? "papelao"}
                            aria-hidden="true"
                          >
                            <Icone
                              nome={iconePorMaterial(o.material)}
                              tamanho={20}
                            />
                          </span>
                          <span className="ocorrencias__nome">
                            {materialMeta ? materialMeta.rotulo : "Sem tipo"}
                            {o.descricao.toLowerCase().includes("mol")
                              ? " molhado"
                              : ""}
                          </span>
                        </Link>
                      </td>
                      <td>{o.localizacao.setor}</td>
                      <td>
                        <strong>≈{pesoEstimado(o)} kg</strong>
                      </td>
                      <td>{tempoRelativo(o.criadaEm)}</td>
                      <td>
                        <span
                          className={`chip ${CLASSE_STATUS[o.status]}`}
                        >
                          {ROTULOS_STATUS_UI[o.status]}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/ocorrencias/${o.id}`}
                          aria-label={`Abrir ocorrência ${o.codigo}`}
                          className="ocorrencias__seta"
                        >
                          <Icone nome="seta-direita" tamanho={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filtradas.length > 0 ? (
            <div className="ocorrencias__rodape">
              <span>
                Mostrando {filtradas.length} de {dados?.length ?? 0} ocorrências
              </span>
              <button
                type="button"
                className="ocorrencias__mais"
                onClick={() => setChaveRecarga((v) => v + 1)}
              >
                Recarregar
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
