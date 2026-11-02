import semFoto from "../assets/sem-foto.svg";
import type {
  AnaliseResiduoApi,
  AreaApi,
  CategoriaResiduoApi,
  CooperativaApi,
  HistoricoColetaApi,
  IncidenteApi,
  NotasDasCooperativasApi,
  PerfilApi,
  PrioridadeApi,
  RelatorioIaApi,
  RespostaChatApi,
  RiscoApi,
  StatusColetaApi,
  StatusIncidenteApi,
  TipoResiduoApi,
  UsuarioApi,
} from "../types/api";
import type {
  ClassificacaoIA,
  NivelContaminacao,
  OpcaoTipoResiduo,
} from "../types/classificacao";
import type {
  Cooperativa,
  IndicacaoDeCooperativas,
  MaterialAceito,
  PosicaoMapa,
} from "../types/cooperativa";
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
    perfil: dto.role,
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

/** Palavras que o chatbot grava no lugar do enum da API (BAIXA, MEDIA, ALTA). */
const PRIORIDADE_EM_PORTUGUES: Readonly<Record<string, PrioridadeOcorrencia>> = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
  CRITICA: "alta",
};

/**
 * Prioridade como a volta-api (LOW, MEDIUM, HIGH, CRITICAL) ou o chatbot (baixa,
 * média, alta) gravam. Ocorrência criada pelo chatbot não pode virar "média" só
 * porque a palavra veio em português.
 */
function prioridadeDaApi(valor: string | null | undefined): PrioridadeOcorrencia {
  const chave = normalizar(valor ?? "").toUpperCase();
  return (
    PRIORIDADE_DA_API[chave as PrioridadeApi] ??
    PRIORIDADE_EM_PORTUGUES[chave] ??
    "media"
  );
}

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

/**
 * Contaminação como a volta-api (LOW, MEDIUM, HIGH) ou o chatbot (BAIXO, MEDIO,
 * ALTO) gravam. Qualquer outro valor ("N/A", vazio) fica sem nível.
 */
function contaminacaoDaApi(valor: string | null | undefined): NivelContaminacao | undefined {
  switch (normalizar(valor ?? "").toUpperCase()) {
    case "LOW":
    case "BAIXO":
    case "BAIXA":
      return "baixa";
    case "MEDIUM":
    case "MEDIO":
    case "MEDIA":
      return "media";
    case "HIGH":
    case "ALTO":
    case "ALTA":
      return "alta";
    default:
      return undefined;
  }
}

