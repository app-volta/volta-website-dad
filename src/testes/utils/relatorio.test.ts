import { describe, expect, it } from "vitest";

import type { RelatorioPgrs } from "../../types/relatorio";
import { montarCsv } from "../../utils/exportarCsv";
import { montarCsvRelatorio } from "../../utils/relatorio";

const SEPARADOR_DE_LINHA = "\r\n";

const relatorio: RelatorioPgrs = {
  periodo: "mes",
  ocorrencias: 12,
  recuperadoKg: 750,
  taxaAprovacao: 80,
  desvioAterro: null,
  porMaterial: [
    { material: "papelao", kg: 500 },
    { material: "plastico", kg: 250 },
  ],
  setores: [{ nome: "Expedição", kg: 600 }],
  ocorrenciasPorSetor: [{ nome: "Expedição", ocorrencias: 9 }],
  destinacao: [{ cooperativaId: "coop-1", nome: "Recicla Vida", percentual: 100 }],
};

const linhas = (csv: string): string[] => csv.split(SEPARADOR_DE_LINHA);

describe("montarCsv", () => {
  it("separa por ponto e vírgula e quebra linha com CRLF", () => {
    expect(montarCsv(["A", "B"], [["x", 1], ["y", 2]])).toBe(`A;B${SEPARADOR_DE_LINHA}x;1${SEPARADOR_DE_LINHA}y;2`);
  });

  it("protege com aspas o que tem ponto e vírgula, aspas ou quebra de linha", () => {
    expect(montarCsv(["A"], [["a;b"], ['diz "oi"'], ["linha1\nlinha2"]])).toBe(
      ['A', '"a;b"', '"diz ""oi"""', '"linha1\nlinha2"'].join(SEPARADOR_DE_LINHA),
    );
  });
});

describe("montarCsvRelatorio", () => {
  it("traz os indicadores, com vazio onde não há dado", () => {
    const csv = linhas(montarCsvRelatorio(relatorio));
    expect(csv[0]).toBe("Seção;Item;Valor;Unidade");
    expect(csv).toContain("Indicador;Ocorrências;12;un");
    expect(csv).toContain("Indicador;Recuperado;750;kg");
    expect(csv).toContain("Indicador;Taxa de aprovação;80;%");
    expect(csv).toContain("Indicador;Desviado de aterro;;%");
  });

  it("lista material, setor e destinação", () => {
    const csv = linhas(montarCsvRelatorio(relatorio));
    expect(csv).toContain("Material;Papelão;500;kg");
    expect(csv).toContain("Material;Plástico;250;kg");
    expect(csv).toContain("Setor;Expedição;600;kg");
    expect(csv).toContain("Destinação;Recicla Vida;100;%");
  });

  it("abre com o cabeçalho do PGRS quando recebe a unidade e a data", () => {
    const csv = linhas(montarCsvRelatorio(relatorio, { unidade: "Unidade Lins", geradoEm: "18/11/2026" }));
    expect(csv[1]).toBe("Cabeçalho;Unidade;Unidade Lins;");
    expect(csv[2]).toBe("Cabeçalho;Período;Mês;");
    expect(csv[3]).toBe("Cabeçalho;Gerado em;18/11/2026;");
  });

  it("só inclui score ESG e ranking quando existem", () => {
    const sem = montarCsvRelatorio(relatorio);
    expect(sem).not.toContain("Score ESG");
    expect(sem).not.toContain("ranking");

    const com = linhas(
      montarCsvRelatorio({
        ...relatorio,
        scoreEsg: 72,
        posicaoNoRanking: { posicao: 3, totalDeEmpresas: 20, pontos: 640 },
      }),
    );
    expect(com).toContain("Indicador;Score ESG;72;pontos");
    expect(com).toContain("Indicador;Posição no ranking;3;º");
    expect(com).toContain("Indicador;Empresas no ranking;20;un");
    expect(com).toContain("Indicador;Pontos no ranking;640;pontos");
  });

  describe("metas (aviso 'Incluir as metas no relatório PGRS')", () => {
    const metas = {
      metaMensalKg: 1500,
      metaDoDiaKg: 60,
      porMaterial: { papelao: 600, plastico: 400, metal: 300, vidro: 200 },
    };

    it("não inclui as metas quando o relatório é chamado sem elas", () => {
      expect(montarCsvRelatorio(relatorio)).not.toContain("Meta;");
    });

    it("inclui a meta do mês, o atingido, a do dia e a de cada material", () => {
      const csv = linhas(montarCsvRelatorio(relatorio, undefined, metas));
      expect(csv).toContain("Meta;Meta do mês;1500;kg");
      expect(csv).toContain("Meta;Atingido da meta do mês;50;%");
      expect(csv).toContain("Meta;Meta do dia;60;kg");
      expect(csv).toContain("Meta;Meta de Papelão;600;kg");
      expect(csv).toContain("Meta;Meta de Plástico;400;kg");
      expect(csv).toContain("Meta;Meta de Metal;300;kg");
      expect(csv).toContain("Meta;Meta de Vidro;200;kg");
    });

    it("sem divisão por material, traz só as metas do mês e do dia", () => {
      const csv = montarCsvRelatorio(relatorio, undefined, { ...metas, porMaterial: null });
      expect(csv).toContain("Meta;Meta do mês;1500;kg");
      expect(csv).not.toContain("Meta de Papelão");
    });

    it("sem meta do mês definida, não inclui linha de meta", () => {
      const csv = montarCsvRelatorio(relatorio, undefined, { ...metas, metaMensalKg: 0 });
      expect(csv).not.toContain("Meta;");
    });
  });
});
