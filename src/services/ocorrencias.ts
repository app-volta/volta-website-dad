import fotoExemplo from "../assets/foto-exemplo.svg";
import type { Material } from "../types/material";
import { METADADOS_MATERIAL } from "../types/material";
import type {
  AtualizarOcorrencia,
  NovaOcorrencia,
  Ocorrencia,
  PrioridadeOcorrencia,
  StatusOcorrencia,
} from "../types/ocorrencia";
import { aguardar } from "./http";
import { classificarFoto } from "./classificacao";

/**
 * MOCK de ocorrências. O estado vive em memória; ao substituir por API real,
 * mantenha as assinaturas exportadas.
 */

const RECOMENDACAO_PADRAO =
  "Guarde num lugar seco e coberto. Coleta em até 24h mantém o material valioso.";

const AGORA = Date.now();

function quando(diasAtras: number, hora: number, minuto: number): string {
  const data = new Date(AGORA);
  data.setDate(data.getDate() - diasAtras);
  data.setHours(hora, minuto, 0, 0);
  return data.toISOString();
}

interface ModeloOcorrencia {
  readonly titulo: string;
  readonly material: Material | null;
  readonly setor: string;
  readonly pesoKg: number;
  readonly confianca: number;
  readonly prioridade: PrioridadeOcorrencia;
  readonly status: StatusOcorrencia;
  readonly autor: string;
  readonly criadaEm: string;
}

const RECENTES: readonly ModeloOcorrencia[] = [
  { titulo: "Papelão molhado", material: "papelao", setor: "Frigorífico B2", pesoKg: 38, confianca: 0.88, prioridade: "alta", status: "classificada", autor: "Breno Gomes", criadaEm: quando(0, 9, 12) },
  { titulo: "Plástico de embalagem", material: "plastico", setor: "Expedição", pesoKg: 22, confianca: 0.91, prioridade: "media", status: "classificada", autor: "Carla Mendes", criadaEm: quando(0, 8, 40) },
  { titulo: "Sucata metálica", material: "metal", setor: "Manutenção", pesoKg: 61, confianca: 0.97, prioridade: "baixa", status: "aprovada", autor: "João Pereira", criadaEm: quando(0, 7, 15) },
  { titulo: "Papelão limpo", material: "papelao", setor: "Recebimento", pesoKg: 45, confianca: 0.95, prioridade: "baixa", status: "aprovada", autor: "Ana Souza", criadaEm: quando(1, 16, 30) },
  { titulo: "Vidro", material: "vidro", setor: "Refeitório", pesoKg: 12, confianca: 0.84, prioridade: "media", status: "encaminhada", autor: "Rafael Lima", criadaEm: quando(1, 14, 2) },
  { titulo: "Plástico filme", material: "plastico", setor: "Expedição", pesoKg: 18, confianca: 0.79, prioridade: "media", status: "classificada", autor: "Carla Mendes", criadaEm: quando(1, 10, 20) },
  { titulo: "Óleo de cozinha", material: null, setor: "Refeitório", pesoKg: 9, confianca: 0.72, prioridade: "alta", status: "recusada", autor: "Rafael Lima", criadaEm: quando(2, 11, 5) },
  { titulo: "Papelão molhado", material: "papelao", setor: "Frigorífico B2", pesoKg: 40, confianca: 0.9, prioridade: "alta", status: "aprovada", autor: "Breno Gomes", criadaEm: quando(3, 9, 40) },
  { titulo: "Metal diverso", material: "metal", setor: "Manutenção", pesoKg: 33, confianca: 0.93, prioridade: "baixa", status: "aprovada", autor: "João Pereira", criadaEm: quando(4, 15, 10) },
  { titulo: "Pallet de madeira", material: null, setor: "Expedição", pesoKg: 55, confianca: 0.86, prioridade: "media", status: "classificada", autor: "Carla Mendes", criadaEm: quando(4, 13, 25) },
];

const TITULOS_ANTIGOS: readonly { readonly titulo: string; readonly material: Material | null; readonly setor: string }[] = [
  { titulo: "Papelão limpo", material: "papelao", setor: "Recebimento" },
  { titulo: "Plástico filme", material: "plastico", setor: "Expedição" },
  { titulo: "Sucata metálica", material: "metal", setor: "Manutenção" },
  { titulo: "Vidro", material: "vidro", setor: "Refeitório" },
  { titulo: "Papelão molhado", material: "papelao", setor: "Frigorífico B2" },
  { titulo: "Metal diverso", material: "metal", setor: "Manutenção" },
  { titulo: "Pallet de madeira", material: null, setor: "Expedição" },
  { titulo: "Óleo de cozinha", material: null, setor: "Refeitório" },
];

const AUTORES: readonly string[] = [
  "Breno Gomes",
  "Carla Mendes",
  "João Pereira",
  "Ana Souza",
  "Rafael Lima",
];

const STATUS_ANTIGOS: readonly StatusOcorrencia[] = [
  "aprovada",
  "aprovada",
  "encaminhada",
  "aprovada",
  "recusada",
  "finalizada",
];

const PRIORIDADES_ANTIGAS: readonly PrioridadeOcorrencia[] = [
  "baixa",
  "media",
  "alta",
  "media",
  "baixa",
];

