import { describe, expect, it } from "vitest";

import { criarCooperativa } from "../fabricas";
import type { Cooperativa } from "../../types/cooperativa";
import type { RelatorioPgrs } from "../../types/relatorio";
import { montarDocumentoPgrs } from "../../utils/documentoPgrs";
import type { ContextoDoDocumento } from "../../utils/documentoPgrs";

const ESPACO_FIXO = " ";
/** 31/10/2026, às 18h: o dia da emissão do modelo. */
const AGORA = new Date(2026, 9, 31, 18, 0);

const RELATORIO: RelatorioPgrs = {
  periodo: "mes",
  ocorrencias: 52,
  recuperadoKg: 1147,
  taxaAprovacao: 94,
  desvioAterro: 89,
  porMaterial: [
    { material: "papelao", kg: 542 },
    { material: "plastico", kg: 318 },
    { material: "metal", kg: 176 },
    { material: "vidro", kg: 111 },
  ],
  setores: [],
  ocorrenciasPorSetor: [],
  setoresRecuperados: [
    { nome: "Frigorífico B2", kg: 342 },
    { nome: "Expedição", kg: 218 },
    { nome: "Manutenção", kg: 187 },
    { nome: "Recebimento", kg: 160 },
    { nome: "Refeitório", kg: 98 },
    { nome: "Laboratório", kg: 74 },
    { nome: "Escritório", kg: 42 },
    { nome: "Pátio", kg: 26 },
  ],
  destinacao: [
    { cooperativaId: "jbs", nome: "JBS Ambiental", percentual: 47, kg: 539, materiais: ["papelao", "plastico", "metal", "vidro"] },
    { cooperativaId: "recicla", nome: "Recicla Vida", percentual: 31, kg: 356, materiais: ["papelao", "plastico"] },
    { cooperativaId: "coop", nome: "Cooperviva", percentual: 22, kg: 252, materiais: ["papelao"] },
  ],
  anterior: { rotulo: "setembro de 2026", ocorrencias: 40, recuperadoKg: 1062, taxaAprovacao: 91 },
  aprovadasRecentes: [
    { id: "o1", codigo: "#0481", titulo: "Sucata metálica", setor: "Manutenção", material: "metal", pesoKg: 61, registradaPor: "João Pereira" },
    { id: "o2", codigo: "#0480", titulo: "Papelão limpo", setor: "Recebimento", material: null, pesoKg: 45, registradaPor: "Ana Souza" },
  ],
  recorrencia: { setor: "Frigorífico B2", titulo: "Papelão molhado", vezes: 3 },
};

const COOPERATIVAS: readonly Cooperativa[] = [
  criarCooperativa({ id: "jbs", nome: "JBS Ambiental", distanciaKm: 2.4, licencaValidaAte: "2027-12-31" }),
  criarCooperativa({ id: "recicla", nome: "Recicla Vida", distanciaKm: 3.1, licencaValidaAte: "2026-11-12" }),
  criarCooperativa({ id: "coop", nome: "Cooperviva", distanciaKm: 5.7, licencaValidaAte: "2027-03-31" }),
];

function contexto(parcial: Partial<ContextoDoDocumento> = {}): ContextoDoDocumento {
  return {
    unidade: {
      nome: "Unidade Frigorífico",
      cnpj: "12.345.678/0001-90",
      endereco: "Av. Industrial, 1200 · SP",
      setores: 8,
    },
    nomeDaUnidade: "Unidade Frigorífico",
    responsavel: { nome: "Davi Liu", funcao: "Gestor · Responsável PGRS" },
    metaMensalKg: 1500,
    cooperativas: COOPERATIVAS,
    agora: AGORA,
    ...parcial,
  };
}

const documento = montarDocumentoPgrs(RELATORIO, contexto());

