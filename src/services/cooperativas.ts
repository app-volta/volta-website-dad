import type { Cooperativa, NovaCooperativa } from "../types/cooperativa";
import { validarLicenca } from "../utils/cooperativas";
import { mascararCnpj } from "../utils/formatacao";
import { validarCnpj } from "../utils/validadores";
import { aguardar } from "./http";

/**
 * MOCK: substitua por chamada real quando o backend expuser /cooperativas.
 * O catálogo vive em memória; recarregar a página volta ao estado inicial.
 */

/** Data local daqui a N dias, no formato AAAA-MM-DD. */
function dataEmDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

const catalogo: Cooperativa[] = [
  {
    id: "coop-jbs-ambiental",
    nome: "JBS Ambiental",
    cnpj: "41.208.763/0001-00",
    cidade: "Lins",
    estado: "SP",
    materiaisAceitos: ["papelao", "plastico", "metal", "vidro"],
    contato: "Marina Costa",
    telefone: "(11) 98877-1020",
    email: "contato@jbs-ambiental.example",
    distanciaKm: 2.4,
    avaliacao: 4.9,
    situacao: "ativa",
    parceiraGrupo: true,
    capacidadeMesKg: 2500,
    usadoMesKg: 1820,
    licencaValidaAte: "2027-12-31",
    licencaDocumento: "licenca-jbs-ambiental.pdf",
    volumeMensalKg: [450, 520, 570, 585, 585],
    posicaoMapa: { x: 40.2, y: 53.4 },
  },
  {
    id: "coop-recicla-vida",
    nome: "Recicla Vida",
    cnpj: "27.530.914/0001-10",
    cidade: "Bauru",
    estado: "SP",
    materiaisAceitos: ["papelao", "plastico", "vidro"],
    contato: "Sérgio Alves",
    telefone: "(11) 97765-3311",
    email: "contato@reciclavida.example",
    distanciaKm: 3.1,
    avaliacao: 4.8,
    situacao: "ativa",
    parceiraGrupo: false,
    capacidadeMesKg: 900,
    usadoMesKg: 640,
    licencaValidaAte: dataEmDias(12),
    licencaDocumento: "licenca-recicla-vida.pdf",
    volumeMensalKg: [300, 390, 355, 480, 480],
    posicaoMapa: { x: 22.1, y: 37.2 },
  },
  {
    id: "coop-cooperviva",
    nome: "Cooperviva",
    cnpj: "08.774.205/0001-36",
    cidade: "Marília",
    estado: "SP",
    materiaisAceitos: ["papelao", "papel_misto"],
    contato: "Helena Prado",
    telefone: "(11) 96541-2208",
    email: "contato@cooperviva.example",
    distanciaKm: 5.7,
    avaliacao: 4.6,
    situacao: "ativa",
    parceiraGrupo: false,
    capacidadeMesKg: 1200,
    usadoMesKg: 300,
    licencaValidaAte: "2027-03-31",
    licencaDocumento: "licenca-cooperviva.pdf",
    volumeMensalKg: [70, 75, 90, 95, 95],
    posicaoMapa: { x: 74, y: 73.1 },
  },
  {
    id: "coop-econorte",
    nome: "EcoNorte",
    cnpj: "33.619.480/0001-22",
    cidade: "Araçatuba",
    estado: "SP",
    materiaisAceitos: ["plastico", "vidro"],
    contato: "Rafael Moura",
    telefone: "(11) 95320-7741",
    email: "contato@econorte.example",
    distanciaKm: 8.2,
    avaliacao: null,
    situacao: "em_homologacao",
    parceiraGrupo: false,
    capacidadeMesKg: 600,
    usadoMesKg: 150,
    licencaValidaAte: null,
    licencaDocumento: "licenca-econorte.pdf",
    volumeMensalKg: [0, 0, 0, 30, 37],
    posicaoMapa: { x: 86, y: 29.3 },
  },
  {
    id: "coop-verde-vivo",
    nome: "Verde Vivo",
    cnpj: "52.091.376/0001-52",
    cidade: "Campo Grande",
    estado: "MS",
    materiaisAceitos: ["oleo", "organico"],
    contato: "Camila Duarte",
    telefone: "(11) 94418-9032",
    email: "contato@verdevivo.example",
    distanciaKm: 11.4,
    avaliacao: null,
    situacao: "em_homologacao",
    parceiraGrupo: false,
    capacidadeMesKg: 400,
    usadoMesKg: 0,
    licencaValidaAte: null,
    licencaDocumento: null,
    volumeMensalKg: [0, 0, 0, 0, 0],
    posicaoMapa: { x: 62, y: 97.2 },
  },
];

export async function listarCooperativas(
  sinal?: AbortSignal,
): Promise<readonly Cooperativa[]> {
  await aguardar(450, sinal);
  return [...catalogo];
}

export async function obterCooperativa(
  id: string,
  sinal?: AbortSignal,
): Promise<Cooperativa> {
  await aguardar(350, sinal);
  const encontrada = catalogo.find((item) => item.id === id);
  if (!encontrada) {
    throw new Error(`Cooperativa ${id} não encontrada.`);
  }
  return encontrada;
}

/**
 * Cadastra a cooperativa em homologação. A distância e a posição no mapa vêm
 * de uma semente calculada do CNPJ: simulam a geocodificação que o backend
 * fará com o endereço.
 */
export async function adicionarCooperativa(
  dados: NovaCooperativa,
  sinal?: AbortSignal,
): Promise<Cooperativa> {
  await aguardar(900, sinal);

  const nome = dados.nome.trim();
  if (nome.length < 3) throw new Error("Informe o nome da cooperativa.");
  const erroCnpj = validarCnpj(dados.cnpj);
  if (erroCnpj) throw new Error(erroCnpj);
  if (dados.materiais.length === 0) {
    throw new Error("Escolha ao menos um material aceito.");
  }
  const erroLicenca = validarLicenca(dados.licenca);
  if (erroLicenca) throw new Error(erroLicenca);

  const digitos = dados.cnpj.replace(/\D/g, "");
  if (catalogo.some((c) => c.cnpj.replace(/\D/g, "") === digitos)) {
    throw new Error("Já existe uma cooperativa com esse CNPJ.");
  }

  const semente = digitos
    .split("")
    .reduce((soma, digito, i) => soma + Number(digito) * (i + 1), 0);

  const nova: Cooperativa = {
    id: `coop-${digitos}`,
    nome,
    cnpj: mascararCnpj(digitos),
    cidade: "Lins",
    estado: "SP",
    materiaisAceitos: [...dados.materiais],
    contato: null,
    telefone: null,
    email: null,
    distanciaKm: 1 + (semente % 130) / 10,
    avaliacao: null,
    situacao: "em_homologacao",
    parceiraGrupo: false,
    capacidadeMesKg: 500,
    usadoMesKg: 0,
    licencaValidaAte: null,
    licencaDocumento: dados.licenca?.name ?? null,
    volumeMensalKg: [0, 0, 0, 0, 0],
    posicaoMapa: { x: 14 + ((semente * 7) % 72), y: 28 + ((semente * 11) % 58) },
  };
  catalogo.push(nova);
  return nova;
}
