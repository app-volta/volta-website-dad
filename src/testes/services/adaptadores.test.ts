import { describe, expect, it } from "vitest";

import type {
  AnaliseResiduoApi,
  AreaApi,
  CategoriaResiduoApi,
  CooperativaApi,
  IncidenteApi,
  NotificacaoApi,
  RiscoApi,
  TipoResiduoApi,
} from "../../types/api";
import {
  analiseInconclusiva,
  categoriaDoTexto,
  classificacaoDaAnalise,
  codigoDaOcorrencia,
  comDecisaoDaApi,
  cooperativaDaApi,
  eventoDaDecisao,
  eventosLocaisSemRepetir,
  materialDoTexto,
  notificacaoDaApi,
  ocorrenciaDaApi,
  opcoesDeTipo,
  riscoDaAnalise,
  statusDaApi,
  tipoDaAnalise,
  usuarioDaApi,
} from "../../services/adaptadores";
import type { CatalogoApi } from "../../services/adaptadores";

function tipo(
  id: string,
  category: CategoriaResiduoApi,
  extras: Partial<TipoResiduoApi> = {},
): TipoResiduoApi {
  return {
    id,
    category,
    description: null,
    defaultRiskLevel: "LOW",
    color: null,
    wasteClass: "CLASSE_II",
    ...extras,
  };
}

function catalogo(tipos: readonly TipoResiduoApi[], areas: readonly AreaApi[] = []): CatalogoApi {
  return {
    tipos: new Map(tipos.map((item) => [item.id, item])),
    areas: new Map(areas.map((item) => [item.id, item])),
  };
}

function analise(parcial: Partial<AnaliseResiduoApi> = {}): AnaliseResiduoApi {
  return {
    detected_waste_type: "Papelão molhado",
    ai_contamination_level: "BAIXO",
    estimated_quantity_kg: 12,
    recommendations: "Secar antes de enviar",
    report_text: "Relatório completo",
    mobile_summary: "Resumo",
    requires_human_validation: false,
    judge: null,
    analysis_id: null,
    generated_at: "2026-11-18T10:00:00",
    ...parcial,
  };
}

function incidente(parcial: Partial<IncidenteApi> = {}): IncidenteApi {
  return {
    id: "12345678-aaaa-bbbb-cccc-1234567890ab",
    companyId: "emp-1",
    userId: "user-1",
    areaId: "area-1",
    wasteTypeIds: ["t-plastico"],
    photoUrl: "https://exemplo.test/foto.jpg",
    employeeDescription: "Sacos de plástico no corredor",
    contaminationLevel: null,
    estimatedQuantity: 8,
    priority: "MEDIUM",
    status: "PENDING",
    registeredAt: "2026-11-18T10:00:00",
    ...parcial,
  };
}

describe("codigoDaOcorrencia", () => {
  it("deriva um código OCC-NNNNN estável do começo do UUID", () => {
    // 0x12345678 = 305.419.896 → resto 19.896 na divisão por 100.000.
    expect(codigoDaOcorrencia("12345678-aaaa-bbbb-cccc-1234567890ab")).toBe("OCC-19896");
    expect(codigoDaOcorrencia("12345678-aaaa-bbbb-cccc-1234567890ab")).toBe(
      codigoDaOcorrencia("12345678-aaaa-bbbb-cccc-1234567890ab"),
    );
  });

  it("completa com zeros e não quebra com id inválido", () => {
    expect(codigoDaOcorrencia("0000000a-0000-0000-0000-000000000000")).toBe("OCC-00010");
    expect(codigoDaOcorrencia("zzzz")).toBe("OCC-00000");
  });
});

describe("materialDoTexto", () => {
  it.each([
    ["Papel molhado", "papelao"],
    ["Papelão contaminado", "papelao"],
    ["Plástico filme", "plastico"],
    ["Garrafa de vidro", "vidro"],
    ["Sucata de METAL", "metal"],
  ])("%s é %s", (texto, material) => {
    expect(materialDoTexto(texto)).toBe(material);
  });

  it("devolve nulo para o que não é uma das quatro categorias", () => {
    expect(materialDoTexto("Óleo lubrificante")).toBeNull();
    expect(materialDoTexto("")).toBeNull();
    expect(materialDoTexto(null)).toBeNull();
  });
});

