import { describe, expect, it } from "vitest";

import { derivarDoRegistro } from "../../pages/Registrar/derivados";
import { estadoInicial } from "../../pages/Registrar/reducer";
import type { EstadoRegistrar } from "../../pages/Registrar/reducer";
import type { ClassificacaoIA, OpcaoTipoResiduo } from "../../types/classificacao";

const OPCOES: readonly OpcaoTipoResiduo[] = [
  { valor: "id-plastico", rotulo: "Plástico", material: "plastico" },
  { valor: "id-papelao", rotulo: "Papelão", material: "papelao" },
  { valor: "id-outro", rotulo: "Outro", material: null },
];

const classificacao = (parcial: Partial<ClassificacaoIA> = {}): ClassificacaoIA => ({
  material: "papelao",
  recomendacao: "Secar antes de enviar",
  analisadaEm: "2026-11-03T12:00:00Z",
  ...parcial,
});

const estado = (parcial: Partial<EstadoRegistrar> = {}): EstadoRegistrar => ({
  ...estadoInicial("Lins"),
  ...parcial,
});

describe("derivarDoRegistro", () => {
  it("nos detalhes, ainda não há análise: passo 1 e nada concluído", () => {
    expect(derivarDoRegistro(estado(), OPCOES)).toMatchObject({
      passo: 1,
      emAnalise: false,
      concluida: false,
      analisando: false,
      analiseFalhou: false,
      valorDoTipo: "",
      rotuloPrioridade: "Média",
    });
  });

  it("na análise, sem resposta da IA ainda, está analisando (passo 2)", () => {
    expect(derivarDoRegistro(estado({ etapa: "analise" }), OPCOES)).toMatchObject({
      passo: 2,
      emAnalise: true,
      analisando: true,
      concluida: false,
    });
  });

  it("quando a IA não responde, deixa de analisar e marca a falha", () => {
    const derivados = derivarDoRegistro(estado({ etapa: "analise", analiseFalhou: true }), OPCOES);
    expect(derivados).toMatchObject({ analisando: false, analiseFalhou: true, concluida: false });
  });

  it("com a classificação, a análise está concluída e mostra o que a IA viu", () => {
    const derivados = derivarDoRegistro(
      estado({
        etapa: "analise",
        prioridade: "alta",
        classificacao: classificacao({ tipoDetectado: "Papelão molhado", contaminacao: "media", unidades: 4 }),
      }),
      OPCOES,
    );
    expect(derivados).toMatchObject({
      concluida: true,
      analisando: false,
      rotuloPrioridade: "Alta",
      tipoRotulo: "Papelão molhado",
      nivelDeContaminacao: "media",
      unidades: 4,
    });
  });

  it("sem o tipo que a IA descreveu, o rótulo é o do material", () => {
    const derivados = derivarDoRegistro(estado({ etapa: "analise", classificacao: classificacao() }), OPCOES);
    expect(derivados.tipoRotulo).toBe("Papelão");
    expect(derivados.unidades).toBeNull();
    expect(derivados.nivelDeContaminacao).toBe("");
  });

  it("o tipo escolhido vale; sem ele, usa a opção do mesmo material; sem nenhuma, fica vazio", () => {
    const escolhido = estado({ etapa: "analise", classificacao: classificacao({ tipoResiduoId: "id-outro" }) });
    expect(derivarDoRegistro(escolhido, OPCOES).valorDoTipo).toBe("id-outro");

    const porMaterial = estado({ etapa: "analise", classificacao: classificacao({ material: "plastico" }) });
    expect(derivarDoRegistro(porMaterial, OPCOES).valorDoTipo).toBe("id-plastico");

    const semOpcao = estado({ etapa: "analise", classificacao: classificacao({ material: "metal" }) });
    expect(derivarDoRegistro(semOpcao, OPCOES).valorDoTipo).toBe("");

    const semMaterial = estado({ etapa: "analise", classificacao: classificacao({ material: null }) });
    expect(derivarDoRegistro(semMaterial, OPCOES).valorDoTipo).toBe("");
  });

  it("a área da foto mostra erro quando falta a foto e ela foi recusada ou apontada", () => {
    expect(derivarDoRegistro(estado({ fotoRecusada: true }), OPCOES).fotoComErro).toBe(true);
    expect(derivarDoRegistro(estado({ erroCampo: { foto: "Anexe uma foto." } }), OPCOES).fotoComErro).toBe(true);
    expect(derivarDoRegistro(estado(), OPCOES).fotoComErro).toBe(false);
  });

  it("com a foto na tela, não mostra erro de foto", () => {
    const comFoto = estado({ fotoBase64: "data:image/png;base64,AAAA", fotoRecusada: true, erroCampo: { foto: "x" } });
    expect(derivarDoRegistro(comFoto, OPCOES).fotoComErro).toBe(false);
  });
});