describe("capa e identificação", () => {
  it("monta os títulos do relatório mensal", () => {
    expect(documento.pill).toBe("RELATÓRIO MENSAL · PGRS");
    expect(documento.pillDaSegundaPagina).toBe("RELATÓRIO PGRS · OUTUBRO DE 2026");
    expect(documento.titulo).toBe("Relatório de resíduos · outubro de 2026");
    expect(documento.rodape).toBe("VOLTA · Relatório PGRS · Unidade Frigorífico · outubro/2026");
    expect(documento.nomeDoArquivo).toBe("pgrs-outubro-2026");
  });

  it("traz os oito campos de identificação", () => {
    expect(documento.identificacao).toEqual([
      { rotulo: "Unidade", valor: "Unidade Frigorífico" },
      { rotulo: "CNPJ", valor: "12.345.678/0001-90" },
      { rotulo: "Endereço", valor: "Av. Industrial, 1200 · SP" },
      { rotulo: "Setores", valor: "8 cadastrados" },
      { rotulo: "Período", valor: "01/10 a 31/10/2026" },
      { rotulo: "Responsável", valor: "Davi Liu" },
      { rotulo: "Função", valor: "Gestor · Responsável PGRS" },
      { rotulo: "Emitido em", valor: "31/10/2026, 18:00" },
    ]);
  });

  it("enquanto o mês não acabou, o período vai só até hoje", () => {
    const meio = montarDocumentoPgrs(RELATORIO, contexto({ agora: new Date(2026, 10, 2, 9, 5) }));
    expect(meio.identificacao.find((item) => item.rotulo === "Período")?.valor).toBe("01/11 a 02/11/2026");
    expect(meio.identificacao.find((item) => item.rotulo === "Emitido em")?.valor).toBe("02/11/2026, 09:05");
  });

  it("no trimestre e no ano, o título e o selo acompanham o período", () => {
    const trimestre = montarDocumentoPgrs({ ...RELATORIO, periodo: "trimestre" }, contexto());
    expect(trimestre.titulo).toBe("Relatório de resíduos · agosto a outubro de 2026");
    expect(trimestre.pill).toBe("RELATÓRIO TRIMESTRAL · PGRS");
    expect(trimestre.rodape).toContain("ago–out/2026");
    expect(trimestre.nomeDoArquivo).toBe("pgrs-ago-out-2026");
    expect(trimestre.identificacao.find((item) => item.rotulo === "Período")?.valor).toBe("01/08 a 31/10/2026");

    const ano = montarDocumentoPgrs({ ...RELATORIO, periodo: "ano" }, contexto());
    expect(ano.titulo).toBe("Relatório de resíduos · 2026");
    expect(ano.pill).toBe("RELATÓRIO ANUAL · PGRS");
    expect(ano.identificacao.find((item) => item.rotulo === "Período")?.valor).toBe("01/01 a 31/10/2026");
  });

  it("o trimestre que cruza o ano cita os dois anos", () => {
    const janeiro = montarDocumentoPgrs({ ...RELATORIO, periodo: "trimestre" }, contexto({ agora: new Date(2027, 0, 20) }));
    expect(janeiro.titulo).toBe("Relatório de resíduos · novembro de 2026 a janeiro de 2027");
    expect(janeiro.identificacao.find((item) => item.rotulo === "Período")?.valor).toBe("01/11/2026 a 20/01/2027");
  });

  it("o que a pessoa não pode ler vira traço, sem inventar", () => {
    const semDados = montarDocumentoPgrs(
      RELATORIO,
      contexto({ unidade: null, nomeDaUnidade: "Minha unidade", responsavel: { nome: "", funcao: "" }, cooperativas: [] }),
    );
    const valor = (rotulo: string): string | undefined =>
      semDados.identificacao.find((item) => item.rotulo === rotulo)?.valor;
    expect(valor("Unidade")).toBe("Minha unidade");
    expect(valor("CNPJ")).toBe("—");
    expect(valor("Endereço")).toBe("—");
    expect(valor("Setores")).toBe("—");
    expect(valor("Responsável")).toBe("—");
  });

  it("com um setor só, escreve no singular", () => {
    const um = montarDocumentoPgrs(
      RELATORIO,
      contexto({ unidade: { nome: "U", cnpj: "", endereco: "", setores: 1 } }),
    );
    expect(um.identificacao.find((item) => item.rotulo === "Setores")?.valor).toBe("1 cadastrado");
  });
});

