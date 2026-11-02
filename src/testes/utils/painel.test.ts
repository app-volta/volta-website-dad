import { describe, expect, it } from "vitest";

import { criarOcorrencia } from "../fabricas";
import {
  aprovada,
  atividadesDaPessoa,
  calcularPainel,
  duracaoEmTexto,
  revisadasPor,
  somaKg,
  taxaDeAprovacao,
  tempoMedioDeRevisaoMs,
  tempoRelativo,
} from "../../utils/painel";

/** Quarta-feira, 18/11/2026, às 15h. */
const AGORA = new Date(2026, 10, 18, 15);
const em = (mes: number, dia: number, hora = 9): string => new Date(2026, mes, dia, hora).toISOString();

describe("tempoRelativo", () => {
  const agora = AGORA.getTime();
  const atras = (minutos: number): string => new Date(agora - minutos * 60_000).toISOString();

  it("conta em minutos na primeira hora, nunca menos de 1", () => {
    expect(tempoRelativo(atras(0.5), agora)).toBe("há 1 min");
    expect(tempoRelativo(atras(5), agora)).toBe("há 5 min");
  });

  it("passa para horas e depois para dias", () => {
    expect(tempoRelativo(atras(3 * 60), agora)).toBe("3h hoje");
    expect(tempoRelativo(atras(25 * 60), agora)).toBe("ontem");
    expect(tempoRelativo(atras(4 * 24 * 60), agora)).toBe("4 dias");
  });
});

describe("aprovada", () => {
  it("vale para aprovada e finalizada", () => {
    expect(aprovada(criarOcorrencia({ status: "aprovada" }))).toBe(true);
    expect(aprovada(criarOcorrencia({ status: "finalizada" }))).toBe(true);
    expect(aprovada(criarOcorrencia({ status: "classificada" }))).toBe(false);
    expect(aprovada(criarOcorrencia({ status: "recusada" }))).toBe(false);
    expect(aprovada(criarOcorrencia({ status: "encaminhada" }))).toBe(false);
  });
});

describe("somaKg", () => {
  it("soma o peso das ocorrências, e é zero sem nenhuma", () => {
    expect(somaKg([criarOcorrencia({ pesoKg: 10 }), criarOcorrencia({ pesoKg: 2.5 })])).toBe(12.5);
    expect(somaKg([])).toBe(0);
  });
});

describe("taxaDeAprovacao", () => {
  it("mede as aprovadas entre as já decididas, sem contar as encaminhadas", () => {
    const lista = [
      criarOcorrencia({ status: "aprovada" }),
      criarOcorrencia({ status: "finalizada" }),
      criarOcorrencia({ status: "aprovada" }),
      criarOcorrencia({ status: "recusada" }),
      criarOcorrencia({ status: "encaminhada" }),
      criarOcorrencia({ status: "classificada" }),
    ];
    expect(taxaDeAprovacao(lista)).toBe(75);
  });

  it("é nula quando nada foi decidido", () => {
    expect(taxaDeAprovacao([criarOcorrencia({ status: "classificada" })])).toBeNull();
    expect(taxaDeAprovacao([])).toBeNull();
  });
});

describe("calcularPainel", () => {
  const ocorrencias = [
    criarOcorrencia({ id: "a", pesoKg: 100, material: "papelao", criadaEm: em(10, 5) }),
    criarOcorrencia({ id: "b", pesoKg: 50, material: "plastico", status: "finalizada", criadaEm: em(10, 10) }),
    criarOcorrencia({ id: "c", pesoKg: 20, material: null, criadaEm: em(10, 12) }),
    criarOcorrencia({ id: "d", pesoKg: 30, material: "metal", status: "recusada", criadaEm: em(10, 13) }),
    criarOcorrencia({ id: "e", pesoKg: 15, status: "classificada", criadaEm: em(10, 17) }),
    criarOcorrencia({ id: "f", pesoKg: 200, material: "vidro", criadaEm: em(9, 20) }),
  ];
  const painel = calcularPainel(ocorrencias, 1500, AGORA);

  it("conta as ocorrências do mês e compara com o mês passado", () => {
    expect(painel.ocorrenciasMes).toBe(5);
    expect(painel.ocorrenciasVariacao).toBe(4);
  });

  it("recupera só o que foi aprovado no mês", () => {
    expect(painel.recuperadoMesKg).toBe(170);
    // Mês passado: 200 kg aprovados; este mês: 170.
    expect(painel.recuperadoVariacaoPct).toBe(-15);
  });

  it("separa por material e põe o resto em 'outros'", () => {
    expect(painel.porMaterial).toEqual([
      { material: "papelao", kg: 100 },
      { material: "plastico", kg: 50 },
      { material: "metal", kg: 0 },
      { material: "vidro", kg: 0 },
    ]);
    expect(painel.outrosKg).toBe(20);
  });

  it("calcula a taxa de aprovação do mês", () => {
    // 3 aprovadas e 1 recusada.
    expect(painel.taxaAprovacao).toBe(75);
  });

  it("diz há quanto tempo espera a ocorrência mais antiga da fila", () => {
    // Registrada em 17/11 às 9h; agora é 18/11 às 15h (30 h, ou 1 dia).
    expect(painel.textoEspera).toBe("a mais antiga espera 1 dia");
  });

  it("monta 8 semanas e 3 meses de gráfico, com a meta quando existe", () => {
    expect(painel.semanas).toHaveLength(8);
    expect(painel.meses).toHaveLength(3);
    expect(painel.semanas.every((ponto) => ponto.meta === 350)).toBe(true);
    expect(painel.meses.every((ponto) => ponto.meta === 1500)).toBe(true);
    expect(painel.meses[2].valor).toBe(170);
    expect(painel.meses[1].valor).toBe(200);
  });

  it("tira a linha de meta do gráfico quando a empresa não definiu meta", () => {
    const semMeta = calcularPainel(ocorrencias, 0, AGORA);
    expect(semMeta.semanas.every((ponto) => ponto.meta === undefined)).toBe(true);
    expect(semMeta.meses.every((ponto) => ponto.meta === undefined)).toBe(true);
  });

  it("diz que não há nada esperando quando a fila está vazia", () => {
    expect(calcularPainel([criarOcorrencia({ criadaEm: em(10, 5) })], 1500, AGORA).textoEspera).toBe(
      "nada esperando",
    );
  });

  it("não inventa tendência sem dados", () => {
    const vazio = calcularPainel([], 1500, AGORA);
    expect(vazio.sparkOcorrencias).toBeNull();
    expect(vazio.sparkRecuperado).toBeNull();
    expect(vazio.taxaAprovacao).toBeNull();
    expect(vazio.recuperadoVariacaoPct).toBeNull();
    expect(vazio.ocorrenciasVariacao).toBeNull();
  });
});