describe("categoriaDoTexto", () => {
  it.each<[string, CategoriaResiduoApi]>([
    ["Óleo lubrificante", "PERIGOSO"],
    ["Bateria velha", "PERIGOSO"],
    ["Seringa descartada", "SAUDE"],
    ["Material radioativo", "RADIOATIVO"],
    ["Papelão contaminado", "PAPEL"],
    ["Garrafa PET", "PLASTICO"],
    ["Lata de alumínio", "METAL"],
    ["Pallet de madeira", "MADEIRA"],
    ["Restos de comida", "ORGANICO"],
    ["Entulho", "NAO_RECICLAVEL"],
  ])("%s é %s", (texto, categoria) => {
    expect(categoriaDoTexto(texto)).toBe(categoria);
  });

  it("só casa palavras que começam no termo, sem pegar o meio de outra palavra", () => {
    expect(categoriaDoTexto("competente")).toBe("NAO_RECICLAVEL");
  });

  it("prefere a categoria mais perigosa quando o texto tem mais de uma", () => {
    expect(categoriaDoTexto("papelão com óleo")).toBe("PERIGOSO");
  });
});

describe("análise da IA", () => {
  it.each<[string, RiscoApi | null]>([
    ["BAIXO", "LOW"],
    ["médio", "MEDIUM"],
    ["Alto", "HIGH"],
    ["N/A", null],
    ["", null],
  ])("a contaminação %j vira o risco %s", (nivel, risco) => {
    expect(riscoDaAnalise(analise({ ai_contamination_level: nivel }))).toBe(risco);
  });

  it("é inconclusiva quando o juiz não aprova ou o nível é indeterminado", () => {
    expect(analiseInconclusiva(analise({ judge: { approved: false, reason: "foto ruim" } }))).toBe(true);
    expect(analiseInconclusiva(analise({ ai_contamination_level: "INDETERMINADO" }))).toBe(true);
    expect(analiseInconclusiva(analise({ judge: { approved: true, reason: null } }))).toBe(false);
    expect(analiseInconclusiva(analise())).toBe(false);
  });

  it("monta a classificação que as telas leem", () => {
    expect(classificacaoDaAnalise(analise())).toEqual({
      material: "papelao",
      contaminacao: "baixa",
      recomendacao: "Secar antes de enviar",
      relatorio: "Relatório completo",
      analisadaEm: "2026-11-18T10:00:00.000Z",
      tipoDetectado: "Papelão molhado",
      pesoEstimadoKg: 12,
      exigeValidacao: false,
    });
  });

  it("deixa a contaminação sem nível quando a IA não informa um valor conhecido", () => {
    expect(classificacaoDaAnalise(analise({ ai_contamination_level: "N/A" })).contaminacao).toBeUndefined();
  });
});

describe("catálogo de tipos de resíduo", () => {
  const tipos = [
    tipo("t1", "PAPEL"),
    tipo("t2", "PAPEL"),
    tipo("t3", "PLASTICO"),
    tipo("t4", "MADEIRA"),
    tipo("t5", "NAO_RECICLAVEL"),
  ];

  it("oferece um tipo por categoria, em ordem alfabética", () => {
    expect(opcoesDeTipo(catalogo(tipos))).toEqual([
      { valor: "t4", rotulo: "Madeira", material: null },
      { valor: "t5", rotulo: "Não reciclável", material: null },
      { valor: "t1", rotulo: "Papelão", material: "papelao" },
      { valor: "t3", rotulo: "Plástico", material: "plastico" },
    ]);
  });

  it("usa o tipo que a pessoa escolheu", () => {
    const escolhido = tipoDaAnalise({ tipoResiduoId: "t3", tipoDetectado: "Papel" }, catalogo(tipos));
    expect(escolhido?.id).toBe("t3");
  });

  it("sem escolha, usa o que o texto da IA indica", () => {
    const porTexto = tipoDaAnalise({ tipoDetectado: "Garrafa PET" }, catalogo(tipos));
    expect(porTexto?.category).toBe("PLASTICO");
  });

  it("sem correspondência, cai em não reciclável", () => {
    const resto = tipoDaAnalise({ tipoDetectado: "Entulho" }, catalogo(tipos));
    expect(resto?.category).toBe("NAO_RECICLAVEL");
  });
});