describe("indicadores do resumo", () => {
  it("compara cada número com o período anterior", () => {
    expect(documento.resumo.titulo).toBe("Resumo do mês");
    expect(documento.resumo.comparacao).toBe("comparado com setembro de 2026");
    expect(documento.resumo.cartoes).toEqual([
      { rotulo: "Ocorrências", valor: "52", unidade: null, rodape: "↑ +12 vs. setembro", tom: "bom" },
      { rotulo: "Recuperado", valor: "1.147", unidade: "kg", rodape: "↑ +8% vs. setembro", tom: "bom" },
      { rotulo: "Taxa de aprovação", valor: "94", unidade: "%", rodape: "↑ +3 pontos", tom: "bom" },
      { rotulo: "Desviado de aterro", valor: "89", unidade: "%", rodape: "do volume registrado", tom: "neutro" },
    ]);
  });

  it("mostra queda em vermelho, igualdade em neutro e o ponto no singular", () => {
    const caiu = montarDocumentoPgrs(
      { ...RELATORIO, ocorrencias: 37, recuperadoKg: 1062, taxaAprovacao: 92 },
      contexto(),
    ).resumo.cartoes;
    expect(caiu[0]).toMatchObject({ rodape: "↓ -3 vs. setembro", tom: "ruim" });
    expect(caiu[1]).toMatchObject({ rodape: "→ 0% vs. setembro", tom: "neutro" });
    expect(caiu[2]).toMatchObject({ rodape: "↑ +1 ponto", tom: "bom" });
  });

  it("sem período anterior, não há comparação", () => {
    const sem = montarDocumentoPgrs({ ...RELATORIO, anterior: null }, contexto());
    expect(sem.resumo.comparacao).toBeNull();
    expect(sem.resumo.cartoes.slice(0, 3).every((cartao) => cartao.rodape === null)).toBe(true);
  });

  it("taxa e desvio sem base viram traço", () => {
    const sem = montarDocumentoPgrs({ ...RELATORIO, taxaAprovacao: null, desvioAterro: null }, contexto());
    expect(sem.resumo.cartoes[2]).toMatchObject({ valor: "—", unidade: null, rodape: null });
    expect(sem.resumo.cartoes[3]).toMatchObject({ valor: "—", unidade: null });
  });

  it("no trimestre, compara com o trimestre anterior", () => {
    const trimestre = montarDocumentoPgrs(
      { ...RELATORIO, periodo: "trimestre", anterior: { rotulo: "o trimestre anterior", ocorrencias: 40, recuperadoKg: 1062, taxaAprovacao: 91 } },
      contexto(),
    );
    expect(trimestre.resumo.titulo).toBe("Resumo do trimestre");
    expect(trimestre.resumo.cartoes[0].rodape).toBe("↑ +12 vs. trimestre anterior");
  });
});

describe("meta do mês", () => {
  it("mostra o atingido, a meta e o percentual", () => {
    expect(documento.meta).toEqual({ atingido: "1.147 kg", total: "1.500 kg", percentual: 76 });
  });

  it("some sem meta definida e fora do relatório mensal", () => {
    expect(montarDocumentoPgrs(RELATORIO, contexto({ metaMensalKg: 0 })).meta).toBeNull();
    expect(montarDocumentoPgrs({ ...RELATORIO, periodo: "trimestre" }, contexto()).meta).toBeNull();
  });

  it("deixa o percentual passar de 100 quando a meta foi superada", () => {
    expect(montarDocumentoPgrs(RELATORIO, contexto({ metaMensalKg: 1000 })).meta?.percentual).toBe(115);
  });
});

describe("recuperado por material e por setor", () => {
  it("dá a parcela de cada material e a barra em relação ao maior", () => {
    expect(documento.materiais.linhas.map((linha) => [linha.rotulo, linha.valor, linha.percentual, linha.barra])).toEqual([
      ["Papelão", "542 kg", "47,3%", 100],
      ["Plástico", "318 kg", "27,7%", 59],
      ["Metal", "176 kg", "15,3%", 32],
      ["Vidro", "111 kg", "9,7%", 20],
    ]);
    expect(documento.materiais.total).toBe("1.147 kg");
  });

  it("o que passou dos quatro materiais entra numa linha à parte, para o total fechar", () => {
    const comOutros = montarDocumentoPgrs({ ...RELATORIO, recuperadoKg: 1200 }, contexto());
    const ultima = comOutros.materiais.linhas[comOutros.materiais.linhas.length - 1];
    expect(ultima).toMatchObject({ rotulo: "Outros materiais", valor: "53 kg", resto: true });
  });

  it("mostra os cinco maiores setores e junta o resto", () => {
    const linhas = documento.setores.linhas;
    expect(linhas).toHaveLength(6);
    expect(linhas[0]).toMatchObject({ rotulo: "Frigorífico B2", valor: "342 kg", percentual: "29,8%", barra: 100, resto: false });
    expect(linhas[5]).toMatchObject({ rotulo: "Outros 3 setores", valor: "142 kg", percentual: "12,4%", resto: true });
  });

  it("com um setor a mais, escreve 'Outros 1 setor'", () => {
    const seis = montarDocumentoPgrs(
      { ...RELATORIO, setoresRecuperados: RELATORIO.setoresRecuperados?.slice(0, 6) },
      contexto(),
    );
    expect(seis.setores.linhas[5].rotulo).toBe("Outros 1 setor");
  });

  it("sem a lista completa, usa os setores do relatório", () => {
    const antigo = montarDocumentoPgrs(
      { ...RELATORIO, setoresRecuperados: undefined, setores: [{ nome: "Expedição", kg: 100 }] },
      contexto(),
    );
    expect(antigo.setores.linhas).toHaveLength(1);
  });
});

