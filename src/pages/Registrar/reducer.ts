import type { ClassificacaoIA } from "../../types/classificacao";

export type Etapa = "detalhes" | "analise" | "sucesso";

export type Prioridade = "baixa" | "media" | "alta";

/** O que a pessoa pode corrigir no que a IA encontrou antes de registrar. */
export type AjusteDaAnalise = Partial<
  Pick<
    ClassificacaoIA,
    "tipoResiduoId" | "tipoDetectado" | "material" | "contaminacao" | "pesoEstimadoKg"
  >
>;

export interface EstadoRegistrar {
  readonly etapa: Etapa;
  readonly fotoBase64: string | null;
  readonly descricao: string;
  readonly setor: string;
  readonly prioridade: Prioridade;
  readonly avisarResponsavel: boolean;
  readonly erroCampo: Readonly<Record<string, string>>;
  readonly erroEnvio: string | null;
  /** O que a IA viu na foto, com as correções da pessoa; nada foi gravado ainda. */
  readonly classificacao: ClassificacaoIA | null;
  /** Tipo, contaminação e quantidade estão abertos para correção. */
  readonly editando: boolean;
  /** A ocorrência está sendo enviada à API. */
  readonly registrando: boolean;
  readonly codigoGerado: string | null;
  /** A foto chegou ao serviço de imagens (ou não precisava chegar, como no mock). */
  readonly fotoGuardada: boolean;
}

export type AcaoRegistrar =
  | { readonly tipo: "definir_foto"; readonly foto: string | null }
  | { readonly tipo: "definir_descricao"; readonly descricao: string }
  | { readonly tipo: "definir_setor"; readonly setor: string }
  | { readonly tipo: "definir_prioridade"; readonly prioridade: Prioridade }
  | { readonly tipo: "alternar_avisar" }
  | {
      readonly tipo: "definir_erros";
      readonly erros: Readonly<Record<string, string>>;
    }
  | { readonly tipo: "iniciar_analise" }
  | { readonly tipo: "analise_pronta"; readonly classificacao: ClassificacaoIA }
  | { readonly tipo: "analise_erro"; readonly mensagem: string }
  | { readonly tipo: "alternar_edicao" }
  | { readonly tipo: "ajustar_analise"; readonly ajuste: AjusteDaAnalise }
  | { readonly tipo: "voltar_aos_detalhes" }
  | { readonly tipo: "voltar_a_analise" }
  | { readonly tipo: "iniciar_registro" }
  | { readonly tipo: "registro_erro"; readonly mensagem: string }
  | {
      readonly tipo: "registro_ok";
      readonly codigo: string;
      readonly fotoGuardada: boolean;
    }
  | { readonly tipo: "reiniciar"; readonly setor: string };

export function estadoInicial(setorPadrao: string): EstadoRegistrar {
  return {
    etapa: "detalhes",
    fotoBase64: null,
    descricao: "",
    setor: setorPadrao,
    prioridade: "media",
    avisarResponsavel: true,
    erroCampo: {},
    erroEnvio: null,
    classificacao: null,
    editando: false,
    registrando: false,
    codigoGerado: null,
    fotoGuardada: true,
  };
}

export function redutor(
  estado: EstadoRegistrar,
  acao: AcaoRegistrar,
): EstadoRegistrar {
  switch (acao.tipo) {
    case "definir_foto":
      // Outra foto, outra análise: a anterior não vale mais.
      return {
        ...estado,
        fotoBase64: acao.foto,
        classificacao: null,
        editando: false,
        erroCampo: {},
      };
    case "definir_descricao":
      return { ...estado, descricao: acao.descricao, erroCampo: {} };
    case "definir_setor":
      return { ...estado, setor: acao.setor, erroCampo: {} };
    case "definir_prioridade":
      return { ...estado, prioridade: acao.prioridade };
    case "alternar_avisar":
      return { ...estado, avisarResponsavel: !estado.avisarResponsavel };
    case "definir_erros":
      return { ...estado, erroCampo: acao.erros };
    case "iniciar_analise":
      return {
        ...estado,
        etapa: "analise",
        classificacao: null,
        editando: false,
        erroEnvio: null,
      };
    case "analise_pronta":
      return { ...estado, classificacao: acao.classificacao, erroEnvio: null };
    case "analise_erro":
      return {
        ...estado,
        etapa: "detalhes",
        classificacao: null,
        erroEnvio: acao.mensagem,
      };
    case "alternar_edicao":
      return { ...estado, editando: !estado.editando };
    case "ajustar_analise":
      return estado.classificacao
        ? { ...estado, classificacao: { ...estado.classificacao, ...acao.ajuste } }
        : estado;
    case "voltar_aos_detalhes":
      return { ...estado, etapa: "detalhes", editando: false, erroEnvio: null };
    case "voltar_a_analise":
      return estado.classificacao
        ? { ...estado, etapa: "analise", erroEnvio: null }
        : estado;
    case "iniciar_registro":
      return { ...estado, registrando: true, erroEnvio: null };
    case "registro_erro":
      return { ...estado, registrando: false, erroEnvio: acao.mensagem };
    case "registro_ok":
      return {
        ...estado,
        etapa: "sucesso",
        registrando: false,
        codigoGerado: acao.codigo,
        fotoGuardada: acao.fotoGuardada,
      };
    case "reiniciar":
      return estadoInicial(acao.setor);
  }
}
