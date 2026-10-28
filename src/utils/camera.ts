/**
 * Como a pessoa tira a foto neste aparelho:
 * - "nativa": celular ou tablet, onde `<input capture>` abre o app de câmera;
 * - "navegador": computador com webcam, onde o `capture` é ignorado e o
 *   navegador abre só o seletor de arquivos; a foto sai de getUserMedia;
 * - null: sem como abrir a câmera (por exemplo, página sem HTTPS).
 */
export type ModoCamera = "nativa" | "navegador" | null;

export function modoDaCamera(): ModoCamera {
  const aparelhoDeToque =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (aparelhoDeToque) return "nativa";
  return typeof navigator.mediaDevices?.getUserMedia === "function"
    ? "navegador"
    : null;
}

/** Texto para cada motivo pelo qual o navegador não entregou a câmera. */
export function mensagemDeErroDaCamera(excecao: unknown): string {
  const nome = excecao instanceof DOMException ? excecao.name : "";
  if (nome === "NotAllowedError" || nome === "SecurityError") {
    return 'O navegador não liberou a câmera. Permita o acesso na barra de endereço ou use "Enviar foto".';
  }
  if (nome === "NotFoundError" || nome === "OverconstrainedError") {
    return 'Nenhuma câmera encontrada neste computador. Use "Enviar foto".';
  }
  if (nome === "NotReadableError") {
    return "A câmera está em uso por outro programa. Feche-o e tente de novo.";
  }
  return 'Não foi possível abrir a câmera. Use "Enviar foto".';
}

/** Quadro atual do vídeo como foto JPEG em base64, no mesmo formato que o seletor de arquivos entrega. */
export function fotoDoVideo(video: HTMLVideoElement): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;
  const tela = document.createElement("canvas");
  tela.width = video.videoWidth;
  tela.height = video.videoHeight;
  const contexto = tela.getContext("2d");
  if (!contexto) return null;
  contexto.drawImage(video, 0, 0);
  return tela.toDataURL("image/jpeg", 0.9);
}
