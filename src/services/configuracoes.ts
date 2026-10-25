import type { EmpresaApi } from "../types/api";
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
  obterUsuarioAtual,
  requisitar,
  USAR_MOCKS,
} from "./http";
import { listarSetores } from "./ocorrencias";

/**
 * A volta-api não tem endpoint de preferências: meta, notificações e insights
 * ficam no navegador para sobreviver ao reload. Só o cartão "Unidade" vem da
 * API (GET /companies/{id}, só ADMIN, e GET /areas/mine).
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

aoEncerrarSessao(() => {
  unidadeDaApi = null;
});

/** Nome, CNPJ e endereço da empresa (só ADMIN lê) e quantos setores ela tem. */
function buscarUnidade(): Promise<UnidadeConfiguracao> {
  const empresaId = obterUsuarioAtual()?.empresaId;
  const empresa = empresaId
    ? requisitar<EmpresaApi>(`/companies/${empresaId}`).catch((excecao: unknown) => {
        if (excecao instanceof ErroHttp && excecao.status === 403) return null;
        throw excecao;
      })
    : Promise.resolve(null);
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

/** Com a API, o cartão da unidade mostra a empresa de verdade, não o exemplo. */
async function comUnidadeDaApi(
  configuracoes: Configuracoes,
): Promise<Configuracoes> {
  if (USAR_MOCKS) return configuracoes;
  return { ...configuracoes, unidade: await obterUnidade() };
}

function lerSalvas(): Configuracoes {
  const salvas = carregar<Configuracoes>(CHAVE_STORAGE, VERSAO_STORAGE);
  return salvas ? mesclarConfiguracoes(PADRAO, salvas) : PADRAO;
}

/** Leitura síncrona da meta, para telas que só precisam do número. */
export function metaRecuperacaoAtual(): number {
  return lerSalvas().metaRecuperacaoKg;
}

export async function obterConfiguracoes(
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  await aguardar(USAR_MOCKS ? 300 : 0, sinal);
  return comUnidadeDaApi(lerSalvas());
}

export async function salvarConfiguracoes(
  parcial: ParcialConfiguracoes,
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  await aguardar(USAR_MOCKS ? 250 : 0, sinal);
  if (parcial.metaRecuperacaoKg !== undefined) {
    const erro = validarMeta(parcial.metaRecuperacaoKg);
    if (erro) throw new Error(erro);
  }
  const atualizadas = mesclarConfiguracoes(lerSalvas(), parcial);
  salvar(CHAVE_STORAGE, VERSAO_STORAGE, atualizadas);
  return comUnidadeDaApi(atualizadas);
}
