import type { ClassificacaoIA } from "../types/classificacao";
import type { Material } from "../types/material";
import { MATERIAIS } from "../types/material";
import { aguardar } from "./http";

/**
 * MOCK de classificação por IA.
 *
 * O backend real deverá receber a foto do resíduo e retornar {material, confianca, recomendacao}.
 * Enquanto isso não existe, este mock:
 *   1. Simula latência de rede (~1.6s).
 *   2. Escolhe um material com base no hash simples da imagem, para respostas
 *      "determinísticas" na mesma foto.
 *   3. Devolve uma recomendação alinhada ao PGRS.
 *
 * ⚠️ SUBSTITUIR quando /classificacao existir no back — mantenha a assinatura.
 */

const RECOMENDACOES: Readonly<Record<Material, string>> = {
  papelao:
    "Enfardar seco e limpo antes de encaminhar. Cooperativas próximas absorvem o volume no mesmo dia.",
  plastico:
    "Separar rígidos de filmes. Cooperativas parceiras aceitam volume misto se pré-triado.",
  metal:
    "Alta prioridade de destinação: metal ferroso rende crédito ambiental ao PGRS.",
  vidro:
    "Empacotar em caixa rígida para transporte seguro. Verificar cooperativa com licença sanitária.",
};

function escolherMaterialDeterministico(pistaFoto: string): Material {
  let acumulador = 0;
  for (let i = 0; i < pistaFoto.length; i += 1) {
    acumulador = (acumulador + pistaFoto.charCodeAt(i)) % 997;
  }
  const indice = acumulador % MATERIAIS.length;
  return MATERIAIS[indice];
}

export async function classificarFoto(
  fotoBase64: string,
  sinal?: AbortSignal,
): Promise<ClassificacaoIA> {
  await aguardar(1600, sinal);
  if (!fotoBase64) {
    throw new Error("É preciso fornecer uma foto para classificar.");
  }
  const material = escolherMaterialDeterministico(fotoBase64);
  const confianca = 0.78 + ((fotoBase64.length % 20) / 100);
  return {
    material,
    confianca: Math.min(0.98, Number(confianca.toFixed(2))),
    recomendacao: RECOMENDACOES[material],
    analisadaEm: new Date().toISOString(),
  };
}
