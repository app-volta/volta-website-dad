import type { Configuracoes } from "../types/configuracao";
import type { Cooperativa } from "../types/cooperativa";
import type { Ocorrencia } from "../types/ocorrencia";

/** Cooperativa ativa, com distância e licença conhecidas; cada teste muda só o que importa. */
export function criarCooperativa(parcial: Partial<Cooperativa> = {}): Cooperativa {
  return {
    id: "coop-1",
    nome: "Recicla Vida",
    cnpj: "11.222.333/0001-81",
    cidade: "Lins",
    estado: "SP",
    materiaisAceitos: ["papelao", "plastico"],
    contato: "Maria Lima",
    telefone: "(14) 99999-0000",
    email: "contato@reciclavida.example",
    distanciaKm: 4.2,
    avaliacao: 4.8,
    situacao: "ativa",
    parceiraGrupo: false,
    capacidadeMesKg: 5000,
    usadoMesKg: 1200,
    licencaValidaAte: "2027-12-31",
    licencaDocumento: "licenca.pdf",
    volumeMensalKg: [100, 200, 300, 400, 500],
    latitude: -21.67,
    longitude: -49.74,
    ...parcial,
  };
}

/** Configurações de uma unidade com meta de 1.500 kg e só o aviso do ritmo desligado. */
export function criarConfiguracoes(parcial: Partial<Configuracoes> = {}): Configuracoes {
  return {
    unidade: {
      nome: "Unidade Lins",
      cnpj: "11.222.333/0001-81",
      endereco: "Rua das Flores, 100",
      setores: 4,
    },
    metaRecuperacaoKg: 1500,
    metaDoDia: { modo: "dividir", valorFixoKg: 0 },
    diasDeOperacao: null,
    metaPorMaterial: null,
    avisosDaMeta: {
      incluirNoPgrs: true,
      mostrarNoInicio: true,
      avisarMetaDoDia: true,
      alertarRitmo: false,
    },
    notificacoes: {
      novaOcorrencia: true,
      licencaVencendo: true,
      resumoSemanal: false,
      cadaRegistro: false,
    },
    insights: true,
    ...parcial,
  };
}

/** Ocorrência aprovada de 10 kg de papelão, de 15/11/2026; cada teste muda só o que importa. */
export function criarOcorrencia(parcial: Partial<Ocorrencia> = {}): Ocorrencia {
  const criadaEm = new Date(2026, 10, 15, 10).toISOString();
  return {
    id: "occ-1",
    codigo: "#0001",
    titulo: "Papelão misturado",
    descricao: "Caixas de papelão no corredor",
    pesoKg: 10,
    prioridade: "media",
    fotoUrl: "",
    localizacao: { setor: "Expedição", unidade: "Unidade Lins" },
    material: "papelao",
    status: "aprovada",
    classificacao: null,
    cooperativaId: null,
    criadaEm,
    atualizadaEm: criadaEm,
    criadaPor: "user-1",
    criadaPorNome: "Ana Souza",
    qualidade: "A",
    perigoso: false,
    setorDestino: null,
    motivoRecusa: null,
    revisadaPor: null,
    revisadaPorNome: null,
    revisadaEm: null,
    ultimaAlteracao: null,
    historico: [],
    ...parcial,
  };
}

/** Preferências de meta com todos os avisos ligados; os testes desligam o que for preciso. */
export function criarPreferenciasDaMeta(
  parcial: Partial<Pick<Configuracoes, "metaDoDia" | "diasDeOperacao" | "avisosDaMeta">> = {},
): Pick<Configuracoes, "metaDoDia" | "diasDeOperacao" | "avisosDaMeta"> {
  return {
    metaDoDia: { modo: "dividir", valorFixoKg: 0 },
    diasDeOperacao: null,
    avisosDaMeta: {
      incluirNoPgrs: true,
      mostrarNoInicio: true,
      avisarMetaDoDia: true,
      alertarRitmo: true,
    },
    ...parcial,
  };
}
