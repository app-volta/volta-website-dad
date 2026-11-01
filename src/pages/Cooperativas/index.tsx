import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { CartoesResumo } from "../../components/CartoesResumo";
import { EstadoForaDoAr } from "../../components/EstadoForaDoAr";
import { EstadoSemAcesso } from "../../components/EstadoSemAcesso";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import {
  useAcoesCooperativas,
  useCooperativas,
} from "../../hooks/useCooperativas";
import { useAuth } from "../../context/AuthContext";
import { foiConflito } from "../../utils/erros";
import { useDadosReais } from "../../hooks/useModo";
import type { NovaCooperativa } from "../../types/cooperativa";
import { resumirCooperativas } from "../../utils/cooperativas";
import { ModalAdicionar } from "./ModalAdicionar";
import { ModalDocumentos } from "./ModalDocumentos";
import { montarCartoes } from "./cartoes";
import { PainelCooperativa } from "./PainelCooperativa";
import { TabelaCooperativas } from "./TabelaCooperativas";
import "./styles.css";

type Filtro = "todas" | "ativas" | "homologacao";

const FILTROS: readonly { readonly id: Filtro; readonly rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "ativas", rotulo: "Ativas" },
  { id: "homologacao", rotulo: "Em homologação" },
];

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
}

export default function Cooperativas(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro, semPermissao } = useCooperativas(chaveRecarga);
  const acoes = useAcoesCooperativas();
  const dadosReais = useDadosReais();
  const { usuario } = useAuth();
  // Só o ADMIN cadastra na volta-api; quem tem outro perfil só consulta.
  const podeCadastrar = usuario?.perfil === undefined || usuario.perfil === "ADMIN";

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  /** CNPJ que a API recusou por já estar cadastrado; o campo avisa enquanto ele não mudar. */
  const [cnpjRecusado, setCnpjRecusado] = useState<string | null>(null);
  const [verDocumentos, setVerDocumentos] = useState<boolean>(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const todas = dados ?? [];
  const filtradas = todas.filter((coop) => {
    if (filtro === "ativas") return coop.situacao === "ativa";
    if (filtro === "homologacao") return coop.situacao === "em_homologacao";
    return true;
  });
  const selecionada =
    filtradas.find((coop) => coop.id === selecionadaId) ?? filtradas[0] ?? null;

  function abrirCadastro(): void {
    setErroCadastro(null);
    setCnpjRecusado(null);
    setAdicionando(true);
  }

  async function cadastrar(novos: NovaCooperativa): Promise<void> {
    setSalvando(true);
    setErroCadastro(null);
    try {
      const nova = await acoes.adicionar(novos);
      setChaveRecarga((chave) => chave + 1);
      setFiltro((atual) => (atual === "ativas" ? "todas" : atual));
      setSelecionadaId(nova.id);
      setAdicionando(false);
      setAviso(
        nova.situacao === "em_homologacao"
          ? {
              titulo: "Cooperativa enviada para homologação",
              descricao: `${nova.nome} entra na lista até a licença ser validada.`,
            }
          : {
              titulo: "Cooperativa cadastrada",
              descricao: `${nova.nome} já está na lista da sua empresa.`,
            },
      );
    } catch (excecao: unknown) {
      if (foiConflito(excecao)) {
        setCnpjRecusado(novos.cnpj);
        return;
      }
      setErroCadastro(
        excecao instanceof Error ? excecao.message : "Falha ao cadastrar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="coops" aria-label="Cooperativas parceiras">
      {semPermissao ? <EstadoSemAcesso /> : null}
      {erro && !dados ? (
        <EstadoForaDoAr aoTentarDeNovo={() => setChaveRecarga((v) => v + 1)} />
      ) : null}
      {erro && dados ? (
        <Alerta variante="erro" titulo="Não foi possível carregar">
          {erro}
        </Alerta>
      ) : null}

      {carregando && !dados ? (
        <SkeletonList quantidade={4} rotulo="Carregando cooperativas" />
      ) : dados ? (
        <>
          <CartoesResumo
            rotulo="Resumo das cooperativas"
            cartoes={montarCartoes(resumirCooperativas(todas))}
          />

          <div className="coops__barra">
            <div className="coops__filtros" role="group" aria-label="Filtrar por situação">
              {FILTROS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`coops__chip${filtro === item.id ? " coops__chip--ativo" : ""}`}
                  aria-pressed={filtro === item.id}
                  onClick={() => setFiltro(item.id)}
                >
                  {item.rotulo}
                </button>
              ))}
            </div>
            {podeCadastrar ? (
              <button
                type="button"
                className="coops__botao coops__botao--primario coops__botao--topo"
                aria-haspopup="dialog"
                onClick={abrirCadastro}
              >
                <Icone nome="mais" tamanho={14} />
                Adicionar cooperativa
              </button>
            ) : null}
          </div>

          <div className="coops__grade">
            <TabelaCooperativas
              cooperativas={filtradas}
              todas={todas}
              selecionadaId={selecionada?.id ?? null}
              aoSelecionar={setSelecionadaId}
            />
            <PainelCooperativa
              todas={todas}
              selecionada={selecionada}
              aoSelecionar={setSelecionadaId}
              aoAbrirDocumentos={() => setVerDocumentos(true)}
              dadosReais={dadosReais}
            />
          </div>
        </>
      ) : null}

      {adicionando ? (
        <ModalAdicionar
          cadastroNaApi={dadosReais}
          salvando={salvando}
          erro={erroCadastro}
          cnpjRecusado={cnpjRecusado}
          aoConfirmar={(novos) => void cadastrar(novos)}
          aoFechar={() => setAdicionando(false)}
        />
      ) : null}

      {verDocumentos && selecionada ? (
        <ModalDocumentos
          coop={selecionada}
          aoFechar={() => setVerDocumentos(false)}
        />
      ) : null}

      <Toast
        aberto={aviso !== null}
        titulo={aviso?.titulo ?? ""}
        descricao={aviso?.descricao}
        aoFechar={() => setAviso(null)}
      />
    </section>
  );
}