describe("statusDaApi", () => {
  it.each([
    ["PENDING", "classificada"],
    ["APPROVED", "aprovada"],
    ["REJECTED", "recusada"],
    ["CLOSED", "finalizada"],
  ] as const)("%s vira %s", (status, esperado) => {
    expect(statusDaApi(status)).toBe(esperado);
  });

  it("trata um status desconhecido como aguardando aprovação", () => {
    expect(statusDaApi("OUTRO" as never)).toBe("classificada");
  });
});

describe("usuarioDaApi", () => {
  const dto = {
    id: "u1",
    name: "Ana Souza",
    email: "ana@volta.com",
    role: "MANAGER",
    position: "Gerente",
    companyId: "emp-1",
  } as const;

  it("traduz o usuário e o papel", () => {
    expect(usuarioDaApi(dto)).toMatchObject({
      id: "u1",
      nome: "Ana Souza",
      papel: "responsavel_pgrs",
      perfil: "MANAGER",
      cargo: "Gerente",
      empresaId: "emp-1",
    });
  });

  it("EMPLOYEE e OPERATOR são operadores", () => {
    expect(usuarioDaApi({ ...dto, role: "EMPLOYEE" }).papel).toBe("operador");
    expect(usuarioDaApi({ ...dto, role: "OPERATOR" }).papel).toBe("operador");
  });
});

describe("ocorrenciaDaApi", () => {
  const area: AreaApi = {
    id: "area-1",
    companyId: "emp-1",
    sectorName: "Expedição",
    locationDescription: "Galpão 2",
  };
  const plastico = tipo("t-plastico", "PLASTICO");
  const vidroPerigoso = tipo("t-vidro", "VIDRO", { wasteClass: "CLASSE_I", defaultRiskLevel: "HIGH" });
  const base = catalogo([plastico, vidroPerigoso], [area]);

  it("traduz o registro com o setor, o código e a data em UTC", () => {
    const ocorrencia = ocorrenciaDaApi(incidente(), base, { autorNome: "Ana Souza" });
    expect(ocorrencia).toMatchObject({
      codigo: "OCC-19896",
      titulo: "Plástico",
      material: "plastico",
      status: "classificada",
      pesoKg: 8,
      prioridade: "media",
      criadaEm: "2026-11-18T10:00:00.000Z",
      criadaPorNome: "Ana Souza",
      localizacao: { setor: "Expedição", unidade: "Galpão 2" },
      perigoso: false,
      motivoRecusa: null,
    });
    expect(ocorrencia.historico).toHaveLength(1);
    expect(ocorrencia.historico[0]).toMatchObject({ tipo: "registro", autor: "Ana Souza" });
  });

  it("mostra um tipo só, o mais perigoso, e avisa quantos vêm junto", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ wasteTypeIds: ["t-plastico", "t-vidro"] }), base);
    expect(ocorrencia.titulo).toBe("Vidro +1");
    expect(ocorrencia.material).toBe("vidro");
    expect(ocorrencia.perigoso).toBe(true);
  });

  it("no empate de gravidade, escolhe o tipo de menor id", () => {
    const duas = catalogo([tipo("b", "PLASTICO"), tipo("a", "METAL")]);
    expect(ocorrenciaDaApi(incidente({ wasteTypeIds: ["b", "a"] }), duas).material).toBe("metal");
  });

  it("guarda o motivo só quando a ocorrência foi recusada", () => {
    const recusada = ocorrenciaDaApi(incidente({ status: "REJECTED", changeReason: "Foto ilegível" }), base);
    expect(recusada.status).toBe("recusada");
    expect(recusada.motivoRecusa).toBe("Foto ilegível");
    const aprovada = ocorrenciaDaApi(incidente({ status: "APPROVED", changeReason: "Ok" }), base);
    expect(aprovada.motivoRecusa).toBeNull();
  });

  it.each([
    ["LOW", "baixa"],
    ["HIGH", "alta"],
    ["CRITICAL", "alta"],
    ["ALTA", "alta"],
    ["baixa", "baixa"],
    ["qualquer", "media"],
  ])("a prioridade %s vira %s", (prioridade, esperada) => {
    expect(ocorrenciaDaApi(incidente({ priority: prioridade as never }), base).prioridade).toBe(esperada);
  });

  it("marca como perigosa a ocorrência de contaminação alta", () => {
    expect(ocorrenciaDaApi(incidente({ contaminationLevel: "HIGH" }), base).perigoso).toBe(true);
  });

  it("sem setor no catálogo e sem peso, usa os textos padrão", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ areaId: "outra", estimatedQuantity: null }), base);
    expect(ocorrencia.localizacao.setor).toBe("Setor não informado");
    expect(ocorrencia.pesoKg).toBe(0);
  });

  it("sem tipo no catálogo, o título é genérico e não há material", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ wasteTypeIds: ["desconhecido"] }), base);
    expect(ocorrencia.titulo).toBe("Resíduo");
    expect(ocorrencia.material).toBeNull();
  });

  it("sem foto, usa a imagem padrão em vez de deixar o campo vazio", () => {
    expect(ocorrenciaDaApi(incidente({ photoUrl: null }), base).fotoUrl).not.toBe("");
  });

  it("leva a contaminação e a quantidade da própria ocorrência para a classificação", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ contaminationLevel: "MEDIUM", estimatedQuantity: 8 }), base);
    expect(ocorrencia.classificacao).toMatchObject({
      material: "plastico",
      contaminacao: "media",
      pesoEstimadoKg: 8,
    });
  });
});

