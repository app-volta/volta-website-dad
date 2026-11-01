import type {
  AreaApi,
  HistoricoColetaApi,
  IncidenteApi,
  NovoIncidenteApi,
  RelatorioIaApi,
  TipoResiduoApi,
} from "../types/api";
import type { ClassificacaoIA, OpcaoTipoResiduo } from "../types/classificacao";
import type { Material } from "../types/material";
import { METADADOS_MATERIAL } from "../types/material";
import type {
  EventoOcorrencia,
  NovaClassificacao,
  NovaOcorrencia,
  Ocorrencia,
  PrioridadeOcorrencia,
  QualidadeMaterial,
  ResultadoDaAprovacao,
  StatusOcorrencia,
} from "../types/ocorrencia";
import { carregar, salvar } from "../utils/armazenamento";
import { arquivoDaFoto } from "../utils/arquivo";
import {
  PRIORIDADE_PARA_API,
  RISCO_DA_CONTAMINACAO,
  analiseInconclusiva,
  categoriaDaApi,
  classificacaoDaAnalise,
  eventoDaColeta,
  ocorrenciaDaApi,
  opcoesDeTipo,
  tipoDaAnalise,
} from "./adaptadores";
import type { CatalogoApi } from "./adaptadores";
import { analisarFoto } from "./chatbot";
import { historicoDaColeta, listarColetas } from "./coletas";
import { nomesDasCooperativas } from "./cooperativasBrutas";
import { ENVIO_DE_FOTOS_CONFIGURADO, enviarFotoDaOcorrencia } from "./imagens";
import {
  ErroHttp,
  aoEncerrarSessao,
  esperarAte,
  obterUsuarioAtual,
  requisitar,
} from "./http";

/**
 * Ocorrências na volta-api (GET/POST /incidents, PATCH /incidents/{id}/close,
 * GET /incidents/{id}/ai-report). Mantém as mesmas assinaturas do mock.
 *
 * A API ainda não tem recusar, encaminhar, observação nem reclassificação, e o
 * status dela é só PENDING ou CLOSED. Essas quatro ações ficam registradas
 * neste navegador (localStorage, por usuário) e são aplicadas por cima do que a
 * API devolve. O mesmo vale para a análise da IA (recomendação e relatório): a
 * volta-api só a devolve se alguém gravar o laudo, então ela fica guardada neste
 * navegador, por usuário. Quando o backend ganhar os endpoints, só este arquivo muda.
 */

const CHAVE_LOCAIS = "volta:ocorrencias-locais";
const VERSAO_LOCAIS = 1;
const CHAVE_ANALISES = "volta:analises-ia";
const VERSAO_ANALISES = 1;
const MAXIMO_DE_ANALISES = 200;

/** O que foi decidido só neste navegador sobre uma ocorrência. */
interface AlteracaoLocal {
  readonly status?: StatusOcorrencia;
  readonly material?: Material | null;
  readonly qualidade?: QualidadeMaterial;
  readonly prioridade?: PrioridadeOcorrencia;
  readonly perigoso?: boolean;
  readonly setorDestino?: string | null;
  readonly motivoRecusa?: string | null;
  readonly ultimaAlteracao?: string | null;
  readonly atualizadaEm?: string;
  readonly eventos?: readonly EventoOcorrencia[];
}

type AlteracoesLocais = Readonly<Record<string, AlteracaoLocal>>;
type AnalisesGuardadas = Readonly<Record<string, ClassificacaoIA>>;

// Estado do módulo: o que veio da API (`bases`), o que foi decidido localmente
// (`locais`) e o resultado da mistura dos dois (`cache`), que as telas leem.
let bases: readonly Ocorrencia[] = [];
let cache: readonly Ocorrencia[] = [];
let locais: AlteracoesLocais | null = null;
let analises: AnalisesGuardadas | null = null;
let catalogo: Promise<CatalogoApi> | null = null;
let carregouLista = false;
let carregandoLista = false;
const relatorios = new Map<string, RelatorioIaApi>();
const eventosDeColeta = new Map<string, readonly EventoOcorrencia[]>();
const classificacoes = new Map<string, ClassificacaoIA>();
const ouvintes = new Set<() => void>();

