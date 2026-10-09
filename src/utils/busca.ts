import type { Cooperativa } from "../types/cooperativa";
import type { Ocorrencia } from "../types/ocorrencia";
import { formatarKm } from "./formatacao";

export interface ResultadoBusca {
  readonly id: string;
  readonly rotulo: string;
  /** Texto de apoio à direita: setor, distância ou "Página". */
  readonly apoio: string;
  readonly destino: string;
  readonly icone: "lixeira" | "folha" | "seta-direita";
}

export interface GrupoBusca {
  readonly titulo: string;
  readonly itens: readonly ResultadoBusca[];
}

export interface BaseBusca {
  readonly ocorrencias: readonly Ocorrencia[];
  readonly cooperativas: readonly Cooperativa[];
}

interface PaginaBusca {
  readonly rotulo: string;
  readonly caminho: string;
}

const PAGINAS: readonly PaginaBusca[] = [
  { rotulo: "Início", caminho: "/" },
  { rotulo: "Ocorrências", caminho: "/ocorrencias" },
  { rotulo: "Registrar", caminho: "/registrar" },
  { rotulo: "Cooperativas", caminho: "/cooperativas" },
  { rotulo: "Relatórios PGRS", caminho: "/relatorios" },
  { rotulo: "Equipe", caminho: "/equipe" },
  { rotulo: "Configurações", caminho: "/configuracoes" },
];

const LIMITE_OCORRENCIAS = 5;
const LIMITE_COOPERATIVAS = 3;
const LIMITE_PAGINAS = 7;

/** Minúsculas e sem acento, para "papelao" achar "Papelão". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function contemTodos(palheiro: string, termos: readonly string[]): boolean {
  const alvo = normalizar(palheiro);
  return termos.every((termo) => alvo.includes(termo));
}

/** O número curto de uma ocorrência: "OCC-0483" vira "#0483". */
export function numeroCurto(codigo: string): string {
  return `#${codigo.slice(-4)}`;
}

export function filtrarBusca(base: BaseBusca, consulta: string): readonly GrupoBusca[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  const grupos: GrupoBusca[] = [];

  if (termos.length > 0) {
    const ocorrencias = base.ocorrencias
      .filter((o) =>
        contemTodos(
          `${o.codigo} ${o.titulo} ${o.localizacao.setor} ${o.material ?? ""}`,
          termos,
        ),
      )
      .slice(0, LIMITE_OCORRENCIAS)
      .map<ResultadoBusca>((o) => ({
        id: `ocorrencia-${o.id}`,
        rotulo: `${numeroCurto(o.codigo)} · ${o.titulo}`,
        apoio: o.localizacao.setor,
        destino: `/ocorrencias/${o.id}`,
        icone: "lixeira",
      }));
    if (ocorrencias.length > 0) grupos.push({ titulo: "Ocorrências", itens: ocorrencias });

    const cooperativas = base.cooperativas
      .filter((c) => contemTodos(`${c.nome} ${c.cidade} ${c.estado}`, termos))
      .slice(0, LIMITE_COOPERATIVAS)
      .map<ResultadoBusca>((c) => ({
        id: `cooperativa-${c.id}`,
        rotulo: c.nome,
        apoio: formatarKm(c.distanciaKm),
        destino: "/cooperativas",
        icone: "folha",
      }));
    if (cooperativas.length > 0) grupos.push({ titulo: "Cooperativas", itens: cooperativas });
  }

  const paginas = PAGINAS.filter(
    (p) => termos.length === 0 || contemTodos(p.rotulo, termos),
  )
    .slice(0, LIMITE_PAGINAS)
    .map<ResultadoBusca>((p) => ({
      id: `pagina-${p.caminho}`,
      rotulo: p.rotulo,
      apoio: "Página",
      destino: p.caminho,
      icone: "seta-direita",
    }));
  if (paginas.length > 0) grupos.push({ titulo: "Páginas", itens: paginas });

  return grupos;
}
