import fotoExemplo from "../assets/foto-exemplo.svg";
import type {
  AnaliseResiduoApi,
  AreaApi,
  CategoriaResiduoApi,
  CooperativaApi,
  HistoricoColetaApi,
  IncidenteApi,
  PerfilApi,
  PrioridadeApi,
  RelatorioIaApi,
  RespostaChatApi,
  RiscoApi,
  StatusColetaApi,
  TipoResiduoApi,
  UsuarioApi,
} from "../types/api";
import type {
  ClassificacaoIA,
  NivelContaminacao,
} from "../types/classificacao";
import type { Cooperativa, MaterialAceito, PosicaoMapa } from "../types/cooperativa";
import type { MembroEquipe, PapelEquipe } from "../types/equipe";
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
import { instanteUtc } from "../utils/datas";
import { mascararCnpj } from "../utils/formatacao";
import type { VolumeDaCooperativa } from "../utils/volumeCooperativas";

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
    empresaId: dto.companyId,
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

/**
 * Perfil da API → papel mostrado na equipe. Pelas descrições da tela, o
 * responsável técnico "revisa, encaminha e aprova" (MANAGER) e o gestor tem
 * "tudo" (ADMIN); quem só registra é colaborador (EMPLOYEE e OPERATOR).
 */
const PAPEL_DA_EQUIPE_POR_PERFIL: Readonly<Record<PerfilApi, PapelEquipe>> = {
  ADMIN: "gestor",
  MANAGER: "responsavel_tecnico",
  EMPLOYEE: "colaborador",
  OPERATOR: "colaborador",
};

const PERFIL_POR_PAPEL_DA_EQUIPE: Readonly<Record<PapelEquipe, PerfilApi>> = {
  gestor: "ADMIN",
  responsavel_tecnico: "MANAGER",
  colaborador: "EMPLOYEE",
};

export function perfilDoPapel(papel: PapelEquipe): PerfilApi {
  return PERFIL_POR_PAPEL_DA_EQUIPE[papel];
}

/** Pessoa da API na tabela da equipe. Setor a API não informa; "convite pendente" não existe lá. */
export function membroDaApi(
  dto: UsuarioApi,
  registrosNoMes: number,
  ultimaAtividade: string | null,
): MembroEquipe {
  return {
    id: dto.id,
    nome: dto.name,
    email: dto.email,
    papel: PAPEL_DA_EQUIPE_POR_PERFIL[dto.role] ?? "colaborador",
    setor: null,
    registrosNoMes,
    ultimaAtividade,
    convitePendente: false,
  };
}

/** Categoria que a cooperativa recebe → material mostrado no painel. As demais não têm rótulo no app. */
const MATERIAL_ACEITO_POR_CATEGORIA: Readonly<
  Partial<Record<CategoriaResiduoApi, MaterialAceito>>
> = {
  PAPEL: "papelao",
  PLASTICO: "plastico",
  METAL: "metal",
  VIDRO: "vidro",
  ORGANICO: "organico",
  PERIGOSO: "oleo",
};

const CATEGORIA_POR_MATERIAL_ACEITO: Readonly<
  Record<MaterialAceito, CategoriaResiduoApi>
> = {
  papelao: "PAPEL",
  papel_misto: "PAPEL",
  plastico: "PLASTICO",
  metal: "METAL",
  vidro: "VIDRO",
  organico: "ORGANICO",
  oleo: "PERIGOSO",
};

/** "PAPEL,PLASTICO" para o cadastro na API, sem repetir categoria. */
export function especialidadesDosMateriais(
  materiais: readonly MaterialAceito[],
): string {
  return [...new Set(materiais.map((m) => CATEGORIA_POR_MATERIAL_ACEITO[m]))].join(",");
}

function materiaisDasEspecialidades(especialidades: string): MaterialAceito[] {
  const encontrados = especialidades
    .split(",")
    .map((item) => MATERIAL_ACEITO_POR_CATEGORIA[item.trim() as CategoriaResiduoApi])
    .filter((material): material is MaterialAceito => material !== undefined);
  return [...new Set(encontrados)];
}