describe("quem revisou a ocorrência e quando", () => {
  const area: AreaApi = {
    id: "area-1",
    companyId: "emp-1",
    sectorName: "Expedição",
    locationDescription: "Galpão 2",
  };
  const base = catalogo([tipo("t-plastico", "PLASTICO")], [area]);
  const aprovada = incidente({
    status: "APPROVED",
    reviewedBy: "gestor-1",
    reviewedAt: "2026-11-18T14:30:00",
  });

  it("guarda quem decidiu e a data em UTC, e põe a decisão na linha do tempo", () => {
    const ocorrencia = ocorrenciaDaApi(aprovada, base, { autorNome: "Ana", revisorNome: "Carlos Lima" });
    expect(ocorrencia).toMatchObject({
      revisadaPor: "gestor-1",
      revisadaPorNome: "Carlos Lima",
      revisadaEm: "2026-11-18T14:30:00.000Z",
    });
    expect(ocorrencia.historico.map((evento) => evento.tipo)).toEqual(["registro", "aprovacao"]);
    expect(ocorrencia.historico[1]).toMatchObject({
      autor: "Carlos Lima",
      texto: "aprovou a ocorrência",
      em: "2026-11-18T14:30:00.000Z",
    });
  });

  it("sem o nome de quem decidiu, o autor do evento é Gestor e o nome fica vazio", () => {
    const ocorrencia = ocorrenciaDaApi(aprovada, base);
    expect(ocorrencia.revisadaPorNome).toBeNull();
    expect(ocorrencia.historico[1].autor).toBe("Gestor");
  });

  it("na recusa, o evento leva o motivo", () => {
    const recusada = incidente({
      status: "REJECTED",
      changeReason: "Foto ilegível",
      reviewedBy: "gestor-1",
      reviewedAt: "2026-11-18T14:30:00",
    });
    const evento = ocorrenciaDaApi(recusada, base).historico[1];
    expect(evento).toMatchObject({ tipo: "recusa", texto: "recusou a ocorrência · Foto ilegível" });
  });

  it("a ocorrência encerrada conta como aprovada", () => {
    const encerrada = incidente({ status: "CLOSED", reviewedBy: "gestor-1", reviewedAt: "2026-11-18T14:30:00" });
    expect(ocorrenciaDaApi(encerrada, base).historico[1].tipo).toBe("aprovacao");
  });

  it("aprovada antes de a API guardar a decisão, não inventa data nem evento", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ status: "APPROVED" }), base);
    expect(ocorrencia).toMatchObject({ revisadaPor: null, revisadaPorNome: null, revisadaEm: null });
    expect(ocorrencia.historico).toHaveLength(1);
  });

  it("a que ainda aguarda não ganha evento de decisão", () => {
    const ocorrencia = ocorrenciaDaApi(incidente({ reviewedBy: "gestor-1", reviewedAt: "2026-11-18T14:30:00" }), base);
    expect(ocorrencia.historico).toHaveLength(1);
  });

  it("a decisão fica na ordem do tempo, entre o registro e a coleta", () => {
    const coleta = {
      id: "coleta-1",
      tipo: "coleta" as const,
      autor: "Recicla Vida",
      texto: "recebeu o pedido de coleta",
      em: "2026-11-18T16:00:00.000Z",
    };
    const ocorrencia = ocorrenciaDaApi(aprovada, base, { coleta: [coleta] });
    expect(ocorrencia.historico.map((evento) => evento.tipo)).toEqual(["registro", "aprovacao", "coleta"]);
  });
});

