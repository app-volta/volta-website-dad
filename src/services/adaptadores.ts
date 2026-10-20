import fotoExemplo from "../assets/foto-exemplo.svg";
import type {
  AnaliseResiduoApi,
  AreaApi,
  CategoriaResiduoApi,
  IncidenteApi,
  PerfilApi,
  PrioridadeApi,
  RelatorioIaApi,
  RespostaChatApi,
  RiscoApi,
  TipoResiduoApi,
  UsuarioApi,
} from "../types/api";
import type {
  ClassificacaoIA,
  NivelContaminacao,
} from "../types/classificacao";
import type { Material } from "../types/material";
import { METADADOS_MATERIAL } from "../types/material";
import type {
  EventoOcorrencia,
  Ocorrencia,
  PrioridadeOcorrencia,
  StatusOcorrencia,
} from "../types/ocorrencia";
import type { AcaoMensagem } from "../types/assistente";
import type { Trecho } from "../types/notificacao";
import type { PapelUsuario, Usuario } from "../types/usuario";

/**
 * Tradução entre os contratos da volta-api (src/types/api.ts) e os tipos de
 * domínio do app. Funções puras: nada aqui faz requisição.
 */

/** A API não expõe o nome da empresa a quem não é ADMIN. */
const UNIDADE_PADRAO = "Minha unidade";

const PAPEL_POR_PERFIL: Readonly<Record<PerfilApi, PapelUsuario>> = {
  ADMIN: "responsavel_pgrs",
  MANAGER: "responsavel_pgrs",
  EMPLOYEE: "operador",
  OPERATOR: "operador",
};

export function usuarioDaApi(dto: UsuarioApi): Usuario {
  return {
    id: dto.id,
    nome: dto.name,
    email: dto.email,
    papel: PAPEL_POR_PERFIL[dto.role] ?? "operador",
    unidade: UNIDADE_PADRAO,
    cargo: dto.position,
  };
}

const MATERIAL_POR_CATEGORIA: Readonly<
  Partial<Record<CategoriaResiduoApi, Material>>
> = {
  PAPEL: "papelao",
  PLASTICO: "plastico",
  METAL: "metal",
  VIDRO: "vidro",
};

export const CATEGORIA_POR_MATERIAL: Readonly<
  Record<Material, CategoriaResiduoApi>
> = {
  papelao: "PAPEL",
  plastico: "PLASTICO",
  metal: "METAL",
  vidro: "VIDRO",
};

const ROTULO_CATEGORIA: Readonly<Record<CategoriaResiduoApi, string>> = {
  PAPEL: "Papelão",
  PLASTICO: "Plástico",
  VIDRO: "Vidro",
  METAL: "Metal",
  MADEIRA: "Madeira",
  PERIGOSO: "Resíduo perigoso",
  SAUDE: "Resíduo de saúde",
  RADIOATIVO: "Resíduo radioativo",
  ORGANICO: "Orgânico",
  NAO_RECICLAVEL: "Não reciclável",
};

const PRIORIDADE_DA_API: Readonly<Record<PrioridadeApi, PrioridadeOcorrencia>> =
  {
    LOW: "baixa",
    MEDIUM: "media",
    HIGH: "alta",
    CRITICAL: "alta",
  };

export const PRIORIDADE_PARA_API: Readonly<
  Record<PrioridadeOcorrencia, PrioridadeApi>
> = {
  baixa: "LOW",
  media: "MEDIUM",
  alta: "HIGH",
};

const CONTAMINACAO_DA_API: Readonly<Record<RiscoApi, NivelContaminacao>> = {
  LOW: "baixa",
  MEDIUM: "media",
  HIGH: "alta",
};

/** O backend serializa LocalDateTime em UTC e sem fuso. */
export function instanteUtc(valor: string): string {
  const temFuso = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(valor);
  const data = new Date(temFuso ? valor : `${valor}Z`);
  return Number.isNaN(data.getTime()) ? valor : data.toISOString();
}

/** Código curto e estável derivado do UUID, no formato OCC-12345. */
export function codigoDaOcorrencia(id: string): string {
  const numero = Number.parseInt(id.replace(/-/g, "").slice(0, 8), 16);
  const curto = Number.isNaN(numero) ? 0 : numero % 100_000;
  return `OCC-${String(curto).padStart(5, "0")}`;
}