/** Nível de contaminação da tela no risco que a volta-api guarda. */
export const RISCO_DA_CONTAMINACAO: Readonly<Record<NivelContaminacao, RiscoApi>> = {
  baixa: "LOW",
  media: "MEDIUM",
  alta: "HIGH",
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

/** Análise da foto no formato que as telas leem. */
export function classificacaoDaAnalise(analise: AnaliseResiduoApi): ClassificacaoIA {
  const risco = riscoDaAnalise(analise);
  return {
    material: materialDoTexto(analise.detected_waste_type),
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

/** Um tipo por categoria do catálogo da empresa, para a pessoa corrigir o que a IA detectou. */
export function opcoesDeTipo(catalogo: CatalogoApi): readonly OpcaoTipoResiduo[] {
  const porCategoria = new Map<CategoriaResiduoApi, TipoResiduoApi>();
  for (const tipo of catalogo.tipos.values()) {
    if (!porCategoria.has(tipo.category)) porCategoria.set(tipo.category, tipo);
  }
  return [...porCategoria.values()]
    .map((tipo) => ({
      valor: tipo.id,
      rotulo: ROTULO_CATEGORIA[tipo.category] ?? "Resíduo",
      material: MATERIAL_POR_CATEGORIA[tipo.category] ?? null,
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/**
 * Tipo do catálogo para a análise: o que a pessoa escolheu; senão, o que o
 * texto da IA indica; senão, não reciclável.
 */
export function tipoDaAnalise(
  classificacao: Pick<ClassificacaoIA, "tipoResiduoId" | "tipoDetectado">,
  catalogo: CatalogoApi,
): TipoResiduoApi | undefined {
  const escolhido = classificacao.tipoResiduoId
    ? catalogo.tipos.get(classificacao.tipoResiduoId)
    : undefined;
  if (escolhido) return escolhido;
  const categoria = categoriaDoTexto(classificacao.tipoDetectado ?? "");
  const tipos = [...catalogo.tipos.values()];
  return (
    tipos.find((tipo) => tipo.category === categoria) ??
    tipos.find((tipo) => tipo.category === "NAO_RECICLAVEL")
  );
}

/**
 * O que a própria ocorrência guarda da análise (contaminação e quantidade),
 * para quando nem o relatório da IA nem a análise feita neste navegador existem.
 * Sem recomendação: a volta-api só devolve o laudo da IA se alguém o gravar.
 */
function classificacaoDoIncidente(
  dto: IncidenteApi,
  material: Material | null,
  analisadaEm: string,
): ClassificacaoIA | null {
  if (dto.contaminationLevel === null && dto.estimatedQuantity === null) return null;
  return {
    material,
    contaminacao: contaminacaoDaApi(dto.contaminationLevel),
    recomendacao: "",
    pesoEstimadoKg: dto.estimatedQuantity,
    analisadaEm,
  };
}

export function classificacaoDoRelatorio(
  relatorio: RelatorioIaApi,
  materialDaOcorrencia: Material | null,
): ClassificacaoIA {
  return {
    material: materialDoTexto(relatorio.detectedWasteType) ?? materialDaOcorrencia,
    contaminacao: contaminacaoDaApi(relatorio.aiContaminationLevel),
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

/**
 * O banco do QA veio da carga antiga, com as categorias dos tipos de resíduo em
 * inglês (PAPER, PLASTIC, GLASS...). A API devolve o texto como está, então o app
 * traduz para as categorias que ele conhece. Sem correspondência: não reciclável.
 */
const CATEGORIA_POR_SINONIMO: Readonly<Record<string, CategoriaResiduoApi>> = {
  PAPEL: "PAPEL",
  PAPER: "PAPEL",
  PAPELAO: "PAPEL",
  PLASTICO: "PLASTICO",
  PLASTIC: "PLASTICO",
  VIDRO: "VIDRO",
  GLASS: "VIDRO",
  METAL: "METAL",
  MADEIRA: "MADEIRA",
  WOOD: "MADEIRA",
  PERIGOSO: "PERIGOSO",
  CHEMICAL: "PERIGOSO",
  QUIMICO: "PERIGOSO",
  ELECTRONIC: "PERIGOSO",
  ELETRONICO: "PERIGOSO",
  SAUDE: "SAUDE",
  HEALTH: "SAUDE",
  RADIOATIVO: "RADIOATIVO",
  RADIOACTIVE: "RADIOATIVO",
  ORGANICO: "ORGANICO",
  ORGANIC: "ORGANICO",
  NAO_RECICLAVEL: "NAO_RECICLAVEL",
  MIXED: "NAO_RECICLAVEL",
  TEXTILE: "NAO_RECICLAVEL",
};

export function categoriaDaApi(valor: string | null | undefined): CategoriaResiduoApi {
  const chave = semAcentos(valor ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return CATEGORIA_POR_SINONIMO[chave] ?? "NAO_RECICLAVEL";
}

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

/**
 * Trechos que indicam cada material, em português ou inglês. A API devolve as
 * categorias separadas por vírgula (PAPEL,PLASTICO), mas as cooperativas da
 * carga antiga têm texto livre ("Papel, plástico e vidro"); procurar o trecho
 * cobre os dois.
 */
const TRECHOS_POR_MATERIAL: ReadonlyArray<readonly [MaterialAceito, readonly string[]]> = [
  ["papelao", ["papel", "paper"]],
  ["plastico", ["plastic"]],
  ["metal", ["metal", "aluminio"]],
  ["vidro", ["vidro", "glass"]],
  ["organico", ["organic"]],
  ["oleo", ["oleo", "perigos", "quimic", "chemical", "eletron", "electron"]],
];

function materiaisDasEspecialidades(especialidades: string | null): MaterialAceito[] {
  const texto = semAcentos(especialidades ?? "");
  return TRECHOS_POR_MATERIAL.filter(([, trechos]) =>
    trechos.some((trecho) => texto.includes(trecho)),
  ).map(([material]) => material);
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
 * nota e as categorias aceitas; contato, capacidade e licença não existem lá e
 * ficam vazios. A distância só entra quando se sabe de onde a empresa envia.
 */
export function cooperativaDaApi(
  dto: CooperativaApi,
  posicaoMapa: PosicaoMapa,
  volume: VolumeDaCooperativa,
  distanciaKm: number | null = null,
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
    distanciaKm,
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

/** Resposta da API de ranking no formato das telas. */
export function indicacaoDaApi(
  resposta: NotasDasCooperativasApi,
): IndicacaoDeCooperativas {
  return {
    raioKm: resposta.radiusKm,
    cooperativas: resposta.cooperatives.map((c) => ({
      id: c.cooperativeId,
      nome: c.name,
      nota: c.score,
      distanciaKm: c.distanceKm,
    })),
  };
}

const STATUS_DA_API: Readonly<Record<StatusIncidenteApi, StatusOcorrencia>> = {
  PENDING: "classificada",
  APPROVED: "aprovada",
  REJECTED: "recusada",
  CLOSED: "finalizada",
};

export function statusDaApi(status: StatusIncidenteApi): StatusOcorrencia {
  return STATUS_DA_API[status] ?? "classificada";
}

const GRAVIDADE_DO_RISCO: Readonly<Record<RiscoApi, number>> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

/**
 * A ocorrência pode ter vários tipos de resíduo, mas as telas mostram um só: o
 * mais perigoso e, no empate, o de menor id (a API devolve a lista sem ordem fixa).
 */
function tipoPrincipal(
  tipos: readonly TipoResiduoApi[],
): TipoResiduoApi | undefined {
  const peso = (tipo: TipoResiduoApi): number =>
    (tipo.wasteClass === "CLASSE_I" ? 10 : 0) +
    (GRAVIDADE_DO_RISCO[tipo.defaultRiskLevel] ?? 0);
  return [...tipos]
    .sort((a, b) => a.id.localeCompare(b.id))
    .reduce<TipoResiduoApi | undefined>(
      (melhor, tipo) =>
        melhor === undefined || peso(tipo) > peso(melhor) ? tipo : melhor,
      undefined,
    );
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
  const tipos = dto.wasteTypeIds.flatMap((id) => catalogo.tipos.get(id) ?? []);
  const tipo = tipoPrincipal(tipos);
  const area = catalogo.areas.get(dto.areaId);
  const material = tipo ? (MATERIAL_POR_CATEGORIA[tipo.category] ?? null) : null;
  const rotuloDoTipo = material
    ? METADADOS_MATERIAL[material].rotulo
    : tipo
      ? (ROTULO_CATEGORIA[tipo.category] ?? "Resíduo")
      : "Resíduo";
  // Com mais de um tipo, o título avisa quantos vêm junto: "Plástico +1".
  const titulo =
    tipos.length > 1 ? `${rotuloDoTipo} +${tipos.length - 1}` : rotuloDoTipo;

  const criadaEm = instanteUtc(dto.registeredAt);
  const codigo = codigoDaOcorrencia(dto.id);
  const autor = extras.autorNome ?? "Colaborador";
  const status = statusDaApi(dto.status);

  const classificacao =
    extras.classificacao ??
    (extras.relatorio
      ? classificacaoDoRelatorio(extras.relatorio, material)
      : classificacaoDoIncidente(dto, material, criadaEm));

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
    prioridade: prioridadeDaApi(dto.priority),
    fotoUrl: dto.photoUrl ?? semFoto,
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
      tipos.some((item) => item.wasteClass === "CLASSE_I") ||
      contaminacaoDaApi(dto.contaminationLevel) === "alta",
    setorDestino: null,
    motivoRecusa: dto.status === "REJECTED" ? (dto.changeReason ?? null) : null,
    ultimaAlteracao: null,
    historico,
  };
}