describe("eventoDaDecisao", () => {
  it("aprovar não leva motivo", () => {
    expect(eventoDaDecisao("aprovacao", "OCC-1", "2026-11-18T14:30:00.000Z", "Ana", "ignorado")).toMatchObject({
      tipo: "aprovacao",
      autor: "Ana",
      texto: "aprovou a ocorrência",
    });
  });

  it("recusar sem motivo diz só que recusou", () => {
    expect(eventoDaDecisao("recusa", "OCC-1", "2026-11-18T14:30:00.000Z", null).texto).toBe("recusou a ocorrência");
  });
});

describe("e-mail da cooperativa", () => {
  const cooperativa: CooperativaApi = {
    id: "coop-1",
    name: "Recicla Vida",
    cnpj: "11222333000181",
    latitude: -21.67,
    longitude: -49.74,
    averageRating: 4.5,
    specialties: "PAPEL",
    email: "  contato@reciclavida.example ",
  };
  const volume = { usadoMesKg: 0, volumeMensalKg: [0, 0, 0, 0, 0] };

  it("leva o e-mail que a API devolve, sem os espaços", () => {
    expect(cooperativaDaApi(cooperativa, volume).email).toBe("contato@reciclavida.example");
  });

  it("sem e-mail (ou em branco), fica vazio para o botão se desligar", () => {
    expect(cooperativaDaApi({ ...cooperativa, email: undefined }, volume).email).toBeNull();
    expect(cooperativaDaApi({ ...cooperativa, email: "   " }, volume).email).toBeNull();
    expect(cooperativaDaApi({ ...cooperativa, email: null }, volume).email).toBeNull();
  });
});

describe("notificacaoDaApi", () => {
  const AGORA = Date.UTC(2026, 10, 18, 10, 5);
  const dto: NotificacaoApi = {
    id: "n-1",
    type: "COLLECTION",
    title: "Coleta solicitada",
    message: 'Coleta solicitada para a ocorrência "Papel misturado".',
    read: false,
    createdAt: "2026-11-18T10:00:00",
  };

  it("mostra a frase da API, quando ela chegou e que ainda não foi lida", () => {
    expect(notificacaoDaApi(dto, AGORA)).toEqual({
      id: "n-1",
      tipo: "coleta",
      trechos: [{ texto: 'Coleta solicitada para a ocorrência "Papel misturado".' }],
      quando: "há 5 min",
      destino: "/ocorrencias",
      lida: false,
    });
  });

  it("o tipo da API define o ícone: ocorrência ou coleta", () => {
    expect(notificacaoDaApi({ ...dto, type: "INCIDENT" }, AGORA).tipo).toBe("ocorrencia");
    expect(notificacaoDaApi({ ...dto, type: "COLLECTION" }, AGORA).tipo).toBe("coleta");
  });

  it("um tipo que a API passe a mandar e o painel não conhece vira ocorrência", () => {
    expect(notificacaoDaApi({ ...dto, type: "OUTRO" as never }, AGORA).tipo).toBe("ocorrencia");
  });

  it("respeita o que a API diz sobre já ter sido lida", () => {
    expect(notificacaoDaApi({ ...dto, read: true }, AGORA).lida).toBe(true);
  });
});

