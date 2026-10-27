import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { fotoDoVideo, mensagemDeErroDaCamera } from "../../utils/camera";
import { Button } from "../Button";
import { Modal } from "../Modal";
import "./styles.css";

interface ModalCameraProps {
  readonly aberto: boolean;
  readonly onFechar: () => void;
  /** Recebe a foto tirada (JPEG em base64); quem chama decide quando fechar. */
  readonly onCapturar: (fotoBase64: string) => void;
}

type Situacao = "abrindo" | "pronta" | "erro";

interface CameraAoVivoProps {
  readonly onFechar: () => void;
  readonly onCapturar: (fotoBase64: string) => void;
}

/** Fica montada só enquanto a janela está aberta: abrir liga a câmera, fechar desliga. */
function CameraAoVivo({ onFechar, onCapturar }: CameraAoVivoProps): ReactNode {
  const video = useRef<HTMLVideoElement | null>(null);
  const [situacao, setSituacao] = useState<Situacao>("abrindo");
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    let encerrada = false;
    let fluxo: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((obtido) => {
        if (encerrada) {
          obtido.getTracks().forEach((faixa) => faixa.stop());
          return;
        }
        fluxo = obtido;
        if (video.current) video.current.srcObject = obtido;
        setSituacao("pronta");
      })
      .catch((excecao: unknown) => {
        if (encerrada) return;
        setMensagem(mensagemDeErroDaCamera(excecao));
        setSituacao("erro");
      });

    return () => {
      encerrada = true;
      fluxo?.getTracks().forEach((faixa) => faixa.stop());
    };
  }, []);

  function tirarFoto(): void {
    if (!video.current) return;
    const foto = fotoDoVideo(video.current);
    if (foto) onCapturar(foto);
  }

  return (
    <div className="modal-camera">
      {situacao === "erro" ? (
        <p role="alert" className="modal-camera__erro">
          {mensagem}
        </p>
      ) : (
        <>
          <video
            ref={video}
            className="modal-camera__video"
            autoPlay
            playsInline
            muted
            aria-label="Imagem ao vivo da câmera"
          />
          <p role="status" className="modal-camera__status">
            {situacao === "abrindo"
              ? "Abrindo a câmera… se o navegador pedir, permita o acesso."
              : "Enquadre o resíduo e toque em Tirar foto."}
          </p>
        </>
      )}
      <div className="modal-camera__acoes">
        <Button variante="secundario" onClick={onFechar}>
          {situacao === "erro" ? "Fechar" : "Cancelar"}
        </Button>
        {situacao === "erro" ? null : (
          <Button onClick={tirarFoto} disabled={situacao !== "pronta"}>
            Tirar foto
          </Button>
        )}
      </div>
    </div>
  );
}

/** Janela com a webcam, para computadores onde `capture` não abre a câmera. */
export function ModalCamera({
  aberto,
  onFechar,
  onCapturar,
}: ModalCameraProps): ReactNode {
  return (
    <Modal aberto={aberto} titulo="Tirar foto do resíduo" onFechar={onFechar}>
      <CameraAoVivo onFechar={onFechar} onCapturar={onCapturar} />
    </Modal>
  );
}
