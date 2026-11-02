import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { ModalSenha } from "../../components/ModalSenha";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import type { AlteracoesUsuario } from "../../context/AuthContext";
import { useAcoesDeSenha } from "../../hooks/useAcoesDeSenha";
import {
  useConfiguracoes,
  useRecuperadoNoMesKg,
} from "../../hooks/useConfiguracoes";
import { rotuloDoPapel } from "../../utils/pessoa";
import { CartaoMeta } from "./CartaoMeta";
import {
  CartaoInsights,
  CartaoNotificacoes,
  CartaoPerfil,
  CartaoUnidade,
} from "./Cartoes";
import { ModalPerfil } from "./ModalPerfil";
import "./styles.css";

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
}

export default function Configuracoes(): ReactNode {
  const { usuario, pedirSaida, atualizarUsuario } = useAuth();
  const { dados, carregando, erro, atualizar, limparErro } = useConfiguracoes();
  const recuperadoNoMesKg = useRecuperadoNoMesKg();

  const [editandoPerfil, setEditandoPerfil] = useState<boolean>(false);
  const [trocandoSenha, setTrocandoSenha] = useState<boolean>(false);
  const senha = useAcoesDeSenha();
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function salvarMeta(metaKg: number): Promise<boolean> {
    const salvou = await atualizar({ metaRecuperacaoKg: metaKg });
    if (salvou) {
      setAviso({
        titulo: "Meta atualizada",
        descricao: `Agora são ${metaKg.toLocaleString("pt-BR")} kg por mês.`,
      });
    }
    return salvou;
  }

  async function salvarPerfil(alteracoes: AlteracoesUsuario): Promise<void> {
    await atualizarUsuario(alteracoes);
    setEditandoPerfil(false);
    setAviso({
      titulo: "Perfil atualizado",
      descricao: `Agora você aparece como ${alteracoes.nome}.`,
    });
  }

  async function salvarSenha(atual: string, nova: string): Promise<void> {
    await senha.trocar(atual, nova);
    setTrocandoSenha(false);
    setAviso({
      titulo: "Senha alterada",
      descricao: "Use a senha nova no próximo acesso.",
    });
  }

  const papel = usuario ? rotuloDoPapel(usuario.papel) : "Operador";

  return (
    <section className="cfg" aria-label="Configurações">
      {erro ? (
        <Alerta
          variante="erro"
          titulo="Não foi possível salvar"
          acao={
            <button type="button" className="cfg__fechar-alerta" onClick={limparErro}>
              Fechar
            </button>
          }
        >
          {erro}
        </Alerta>
      ) : null}

      {carregando ? (
        <SkeletonList quantidade={3} rotulo="Carregando configurações" />
      ) : dados ? (
        <div className="cfg__grade">
          <div className="cfg__coluna">
            <CartaoPerfil
              nome={usuario?.nome ?? "Usuário"}
              papel={papel}
              aoEditar={() => setEditandoPerfil(true)}
              aoAlterarSenha={() => setTrocandoSenha(true)}
            />
            <CartaoUnidade unidade={dados.unidade} />
            <CartaoMeta
              metaKg={dados.metaRecuperacaoKg}
              recuperadoKg={recuperadoNoMesKg}
              aoSalvar={salvarMeta}
            />
          </div>

          <div className="cfg__coluna">
            <CartaoNotificacoes
              preferencias={dados.notificacoes}
              aoAlterar={(alteracao) => void atualizar({ notificacoes: alteracao })}
            />
            <CartaoInsights
              ativo={dados.insights}
              aoAlterar={(ativo) => void atualizar({ insights: ativo })}
            />
            <button type="button" className="cfg__sair" onClick={pedirSaida}>
              <Icone nome="sair" tamanho={14} />
              Sair do painel
            </button>
          </div>
        </div>
      ) : null}

      {editandoPerfil && usuario ? (
        <ModalPerfil
          nomeAtual={usuario.nome}
          cargoAtual={usuario.cargo ?? ""}
          email={usuario.email}
          aoSalvar={salvarPerfil}
          aoFechar={() => setEditandoPerfil(false)}
        />
      ) : null}

      {trocandoSenha ? (
        <ModalSenha
          aoSalvar={salvarSenha}
          aoFechar={() => setTrocandoSenha(false)}
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
