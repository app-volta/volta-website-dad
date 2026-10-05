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
import type {
  Ocorrencia,
  PrioridadeOcorrencia,
  StatusOcorrencia,
} from "../../types/ocorrencia";
import { baixarCsv, montarCsv } from "../../utils/exportarCsv";
import { formatarPorcentagem, formatarRegistro } from "../../utils/formatacao";
import "./styles.css";

type Categoria = "aguardando" | "aprovadas" | "encaminhadas" | "recusadas";
type Filtro = "todas" | Categoria;

const POR_PAGINA = 10;

const FILTROS: readonly { readonly valor: Filtro; readonly rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "aguardando", rotulo: "Aguardando aprovação" },
  { valor: "aprovadas", rotulo: "Aprovadas" },
  { valor: "encaminhadas", rotulo: "Encaminhadas" },
  { valor: "recusadas", rotulo: "Recusadas" },
];

const ROTULO_STATUS: Readonly<Record<Categoria, string>> = {
  aguardando: "AGUARDANDO APROVAÇÃO",
  aprovadas: "APROVADA",
  encaminhadas: "ENCAMINHADA",
  recusadas: "RECUSADA",
};

const ROTULO_PRIORIDADE: Readonly<Record<PrioridadeOcorrencia, string>> = {
  alta: "ALTA",
  media: "MÉDIA",
  baixa: "BAIXA",
};

function categoriaDe(status: StatusOcorrencia): Categoria {
  switch (status) {
    case "aguardando_classificacao":
    case "classificada":
      return "aguardando";
    case "aprovada":
    case "finalizada":
      return "aprovadas";
    case "encaminhada":
      return "encaminhadas";
    case "recusada":
      return "recusadas";
  }
}

function iconePorMaterial(material: Material | null): NomeIcone {
  return material ?? "reciclagem";
}

function textoBuscavel(o: Ocorrencia): string {
  const material = o.material ? METADADOS_MATERIAL[o.material].rotulo : "";
  return [o.titulo, o.codigo, o.localizacao.setor, o.criadaPorNome, material]
    .join(" ")
    .toLowerCase();
}

