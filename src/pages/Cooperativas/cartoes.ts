import type { CartaoResumo } from "../../components/CartoesResumo";
import type { ResumoCooperativas } from "../../utils/cooperativas";

export function montarCartoes(
  resumo: ResumoCooperativas,
): readonly CartaoResumo[] {
  return [
    {
      rotulo: "Parcerias ativas",
      valor: String(resumo.ativas),
      icone: "ciclo",
      tom: "verde",
    },
    {
      rotulo: "Em homologação",
      valor: String(resumo.emHomologacao),
      icone: "relogio",
      tom: "azul",
    },
    {
      rotulo: "Destinado no trimestre",
      valor: resumo.destinadoTrimestreKg.toLocaleString("pt-BR"),
      unidade: "kg",
      icone: "caminhao",
      tom: "roxo",
    },
    {
      rotulo: "Licenças vencendo",
      valor: String(resumo.licencasVencendo),
      icone: "alerta",
      tom: "laranja",
    },
  ];
}