function chaveLocais(): string {
  return `${CHAVE_LOCAIS}:${obterUsuarioAtual()?.id ?? "anonimo"}`;
}

function lerLocais(): AlteracoesLocais {
  if (locais === null) {
    locais = carregar<AlteracoesLocais>(chaveLocais(), VERSAO_LOCAIS) ?? {};
  }
  return locais;
}

function chaveAnalises(): string {
  return `${CHAVE_ANALISES}:${obterUsuarioAtual()?.id ?? "anonimo"}`;
}

function lerAnalises(): AnalisesGuardadas {
  if (analises === null) {
    analises = carregar<AnalisesGuardadas>(chaveAnalises(), VERSAO_ANALISES) ?? {};
  }
  return analises;
}

/** Guarda a análise que a pessoa viu, para ela não sumir ao recarregar a página. */
function guardarAnalise(id: string, analise: ClassificacaoIA): void {
  const todas = { ...lerAnalises(), [id]: analise };
  const recentes = Object.entries(todas)
    .sort(([, a], [, b]) => b.analisadaEm.localeCompare(a.analisadaEm))
    .slice(0, MAXIMO_DE_ANALISES);
  analises = Object.fromEntries(recentes);
  salvar(chaveAnalises(), VERSAO_ANALISES, analises);
}

function usar<T>(local: T | undefined, base: T): T {
  return local === undefined ? base : local;
}

function aplicarAlteracoes(base: Ocorrencia): Ocorrencia {
  const alteracao = lerLocais()[base.id];
  if (!alteracao) return base;
  // Se a API já encerrou a ocorrência, o servidor decide.
  const encerrada = base.status === "aprovada";
  return {
    ...base,
    status: encerrada ? base.status : usar(alteracao.status, base.status),
    material: usar(alteracao.material, base.material),
    qualidade: usar(alteracao.qualidade, base.qualidade),
    prioridade: usar(alteracao.prioridade, base.prioridade),
    perigoso: usar(alteracao.perigoso, base.perigoso),
    setorDestino: usar(alteracao.setorDestino, base.setorDestino),
    motivoRecusa: usar(alteracao.motivoRecusa, base.motivoRecusa),
    ultimaAlteracao: usar(alteracao.ultimaAlteracao, base.ultimaAlteracao),
    atualizadaEm: usar(alteracao.atualizadaEm, base.atualizadaEm),
    historico: [...base.historico, ...(alteracao.eventos ?? [])],
  };
}

function notificar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

function publicar(): void {
  cache = bases
    .map(aplicarAlteracoes)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  notificar();
}

function substituirBase(nova: Ocorrencia): void {
  bases = bases.some((item) => item.id === nova.id)
    ? bases.map((item) => (item.id === nova.id ? nova : item))
    : [nova, ...bases];
}

