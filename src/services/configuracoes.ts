import type { EmpresaApi, MetaApi } from "../types/api";
import type {
  Configuracoes,
  ParcialConfiguracoes,
  UnidadeConfiguracao,
} from "../types/configuracao";
import { mesclarConfiguracoes, validarMeta } from "../utils/configuracoes";
import { carregar, salvar } from "../utils/armazenamento";
import { mascararCnpj } from "../utils/formatacao";
import {
  aguardar,
  aoEncerrarSessao,
  ErroHttp,
  requisitar,
  USAR_MOCKS,
} from "./http";
import { listarSetores } from "./ocorrencias";

/**
 * A volta-api guarda a meta mensal de reciclagem da empresa (GET e PUT /goals) e
 * os dados do cartão "Unidade" (GET /companies/me, ADMIN e MANAGER, e GET
 * /areas/mine). Ela não tem endpoint de preferências, então notificações e
 * insights ficam no navegador para sobreviver ao reload.
 */

const CHAVE_STORAGE = "volta:configuracoes";
const VERSAO_STORAGE = 1;

const PADRAO: Configuracoes = {
  unidade: {
    nome: "Unidade Frigorífico",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Industrial, 1200 · SP",
    setores: 8,
  },
  metaRecuperacaoKg: 1500,
  notificacoes: {
    novaOcorrencia: true,
    licencaVencendo: true,
    resumoSemanal: true,
    cadaRegistro: false,
  },
  insights: true,
};

const SEM_DADO = "—";

let unidadeDaApi: Promise<UnidadeConfiguracao> | null = null;

/** Meta da API em memória: `null` até a primeira resposta, 0 se a empresa não definiu uma. */
let metaDaApi: number | null = null;
let carregandoMeta: Promise<void> | null = null;
const ouvintesDaMeta = new Set<() => void>();

function avisarMeta(): void {
  for (const ouvinte of ouvintesDaMeta) ouvinte();
}

aoEncerrarSessao(() => {
  unidadeDaApi = null;
  metaDaApi = null;
  carregandoMeta = null;
  avisarMeta();
});

export function assinarMeta(ouvinte: () => void): () => void {
  ouvintesDaMeta.add(ouvinte);
  return () => {
    ouvintesDaMeta.delete(ouvinte);
  };
}

async function carregarMeta(sinal?: AbortSignal): Promise<void> {
  const resposta = await requisitar<MetaApi>("/goals", { sinal });
  metaDaApi = resposta.monthlyKg ?? 0;
  avisarMeta();
}

/** Busca a meta uma vez por sessão, sem esperar uma tela; quem precisa do número assina a mudança. */
export function garantirMetaCarregada(): void {
  if (USAR_MOCKS || metaDaApi !== null || carregandoMeta !== null) return;
  carregandoMeta = carregarMeta()
    .catch(() => undefined)
    .finally(() => {
      carregandoMeta = null;
    });
}

async function gravarMeta(metaKg: number, sinal?: AbortSignal): Promise<void> {
  const resposta = await requisitar<MetaApi>("/goals", {
    metodo: "PUT",
    corpo: { monthlyKg: metaKg },
    sinal,
  });
  metaDaApi = resposta.monthlyKg ?? metaKg;
  avisarMeta();
}

/** Nome, CNPJ e endereço da empresa (ADMIN e MANAGER leem) e quantos setores ela tem. */
function buscarUnidade(): Promise<UnidadeConfiguracao> {
  const empresa = requisitar<EmpresaApi>("/companies/me").catch((excecao: unknown) => {
    if (excecao instanceof ErroHttp && excecao.status === 403) return null;
    throw excecao;
  });
  return Promise.all([empresa, listarSetores()]).then(([dados, setores]) => ({
    nome: dados?.name ?? SEM_DADO,
    cnpj: dados ? mascararCnpj(dados.cnpj) : SEM_DADO,
    endereco: dados?.address ?? SEM_DADO,
    setores: setores.length,
  }));
}

function obterUnidade(): Promise<UnidadeConfiguracao> {
  if (unidadeDaApi === null) {
    unidadeDaApi = buscarUnidade().catch((excecao: unknown) => {
      unidadeDaApi = null;
      throw excecao;
    });
  }
  return unidadeDaApi;
}

/**
 * Com a API, o cartão da unidade mostra a empresa de verdade e a meta é a que a
 * empresa definiu, não o exemplo. `recarregarMeta` busca a meta de novo; depois
 * de gravá-la não precisa, porque a resposta do PUT já a trouxe.
 */
async function comDadosDaApi(
  configuracoes: Configuracoes,
  recarregarMeta: boolean,
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  if (USAR_MOCKS) return configuracoes;
  const [unidade] = await Promise.all([
    obterUnidade(),
    recarregarMeta || metaDaApi === null ? carregarMeta(sinal) : Promise.resolve(),
  ]);
  return { ...configuracoes, unidade, metaRecuperacaoKg: metaRecuperacaoAtual() };
}

function lerSalvas(): Configuracoes {
  const salvas = carregar<Configuracoes>(CHAVE_STORAGE, VERSAO_STORAGE);
  return salvas ? mesclarConfiguracoes(PADRAO, salvas) : PADRAO;
}

/**
 * Leitura síncrona da meta mensal em kg, para telas que só precisam do número.
 * Com a API vale 0 enquanto a empresa não definiu uma meta.
 */
export function metaRecuperacaoAtual(): number {
  return USAR_MOCKS ? lerSalvas().metaRecuperacaoKg : (metaDaApi ?? 0);
}

export async function obterConfiguracoes(
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  await aguardar(USAR_MOCKS ? 300 : 0, sinal);
  return comDadosDaApi(lerSalvas(), true, sinal);
}

export async function salvarConfiguracoes(
  parcial: ParcialConfiguracoes,
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  await aguardar(USAR_MOCKS ? 250 : 0, sinal);
  if (parcial.metaRecuperacaoKg !== undefined) {
    const erro = validarMeta(parcial.metaRecuperacaoKg);
    if (erro) throw new Error(erro);
    if (!USAR_MOCKS) await gravarMeta(parcial.metaRecuperacaoKg, sinal);
  }
  const atualizadas = mesclarConfiguracoes(lerSalvas(), parcial);
  salvar(CHAVE_STORAGE, VERSAO_STORAGE, atualizadas);
  return comDadosDaApi(atualizadas, false, sinal);
}
