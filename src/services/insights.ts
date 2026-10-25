import type { PrevisaoCapacidadeApi, ResumoGestaoApi } from "../types/api";
import type { DicaVolta, InsightVolta } from "../types/insight";
import { BASE_CHATBOT, aoEncerrarSessao, requisitar, USAR_MOCKS } from "./http";
import type { OpcoesRequisicao } from "./http";
import { listarAreas } from "./ocorrencias.api";

/**
 * Sugestões do mascote. Com a IA do chatbot, o "VOLTA notou" vem do resumo de
 * gestão (GET /v1/occurrences/reports/ai_summary) e a dica vem da previsão de
 * lotação dos setores (GET /v1/occurrences/areas/{id}/predict_capacity).
 * Qualquer falha da IA vira "sem sugestão": o painel funciona sem elas.
 */

const TEMPO_IA_MS = 60_000;
const VALIDADE_MS = 10 * 60_000;
const LIMITE_TEXTO = 240;
/** Capacidade usada pela previsão (o padrão do chatbot); a API não guarda a da caçamba. */
const CAPACIDADE_PADRAO_KG = 1000;

const BASE: OpcoesRequisicao = {
  base: BASE_CHATBOT,
  detalheDoServidor: true,
  semLogoutEm401: true,
  tempoLimiteMs: TEMPO_IA_MS,
};

const INSIGHT_MOCK: InsightVolta = {
  texto:
    "o Setor B2 registrou papelão molhado 3 vezes essa semana. Que tal uma área coberta perto da câmara fria?",
};

const DICA_MOCK: DicaVolta = {
  trechos: [
    { texto: "A licença da " },
    { texto: "Recicla Vida", destaque: true },
    {
      texto:
        " vence em 12 dias. Peça a renovação antes de mandar mais material.",
    },
  ],
  destino: "/cooperativas",
  rotuloDestino: "Ver cooperativa",
};

interface Guardado<T> {
  readonly em: number;
  readonly valor: Promise<T>;
}

let insightGuardado: Guardado<InsightVolta | null> | null = null;
let dicaGuardada: Guardado<DicaVolta | null> | null = null;

aoEncerrarSessao(() => {
  insightGuardado = null;
  dicaGuardada = null;
});

/** Reaproveita a resposta da IA por alguns minutos: cada chamada gasta tempo e cota do modelo. */
function guardar<T>(
  atual: Guardado<T> | null,
  buscar: () => Promise<T>,
): Guardado<T> {
  if (atual && Date.now() - atual.em < VALIDADE_MS) return atual;
  return { em: Date.now(), valor: buscar() };
}

/** Corta no fim de uma frase (ou de uma palavra) para caber no cartão do mascote. */
export function resumirTexto(texto: string, limite: number = LIMITE_TEXTO): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const fimDeFrase = Math.max(
    corte.lastIndexOf(". "),
    corte.lastIndexOf("! "),
    corte.lastIndexOf("? "),
  );
  if (fimDeFrase >= limite / 2) return corte.slice(0, fimDeFrase + 1);
  const fimDePalavra = corte.lastIndexOf(" ");
  return `${corte.slice(0, fimDePalavra > 0 ? fimDePalavra : limite).replace(/[.,;:]$/, "")}…`;
}

async function buscarInsight(): Promise<InsightVolta | null> {
  try {
    const resumo = await requisitar<ResumoGestaoApi>(
      "/v1/occurrences/reports/ai_summary",
      BASE,
    );
    // Sem registros recentes a IA devolve só o aviso, sem recomendação.
    if (resumo.recomendacoes.length === 0) return null;
    const texto = [resumo.problema_analisado, resumo.recomendacoes[0]]
      .map((parte) => parte.trim())
      .filter(Boolean)
      .join(" ");
    return texto ? { texto: resumirTexto(texto) } : null;
  } catch {
    return null;
  }
}

async function buscarDica(sinal?: AbortSignal): Promise<DicaVolta | null> {
  try {
    const areas = await listarAreas();
    const previsoes = await Promise.all(
      areas.map(async (area) => {
        try {
          const previsao = await requisitar<PrevisaoCapacidadeApi>(
            `/v1/occurrences/areas/${area.id}/predict_capacity?capacidade_maxima=${CAPACIDADE_PADRAO_KG}`,
            { ...BASE, sinal },
          );
          return { area, previsao };
        } catch {
          // 400 quando o setor ainda não tem histórico suficiente.
          return null;
        }
      }),
    );
    const proxima = previsoes
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null &&
          typeof item.previsao.dias_ate_lotacao === "number" &&
          item.previsao.dias_ate_lotacao >= 0,
      )
      .sort(
        (a, b) =>
          (a.previsao.dias_ate_lotacao ?? 0) - (b.previsao.dias_ate_lotacao ?? 0),
      )[0];
    if (!proxima) return null;

    const dias = proxima.previsao.dias_ate_lotacao ?? 0;
    return {
      trechos: [
        { texto: "No ritmo atual, " },
        { texto: proxima.area.sectorName, destaque: true },
        { texto: " chega a " },
        {
          texto: `${CAPACIDADE_PADRAO_KG.toLocaleString("pt-BR")} kg`,
          destaque: true,
        },
        {
          texto:
            dias === 0
              ? " hoje. Programe a coleta."
              : ` em ${dias} ${dias === 1 ? "dia" : "dias"}. Programe a coleta antes.`,
        },
      ],
      destino: "/cooperativas",
      rotuloDestino: "Ver cooperativas",
    };
  } catch {
    return null;
  }
}

/** "VOLTA notou": o resumo da IA sobre os registros recentes, ou nada. */
export async function obterInsight(): Promise<InsightVolta | null> {
  if (USAR_MOCKS) return INSIGHT_MOCK;
  insightGuardado = guardar(insightGuardado, buscarInsight);
  return insightGuardado.valor;
}

/** "Dica do VOLTA": o que merece atenção em seguida, ou nada. */
export async function obterDica(): Promise<DicaVolta | null> {
  if (USAR_MOCKS) return DICA_MOCK;
  dicaGuardada = guardar(dicaGuardada, () => buscarDica());
  return dicaGuardada.valor;
}
