import type {
  ClassificacaoIA,
  NivelContaminacao,
} from "../types/classificacao";
import type { Ocorrencia } from "../types/ocorrencia";

function nivelPorConfianca(confianca: number | null): NivelContaminacao | null {
  if (confianca === null) return null;
  if (confianca >= 0.85) return "baixa";
  if (confianca >= 0.75) return "media";
  return "alta";
}

const ROTULO_CONTAMINACAO: Readonly<Record<NivelContaminacao, string>> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

/** Nível informado pela IA; se não veio, deduz da confiança. "—" sem nenhum dos dois. */
export function contaminacao(classificacao: ClassificacaoIA | null): string {
  const nivel =
    classificacao?.contaminacao ??
    nivelPorConfianca(classificacao?.confianca ?? null);
  return nivel ? ROTULO_CONTAMINACAO[nivel] : "—";
}

export function relatorioAutomatico(ocorrencia: Ocorrencia): string {
  const prefixo = ocorrencia.perigoso
    ? "Resíduo perigoso (Classe I da NBR 10004): exige destinação especial e registro no PGRS. "
    : "";
  const textoDaIa = ocorrencia.classificacao?.relatorio?.trim();
  if (textoDaIa) return prefixo + textoDaIa;
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

/**
 * Recomendação que a IA deu para a ocorrência. A volta-api só devolve o laudo
 * da IA se alguém o gravar; sem ele (e sem a análise guardada neste navegador)
 * não há texto, e dizer que a IA "ainda analisa" seria falso.
 */
export function recomendacaoDaIa(ocorrencia: Ocorrencia): string {
  return (
    ocorrencia.classificacao?.recomendacao.trim() ||
    "A recomendação da IA não ficou guardada para esta ocorrência."
  );
}

export function recomendacaoVolta(
  ocorrencia: Ocorrencia,
  semelhantes: number,
): string {
  if (semelhantes >= 2) {
    return `Esse é o ${semelhantes}º ${ocorrencia.titulo.toLowerCase()} do ${ocorrencia.localizacao.setor} na semana. Vale uma ação preventiva no setor.`;
  }
  return recomendacaoDaIa(ocorrencia);
}
