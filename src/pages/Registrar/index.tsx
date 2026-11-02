import { useEffect, useReducer, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { ModalCamera } from "../../components/ModalCamera";
import { useAuth } from "../../context/AuthContext";
import { useAcoesOcorrencia } from "../../hooks/useAcoesOcorrencia";
import { useDadosReais } from "../../hooks/useModo";
import { useOpcoesDeTipo } from "../../hooks/useOpcoesDeTipo";
import { useSetores } from "../../hooks/useSetores";
import type { OpcaoTipoResiduo } from "../../types/classificacao";
import { lerFoto } from "../../utils/arquivo";
import { modoDaCamera } from "../../utils/camera";
import { foiResultadoIncerto, foiSemResposta } from "../../utils/erros";
import {
  combinar,
  validarDescricao,
  validarFoto,
  validarObrigatorio,
  validarPeso,
} from "../../utils/validadores";
import { derivarDoRegistro } from "./derivados";
import { FotoDaOcorrencia } from "./FotoDaOcorrencia";
import { ModalEnvioIncerto } from "./ModalEnvioIncerto";
import { PainelAnalise } from "./PainelAnalise";
import { PainelDetalhes } from "./PainelDetalhes";
import { estadoInicial, pesoDaOcorrencia, redutor } from "./reducer";
import { Sucesso } from "./Sucesso";
import "./styles.css";

const SEM_SETORES: readonly string[] = [];
const SEM_OPCOES: readonly OpcaoTipoResiduo[] = [];

/**
 * Registro de ocorrência em duas etapas: detalhes e análise da IA. A página guarda o
 * estado (um reducer) e as ações; cada parte da tela é um componente que recebe o
 * estado e o `despachar` por props.
 */
export default function Registrar(): ReactNode {
  const { usuario } = useAuth();
  const acoes = useAcoesOcorrencia();
  const { dados: setoresCarregados, erro: erroSetores } = useSetores();
  const setores = setoresCarregados ?? SEM_SETORES;
  const { dados: opcoesCarregadas } = useOpcoesDeTipo();
  const opcoesDeTipo = opcoesCarregadas ?? SEM_OPCOES;
  const dadosReais = useDadosReais();
  const navegar = useNavigate();
  const [estado, despachar] = useReducer(
    redutor,
    usuario?.unidade ?? "Frigorífico — Setor B2",
    estadoInicial,
  );
  const setorInicial = useRef<string>(estado.setor);
  const peso = pesoDaOcorrencia(estado);
  const erroPeso = validarPeso(estado.pesoInformado);

  // O setor sugerido no início pode não existir na empresa; troca pelo primeiro cadastrado.
  useEffect(() => {
    if (setores.length === 0) return;
    if (estado.setor === setorInicial.current && !setores.includes(estado.setor)) {
      despachar({ tipo: "definir_setor", setor: setores[0] });
    }
  }, [setores, estado.setor]);
  const [cameraAberta, setCameraAberta] = useState<boolean>(false);
  const [modoCamera] = useState(modoDaCamera);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const inputCamera = useRef<HTMLInputElement | null>(null);

  function receberFoto(arquivo: File): void {
    lerFoto(
      arquivo,
      (foto) => despachar({ tipo: "definir_foto", foto }),
      () => despachar({ tipo: "foto_recusada" }),
    );
  }

  function selecionarFoto(evento: ChangeEvent<HTMLInputElement>): void {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    receberFoto(arquivo);
    evento.target.value = "";
  }

  function usarCamera(): void {
    if (modoCamera === "navegador") setCameraAberta(true);
    else inputCamera.current?.click();
  }

  function trocarFoto(): void {
    despachar({ tipo: "voltar_aos_detalhes" });
    inputArquivo.current?.click();
  }

  async function analisar(): Promise<void> {
    const descricaoInformada = estado.descricao.trim().length > 0;
    const validacao = combinar({
      foto: validarFoto(estado.fotoBase64),
      descricao: descricaoInformada ? validarDescricao(estado.descricao) : null,
      setor:
        estado.setor.trim() === ""
          ? "Escolha onde está o resíduo."
          : validarObrigatorio(estado.setor, "o setor", 80),
      peso: validarPeso(estado.pesoInformado),
    });
    if (!validacao.valido) {
      despachar({ tipo: "definir_erros", erros: validacao.erros });
      return;
    }
    despachar({ tipo: "iniciar_analise" });
    try {
      const classificacao = await acoes.analisar(estado.fotoBase64 ?? "");
      despachar({ tipo: "analise_pronta", classificacao });
    } catch (excecao) {
      despachar({
        tipo: "analise_erro",
        mensagem:
          excecao instanceof Error ? excecao.message : "Falha ao analisar.",
        semResposta: foiSemResposta(excecao),
      });
    }
  }

  /** Segue sem a IA: a pessoa escolhe o tipo e corrige o que souber antes de registrar. */
  function preencherSemIa(): void {
    despachar({
      tipo: "preencher_sem_ia",
      classificacao: {
        material: null,
        recomendacao: "",
        analisadaEm: new Date().toISOString(),
      },
    });
  }

  /** Só aqui a ocorrência é criada: já com a foto enviada e com o que a pessoa corrigiu. */
  async function registrar(): Promise<void> {
    if (!estado.classificacao || erroPeso) return;
    despachar({ tipo: "iniciar_registro" });
    try {
      const criada = await acoes.criar({
        descricao:
          estado.descricao.trim().length > 0
            ? estado.descricao
            : `Resíduo registrado em ${estado.setor}`,
        prioridade: estado.prioridade,
        autorNome: usuario?.nome ?? "Equipe",
        localizacao: { setor: estado.setor, unidade: usuario?.unidade ?? "-" },
        fotoBase64: estado.fotoBase64 ?? "",
        // O peso informado vale mais que a estimativa da IA; sem nenhum dos dois, vai vazio.
        classificacao: { ...estado.classificacao, pesoEstimadoKg: peso.kg },
      });
      despachar({
        tipo: "registro_ok",
        codigo: criada.codigo,
        // No mock a foto nunca sai do navegador; na API, "data:" quer dizer que o envio falhou.
        fotoGuardada: !dadosReais || !criada.fotoUrl.startsWith("data:"),
      });
    } catch (excecao) {
      despachar({
        tipo: "registro_erro",
        mensagem:
          excecao instanceof Error ? excecao.message : "Falha ao registrar.",
        incerto: foiResultadoIncerto(excecao),
      });
    }
  }

  function escolherTipo(valor: string): void {
    const opcao = opcoesDeTipo.find((item) => item.valor === valor);
    if (!opcao) return;
    despachar({
      tipo: "ajustar_analise",
      ajuste: {
        tipoResiduoId: opcao.valor,
        material: opcao.material,
        tipoDetectado: opcao.rotulo,
      },
    });
  }

  if (estado.etapa === "sucesso") {
    return (
      <Sucesso
        codigo={estado.codigoGerado}
        peso={peso}
        fotoGuardada={estado.fotoGuardada}
        aoRegistrarOutra={() =>
          despachar({
            tipo: "reiniciar",
            setor: usuario?.unidade ?? "Frigorífico — Setor B2",
          })
        }
        aoVerOcorrencias={() => navegar("/ocorrencias")}
      />
    );
  }

  const derivados = derivarDoRegistro(estado, opcoesDeTipo);
  const { analisando, concluida, passo } = derivados;

  return (
    <div className="registrar">
      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={selecionarFoto}
      />
      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={selecionarFoto}
      />

      <ModalEnvioIncerto
        aberto={estado.envioIncerto}
        aoConferir={() => navegar("/ocorrencias")}
        aoEnviarDeNovo={() => {
          despachar({ tipo: "fechar_envio_incerto" });
          void registrar();
        }}
        aoFechar={() => despachar({ tipo: "fechar_envio_incerto" })}
      />

      <ModalCamera
        aberto={cameraAberta}
        onFechar={() => setCameraAberta(false)}
        onCapturar={(foto) => {
          despachar({ tipo: "definir_foto", foto });
          setCameraAberta(false);
        }}
      />

      <div
        className="registrar__progresso"
        role="progressbar"
        aria-valuenow={passo * 50}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Passo ${passo} de 2`}
      >
        <span className="registrar__etapa registrar__etapa--cheia" />
        <span
          className={
            passo === 2
              ? "registrar__etapa registrar__etapa--cheia"
              : "registrar__etapa"
          }
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {analisando ? "A IA está analisando a foto." : null}
        {concluida && !estado.semIA ? "Análise concluída." : null}
      </p>

      {erroSetores ? (
        <Alerta variante="erro" titulo="Não foi possível carregar os setores">
          {erroSetores}
        </Alerta>
      ) : null}
      {estado.erroEnvio && estado.etapa === "detalhes" ? (
        <Alerta variante="erro" titulo="Não foi possível analisar a foto">
          {estado.erroEnvio}
        </Alerta>
      ) : null}

      <div className="registrar__linha">
        <FotoDaOcorrencia
          estado={estado}
          derivados={derivados}
          modoCamera={modoCamera}
          aoSoltarArquivo={receberFoto}
          aoEscolherArquivo={() => inputArquivo.current?.click()}
          aoUsarCamera={usarCamera}
          aoTrocar={trocarFoto}
          aoTentarDeNovo={() => void analisar()}
          aoPreencherSemIa={preencherSemIa}
        />

        {estado.etapa === "detalhes" ? (
          <PainelDetalhes
            estado={estado}
            setores={setores}
            erroPeso={erroPeso}
            despachar={despachar}
            aoAnalisar={() => void analisar()}
          />
        ) : (
          <PainelAnalise
            estado={estado}
            derivados={derivados}
            opcoesDeTipo={opcoesDeTipo}
            peso={peso}
            erroPeso={erroPeso}
            despachar={despachar}
            aoEscolherTipo={escolherTipo}
            aoRegistrar={() => void registrar()}
          />
        )}
      </div>
    </div>
  );
}