describe("destinação final por cooperativa", () => {
  it("traz distância, materiais, quilos, parcela e licença", () => {
    const [jbs, recicla, coop] = documento.destinacao?.linhas ?? [];
    expect(jbs).toEqual({
      nome: "JBS Ambiental",
      distancia: "2,4 km da unidade",
      materiais: "Papelão, plástico, metal e vidro",
      destinado: "539 kg",
      parcela: "47%",
      licenca: "VÁLIDA ATÉ DEZ/2027",
      tomDaLicenca: "valida",
    });
    expect(recicla).toMatchObject({ materiais: "Papelão e plástico", licenca: "VENCE EM 12 DIAS", tomDaLicenca: "vencendo" });
    expect(coop).toMatchObject({ materiais: "Papelão", licenca: "VÁLIDA ATÉ MAR/2027" });
  });

  it("soma os totais e diz que todo o material foi para parceiras homologadas", () => {
    expect(documento.destinacao?.totalDestinado).toBe("1.147 kg");
    expect(documento.destinacao?.totalParcela).toBe("100%");
    expect(documento.destinacao?.subtitulo).toBe("todo o material recuperado foi destinado a parceiras homologadas");
  });

  it("não afirma a homologação quando alguma cooperativa está em homologação ou é desconhecida", () => {
    const emHomologacao = montarDocumentoPgrs(
      RELATORIO,
      contexto({ cooperativas: [criarCooperativa({ id: "jbs", situacao: "em_homologacao" }), ...COOPERATIVAS.slice(1)] }),
    );
    expect(emHomologacao.destinacao?.subtitulo).toBe("material recuperado destinado às cooperativas parceiras");
    const semLista = montarDocumentoPgrs(RELATORIO, contexto({ cooperativas: [] }));
    expect(semLista.destinacao?.subtitulo).toBe("material recuperado destinado às cooperativas parceiras");
  });

  it("cooperativa que a API não deixa listar aparece sem licença nem distância", () => {
    const [jbs] = montarDocumentoPgrs(RELATORIO, contexto({ cooperativas: [] })).destinacao?.linhas ?? [];
    expect(jbs).toMatchObject({ distancia: null, licenca: "NÃO INFORMADA", tomDaLicenca: "neutra", materiais: "Papelão, plástico, metal e vidro" });
  });

  it("sem os materiais da coleta, usa os que a cooperativa aceita", () => {
    const semMateriais = montarDocumentoPgrs(
      { ...RELATORIO, destinacao: [{ cooperativaId: "jbs", nome: "JBS Ambiental", percentual: 100, kg: 10 }] },
      contexto({ cooperativas: [criarCooperativa({ id: "jbs", materiaisAceitos: ["papel_misto", "oleo"] })] }),
    );
    expect(semMateriais.destinacao?.linhas[0].materiais).toBe("Papel misto e óleo");
  });

  it("sem os quilos, mostra traço", () => {
    const semKg = montarDocumentoPgrs(
      { ...RELATORIO, destinacao: [{ cooperativaId: "jbs", nome: "JBS Ambiental", percentual: 100 }] },
      contexto(),
    );
    expect(semKg.destinacao?.linhas[0].destinado).toBe("—");
    expect(semKg.destinacao?.totalDestinado).toBe("—");
  });

  it("a seção some quando não houve coleta", () => {
    expect(montarDocumentoPgrs({ ...RELATORIO, destinacao: [] }, contexto()).destinacao).toBeNull();
  });

  it("licença vencida aparece em vermelho", () => {
    const vencida = montarDocumentoPgrs(
      RELATORIO,
      contexto({ cooperativas: [criarCooperativa({ id: "jbs", licencaValidaAte: "2026-10-01" }), ...COOPERATIVAS.slice(1)] }),
    );
    expect(vencida.destinacao?.linhas[0]).toMatchObject({ licenca: "LICENÇA VENCIDA", tomDaLicenca: "problema" });
  });
});

