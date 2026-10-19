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

/** Erros da API seguem o ProblemDetail (RFC 7807). */
export interface ProblemaApi {
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: Readonly<Record<string, string>>;
}
