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

/** Maior foto aceita: o envio ao Cloudinary recusa imagens acima de 10 MB. */
export const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;

/** A foto escolhida serve? Precisa ser uma imagem e não passar do limite. */
export function fotoAceita(arquivo: Pick<File, "type" | "size">): boolean {
  return arquivo.type.startsWith("image/") && arquivo.size <= TAMANHO_MAXIMO_FOTO;
}

/** Lê a foto; o que não é imagem, passa do limite ou não abre cai em `aoFalhar`. */
export function lerFoto(
  arquivo: File,
  aoLer: (base64: string) => void,
  aoFalhar: () => void,
): void {
  if (!fotoAceita(arquivo)) {
    aoFalhar();
    return;
  }
  const leitor = new FileReader();
  leitor.onload = () => {
    if (typeof leitor.result === "string") aoLer(leitor.result);
    else aoFalhar();
  };
  leitor.onerror = aoFalhar;
  leitor.readAsDataURL(arquivo);
}
