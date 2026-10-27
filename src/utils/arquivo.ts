/** Converte a foto lida no navegador (data URL) em arquivo, para enviar como multipart. */
export async function arquivoDaFoto(
  dataUrl: string,
  nome = "residuo",
): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const extensao = blob.type.split("/")[1] || "jpg";
  return new File([blob], `${nome}.${extensao}`, { type: blob.type });
}
