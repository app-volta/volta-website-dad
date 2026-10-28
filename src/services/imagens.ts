/**
 * Envio das fotos das ocorrências para o Cloudinary. O navegador manda o arquivo
 * direto para o serviço de imagens (envio sem assinatura, por uma configuração
 * criada na conta) e recebe o endereço público, que a volta-api guarda em
 * `photoUrl`. O nome da conta e o da configuração não são segredos; a chave
 * secreta nunca entra no front.
 */

const NOME_DA_CONTA = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;
const CONFIG_DA_OCORRENCIA = import.meta.env
  .VITE_CLOUDINARY_PRESET_OCORRENCIA as string | undefined;

const BASE_DO_ENVIO = (
  (import.meta.env.VITE_CLOUDINARY_API_URL as string | undefined) ??
  "https://api.cloudinary.com/v1_1"
).replace(/\/+$/, "");

const TEMPO_LIMITE_MS = 30_000;
/** Tamanho máximo de `photoUrl` na volta-api. */
const LIMITE_DO_ENDERECO = 500;

interface RespostaDoEnvio {
  readonly secure_url?: string;
  readonly error?: { readonly message?: string };
}

/** Sem a conta e a configuração, as fotos não são guardadas e a ocorrência segue sem elas. */
export const ENVIO_DE_FOTOS_CONFIGURADO = Boolean(
  NOME_DA_CONTA && CONFIG_DA_OCORRENCIA,
);

/** Envia a foto da ocorrência e devolve o endereço público (https) dela. */
export async function enviarFotoDaOcorrencia(
  foto: File,
  sinal?: AbortSignal,
): Promise<string> {
  if (!NOME_DA_CONTA || !CONFIG_DA_OCORRENCIA) {
    throw new Error("O envio de fotos não está configurado.");
  }

  const corpo = new FormData();
  corpo.append("file", foto);
  corpo.append("upload_preset", CONFIG_DA_OCORRENCIA);

  const limite = AbortSignal.timeout(TEMPO_LIMITE_MS);
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_DO_ENVIO}/${NOME_DA_CONTA}/image/upload`, {
      method: "POST",
      body: corpo,
      signal: sinal ? AbortSignal.any([sinal, limite]) : limite,
    });
  } catch {
    throw new Error("Não foi possível enviar a foto agora.");
  }

  const dados = (await resposta.json().catch(() => null)) as RespostaDoEnvio | null;
  const endereco = dados?.secure_url;
  if (!resposta.ok || !endereco) {
    throw new Error(
      dados?.error?.message
        ? `O serviço de imagens recusou a foto: ${dados.error.message}`
        : "O serviço de imagens recusou a foto.",
    );
  }
  if (endereco.length > LIMITE_DO_ENDERECO) {
    throw new Error("O endereço da foto passou do tamanho que a API guarda.");
  }
  return endereco;
}