describe("atividadesDaPessoa", () => {
  const evento = (id: string, autor: string, tipo: "registro" | "aprovacao" | "ia", em: string) => ({
    id,
    tipo,
    autor,
    texto: "fez algo",
    em,
  });
  const lista = [
    criarOcorrencia({
      id: "o1",
      codigo: "OCC-00001",
      titulo: "Papelão",
      historico: [
        evento("e1", "Ana", "registro", em(10, 17, 8)),
        evento("e2", "Bruno", "aprovacao", em(10, 17, 10)),
        evento("e3", "IA VOLTA", "ia", em(10, 17, 9)),
      ],
    }),
  ];

  it("traz só as ações da pessoa, da mais recente para a mais antiga", () => {
    const atividades = atividadesDaPessoa(lista, "Ana", AGORA.getTime());
    expect(atividades).toHaveLength(1);
    expect(atividades[0]).toMatchObject({
      id: "o1:e1",
      autor: "Ana",
      acao: "registrou OCC-00001 · Papelão",
    });
  });

  it("ignora eventos que não são ação de pessoa, como o da IA", () => {
    expect(atividadesDaPessoa(lista, "IA VOLTA", AGORA.getTime())).toHaveLength(0);
  });
});

describe("revisões da pessoa", () => {
  const hora = (h: number): string => new Date(2026, 10, 18, h).toISOString();
  const revisada = (id: string, por: string | null, registrada: number, decidida: number | null) =>
    criarOcorrencia({
      id,
      criadaEm: hora(registrada),
      revisadaPor: por,
      revisadaEm: decidida === null ? null : hora(decidida),
    });

  it("revisadasPor separa o que a pessoa decidiu do que outras decidiram ou ninguém decidiu", () => {
    const lista = [revisada("a", "gestor-1", 8, 9), revisada("b", "gestor-2", 8, 9), revisada("c", null, 8, null)];
    expect(revisadasPor(lista, "gestor-1").map((o) => o.id)).toEqual(["a"]);
    expect(revisadasPor(lista, "gestor-3")).toEqual([]);
  });

  it("o tempo médio vai do registro à decisão e ignora as sem data", () => {
    const lista = [revisada("a", "gestor-1", 8, 9), revisada("b", "gestor-1", 8, 11), revisada("c", "gestor-1", 8, null)];
    expect(tempoMedioDeRevisaoMs(lista)).toBe(2 * 3_600_000);
  });

  it("sem nenhuma decisão com data, não há média", () => {
    expect(tempoMedioDeRevisaoMs([])).toBeNull();
    expect(tempoMedioDeRevisaoMs([revisada("a", "gestor-1", 8, null)])).toBeNull();
  });

  it("uma decisão com data anterior ao registro (relógios diferentes) conta como zero, não como negativa", () => {
    expect(tempoMedioDeRevisaoMs([revisada("a", "gestor-1", 9, 8)])).toBe(0);
  });
});

describe("duracaoEmTexto", () => {
  it("usa minutos, horas e dias, nunca menos de 1 minuto", () => {
    expect(duracaoEmTexto(0)).toBe("1 min");
    expect(duracaoEmTexto(20 * 60_000)).toBe("20 min");
    expect(duracaoEmTexto(8 * 3_600_000)).toBe("8 h");
    expect(duracaoEmTexto(24 * 3_600_000)).toBe("1 dia");
    expect(duracaoEmTexto(3 * 24 * 3_600_000)).toBe("3 dias");
  });
});
