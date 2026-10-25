import type { NovoUsuarioApi, PerfilNovoApi, UsuarioApi } from "../types/api";
import type { MembroEquipe, NovoConvite, PapelEquipe } from "../types/equipe";
import { inicioDoMes } from "../utils/painel";
import { membroDaApi, perfilDoPapel } from "./adaptadores";
import { obterUsuarioAtual, requisitar } from "./http";
import { listarOcorrencias } from "./ocorrencias.api";

/**
 * Equipe na volta-api (GET e POST /users, PATCH /users/{id}/role), todos só
 * para ADMIN. A API não tem convite por e-mail: "convidar" cria a conta com a
 * senha informada. Os registros do mês e a última atividade saem das
 * ocorrências de cada pessoa.
 */

const SENHA_MINIMA = 8;

export async function listarEquipe(
  sinal?: AbortSignal,
): Promise<readonly MembroEquipe[]> {
  const [usuarios, ocorrencias] = await Promise.all([
    requisitar<readonly UsuarioApi[]>("/users", { sinal }),
    listarOcorrencias(sinal).catch(() => []),
  ]);
  // GET /users devolve as pessoas de todas as empresas: a tela mostra só a da pessoa logada.
  const empresaId = obterUsuarioAtual()?.empresaId;
  const daEmpresa = empresaId
    ? usuarios.filter((usuario) => usuario.companyId === empresaId)
    : usuarios;

  const inicioDoMesAtual = inicioDoMes(new Date(), 0);
  return daEmpresa.map((usuario) => {
    const dela = ocorrencias.filter((o) => o.criadaPor === usuario.id);
    const noMes = dela.filter((o) => new Date(o.criadaEm).getTime() >= inicioDoMesAtual);
    const ultima = dela.reduce<string | null>(
      (recente, o) => (recente === null || o.criadaEm > recente ? o.criadaEm : recente),
      null,
    );
    return membroDaApi(usuario, noMes.length, ultima);
  });
}

async function definirPapel(id: string, papel: PapelEquipe): Promise<UsuarioApi> {
  const corpo: PerfilNovoApi = { role: perfilDoPapel(papel) };
  return requisitar<UsuarioApi>(`/users/${id}/role`, { metodo: "PATCH", corpo });
}

export async function convidarPessoa(
  convite: NovoConvite,
  sinal?: AbortSignal,
): Promise<MembroEquipe> {
  const nome = convite.nome?.trim() ?? "";
  if (nome.length < 3) throw new Error("Informe o nome da pessoa.");
  if ((convite.senha?.length ?? 0) < SENHA_MINIMA) {
    throw new Error(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
  }
  const empresaId = obterUsuarioAtual()?.empresaId;
  if (!empresaId) {
    throw new Error("Não foi possível identificar a sua empresa. Entre novamente.");
  }

  const corpo: NovoUsuarioApi = {
    name: nome,
    email: convite.email.trim().toLowerCase(),
    password: convite.senha ?? "",
    position: null,
    companyId: empresaId,
  };
  const criado = await requisitar<UsuarioApi>("/users", {
    metodo: "POST",
    corpo,
    sinal,
  });

  // A API cria todo mundo como colaborador; o papel escolhido vem num segundo passo.
  if (perfilDoPapel(convite.papel) === criado.role) return membroDaApi(criado, 0, null);
  try {
    return membroDaApi(await definirPapel(criado.id, convite.papel), 0, null);
  } catch (excecao) {
    const motivo = excecao instanceof Error ? excecao.message : "";
    throw new Error(
      `A pessoa foi cadastrada como colaboradora, mas o papel não pôde ser definido. ${motivo}`.trim(),
    );
  }
}

export async function alterarPapel(
  id: string,
  papel: PapelEquipe,
): Promise<MembroEquipe> {
  return membroDaApi(await definirPapel(id, papel), 0, null);
}

/** Não há convites pendentes na API: a conta nasce ativa. */
export function reenviarConvite(): Promise<void> {
  return Promise.reject(
    new Error("A volta-api não usa convites: a conta já nasce ativa."),
  );
}

export function cancelarConvite(): Promise<void> {
  return reenviarConvite();
}
