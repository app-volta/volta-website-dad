import type { ClassificacaoIA } from "../../types/classificacao";

export type Etapa = "detalhes" | "analise" | "sucesso";

export type Prioridade = "baixa" | "media" | "alta";

export interface EstadoRegistrar {
  readonly etapa: Etapa;
  readonly fotoBase64: string | null;
  readonly descricao: string;
  readonly setor: string;
  readonly prioridade: Prioridade;
  readonly avisarResponsavel: boolean;
  readonly erroCampo: Readonly<Record<string, string>>;
  readonly erroEnvio: string | null;
  readonly classificacao: ClassificacaoIA | null;
  readonly codigoGerado: string | null;
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
  | { readonly tipo: "iniciar_envio" }
  | {
      readonly tipo: "envio_sucesso";
      readonly classificacao: ClassificacaoIA;
      readonly codigo: string;
    }
  | { readonly tipo: "envio_erro"; readonly mensagem: string }
  | { readonly tipo: "editar_novamente" }
  | { readonly tipo: "confirmar" }
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
    codigoGerado: null,
  };
}

export function redutor(
  estado: EstadoRegistrar,
  acao: AcaoRegistrar,
): EstadoRegistrar {
  switch (acao.tipo) {
    case "definir_foto":
      return { ...estado, fotoBase64: acao.foto, erroCampo: {} };
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
    case "iniciar_envio":
      return { ...estado, etapa: "analise", erroEnvio: null };
    case "envio_sucesso":
      return {
        ...estado,
        etapa: "analise",
        classificacao: acao.classificacao,
        codigoGerado: acao.codigo,
        erroEnvio: null,
      };
    case "envio_erro":
      return { ...estado, etapa: "detalhes", erroEnvio: acao.mensagem };
    case "editar_novamente":
      return { ...estado, etapa: "detalhes" };
    case "confirmar":
      return { ...estado, etapa: "sucesso" };
    case "reiniciar":
      return estadoInicial(acao.setor);
  }
}
