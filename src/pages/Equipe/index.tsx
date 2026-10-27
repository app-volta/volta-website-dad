import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { CartoesResumo } from "../../components/CartoesResumo";
import type { CartaoResumo } from "../../components/CartoesResumo";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { useAcoesEquipe, useEquipe } from "../../hooks/useEquipe";
import { useDadosReais } from "../../hooks/useModo";
import type { MembroEquipe, NovoConvite, PapelEquipe } from "../../types/equipe";
import {
  resumirEquipe,
  ROTULOS_PAPEL,
  textoBuscavel,
} from "../../utils/equipe";
import type { ResumoEquipe } from "../../utils/equipe";
import { ModalConvidar } from "./ModalConvidar";
import { TabelaEquipe } from "./TabelaEquipe";
import "./styles.css";

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
}

function montarCartoes(resumo: ResumoEquipe): readonly CartaoResumo[] {
  return [
    {
      rotulo: "Pessoas na unidade",
      valor: String(resumo.pessoas),
      icone: "equipe",
      tom: "verde",
    },
    {
      rotulo: "Responsáveis técnicos",
      valor: String(resumo.responsaveisTecnicos),
      icone: "escudo",
      tom: "azul",
    },
    {
      rotulo: "Registros no mês",
      valor: String(resumo.registrosNoMes),
      icone: "bandeira",
      tom: "ambar",
    },
    {
      rotulo: "Convites pendentes",
      valor: String(resumo.convitesPendentes),
      icone: "email",
      tom: "laranja",
    },
  ];
}

export default function Equipe(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useEquipe(chaveRecarga);
  const acoes = useAcoesEquipe();
  const dadosReais = useDadosReais();
  const { usuario } = useAuth();

  const [busca, setBusca] = useState<string>("");
  const [convidando, setConvidando] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroConvite, setErroConvite] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const buscaAtrasada = useDebounce(busca);
  const equipe = dados ?? [];
  const termo = buscaAtrasada.trim().toLowerCase();
  const visiveis = equipe.filter(
    (membro) => termo === "" || textoBuscavel(membro).includes(termo),
  );
  const maiorRegistro = Math.max(...equipe.map((m) => m.registrosNoMes), 0);

  function abrirConvite(): void {
    setErroConvite(null);
    setConvidando(true);
  }

  async function convidar(convite: NovoConvite): Promise<void> {
    setSalvando(true);
    setErroConvite(null);
    try {
      const novo = await acoes.convidar(convite);
      setChaveRecarga((chave) => chave + 1);
      setBusca("");
      setConvidando(false);
      setAviso(
        dadosReais
          ? {
              titulo: "Acesso criado",
              descricao: `${novo.email} já pode entrar com a senha que você definiu.`,
            }
          : {
              titulo: "Convite enviado",
              descricao: `${novo.email} vai receber um e-mail para criar a conta.`,
            },
      );
    } catch (excecao: unknown) {
      setErroConvite(
        excecao instanceof Error ? excecao.message : "Falha ao enviar o convite.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function reenviar(membro: MembroEquipe): Promise<void> {
    setErroAcao(null);
    try {
      await acoes.reenviar(membro.id);
      setAviso({
        titulo: "Convite reenviado",
        descricao: `Enviamos de novo para ${membro.email}.`,
      });
    } catch (excecao: unknown) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao reenviar o convite.",
      );
    }
  }

  async function cancelar(membro: MembroEquipe): Promise<void> {
    setErroAcao(null);
    try {
      await acoes.cancelar(membro.id);
      setChaveRecarga((chave) => chave + 1);
      setAviso({
        titulo: "Convite cancelado",
        descricao: `${membro.email} não pode mais usar esse convite.`,
      });
    } catch (excecao: unknown) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao cancelar o convite.",
      );
    }
  }

  async function alterarPapel(membro: MembroEquipe, papel: PapelEquipe): Promise<void> {
    setErroAcao(null);
    try {
      await acoes.alterarPapel(membro.id, papel);
      setChaveRecarga((chave) => chave + 1);
      setAviso({
        titulo: "Papel atualizado",
        descricao: `${membro.nome} agora é ${ROTULOS_PAPEL[papel].toLowerCase()}.`,
      });
    } catch (excecao: unknown) {
      setErroAcao(
        excecao instanceof Error ? excecao.message : "Falha ao alterar o papel.",
      );
    }
  }

  async function copiarEmail(membro: MembroEquipe): Promise<void> {
    try {
      await navigator.clipboard.writeText(membro.email);
      setAviso({ titulo: "E-mail copiado", descricao: membro.email });
    } catch {
      setErroAcao("Não foi possível copiar o e-mail. Copie manualmente.");
    }
  }

  return (
    <section className="eq" aria-label="Equipe da unidade">
      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível carregar">
          {erro}
        </Alerta>
      ) : null}
      {erroAcao ? (
        <Alerta variante="erro" titulo="Ação não concluída">
          {erroAcao}
        </Alerta>
      ) : null}

      {!dados && carregando ? (
        <SkeletonList quantidade={4} rotulo="Carregando equipe" />
      ) : dados ? (
        <>
          <CartoesResumo
            rotulo="Resumo da equipe"
            cartoes={montarCartoes(resumirEquipe(equipe))}
          />

          <div className="eq__barra">
            <label className="eq__busca">
              <span className="eq__busca-icone" aria-hidden="true">
                <Icone nome="lupa" tamanho={16} />
              </span>
              <span className="sr-only">Buscar pessoa</span>
              <input
                type="search"
                placeholder="Buscar pessoa"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </label>
            <button
              type="button"
              className="eq__botao-principal"
              aria-haspopup="dialog"
              onClick={abrirConvite}
            >
              <Icone nome="mais" tamanho={14} />
              {dadosReais ? "Cadastrar pessoa" : "Convidar pessoa"}
            </button>
          </div>

          {visiveis.length === 0 ? (
            <p className="lista-vazia">
              Nenhuma pessoa encontrada para “{buscaAtrasada.trim()}”.
            </p>
          ) : (
            <TabelaEquipe
              membros={visiveis}
              maiorRegistro={maiorRegistro}
              aoCopiarEmail={(membro) => void copiarEmail(membro)}
              aoReenviarConvite={(membro) => void reenviar(membro)}
              aoCancelarConvite={(membro) => void cancelar(membro)}
              aoAlterarPapel={
                dadosReais ? (membro, papel) => void alterarPapel(membro, papel) : undefined
              }
              idDaPessoaLogada={usuario?.id}
            />
          )}
        </>
      ) : null}

      {convidando ? (
        <ModalConvidar
          criaAcesso={dadosReais}
          salvando={salvando}
          erro={erroConvite}
          aoConfirmar={(convite) => void convidar(convite)}
          aoFechar={() => setConvidando(false)}
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
