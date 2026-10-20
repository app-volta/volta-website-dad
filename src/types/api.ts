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

/** Erros da API seguem o ProblemDetail (RFC 7807). */
export interface ProblemaApi {
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: Readonly<Record<string, string>>;
}