const ANTIGAS: readonly ModeloOcorrencia[] = Array.from({ length: 42 }, (_, i) => {
  const base = TITULOS_ANTIGOS[i % TITULOS_ANTIGOS.length];
  return {
    titulo: base.titulo,
    material: base.material,
    setor: base.setor,
    pesoKg: 8 + ((i * 13) % 60),
    confianca: 0.7 + ((i * 7) % 28) / 100,
    prioridade: PRIORIDADES_ANTIGAS[i % PRIORIDADES_ANTIGAS.length],
    status: STATUS_ANTIGOS[i % STATUS_ANTIGOS.length],
    autor: AUTORES[(i + 2) % AUTORES.length],
    criadaEm: quando(5 + Math.floor(i / 3), 8 + (i % 9), (i * 7) % 60),
  };
});

function montar(modelo: ModeloOcorrencia, numero: number): Ocorrencia {
  const codigo = `OCC-${String(numero).padStart(4, "0")}`;
  const analisadaEm = modelo.criadaEm;
  return {
    id: `occ-${String(numero).padStart(4, "0")}`,
    codigo,
    titulo: modelo.titulo,
    descricao: `${modelo.titulo} registrado em ${modelo.setor}.`,
    pesoKg: modelo.pesoKg,
    prioridade: modelo.prioridade,
    fotoUrl: fotoExemplo,
    localizacao: { setor: modelo.setor, unidade: "Lins/SP" },
    material: modelo.material,
    status: modelo.status,
    classificacao: {
      material: modelo.material ?? "papelao",
      confianca: Number(modelo.confianca.toFixed(2)),
      recomendacao: RECOMENDACAO_PADRAO,
      analisadaEm,
    },
    cooperativaId: modelo.status === "encaminhada" ? "coop-2" : null,
    criadaEm: modelo.criadaEm,
    atualizadaEm: modelo.criadaEm,
    criadaPor: `op-${String(numero % 20).padStart(2, "0")}`,
    criadaPorNome: modelo.autor,
  };
}

const CATALOGO: Ocorrencia[] = [
  ...RECENTES.map((modelo, i) => montar(modelo, 483 - i)),
  ...ANTIGAS.map((modelo, i) => montar(modelo, 473 - i)),
];

function proximoCodigo(): string {
  const maior = Math.max(
    ...CATALOGO.map((item) => Number(item.codigo.replace(/\D/g, ""))),
  );
  return `OCC-${String(maior + 1).padStart(4, "0")}`;
}

export async function listarOcorrencias(
  sinal?: AbortSignal,
): Promise<readonly Ocorrencia[]> {
  await aguardar(500, sinal);
  return [...CATALOGO].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

export async function obterOcorrencia(
  id: string,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  await aguardar(400, sinal);
  const encontrada = CATALOGO.find((item) => item.id === id);
  if (!encontrada) {
    throw new Error(`Ocorrência ${id} não encontrada.`);
  }
  return encontrada;
}

export async function criarOcorrencia(
  entrada: NovaOcorrencia,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  const classificacao = await classificarFoto(entrada.fotoBase64, sinal);
  const agora = new Date().toISOString();
  const codigo = proximoCodigo();
  const nova: Ocorrencia = {
    id: `occ-${codigo.slice(4)}`,
    codigo,
    titulo: METADADOS_MATERIAL[classificacao.material].rotulo,
    descricao: entrada.descricao,
    pesoKg: 20 + (entrada.fotoBase64.length % 40),
    prioridade: entrada.prioridade,
    fotoUrl: entrada.fotoBase64,
    localizacao: entrada.localizacao,
    material: classificacao.material,
    status: "classificada",
    classificacao,
    cooperativaId: null,
    criadaEm: agora,
    atualizadaEm: agora,
    criadaPor: "user-atual",
    criadaPorNome: entrada.autorNome,
  };
  CATALOGO.unshift(nova);
  return nova;
}

export async function atualizarOcorrencia(
  id: string,
  entrada: AtualizarOcorrencia,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  await aguardar(500, sinal);
  const indice = CATALOGO.findIndex((item) => item.id === id);
  if (indice < 0) {
    throw new Error(`Ocorrência ${id} não encontrada.`);
  }
  const anterior = CATALOGO[indice];
  const atualizada: Ocorrencia = {
    ...anterior,
    material: entrada.material ?? anterior.material,
    cooperativaId: entrada.cooperativaId ?? anterior.cooperativaId,
    status: entrada.status ?? anterior.status,
    atualizadaEm: new Date().toISOString(),
  };
  CATALOGO[indice] = atualizada;
  return atualizada;
}

export async function aprovarOcorrencias(
  ids: readonly string[],
  sinal?: AbortSignal,
): Promise<number> {
  await aguardar(600, sinal);
  let aprovadas = 0;
  for (const id of ids) {
    const indice = CATALOGO.findIndex((item) => item.id === id);
    if (indice < 0) continue;
    const atual = CATALOGO[indice];
    if (atual.status !== "classificada" && atual.status !== "aguardando_classificacao") {
      continue;
    }
    CATALOGO[indice] = {
      ...atual,
      status: "aprovada",
      atualizadaEm: new Date().toISOString(),
    };
    aprovadas += 1;
  }
  return aprovadas;
}