/** CNPJ numérico ganha máscara; o alfanumérico (formato novo) fica como a API devolve. */
function cnpjParaExibir(cnpj: string): string {
  return /^\d{14}$/.test(cnpj) ? mascararCnpj(cnpj) : cnpj;
}

const MARGEM_MAPA_X = { min: 12, max: 88 } as const;
const MARGEM_MAPA_Y = { min: 18, max: 82 } as const;

function escalar(
  valor: number,
  menor: number,
  maior: number,
  margem: { readonly min: number; readonly max: number },
): number {
  if (maior === menor) return (margem.min + margem.max) / 2;
  return margem.min + ((valor - menor) / (maior - menor)) * (margem.max - margem.min);
}

/**
 * Posição ilustrativa no mapa: as coordenadas reais, proporcionais entre si e
 * ajustadas ao quadro (norte em cima). Não é um mapa de verdade.
 */
export function posicoesNoMapa(
  lista: readonly CooperativaApi[],
): ReadonlyMap<string, PosicaoMapa> {
  const latitudes = lista.map((c) => c.latitude);
  const longitudes = lista.map((c) => c.longitude);
  const [sul, norte] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [oeste, leste] = [Math.min(...longitudes), Math.max(...longitudes)];
  return new Map(
    lista.map((c) => [
      c.id,
      {
        x: Number(escalar(c.longitude, oeste, leste, MARGEM_MAPA_X).toFixed(1)),
        y: Number((MARGEM_MAPA_Y.min + MARGEM_MAPA_Y.max - escalar(c.latitude, sul, norte, MARGEM_MAPA_Y)).toFixed(1)),
      },
    ]),
  );
}

/**
 * Cooperativa da API no formato das telas. A API guarda nome, CNPJ, sede,
 * nota e as categorias aceitas; o resto (contato, distância, capacidade e
 * licença) não existe lá e fica vazio.
 */
export function cooperativaDaApi(
  dto: CooperativaApi,
  posicaoMapa: PosicaoMapa,
  volume: VolumeDaCooperativa,
): Cooperativa {
  return {
    id: dto.id,
    nome: dto.name,
    cnpj: cnpjParaExibir(dto.cnpj),
    cidade: "",
    estado: "",
    materiaisAceitos: materiaisDasEspecialidades(dto.specialties),
    contato: null,
    telefone: null,
    email: null,
    distanciaKm: null,
    avaliacao: dto.averageRating,
    situacao: "ativa",
    parceiraGrupo: false,
    capacidadeMesKg: null,
    usadoMesKg: volume.usadoMesKg,
    licencaMonitorada: false,
    licencaValidaAte: null,
    licencaDocumento: null,
    volumeMensalKg: volume.volumeMensalKg,
    posicaoMapa,
  };
}

const TEXTO_DO_STATUS_DA_COLETA: Readonly<Record<StatusColetaApi, string>> = {
  REQUESTED: "recebeu o pedido de coleta",
  SCHEDULED: "agendou a coleta",
  IN_PROGRESS: "iniciou a coleta",
  COMPLETED: "concluiu a coleta",
  CANCELED: "cancelou a coleta",
};

/** Uma mudança de status da coleta como evento da linha do tempo da ocorrência. */
export function eventoDaColeta(
  historico: HistoricoColetaApi,
  nomeDaCooperativa: string | undefined,
): EventoOcorrencia {
  const observacao = historico.observation?.trim();
  const texto = TEXTO_DO_STATUS_DA_COLETA[historico.status] ?? "atualizou a coleta";
  return {
    id: `coleta-${historico.id}`,
    tipo: "coleta",
    autor: nomeDaCooperativa ?? "Cooperativa",
    texto: observacao ? `${texto} · ${observacao}` : texto,
    em: instanteUtc(historico.changedAt),
  };
}

export interface ExtrasOcorrencia {
  readonly relatorio?: RelatorioIaApi | null;
  readonly coleta?: readonly EventoOcorrencia[];
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

  // A coleta acontece depois do registro: mantém a linha do tempo em ordem.
  historico.push(...(extras.coleta ?? []));
  historico.sort((a, b) => a.em.localeCompare(b.em));

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