function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Texto livre da IA ("Óleo lubrificante", "Papel molhado") para uma das quatro categorias. */
export function materialDoTexto(texto: string | null): Material | null {
  if (!texto) return null;
  const limpo = semAcentos(texto);
  if (limpo.includes("papel")) return "papelao";
  if (limpo.includes("plastic")) return "plastico";
  if (limpo.includes("metal")) return "metal";
  if (limpo.includes("vidro")) return "vidro";
  return null;
}

function normalizar(texto: string): string {
  return semAcentos(texto).trim();
}

/** Palavras (no começo de uma palavra) que levam o texto livre da IA a cada categoria. Vale a primeira que bater. */
const PALAVRAS_POR_CATEGORIA: ReadonlyArray<
  readonly [CategoriaResiduoApi, readonly string[]]
> = [
  ["RADIOATIVO", ["radioativ", "nuclear"]],
  ["SAUDE", ["saude", "hospitalar", "infectante", "seringa", "perfurocortante"]],
  [
    "PERIGOSO",
    ["perigos", "oleo", "lubrificante", "solvente", "tinta", "quimic", "toxic", "bateria", "pilha", "combustivel", "inflamavel", "corrosiv", "graxa", "amianto"],
  ],
  ["PAPEL", ["papel", "papelao", "cartao"]],
  ["PLASTICO", ["plastic", "polietileno", "polipropileno", "pet", "pvc"]],
  ["VIDRO", ["vidro"]],
  ["METAL", ["metal", "sucata", "aluminio", "ferro", "cobre", "lata"]],
  ["MADEIRA", ["madeira", "pallet", "palete"]],
  ["ORGANICO", ["organic", "alimento", "comida", "restos"]],
];

/** Categoria da volta-api para o tipo descrito pela IA; sem correspondência, não reciclável. */
export function categoriaDoTexto(texto: string): CategoriaResiduoApi {
  const limpo = normalizar(texto);
  for (const [categoria, palavras] of PALAVRAS_POR_CATEGORIA) {
    if (palavras.some((palavra) => new RegExp(`\\b${palavra}`).test(limpo))) {
      return categoria;
    }
  }
  return "NAO_RECICLAVEL";
}

const RISCO_DA_ANALISE: Readonly<Record<string, RiscoApi>> = {
  BAIXO: "LOW",
  MEDIO: "MEDIUM",
  ALTO: "HIGH",
};

/** Contaminação da IA (BAIXO, MEDIO, ALTO) no risco da volta-api; qualquer outro valor vira nulo. */
export function riscoDaAnalise(analise: AnaliseResiduoApi): RiscoApi | null {
  return RISCO_DA_ANALISE[normalizar(analise.ai_contamination_level).toUpperCase()] ?? null;
}

/** O juiz não aprovou: a IA não sustenta o que viu e a ocorrência não deve ser criada com esses dados. */
export function analiseInconclusiva(analise: AnaliseResiduoApi): boolean {
  return (
    analise.judge?.approved === false ||
    normalizar(analise.ai_contamination_level).toUpperCase() === "INDETERMINADO"
  );
}

/** Análise da foto no formato que as telas leem. A IA não informa a confiança. */
export function classificacaoDaAnalise(analise: AnaliseResiduoApi): ClassificacaoIA {
  const risco = riscoDaAnalise(analise);
  return {
    material: materialDoTexto(analise.detected_waste_type),
    confianca: null,
    contaminacao: risco ? CONTAMINACAO_DA_API[risco] : undefined,
    recomendacao: analise.recommendations,
    relatorio: analise.report_text,
    analisadaEm: analise.generated_at
      ? instanteUtc(analise.generated_at)
      : new Date().toISOString(),
    tipoDetectado: analise.detected_waste_type,
    pesoEstimadoKg: analise.estimated_quantity_kg,
    exigeValidacao: analise.requires_human_validation,
  };
}

export interface CatalogoApi {
  readonly areas: ReadonlyMap<string, AreaApi>;
  readonly tipos: ReadonlyMap<string, TipoResiduoApi>;
}

export function classificacaoDoRelatorio(
  relatorio: RelatorioIaApi,
  materialDaOcorrencia: Material | null,
): ClassificacaoIA {
  return {
    material: materialDoTexto(relatorio.detectedWasteType) ?? materialDaOcorrencia,
    confianca: null,
    contaminacao: relatorio.aiContaminationLevel
      ? CONTAMINACAO_DA_API[relatorio.aiContaminationLevel]
      : undefined,
    recomendacao: relatorio.recommendations ?? relatorio.reportText ?? "",
    relatorio: relatorio.reportText ?? undefined,
    analisadaEm: instanteUtc(relatorio.generatedAt),
  };
}

