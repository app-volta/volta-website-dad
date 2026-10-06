import { semelhantesNaSemana } from "../services/ocorrencias";
import type { Ocorrencia } from "../types/ocorrencia";

export function contaminacao(confianca: number): string {
  if (confianca >= 0.85) return "Baixa";
  if (confianca >= 0.75) return "Média";
  return "Alta";
}

export function relatorioAutomatico(ocorrencia: Ocorrencia): string {
  const prefixo = ocorrencia.perigoso
    ? "Resíduo perigoso (Classe I da NBR 10004): exige destinação especial e registro no PGRS. "
    : "";
  switch (ocorrencia.material) {
    case "papelao":
      return (
        prefixo +
        (ocorrencia.titulo.toLowerCase().includes("molhado")
          ? "Material com umidade superficial, ainda reciclável. Remover em até 24h e guardar em área coberta. Não descartar como rejeito."
          : "Material limpo e seco, pronto para enfardamento. Destinar à cooperativa parceira no próximo ciclo de coleta.")
      );
    case "plastico":
      return (
        prefixo +
        "Plástico com baixa contaminação. Separar rígidos de filmes antes do encaminhamento à cooperativa."
      );
    case "metal":
      return (
        prefixo +
        "Metal de alto valor de recuperação. Registrar o peso na pesagem e enviar direto à cooperativa."
      );
    case "vidro":
      return (
        prefixo +
        "Vidro íntegro. Empacotar em caixa rígida e verificar a licença sanitária da cooperativa."
      );
    case null:
      return (
        prefixo +
        `${ocorrencia.titulo} exige destinação específica. Consulte o responsável PGRS antes de enviar.`
      );
  }
}

export function recomendacaoVolta(ocorrencia: Ocorrencia): string {
  const semelhantes = semelhantesNaSemana(ocorrencia);
  if (semelhantes >= 2) {
    return `Esse é o ${semelhantes}º ${ocorrencia.titulo.toLowerCase()} do ${ocorrencia.localizacao.setor} na semana. Vale uma ação preventiva no setor.`;
  }
  return (
    ocorrencia.classificacao?.recomendacao ??
    "A IA ainda está analisando esta ocorrência."
  );
}
