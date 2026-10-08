import type {
  Configuracoes,
  ParcialConfiguracoes,
} from "../types/configuracao";
import { mesclarConfiguracoes, validarMeta } from "../utils/configuracoes";
import { carregar, salvar } from "../utils/armazenamento";
import { aguardar } from "./http";

/**
 * MOCK: substitua por chamada real quando o backend expuser /configuracoes.
 * Enquanto isso, as preferências ficam no navegador para sobreviver ao reload.
 */

const CHAVE_STORAGE = "volta:configuracoes";
const VERSAO_STORAGE = 1;

/** Quilos recuperados no mês, o mesmo número da Home e do relatório PGRS. */
export const RECUPERADO_NO_MES_KG = 1147;

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
  await aguardar(300, sinal);
  return lerSalvas();
}

export async function salvarConfiguracoes(
  parcial: ParcialConfiguracoes,
  sinal?: AbortSignal,
): Promise<Configuracoes> {
  await aguardar(250, sinal);
  if (parcial.metaRecuperacaoKg !== undefined) {
    const erro = validarMeta(parcial.metaRecuperacaoKg);
    if (erro) throw new Error(erro);
  }
  const atualizadas = mesclarConfiguracoes(lerSalvas(), parcial);
  salvar(CHAVE_STORAGE, VERSAO_STORAGE, atualizadas);
  return atualizadas;
}
