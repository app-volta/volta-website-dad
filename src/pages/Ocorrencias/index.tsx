import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { aprovarOcorrencias } from "../../services/ocorrencias";
import { METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import { baixarCsv, montarCsv } from "../../utils/exportarCsv";
import { formatarPorcentagem, formatarRegistro } from "../../utils/formatacao";
import {
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  categoriaDe,
} from "../../utils/statusOcorrencia";
import type { CategoriaStatus } from "../../utils/statusOcorrencia";
import "./styles.css";

type Filtro = "todas" | CategoriaStatus;

const POR_PAGINA = 10;

const FILTROS: readonly { readonly valor: Filtro; readonly rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "aguardando", rotulo: "Aguardando aprovação" },
  { valor: "aprovadas", rotulo: "Aprovadas" },
  { valor: "encaminhadas", rotulo: "Encaminhadas" },
  { valor: "recusadas", rotulo: "Recusadas" },
];

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
  const [selecionadas, setSelecionadas] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [aprovando, setAprovando] = useState<boolean>(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
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

  const idsVisiveis = visiveis.map((o) => o.id);
  const todasVisiveis =
    idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionadas.has(id));
  const algumaVisivel = idsVisiveis.some((id) => selecionadas.has(id));

  function alternar(id: string): void {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function alternarPagina(): void {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      for (const id of idsVisiveis) {
        if (todasVisiveis) novo.delete(id);
        else novo.add(id);
      }
      return novo;
    });
  }

  async function aprovarSelecionadas(): Promise<void> {
    setAprovando(true);
    setAviso(null);
    setErroAcao(null);
    try {
      const aprovadas = await aprovarOcorrencias([...selecionadas]);
      setSelecionadas(new Set());
      setChaveRecarga((v) => v + 1);
      setAviso(
        aprovadas === 0
          ? "Nenhuma das ocorrências selecionadas estava aguardando aprovação."
          : aprovadas === 1
            ? "1 ocorrência aprovada."
            : `${aprovadas} ocorrências aprovadas.`,
      );
    } catch (excecao) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao aprovar.",
      );
    } finally {
      setAprovando(false);
    }
  }

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
        ROTULO_CATEGORIA[categoriaDe(o.status)],
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

      {aviso ? <Alerta variante="sucesso">{aviso}</Alerta> : null}
      {erroAcao ? (
        <Alerta variante="erro" titulo="Não foi possível aprovar">
          {erroAcao}
        </Alerta>
      ) : null}

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
                  <th scope="col" className="ocorrencias__col-check">
                    <label className="ocorrencias__check">
                      <input
                        type="checkbox"
                        checked={todasVisiveis}
                        ref={(el) => {
                          if (el) el.indeterminate = algumaVisivel && !todasVisiveis;
                        }}
                        onChange={alternarPagina}
                        disabled={visiveis.length === 0}
                        aria-label="Selecionar todas as ocorrências desta página"
                      />
                      <span className="ocorrencias__check-caixa" aria-hidden="true">
                        <Icone nome="check" tamanho={11} />
                      </span>
                    </label>
                  </th>
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
                    <td colSpan={9} className="ocorrencias__vazio">
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                ) : (
                  visiveis.map((o) => {
                    const confianca = o.classificacao?.confianca ?? 0;
                    return (
                      <tr
                        key={o.id}
                        className={
                          selecionadas.has(o.id)
                            ? "ocorrencias__linha ocorrencias__linha--selecionada"
                            : "ocorrencias__linha"
                        }
                      >
                        <td className="ocorrencias__col-check">
                          <label className="ocorrencias__check">
                            <input
                              type="checkbox"
                              checked={selecionadas.has(o.id)}
                              onChange={() => alternar(o.id)}
                              aria-label={`Selecionar ocorrência ${o.codigo}`}
                            />
                            <span
                              className="ocorrencias__check-caixa"
                              aria-hidden="true"
                            >
                              <Icone nome="check" tamanho={11} />
                            </span>
                          </label>
                        </td>
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
                            {ROTULO_CATEGORIA[categoriaDe(o.status)]}
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

      <div
        className="ocorrencias__lote"
        role="region"
        aria-label="Ações em lote"
      >
        <span className="ocorrencias__lote-contagem" aria-live="polite">
          {selecionadas.size}{" "}
          {selecionadas.size === 1 ? "selecionada" : "selecionadas"}
        </span>
        <button
          type="button"
          className="ocorrencias__lote-limpar"
          onClick={() => setSelecionadas(new Set())}
          disabled={selecionadas.size === 0}
        >
          Limpar
        </button>
        <button
          type="button"
          className="ocorrencias__lote-aprovar"
          onClick={aprovarSelecionadas}
          disabled={selecionadas.size === 0 || aprovando}
        >
          <Icone nome="check" tamanho={14} />
          {aprovando ? "Aprovando…" : "Aprovar selecionadas"}
        </button>
      </div>
    </section>
  );
}