describe("ocorrências aprovadas", () => {
  it("mostra a amostra com o peso compacto e o material", () => {
    expect(documento.ocorrencias).toEqual([
      { id: "o1", codigo: "#0481", titulo: "Sucata metálica", setor: "Manutenção", material: "Metal", peso: `≈61${ESPACO_FIXO}kg`, registradaPor: "João Pereira" },
      { id: "o2", codigo: "#0480", titulo: "Papelão limpo", setor: "Recebimento", material: "—", peso: `≈45${ESPACO_FIXO}kg`, registradaPor: "Ana Souza" },
    ]);
  });

  it("não traz a confiança da IA, que saiu das telas", () => {
    expect(JSON.stringify(documento)).not.toMatch(/confian/i);
  });

  it("fica vazia quando o relatório não traz a amostra", () => {
    expect(montarDocumentoPgrs({ ...RELATORIO, aprovadasRecentes: undefined }, contexto()).ocorrencias).toEqual([]);
  });
});

describe("recomendações do VOLTA", () => {
  it("monta até três, só do que os dados mostram", () => {
    expect(documento.recomendacoes?.titulo).toBe("Recomendações do VOLTA para novembro");
    expect(documento.recomendacoes?.itens).toEqual([
      'No setor Frigorífico B2, "papelão molhado" foi registrado 3 vezes neste mês. Vale uma ação preventiva no setor.',
      "A licença ambiental da Recicla Vida vence em 12 dias. Peça a renovação antes da próxima coleta.",
      "Faltam 353 kg para a meta mensal de 1.500 kg. Frigorífico B2 é o setor que mais gera resíduo: é onde há mais a recuperar.",
    ]);
  });

  it("cita o dia no singular e a licença que vence hoje ou já venceu", () => {
    const comLicenca = (licencaValidaAte: string): readonly string[] =>
      montarDocumentoPgrs(
        { ...RELATORIO, recorrencia: null },
        contexto({ metaMensalKg: 0, cooperativas: [criarCooperativa({ id: "recicla", nome: "Recicla Vida", licencaValidaAte })] }),
      ).recomendacoes?.itens ?? [];
    expect(comLicenca("2026-11-01")[0]).toContain("vence em 1 dia.");
    expect(comLicenca("2026-10-31")[0]).toContain("vence hoje.");
    expect(comLicenca("2026-10-20")[0]).toBe(
      "A licença ambiental da Recicla Vida está vencida. Regularize antes de enviar novas coletas.",
    );
  });

  it("não cita licença de cooperativa que não recebeu o material do período", () => {
    const fora = montarDocumentoPgrs(
      { ...RELATORIO, recorrencia: null },
      contexto({ metaMensalKg: 0, cooperativas: [criarCooperativa({ id: "outra", licencaValidaAte: "2026-11-05" })] }),
    );
    expect(fora.recomendacoes).toBeNull();
  });

  it("com a meta batida, sugere rever a meta do próximo mês", () => {
    const batida = montarDocumentoPgrs({ ...RELATORIO, recorrencia: null }, contexto({ metaMensalKg: 1000, cooperativas: [] }));
    expect(batida.recomendacoes?.itens).toEqual(["A meta mensal de 1.000 kg foi atingida. Vale rever a meta do próximo mês."]);
  });

  it("chegar exatamente na meta também conta como atingida", () => {
    const exata = montarDocumentoPgrs({ ...RELATORIO, recorrencia: null }, contexto({ metaMensalKg: 1147, cooperativas: [] }));
    expect(exata.recomendacoes?.itens[0]).toBe("A meta mensal de 1.147 kg foi atingida. Vale rever a meta do próximo mês.");
  });

  it("no trimestre e no ano, fala do próximo período e não da meta do mês", () => {
    const trimestre = montarDocumentoPgrs({ ...RELATORIO, periodo: "trimestre" }, contexto());
    expect(trimestre.recomendacoes?.titulo).toBe("Recomendações do VOLTA para o próximo período");
    expect(trimestre.recomendacoes?.itens.some((item) => item.includes("meta mensal"))).toBe(false);
    expect(trimestre.recomendacoes?.itens[0]).toContain("no período");
  });

  it("o bloco some quando não há nada a recomendar", () => {
    const nada = montarDocumentoPgrs({ ...RELATORIO, recorrencia: null }, contexto({ metaMensalKg: 0, cooperativas: [] }));
    expect(nada.recomendacoes).toBeNull();
  });
});

describe("declaração do responsável", () => {
  it("cita a unidade e o período do relatório", () => {
    expect(documento.declaracao).toBe(
      "Declaro que as informações deste relatório correspondem aos registros da Unidade Frigorífico no período de 01/10 a 31/10/2026, aprovados no painel VOLTA.",
    );
    expect(documento.responsavel).toEqual({ nome: "Davi Liu", funcao: "Gestor · Responsável PGRS" });
  });
});
