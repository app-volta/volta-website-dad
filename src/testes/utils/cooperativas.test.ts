import { describe, expect, it } from "vitest";

import { criarCooperativa } from "../fabricas";
import {
  TAMANHO_MAXIMO_LICENCA_BYTES,
  cooperativasNoRaio,
  diasParaVencer,
  estadoLicenca,
  formatarMesAno,
  lerCoordenada,
  mesesDoGrafico,
  resumirCooperativas,
  rotuloLicenca,
  temDistancias,
  validarLatitude,
  validarLicenca,
  validarLongitude,
  validarMateriais,
  validarNomeCooperativa,
} from "../../utils/cooperativas";

/** 18/11/2026. */
const AGORA = new Date(2026, 10, 18, 15);

describe("diasParaVencer", () => {
  it("conta os dias inteiros até o fim da validade", () => {
    expect(diasParaVencer("2026-11-28", AGORA)).toBe(10);
    expect(diasParaVencer("2026-11-18", AGORA)).toBe(0);
  });

  it("é negativo quando já venceu", () => {
    expect(diasParaVencer("2026-11-10", AGORA)).toBe(-8);
  });
});

describe("estadoLicenca", () => {
  it("é 'nao_informada' quando a fonte não controla licenças", () => {
    expect(estadoLicenca({ licencaMonitorada: false, licencaValidaAte: "2030-01-01", licencaDocumento: null }, AGORA)).toBe(
      "nao_informada",
    );
  });

  it("fica 'vencendo' a 30 dias ou menos, e 'valida' depois disso", () => {
    const comValidade = (licencaValidaAte: string) =>
      estadoLicenca({ licencaValidaAte, licencaDocumento: null }, AGORA);
    expect(comValidade("2026-12-18")).toBe("vencendo");
    expect(comValidade("2026-12-19")).toBe("valida");
    expect(comValidade("2026-11-18")).toBe("vencendo");
  });

  it("fica 'vencida' no dia seguinte ao fim da validade", () => {
    expect(estadoLicenca({ licencaValidaAte: "2026-11-17", licencaDocumento: null }, AGORA)).toBe("vencida");
  });

  it("sem data, separa o documento em análise de quem não tem licença", () => {
    expect(estadoLicenca({ licencaValidaAte: null, licencaDocumento: "licenca.pdf" }, AGORA)).toBe("em_analise");
    expect(estadoLicenca({ licencaValidaAte: null, licencaDocumento: null }, AGORA)).toBe("sem_licenca");
  });
});

describe("rotuloLicenca", () => {
  const dados = (licencaValidaAte: string | null, licencaDocumento: string | null = null) => ({
    licencaValidaAte,
    licencaDocumento,
  });

  it("escreve a validade na tabela e no painel", () => {
    expect(rotuloLicenca(dados("2027-12-31"), AGORA)).toBe("Até dez/2027");
    expect(rotuloLicenca(dados("2027-12-31"), AGORA, true)).toBe("Válida até dez/2027");
  });

  it("conta os dias quando está vencendo", () => {
    expect(rotuloLicenca(dados("2026-11-28"), AGORA)).toBe("Vence em 10 dias");
    expect(rotuloLicenca(dados("2026-11-19"), AGORA)).toBe("Vence em 1 dia");
    expect(rotuloLicenca(dados("2026-11-18"), AGORA)).toBe("Vence hoje");
  });

  it("descreve os demais estados", () => {
    expect(rotuloLicenca(dados("2026-11-01"), AGORA)).toBe("Licença vencida");
    expect(rotuloLicenca(dados(null, "licenca.pdf"), AGORA)).toBe("Docs em análise");
    expect(rotuloLicenca(dados(null), AGORA)).toBe("Sem licença");
    expect(rotuloLicenca({ ...dados(null), licencaMonitorada: false }, AGORA)).toBe("Não informada");
  });
});

describe("formatarMesAno e mesesDoGrafico", () => {
  it("abrevia o mês", () => {
    expect(formatarMesAno("2027-12-31")).toBe("dez/2027");
    expect(formatarMesAno("2026-01-05")).toBe("jan/2026");
  });

  it("mostra os cinco meses, terminando no último mês fechado", () => {
    expect(mesesDoGrafico(AGORA)).toEqual(["jun", "jul", "ago", "set", "out"]);
    // Em janeiro, o último mês fechado é dezembro e a lista cruza o ano.
    expect(mesesDoGrafico(new Date(2026, 0, 10))).toEqual(["ago", "set", "out", "nov", "dez"]);
  });
});