/** O que o assistente mostra de uma resposta do chatbot. */
export interface ConteudoAssistente {
  readonly trechos: readonly Trecho[];
  readonly acao?: AcaoMensagem;
}

/**
 * Resposta do chatbot em trechos de texto: título em destaque, resposta,
 * próximos passos e fontes. Documentos internos não aparecem como fonte.
 */
export function conteudoDaRespostaChat(resposta: RespostaChatApi): ConteudoAssistente {
  const { response, citations, proposed_occurrence: proposta } = resposta;
  const trechos: Trecho[] = [];

  if (response.title) trechos.push({ texto: `${response.title}\n`, destaque: true });
  trechos.push({ texto: response.answer });

  if (response.recommended_actions.length > 0) {
    trechos.push({ texto: "\n\nPróximos passos:", destaque: true });
    for (const passo of response.recommended_actions) {
      trechos.push({ texto: `\n• ${passo}` });
    }
  }

  const fontes = citations
    .filter((fonte) => !fonte.internal_document)
    .slice(0, 3)
    .map((fonte) => fonte.title);
  if (fontes.length > 0) {
    trechos.push({ texto: `\n\nFontes: ${fontes.join("; ")}.` });
  }

  if (response.requires_human_validation) {
    trechos.push({ texto: "\n\nPeça a validação do responsável antes de agir." });
  }

  return {
    trechos,
    acao: proposta
      ? { rotulo: "Registrar ocorrência", destino: "/registrar" }
      : undefined,
  };
}

export interface ExtrasOcorrencia {
  readonly relatorio?: RelatorioIaApi | null;
  readonly classificacao?: ClassificacaoIA | null;
  readonly autorNome?: string;
}

export function ocorrenciaDaApi(
  dto: IncidenteApi,
  catalogo: CatalogoApi,
  extras: ExtrasOcorrencia = {},
): Ocorrencia {
  const tipo = catalogo.tipos.get(dto.wasteTypeId);
  const area = catalogo.areas.get(dto.areaId);
  const material = tipo ? (MATERIAL_POR_CATEGORIA[tipo.category] ?? null) : null;
  const titulo = material
    ? METADADOS_MATERIAL[material].rotulo
    : tipo
      ? (ROTULO_CATEGORIA[tipo.category] ?? "Resíduo")
      : "Resíduo";

  const criadaEm = instanteUtc(dto.registeredAt);
  const codigo = codigoDaOcorrencia(dto.id);
  const autor = extras.autorNome ?? "Colaborador";
  const status: StatusOcorrencia =
    dto.status === "CLOSED" ? "aprovada" : "classificada";

  const classificacao =
    extras.classificacao ??
    (extras.relatorio
      ? classificacaoDoRelatorio(extras.relatorio, material)
      : null);

  const historico: EventoOcorrencia[] = [
    {
      id: `${codigo}-e1`,
      tipo: "registro",
      autor,
      texto: "registrou a ocorrência",
      em: criadaEm,
    },
  ];
  if (extras.relatorio) {
    historico.push({
      id: `${codigo}-e2`,
      tipo: "ia",
      autor: "IA VOLTA",
      texto: extras.relatorio.detectedWasteType
        ? `classificou como ${extras.relatorio.detectedWasteType}`
        : "gerou o relatório da ocorrência",
      em: instanteUtc(extras.relatorio.generatedAt),
    });
  }

  return {
    id: dto.id,
    codigo,
    titulo,
    descricao: dto.employeeDescription,
    pesoKg: dto.estimatedQuantity ?? 0,
    prioridade: PRIORIDADE_DA_API[dto.priority] ?? "media",
    fotoUrl: dto.photoUrl ?? fotoExemplo,
    localizacao: {
      setor: area?.sectorName ?? "Setor não informado",
      unidade: area?.locationDescription ?? "",
    },
    material,
    status,
    classificacao,
    cooperativaId: null,
    criadaEm,
    atualizadaEm: criadaEm,
    criadaPor: dto.userId,
    criadaPorNome: autor,
    qualidade: "A",
    perigoso:
      tipo?.wasteClass === "CLASSE_I" || dto.contaminationLevel === "HIGH",
    setorDestino: null,
    motivoRecusa: null,
    ultimaAlteracao: null,
    historico,
  };
}
