/**
 * Contratos da volta-api, exatamente como o backend os envia e recebe.
 *
 * Ficam separados dos tipos de domínio do app (Usuario, Ocorrencia...). A
 * tradução entre os dois lados acontece em src/services/adaptadores.ts, então
 * uma mudança no backend altera um arquivo só.
 */

export type PerfilApi = "ADMIN" | "MANAGER" | "EMPLOYEE" | "OPERATOR";

export type RiscoApi = "LOW" | "MEDIUM" | "HIGH";

export type PrioridadeApi = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type StatusIncidenteApi = "PENDING" | "CLOSED";

export type CategoriaResiduoApi =
  | "PAPEL"
  | "PLASTICO"
  | "VIDRO"
  | "METAL"
  | "MADEIRA"
  | "PERIGOSO"
  | "SAUDE"
  | "RADIOATIVO"
  | "ORGANICO"
  | "NAO_RECICLAVEL";

/** POST /auth/login */
export interface CredenciaisApi {
  readonly email: string;
  readonly password: string;
}

/** Resposta de POST /auth/login. `expiresIn` vem em milissegundos. */
export interface TokenApi {
  readonly token: string;
  readonly expiresIn: number;
}

/** GET /users/me */
export interface UsuarioApi {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly position: string | null;
  readonly companyId: string;
  readonly role: PerfilApi;
}

/** PUT /users/me: a pessoa altera só o próprio nome e cargo. */
export interface AtualizacaoPerfilApi {
  readonly name: string;
  readonly position: string | null;
}

/** GET /companies/{id} (somente ADMIN). */
export interface EmpresaApi {
  readonly id: string;
  readonly name: string;
  readonly cnpj: string;
  readonly address: string | null;
}

/** GET /areas/mine */
export interface AreaApi {
  readonly id: string;
  readonly companyId: string;
  readonly sectorName: string;
  readonly locationDescription: string | null;
}

/** GET /waste-types */
export interface TipoResiduoApi {
  readonly id: string;
  readonly category: CategoriaResiduoApi;
  readonly description: string | null;
  readonly defaultRiskLevel: RiscoApi;
  readonly color: string | null;
  readonly wasteClass: "CLASSE_I" | "CLASSE_II";
}

/** GET /incidents e GET /incidents/{id}. `registeredAt` está em UTC, sem fuso. */
export interface IncidenteApi {
  readonly id: string;
  readonly companyId: string;
  readonly userId: string;
  readonly areaId: string;
  readonly wasteTypeId: string;
  readonly photoUrl: string | null;
  readonly employeeDescription: string;
  readonly contaminationLevel: RiscoApi | null;
  readonly estimatedQuantity: number | null;
  readonly priority: PrioridadeApi;
  readonly status: StatusIncidenteApi;
  readonly registeredAt: string;
}

/** POST /incidents (somente o perfil EMPLOYEE registra). */
export interface NovoIncidenteApi {
  readonly areaId: string;
  readonly wasteTypeId: string;
  readonly photoUrl: string | null;
  readonly employeeDescription: string;
  readonly contaminationLevel: RiscoApi | null;
  readonly estimatedQuantity: number | null;
  readonly priority: PrioridadeApi;
}

/** GET /incidents/{id}/ai-report */
export interface RelatorioIaApi {
  readonly id: string;
  readonly incidentId: string;
  readonly detectedWasteType: string | null;
  readonly aiContaminationLevel: RiscoApi | null;
  readonly recommendations: string | null;
  readonly reportText: string | null;
  readonly generatedAt: string;
}

/** GET /esg/metrics (ADMIN e MANAGER). Os decimais chegam como número. */
export interface MetricaEsgApi {
  readonly id: string;
  readonly companyId: string;
  /** Mês de referência, AAAA-MM. */
  readonly period: string;
  readonly totalWasteKg: number;
  readonly totalRecycledKg: number;
  readonly recyclingPercentage: number;
  readonly calculatedAt: string;
}

/** GET /esg/score (ADMIN e MANAGER). */
export interface ScoreEsgApi {
  readonly companyId: string;
  readonly score: number;
}

export type StatusColetaApi =
  | "REQUESTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

/** GET /collections (ADMIN e MANAGER). */
export interface ColetaApi {
  readonly id: string;
  readonly incidentId: string;
  readonly cooperativeId: string;
  readonly requestedAt: string;
  readonly scheduledAt: string | null;
  readonly currentStatus: StatusColetaApi;
  readonly collectionType: string;
  readonly urgent: boolean;
}

/** GET /collections/{id}/history (ADMIN e MANAGER). */
export interface HistoricoColetaApi {
  readonly id: string;
  readonly collectionId: string;
  readonly status: StatusColetaApi;
  readonly changedAt: string;
  readonly observation: string | null;
}

/** GET /cooperatives (somente ADMIN). */
export interface CooperativaApi {
  readonly id: string;
  readonly name: string;
  /** Só dígitos, sem máscara. */
  readonly cnpj: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly averageRating: number | null;
  /** Categorias de resíduo separadas por vírgula: "PAPEL,PLASTICO". */
  readonly specialties: string;
}

/** POST /cooperatives e PUT /cooperatives/{id} (somente ADMIN). */
export interface NovaCooperativaApi {
  readonly name: string;
  readonly cnpj: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly specialties: string;
}