describe("resumirCooperativas", () => {
  it("conta ativas, em homologação, volume do trimestre e licenças com problema", () => {
    const lista = [
      criarCooperativa({ id: "1", volumeMensalKg: [1, 2, 3, 4, 5], licencaValidaAte: "2027-12-31" }),
      criarCooperativa({ id: "2", situacao: "em_homologacao", volumeMensalKg: [0, 0, 10, 20, 30], licencaValidaAte: "2026-11-25" }),
      criarCooperativa({ id: "3", volumeMensalKg: [0, 0, 0, 0, 0], licencaValidaAte: "2026-10-01" }),
    ];
    expect(resumirCooperativas(lista, AGORA)).toEqual({
      ativas: 2,
      emHomologacao: 1,
      destinadoTrimestreKg: 12 + 60 + 0,
      licencasVencendo: 2,
    });
  });
});

describe("validarLicenca", () => {
  const pdf = (tamanho = 10, nome = "licenca.pdf", tipo = "application/pdf"): File =>
    new File([new Uint8Array(tamanho)], nome, { type: tipo });

  it("a licença é opcional", () => {
    expect(validarLicenca(null)).toBeNull();
  });

  it("aceita PDF pelo tipo ou pela extensão", () => {
    expect(validarLicenca(pdf())).toBeNull();
    expect(validarLicenca(pdf(10, "LICENCA.PDF", ""))).toBeNull();
  });

  it("recusa o que não é PDF", () => {
    expect(validarLicenca(pdf(10, "foto.png", "image/png"))).toBe("Envie a licença em PDF.");
  });

  it("recusa PDF acima de 10 MB", () => {
    expect(validarLicenca(pdf(TAMANHO_MAXIMO_LICENCA_BYTES))).toBeNull();
    expect(validarLicenca(pdf(TAMANHO_MAXIMO_LICENCA_BYTES + 1))).toBe("O PDF passa de 10 MB.");
  });
});

describe("cadastro de cooperativa", () => {
  it("o nome precisa de 3 letras depois de tirar os espaços", () => {
    expect(validarNomeCooperativa("  ab ")).toBe("Informe o nome da cooperativa.");
    expect(validarNomeCooperativa("abc")).toBeNull();
  });

  it("exige ao menos um material", () => {
    expect(validarMateriais([])).toBe("Escolha ao menos um material.");
    expect(validarMateriais(["oleo"])).toBeNull();
  });

  it("lê coordenadas com vírgula ou ponto", () => {
    expect(lerCoordenada("-21,67")).toBe(-21.67);
    expect(lerCoordenada(" -49.74 ")).toBe(-49.74);
    expect(lerCoordenada("")).toBeNaN();
  });

  it("a latitude vai de -90 a 90", () => {
    expect(validarLatitude("-21,67")).toBeNull();
    expect(validarLatitude("90")).toBeNull();
    expect(validarLatitude("91")).toBe("Informe a latitude, entre -90 e 90.");
    expect(validarLatitude("")).toBe("Informe a latitude, entre -90 e 90.");
    expect(validarLatitude("abc")).toBe("Informe a latitude, entre -90 e 90.");
  });

  it("a longitude vai de -180 a 180", () => {
    expect(validarLongitude("-49,74")).toBeNull();
    expect(validarLongitude("-180")).toBeNull();
    expect(validarLongitude("181")).toBe("Informe a longitude, entre -180 e 180.");
    expect(validarLongitude("")).toBe("Informe a longitude, entre -180 e 180.");
  });
});

describe("raio de 10 km", () => {
  const lista = [
    criarCooperativa({ id: "1", distanciaKm: 4.2 }),
    criarCooperativa({ id: "2", distanciaKm: 10 }),
    criarCooperativa({ id: "3", distanciaKm: 10.1 }),
    criarCooperativa({ id: "4", distanciaKm: null }),
  ];

  it("conta as que estão dentro do raio, inclusive no limite", () => {
    expect(cooperativasNoRaio(lista)).toBe(2);
    expect(cooperativasNoRaio(lista, 5)).toBe(1);
  });

  it("só fala em raio quando todas as distâncias são conhecidas", () => {
    expect(temDistancias(lista)).toBe(false);
    expect(temDistancias(lista.slice(0, 3))).toBe(true);
  });
});
