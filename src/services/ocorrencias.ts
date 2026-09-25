import type {
  AtualizarOcorrencia,
  NovaOcorrencia,
  Ocorrencia,
} from "../types/ocorrencia";
import { aguardar } from "./http";
import { classificarFoto } from "./classificacao";

/**
 * MOCK de ocorrências. O estado vive em memória; ao substituir por API real,
 * mantenha as assinaturas exportadas.
 */

const CATALOGO: Ocorrencia[] = [
  {
    id: "occ-1001",
    codigo: "OCC-1001",
    descricao: "Papelão molhado ao lado do setor de embalagens.",
    fotoUrl:
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=640&q=60",
    localizacao: {
      setor: "Embalagens B",
      unidade: "Lins/SP",
    },
    material: "papelao",
    status: "classificada",
    classificacao: {
      material: "papelao",
      confianca: 0.94,
      recomendacao:
        "Enfardar após secagem e destinar à cooperativa CooperAmbiental.",
      analisadaEm: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    cooperativaId: null,
    criadaEm: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    atualizadaEm: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    criadaPor: "op-04",
  },
  {
    id: "occ-1002",
    codigo: "OCC-1002",
    descricao: "Garrafas PET acumuladas na área externa da caldeira.",
    fotoUrl:
      "https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=640&q=60",
    localizacao: { setor: "Caldeira", unidade: "Lins/SP" },
    material: "plastico",
    status: "encaminhada",
    classificacao: {
      material: "plastico",
      confianca: 0.88,
      recomendacao: "Separar tampas antes do encaminhamento.",
      analisadaEm: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    cooperativaId: "coop-2",
    criadaEm: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    atualizadaEm: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    criadaPor: "op-07",
  },
  {
    id: "occ-1003",
    codigo: "OCC-1003",
    descricao: "Sucata de metal cortada no pátio norte.",
    fotoUrl:
      "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=640&q=60",
    localizacao: { setor: "Pátio Norte", unidade: "Lins/SP" },
    material: "metal",
    status: "finalizada",
    classificacao: {
      material: "metal",
      confianca: 0.96,
      recomendacao: "Enviar direto para a cooperativa Reciclamex.",
      analisadaEm: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    cooperativaId: "coop-3",
    criadaEm: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    atualizadaEm: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    criadaPor: "op-04",
  },
  {
    id: "occ-1004",
    codigo: "OCC-1004",
    descricao: "Frascos de vidro identificados no laboratório.",
    fotoUrl:
      "https://images.unsplash.com/photo-1517495306984-f84210f9daa8?auto=format&fit=crop&w=640&q=60",
    localizacao: { setor: "Laboratório", unidade: "Lins/SP" },
    material: null,
    status: "aguardando_classificacao",
    classificacao: null,
    cooperativaId: null,
    criadaEm: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    atualizadaEm: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    criadaPor: "op-12",
  },
];

function proximoCodigo(): string {
  const numero = 1000 + CATALOGO.length + 1;
  return `OCC-${numero}`;
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
  const nova: Ocorrencia = {
    id: `occ-${Math.random().toString(36).slice(2, 8)}`,
    codigo: proximoCodigo(),
    descricao: entrada.descricao,
    fotoUrl: entrada.fotoBase64,
    localizacao: entrada.localizacao,
    material: classificacao.material,
    status: "classificada",
    classificacao,
    cooperativaId: null,
    criadaEm: agora,
    atualizadaEm: agora,
    criadaPor: "user-atual",
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