/** POST /users (somente ADMIN): cria a conta, sempre como EMPLOYEE. */
export interface NovoUsuarioApi {
  readonly name: string;
  readonly email: string;
  /** De 8 a 72 caracteres. */
  readonly password: string;
  readonly position: string | null;
  readonly companyId: string;
}

/** PATCH /users/{id}/role (somente ADMIN). */
export interface PerfilNovoApi {
  readonly role: PerfilApi;
}

/* ---- volta-chatbot (FastAPI): as chaves vêm em snake_case ---- */

export type RotaChatApi =
  | "triage"
  | "standards"
  | "data"
  | "performance"
  | "direct"
  | "blocked";

/** POST /v1/sessions */
export interface SessaoChatApi {
  readonly session_id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly created_at: string;
}

/** POST /v1/chat */
export interface PedidoChatApi {
  readonly session_id: string;
  readonly message: string;
}

export interface RespostaCorporativaApi {
  readonly title: string | null;
  readonly answer: string;
  readonly recommended_actions: readonly string[];
  readonly requires_human_validation: boolean;
}

export interface CitacaoChatApi {
  readonly source_id: string;
  readonly title: string;
  readonly corpus: "operational" | "regulatory" | "cooperatives" | "history";
  readonly internal_document: boolean;
  readonly location: string | null;
  readonly url: string | null;
  readonly score: number | null;
  readonly excerpt: string;
  readonly retrieved_at: string | null;
}

export interface OcorrenciaPropostaApi {
  readonly description: string;
  readonly category: string;
  readonly requires_sanitization: boolean;
}

/** Resposta de POST /v1/chat. */
export interface RespostaChatApi {
  readonly request_id: string;
  readonly session_id: string;
  readonly route: RotaChatApi;
  readonly response: RespostaCorporativaApi;
  readonly citations: readonly CitacaoChatApi[];
  readonly proposed_occurrence: OcorrenciaPropostaApi | null;
}

/** Veredito do juiz que revisa a análise visual. */
export interface VereditoJuizApi {
  readonly approved: boolean;
  readonly reason: string | null;
}

/**
 * Resposta de POST /v1/occurrences/predict. `ai_contamination_level` vem como
 * BAIXO, MEDIO ou ALTO; INDETERMINADO quando o juiz não aprova a análise.
 */
export interface AnaliseResiduoApi {
  readonly detected_waste_type: string;
  readonly ai_contamination_level: string;
  readonly estimated_quantity_kg: number | null;
  readonly recommendations: string;
  readonly report_text: string;
  readonly mobile_summary: string;
  readonly requires_human_validation: boolean;
  readonly judge: VereditoJuizApi | null;
  readonly analysis_id: string | null;
  readonly generated_at: string | null;
}

/** GET /v1/occurrences/reports/ai_summary */
export interface ResumoGestaoApi {
  readonly problema_analisado: string;
  readonly recomendacoes: readonly string[];
}

/**
 * GET /v1/occurrences/areas/{id}/predict_capacity. Sem histórico suficiente o
 * servidor responde 400; com poucos dias distintos, devolve só `mensagem`.
 */
export interface PrevisaoCapacidadeApi {
  readonly sucesso?: boolean;
  readonly mensagem?: string;
  readonly dias_projetados?: number;
  readonly data_projetada?: string;
  readonly taxa_geracao_diaria_kg?: number;
  readonly volume_atual_kg?: number;
  readonly volume_estimado_kg?: number;
  readonly capacidade_maxima_kg?: number;
  readonly capacidade_atingida_no_horizonte?: boolean;
  readonly dias_ate_lotacao?: number | null;
  readonly data_estimada_lotacao?: string | null;
}

/* ---- volta-api-redis: ranking de empresas e cooperativas por proximidade ---- */

/** GET /api/v1/ranking/{companyId}/position */
export interface PosicaoEmpresaApi {
  readonly companyId: string;
  /** 1 é a melhor empresa. */
  readonly position: number;
  /** De 0 a 1000. */
  readonly score: number;
  readonly totalCompanies: number;
}

/** GET /api/v1/cooperatives/nearby: só o id e a distância em linha reta. */
export interface CooperativaProximaApi {
  readonly cooperativeId: string;
  readonly distanceKm: number;
}

/** Peso de cada critério na nota da cooperativa, de 0 a 100. */
export interface DetalheDaNotaApi {
  readonly distance: number;
  readonly rating: number;
  readonly fit: number;
}

export interface NotaDaCooperativaApi {
  readonly cooperativeId: string;
  readonly name: string;
  /** De 0 a 100. */
  readonly score: number;
  readonly distanceKm: number;
  readonly breakdown: DetalheDaNotaApi;
}

/** GET /api/v1/incidents/{id}/cooperative-scores: cooperativas indicadas, da melhor para a pior. */
export interface NotasDasCooperativasApi {
  readonly incidentId: string;
  readonly priority: string;
  readonly wasteCategory: string;
  readonly highRisk: boolean;
  readonly radiusKm: number;
  readonly cooperatives: readonly NotaDaCooperativaApi[];
}

/** GET /incidents/{id}/scoring-context (volta-api): de onde a empresa envia o resíduo. */
export interface ContextoDaOcorrenciaApi {
  readonly incidentId: string;
  readonly origin: {
    readonly latitude: number | null;
    readonly longitude: number | null;
  } | null;
}

/** Erros da API seguem o ProblemDetail (RFC 7807). */
export interface ProblemaApi {
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: Readonly<Record<string, string>>;
}