export default function Ocorrencias(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState<string>("");
  const [pagina, setPagina] = useState<number>(1);
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const contagens = useMemo(() => {
    const base: Record<Filtro, number> = {
      todas: dados?.length ?? 0,
      aguardando: 0,
      aprovadas: 0,
      encaminhadas: 0,
      recusadas: 0,
    };
    for (const o of dados ?? []) base[categoriaDe(o.status)] += 1;
    return base;
  }, [dados]);

  const filtradas = useMemo<readonly Ocorrencia[]>(() => {
    const termo = busca.trim().toLowerCase();
    return (dados ?? []).filter((o) => {
      if (filtro !== "todas" && categoriaDe(o.status) !== filtro) return false;
      return termo === "" || textoBuscavel(o).includes(termo);
    });
  }, [dados, filtro, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

  function exportar(): void {
    const csv = montarCsv(
      [
        "Código",
        "Ocorrência",
        "Setor",
        "Peso (kg)",
        "Confiança IA",
        "Prioridade",
        "Status",
        "Registrada por",
        "Registrada em",
      ],
      filtradas.map((o) => [
        o.codigo,
        o.titulo,
        o.localizacao.setor,
        o.pesoKg,
        formatarPorcentagem(o.classificacao?.confianca ?? 0),
        ROTULO_PRIORIDADE[o.prioridade],
        ROTULO_STATUS[categoriaDe(o.status)],
        o.criadaPorNome,
        new Date(o.criadaEm).toLocaleString("pt-BR"),
      ]),
    );
    baixarCsv(`ocorrencias-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <section className="ocorrencias" aria-labelledby="titulo-lista">
      <h2 id="titulo-lista" className="sr-only">
        Lista de ocorrências
      </h2>

      <div className="ocorrencias__filtros">
        <label className="ocorrencias__busca">
          <span className="sr-only">Buscar por material, setor ou código</span>
          <Icone nome="lupa" tamanho={17} />
          <input
            type="search"
            placeholder="Buscar por material, setor ou código"
            value={busca}
            onChange={(evento) => {
              setBusca(evento.target.value);
              setPagina(1);
            }}
          />
        </label>
        {FILTROS.map((op) => (
          <button
            key={op.valor}
            type="button"
            aria-pressed={filtro === op.valor}
            className={
              filtro === op.valor
                ? "ocorrencias__chip ocorrencias__chip--ativo"
                : "ocorrencias__chip"
            }
            onClick={() => {
              setFiltro(op.valor);
              setPagina(1);
            }}
          >
            {op.rotulo}
            <span className="ocorrencias__contagem">{contagens[op.valor]}</span>
          </button>
        ))}
      </div>

      <div className="ocorrencias__acoes">
        <button
          type="button"
          className="ocorrencias__exportar"
          onClick={exportar}
          disabled={filtradas.length === 0}
        >
          <Icone nome="download" tamanho={14} />
          Exportar
        </button>
      </div>

      {erro ? (
        <Alerta
          variante="erro"
          titulo="Não foi possível carregar"
          acao={
            <button
              type="button"
              className="ocorrencias__proxima"
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
        <SkeletonList quantidade={6} rotulo="Carregando ocorrências" />
      ) : (
        <div className="ocorrencias__tabela-card">
          <div className="ocorrencias__rolagem">
            <table className="ocorrencias__tabela">
              <thead>
                <tr>
                  <th scope="col">Ocorrência</th>
                  <th scope="col">Setor</th>
                  <th scope="col">Peso</th>
                  <th scope="col">Confiança IA</th>
                  <th scope="col">Prioridade</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registrada</th>
                  <th scope="col">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiveis.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ocorrencias__vazio">
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                ) : (
                  visiveis.map((o) => {
                    const confianca = o.classificacao?.confianca ?? 0;
                    return (
                      <tr key={o.id}>
                        <td>
                          <Link
                            to={`/ocorrencias/${o.id}`}
                            className="ocorrencias__ocorrencia"
                          >
                            <span
                              className="ocorrencias__tile"
                              data-material={o.material ?? "outro"}
                              aria-hidden="true"
                            >
                              <Icone
                                nome={iconePorMaterial(o.material)}
                                tamanho={16}
                              />
                            </span>
                            <span>
                              <strong className="ocorrencias__titulo">
                                {o.titulo}
                              </strong>
                              <span className="ocorrencias__sub">
                                #{o.codigo.replace(/\D/g, "")} · por{" "}
                                {o.criadaPorNome}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td>{o.localizacao.setor}</td>
                        <td>
                          <strong>≈{o.pesoKg} kg</strong>
                        </td>
                        <td>
                          <span className="ocorrencias__confianca">
                            <span
                              className="ocorrencias__barra"
                              aria-hidden="true"
                            >
                              <span style={{ width: `${confianca * 100}%` }} />
                            </span>
                            <strong>{formatarPorcentagem(confianca)}</strong>
                          </span>
                        </td>
                        <td>
                          <span
                            className={`ocorrencias__pill ocorrencias__pill--${o.prioridade}`}
                          >
                            {ROTULO_PRIORIDADE[o.prioridade]}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`ocorrencias__pill ocorrencias__status--${categoriaDe(o.status)}`}
                          >
                            {ROTULO_STATUS[categoriaDe(o.status)]}
                          </span>
                        </td>
                        <td className="ocorrencias__registro">
                          {formatarRegistro(o.criadaEm)}
                        </td>
                        <td>
                          <Link
                            to={`/ocorrencias/${o.id}`}
                            aria-label={`Abrir ocorrência ${o.codigo}`}
                            className="ocorrencias__seta"
                          >
                            <Icone nome="seta-direita" tamanho={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ocorrencias__rodape">
            <span>
              Mostrando {visiveis.length} de {filtradas.length} ocorrências
            </span>
            <nav className="ocorrencias__paginacao" aria-label="Paginação">
              {paginaAtual > 1 ? (
                <button
                  type="button"
                  className="ocorrencias__proxima"
                  onClick={() => setPagina(paginaAtual - 1)}
                >
                  Anterior
                </button>
              ) : null}
              <span>
                Página {paginaAtual} de {totalPaginas}
              </span>
              {paginaAtual < totalPaginas ? (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className="ocorrencias__proxima"
                    onClick={() => setPagina(paginaAtual + 1)}
                  >
                    Próxima
                  </button>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </section>
  );
}