describe("decisão guardada na lista e eventos anotados no navegador", () => {
  const area: AreaApi = { id: "area-1", companyId: "emp-1", sectorName: "Expedição", locationDescription: "Galpão 2" };
  const base = catalogo([tipo("t-plastico", "PLASTICO")], [area]);
  const pendente = ocorrenciaDaApi(incidente(), base, { autorNome: "Ana" });
  const aprovadaNaApi = incidente({ status: "APPROVED", reviewedBy: "gestor-1", reviewedAt: "2026-11-18T14:30:00" });
  const anotado = {
    id: "OCC-1-l1",
    tipo: "aprovacao" as const,
    autor: "Carlos Lima",
    texto: "aprovou a ocorrência",
    em: "2026-11-18T14:31:00.000Z",
  };
  const observacao = { ...anotado, id: "OCC-1-l2", tipo: "observacao" as const, texto: "adicionou uma observação · ok" };

  it("depois de aprovar, a lista guarda o status, quem decidiu e a decisão na linha do tempo", () => {
    const depois = comDecisaoDaApi(pendente, aprovadaNaApi, "Carlos Lima");
    expect(depois).toMatchObject({
      status: "aprovada",
      revisadaPor: "gestor-1",
      revisadaPorNome: "Carlos Lima",
      revisadaEm: "2026-11-18T14:30:00.000Z",
      motivoRecusa: null,
    });
    expect(depois.historico.map((evento) => evento.tipo)).toEqual(["registro", "aprovacao"]);
  });

  it("depois de recusar, guarda o motivo no status e no evento", () => {
    const recusada = incidente({ status: "REJECTED", changeReason: "Foto ilegível", reviewedBy: "gestor-1", reviewedAt: "2026-11-18T14:30:00" });
    const depois = comDecisaoDaApi(pendente, recusada, null);
    expect(depois).toMatchObject({ status: "recusada", motivoRecusa: "Foto ilegível", revisadaPorNome: null });
    expect(depois.historico[1]).toMatchObject({ tipo: "recusa", autor: "Gestor", texto: "recusou a ocorrência · Foto ilegível" });
  });

  it("decidir de novo troca a decisão anterior em vez de empilhar duas", () => {
    const primeira = comDecisaoDaApi(pendente, aprovadaNaApi, "Carlos Lima");
    const segunda = comDecisaoDaApi(primeira, aprovadaNaApi, "Carlos Lima");
    expect(segunda.historico.filter((evento) => evento.tipo === "aprovacao")).toHaveLength(1);
  });

  it("com um servidor que ainda não devolve a data, só muda o status e o histórico fica igual", () => {
    const depois = comDecisaoDaApi(pendente, incidente({ status: "APPROVED" }), null);
    expect(depois).toMatchObject({ status: "aprovada", revisadaPor: null, revisadaEm: null });
    expect(depois.historico).toEqual(pendente.historico);
  });

  it("com a decisão na API, descarta a aprovação anotada no navegador e mantém as outras anotações", () => {
    const comDecisao = ocorrenciaDaApi(aprovadaNaApi, base, { revisorNome: "Carlos Lima" });
    expect(eventosLocaisSemRepetir(comDecisao, [anotado, observacao])).toEqual([observacao]);
  });

  it("sem a decisão na API, mantém a aprovação anotada no navegador", () => {
    const semDecisao = ocorrenciaDaApi(incidente({ status: "APPROVED" }), base);
    expect(eventosLocaisSemRepetir(semDecisao, [anotado, observacao])).toEqual([anotado, observacao]);
  });
});
