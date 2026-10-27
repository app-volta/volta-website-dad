/**
 * Converte a foto lida no navegador (data URL em base64, como o FileReader
 * devolve) em arquivo, para enviar como multipart. A decodificação é local:
 * nenhuma requisição sai daqui.
 */
export function arquivoDaFoto(dataUrl: string, nome = "residuo"): File {
  const [cabecalho = "", conteudo = ""] = dataUrl.split(",");
  const tipo = /^data:([^;,]+)/.exec(cabecalho)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(conteudo), (caractere) => caractere.charCodeAt(0));
  const extensao = tipo.split("/")[1] || "jpg";
  return new File([bytes], `${nome}.${extensao}`, { type: tipo });
}