export function assinarMudancas(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function aguardaAprovacao(status: StatusOcorrencia): boolean {
  return status === "classificada" || status === "aguardando_classificacao";
}

/** Ocorrências já carregadas, na ordem da lista; troca de referência a cada mudança. */
export function lerOcorrencias(): readonly Ocorrencia[] {
  return cache;
}

export function quantidadeAguardando(): number {
  return cache.filter((item) => aguardaAprovacao(item.status)).length;
}

export function semelhantesNaSemana(ocorrencia: Ocorrencia): number {
  const limite = Date.now() - 7 * 86_400_000;
  return cache.filter(
    (item) =>
      item.titulo === ocorrencia.titulo &&
      item.localizacao.setor === ocorrencia.localizacao.setor &&
      new Date(item.criadaEm).getTime() >= limite &&
      item.criadaEm <= ocorrencia.criadaEm,
  ).length;
}

/** Áreas da empresa e tipos de resíduo, buscados uma vez por sessão. */
function carregarCatalogo(): Promise<CatalogoApi> {
  if (catalogo === null) {
    catalogo = Promise.all([
      requisitar<readonly AreaApi[]>("/areas/mine"),
      requisitar<readonly TipoResiduoApi[]>("/waste-types"),
    ])
      .then(([areas, tipos]) => ({
        areas: new Map(areas.map((area) => [area.id, area])),
        tipos: new Map(
          tipos.map((tipo) => [tipo.id, { ...tipo, category: categoriaDaApi(tipo.category) }]),
        ),
      }))
      .catch((excecao: unknown) => {
        catalogo = null;
        throw excecao;
      });
  }
  return catalogo;
}

/** Áreas (setores) da empresa da pessoa logada, com o id que a API usa. */
export async function listarAreas(): Promise<readonly AreaApi[]> {
  const cat = await carregarCatalogo();
  return [...cat.areas.values()];
}

/** Setores da empresa da pessoa logada (GET /areas/mine). */
export async function listarSetores(
  sinal?: AbortSignal,
): Promise<readonly string[]> {
  const cat = await esperarAte(carregarCatalogo(), sinal);
  return [...cat.areas.values()]
    .map((area) => area.sectorName)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function nomeDoAutor(userId: string): string | undefined {
  const atual = obterUsuarioAtual();
  return atual?.id === userId ? atual.nome : undefined;
}

function daApi(dto: IncidenteApi, cat: CatalogoApi): Ocorrencia {
  return ocorrenciaDaApi(dto, cat, {
    relatorio: relatorios.get(dto.id) ?? null,
    classificacao: classificacoes.get(dto.id) ?? lerAnalises()[dto.id] ?? null,
    coleta: eventosDeColeta.get(dto.id),
    autorNome: nomeDoAutor(dto.userId),
  });
}

export async function listarOcorrencias(
  sinal?: AbortSignal,
): Promise<readonly Ocorrencia[]> {
  const [incidentes, cat] = await Promise.all([
    requisitar<readonly IncidenteApi[]>("/incidents", { sinal }),
    carregarCatalogo(),
  ]);
  // Fotos enviadas nesta sessão só existem em memória; preserva ao recarregar.
  const fotos = new Map(bases.map((item) => [item.id, item.fotoUrl]));
  bases = incidentes.map((dto) => {
    const item = daApi(dto, cat);
    const foto = fotos.get(dto.id);
    return foto?.startsWith("data:") ? { ...item, fotoUrl: foto } : item;
  });
  carregouLista = true;
  publicar();
  return cache;
}

/** Faz o primeiro carregamento para contadores (menu, notificações) sem esperar uma tela. */
export function garantirCarregado(): void {
  if (carregouLista || carregandoLista) return;
  carregandoLista = true;
  listarOcorrencias()
    .catch(() => undefined)
    .finally(() => {
      carregandoLista = false;
    });
}

function buscarRelatorio(
  id: string,
  sinal?: AbortSignal,
): Promise<RelatorioIaApi | null> {
  return requisitar<RelatorioIaApi>(`/incidents/${id}/ai-report`, {
    sinal,
  }).catch((excecao: unknown) => {
    // A IA pode ainda não ter gerado o relatório.
    if (excecao instanceof ErroHttp && excecao.status === 404) return null;
    throw excecao;
  });
}

/**
 * Linha do tempo da coleta da ocorrência (GET /collections e
 * /collections/{id}/history, só ADMIN e MANAGER). Sem permissão ou sem coleta,
 * não há eventos; qualquer falha aqui não impede de abrir a ocorrência.
 */
async function buscarEventosDeColeta(
  incidenteId: string,
  sinal?: AbortSignal,
): Promise<readonly EventoOcorrencia[]> {
  try {
    const coletas = (await listarColetas()).filter(
      (coleta) => coleta.incidentId === incidenteId,
    );
    if (coletas.length === 0) return [];
    const nomes = await nomesDasCooperativas().catch(() => new Map<string, string>());
    const historicos = await Promise.all(
      coletas.map(async (coleta) => {
        const itens: readonly HistoricoColetaApi[] = await historicoDaColeta(
          coleta.id,
          sinal,
        ).catch(() => []);
        return itens.map((item) =>
          eventoDaColeta(item, nomes.get(coleta.cooperativeId)),
        );
      }),
    );
    return historicos.flat();
  } catch {
    return [];
  }
}

const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function obterOcorrencia(
  id: string,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  if (!FORMATO_UUID.test(id)) {
    throw new ErroHttp("Ocorrência não encontrada.", 404);
  }
  const [incidente, cat, relatorio, coleta] = await Promise.all([
    requisitar<IncidenteApi>(`/incidents/${id}`, { sinal }),
    carregarCatalogo(),
    buscarRelatorio(id, sinal),
    buscarEventosDeColeta(id, sinal),
  ]);
  if (relatorio) relatorios.set(id, relatorio);
  eventosDeColeta.set(id, coleta);
  const anterior = bases.find((item) => item.id === id);
  const base = daApi(incidente, cat);
  substituirBase(
    anterior?.fotoUrl.startsWith("data:")
      ? { ...base, fotoUrl: anterior.fotoUrl }
      : base,
  );
  publicar();
  return localizar(id);
}

function localizar(id: string): Ocorrencia {
  const encontrada = cache.find((item) => item.id === id);
  if (!encontrada) throw new Error(`Ocorrência ${id} não encontrada.`);
  return encontrada;
}

const NOME_DO_PERFIL: Readonly<Record<string, string>> = {
  ADMIN: "administrador",
  MANAGER: "gestor",
  OPERATOR: "operador",
};

/** A volta-api só deixa o perfil EMPLOYEE criar ocorrência; avisar antes poupa a análise da IA. */
function mensagemSePerfilNaoRegistra(): string | null {
  const perfil = obterUsuarioAtual()?.perfil;
  if (perfil === undefined || perfil === "EMPLOYEE") return null;
  return `Só colaboradores registram ocorrências, e você entrou como ${NOME_DO_PERFIL[perfil] ?? "outro perfil"}. Saia e entre com um usuário colaborador.`;
}

/** Tipos de resíduo que a pessoa pode escolher ao conferir a análise (um por categoria). */
export async function listarOpcoesDeTipo(
  sinal?: AbortSignal,
): Promise<readonly OpcaoTipoResiduo[]> {
  return opcoesDeTipo(await esperarAte(carregarCatalogo(), sinal));
}

/**
 * Análise da foto pela IA, antes de registrar. Nada é gravado: a pessoa confere
 * (e corrige, se precisar) o que a IA viu e só então a ocorrência é criada.
 */
export async function analisarOcorrencia(
  fotoBase64: string,
  sinal?: AbortSignal,
): Promise<ClassificacaoIA> {
  const semPermissao = mensagemSePerfilNaoRegistra();
  if (semPermissao) throw new Error(semPermissao);

  const [cat, analise] = await Promise.all([
    carregarCatalogo(),
    analisarFoto(arquivoDaFoto(fotoBase64), sinal),
  ]);

  if (analiseInconclusiva(analise)) {
    throw new Error(
      "A IA não conseguiu confirmar o resíduo nesta foto. Tente outra foto, com o resíduo bem visível e boa iluminação.",
    );
  }
  const classificacao = classificacaoDaAnalise(analise);
  const tipo = tipoDaAnalise(classificacao, cat);
  if (!tipo) {
    throw new Error(
      `O tipo de resíduo "${analise.detected_waste_type}" ainda não está cadastrado na VOLTA.`,
    );
  }
  return { ...classificacao, tipoResiduoId: tipo.id };
}

/**
 * Envia a foto ao serviço de imagens e devolve o endereço dela. Se o envio falhar
 * (ou não estiver configurado), a ocorrência segue sem foto em vez de se perder.
 */
async function guardarFoto(foto: File, sinal?: AbortSignal): Promise<string | null> {
  if (!ENVIO_DE_FOTOS_CONFIGURADO) return null;
  try {
    return await enviarFotoDaOcorrencia(foto, sinal);
  } catch (excecao) {
    if (sinal?.aborted) throw excecao;
    return null;
  }
}

export async function criarOcorrencia(
  entrada: NovaOcorrencia,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  const semPermissao = mensagemSePerfilNaoRegistra();
  if (semPermissao) throw new Error(semPermissao);

  const cat = await carregarCatalogo();
  const area = [...cat.areas.values()].find(
    (item) => item.sectorName === entrada.localizacao.setor,
  );
  if (!area) {
    throw new Error("Escolha um setor cadastrado para a sua empresa.");
  }

  const { classificacao } = entrada;
  const tipo = tipoDaAnalise(classificacao, cat);
  if (!tipo) {
    throw new Error("O tipo de resíduo escolhido não está cadastrado na VOLTA.");
  }

  const endereco = await guardarFoto(arquivoDaFoto(entrada.fotoBase64), sinal);

  const peso = classificacao.pesoEstimadoKg ?? null;
  const corpo: NovoIncidenteApi = {
    areaId: area.id,
    wasteTypeId: tipo.id,
    photoUrl: endereco,
    employeeDescription: entrada.descricao,
    contaminationLevel: classificacao.contaminacao
      ? RISCO_DA_CONTAMINACAO[classificacao.contaminacao]
      : null,
    estimatedQuantity: peso === null ? null : Math.round(peso * 100) / 100,
    priority: PRIORIDADE_PARA_API[entrada.prioridade],
  };

  const criado = await requisitar<IncidenteApi>("/incidents", {
    metodo: "POST",
    corpo,
    sinal,
  }).catch((excecao: unknown) => {
    // Sessão antiga, sem o perfil guardado: a API recusa e a mensagem explica o motivo.
    if (excecao instanceof ErroHttp && excecao.status === 403) {
      throw new Error(
        "Só colaboradores registram ocorrências. Saia e entre com um usuário colaborador.",
      );
    }
    throw excecao;
  });
  classificacoes.set(criado.id, classificacao);
  guardarAnalise(criado.id, classificacao);
  // Sem endereço, a foto só existe nesta sessão (em memória) e a tela avisa.
  substituirBase({
    ...daApi(criado, cat),
    fotoUrl: criado.photoUrl ?? entrada.fotoBase64,
    criadaPorNome: entrada.autorNome,
  });
  publicar();
  return localizar(criado.id);
}

function salvarLocais(proximos: AlteracoesLocais): void {
  locais = proximos;
  salvar(chaveLocais(), VERSAO_LOCAIS, proximos);
}

function registrarLocal(
  id: string,
  mudanca: Omit<AlteracaoLocal, "eventos" | "atualizadaEm">,
  evento: Pick<EventoOcorrencia, "tipo" | "autor" | "texto">,
): Ocorrencia {
  const atual = localizar(id);
  const agora = new Date().toISOString();
  const anterior = lerLocais()[id] ?? {};
  const eventos = anterior.eventos ?? [];
  salvarLocais({
    ...lerLocais(),
    [id]: {
      ...anterior,
      ...mudanca,
      atualizadaEm: agora,
      eventos: [
        ...eventos,
        { ...evento, id: `${atual.codigo}-l${eventos.length + 1}`, em: agora },
      ],
    },
  });
  publicar();
  return localizar(id);
}

async function encerrarNaApi(id: string, sinal?: AbortSignal): Promise<void> {
  await requisitar<void>(`/incidents/${id}/close`, { metodo: "PATCH", sinal });
  bases = bases.map((item) =>
    item.id === id ? { ...item, status: "aprovada" } : item,
  );
}

export async function aprovarOcorrencia(
  id: string,
  autor: string,
  sinal?: AbortSignal,
): Promise<Ocorrencia> {
  await encerrarNaApi(id, sinal);
  return registrarLocal(
    id,
    { status: "aprovada" },
    { tipo: "aprovacao", autor, texto: "aprovou a ocorrência" },
  );
}

export async function aprovarOcorrencias(
  ids: readonly string[],
  autor: string,
  sinal?: AbortSignal,
): Promise<ResultadoDaAprovacao> {
  const elegiveis = ids.filter((id) => {
    const item = cache.find((ocorrencia) => ocorrencia.id === id);
    return item !== undefined && aguardaAprovacao(item.status);
  });
  const resultados = await Promise.allSettled(
    elegiveis.map((id) => aprovarOcorrencia(id, autor, sinal)),
  );
  const falhas = resultados.flatMap((resultado, indice) =>
    resultado.status === "rejected"
      ? [
          {
            id: elegiveis[indice],
            motivo:
              resultado.reason instanceof Error
                ? resultado.reason.message
                : "Não foi possível aprovar.",
          },
        ]
      : [],
  );
  const aprovadas = resultados.length - falhas.length;
  // Se nenhuma foi aprovada, mostra o motivo; se algumas foram, devolve o resultado.
  const primeira = resultados.find((r) => r.status === "rejected");
  if (aprovadas === 0 && primeira) throw primeira.reason;
  return { aprovadas, falhas };
}

export async function recusarOcorrencia(
  id: string,
  motivo: string,
  autor: string,
): Promise<Ocorrencia> {
  return registrarLocal(
    id,
    { status: "recusada", motivoRecusa: motivo },
    { tipo: "recusa", autor, texto: `recusou a ocorrência · ${motivo}` },
  );
}

export async function encaminharOcorrencia(
  id: string,
  setor: string,
  mensagem: string,
  autor: string,
): Promise<Ocorrencia> {
  const recado = mensagem.trim();
  return registrarLocal(
    id,
    { status: "encaminhada", setorDestino: setor },
    {
      tipo: "encaminhamento",
      autor,
      texto: recado
        ? `encaminhou para ${setor} · “${recado}”`
        : `encaminhou para ${setor}`,
    },
  );
}

export async function registrarObservacao(
  id: string,
  texto: string,
  autor: string,
): Promise<Ocorrencia> {
  return registrarLocal(
    id,
    {},
    {
      tipo: "observacao",
      autor,
      texto: `adicionou uma observação · ${texto.trim()}`,
    },
  );
}

const PRIORIDADE_POR_EXTENSO: Readonly<Record<PrioridadeOcorrencia, string>> = {
  alta: "alta",
  media: "média",
  baixa: "baixa",
};

export async function alterarClassificacao(
  id: string,
  nova: NovaClassificacao,
  autor: string,
): Promise<Ocorrencia> {
  const atual = localizar(id);
  const antes = `${atual.material ? METADADOS_MATERIAL[atual.material].rotulo : atual.titulo} ${atual.qualidade}`;
  const depois = `${METADADOS_MATERIAL[nova.material].rotulo} ${nova.qualidade}`;
  const resumo = `${antes} → ${depois} · prioridade ${PRIORIDADE_POR_EXTENSO[nova.prioridade]}`;
  return registrarLocal(
    id,
    {
      material: nova.material,
      qualidade: nova.qualidade,
      prioridade: nova.prioridade,
      perigoso: nova.perigoso,
      ultimaAlteracao: resumo,
    },
    {
      tipo: "classificacao",
      autor,
      texto: `alterou a classificação · ${resumo}`,
    },
  );
}

/** Esquece tudo da sessão anterior; chamado ao entrar e ao sair. */
function reiniciar(): void {
  bases = [];
  cache = [];
  locais = null;
  analises = null;
  catalogo = null;
  carregouLista = false;
  relatorios.clear();
  eventosDeColeta.clear();
  classificacoes.clear();
  notificar();
}

aoEncerrarSessao(reiniciar);
