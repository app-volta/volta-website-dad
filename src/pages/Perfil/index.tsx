import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { Spinner } from "../../components/Spinner";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import {
  useMinhasAtividades,
  usePainel,
  useRegistradasPor,
} from "../../hooks/usePainel";
import { iniciais, rotuloDoPapel } from "../../utils/pessoa";
import { ModalPerfil } from "../Configuracoes/ModalPerfil";
import "./styles.css";

interface Numero {
  readonly rotulo: string;
  readonly valor: string;
}

export default function Perfil(): ReactNode {
  const { usuario, pedirSaida, atualizarUsuario } = useAuth();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [editando, setEditando] = useState<boolean>(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);
  const { painel } = usePainel(dados);
  const registradas = useRegistradasPor(dados, usuario?.id ?? "");
  const atividades = useMinhasAtividades(dados, usuario?.nome ?? "");

  if (!usuario) {
    return <Alerta variante="info">Nenhuma sessão ativa detectada.</Alerta>;
  }

  async function salvarPerfil(nome: string): Promise<void> {
    await atualizarUsuario({ nome });
    setEditando(false);
    setAviso(`Agora você aparece como ${nome}.`);
  }

  // Sem a lista, os números não existem: mostrar 0 seria dizer que não há nada.
  const semDados = dados === null;
  const numeros: readonly Numero[] = [
    { rotulo: "Registradas por você", valor: semDados ? "—" : String(registradas) },
    {
      rotulo: "Ocorrências no mês",
      valor: semDados ? "—" : String(painel.ocorrenciasMes),
    },
    {
      rotulo: "Recuperado no mês",
      valor: semDados ? "—" : `${painel.recuperadoMesKg.toLocaleString("pt-BR")} kg`,
    },
    {
      rotulo: "Taxa de aprovação",
      valor: semDados || painel.taxaAprovacao === null ? "—" : `${painel.taxaAprovacao}%`,
    },
  ];

  return (
    <div className="perfil">
      <div className="perfil__coluna">
        <section className="perfil__cartao perfil__cabecalho" aria-label="Cabeçalho do perfil">
          <span className="perfil__avatar" aria-hidden="true">
            {iniciais(usuario.nome)}
          </span>
          <div className="perfil__identidade">
            <h2 className="perfil__nome">{usuario.nome}</h2>
            <p className="perfil__papel">{rotuloDoPapel(usuario.papel)}</p>
          </div>
          <button type="button" className="perfil__editar" onClick={() => setEditando(true)}>
            <Icone nome="editar" tamanho={16} />
            Editar
          </button>
        </section>

        {erro ? (
          <Alerta
            variante="erro"
            titulo="Não foi possível carregar suas ocorrências"
            acao={
              <button
                type="button"
                className="perfil__tentar"
                onClick={() => setChaveRecarga((v) => v + 1)}
              >
                Tentar novamente
              </button>
            }
          >
            {erro}
          </Alerta>
        ) : null}

        <section className="perfil__cartao" aria-labelledby="perfil-mes">
          <h2 id="perfil-mes" className="perfil__titulo">
            Seu mês no painel
          </h2>
          {semDados && carregando ? (
            <Spinner compacto rotulo="Carregando seus números…" />
          ) : null}
          <dl className="perfil__numeros">
            {numeros.map((numero) => (
              <div key={numero.rotulo} className="perfil__numero">
                <dt>{numero.rotulo}</dt>
                <dd>{numero.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="perfil__cartao" aria-labelledby="perfil-atividade">
          <h2 id="perfil-atividade" className="perfil__titulo">
            Minha atividade
          </h2>
          {atividades.length > 0 ? (
            <ul className="perfil__atividades">
              {atividades.map((atividade) => (
                <li key={atividade.id} className="perfil__atividade">
                  <span className="perfil__atividade-avatar" aria-hidden="true">
                    {iniciais(usuario.nome)}
                  </span>
                  <div>
                    <p className="perfil__atividade-texto">
                      <strong>Você</strong> {atividade.acao}
                    </p>
                    <p className="perfil__atividade-tempo">{atividade.tempo}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="perfil__vazio">
              {semDados
                ? "Carregando sua atividade…"
                : "Você ainda não registrou nem revisou ocorrências."}
            </p>
          )}
        </section>
      </div>

      <div className="perfil__coluna">
        <section className="perfil__cartao" aria-labelledby="perfil-conta">
          <h2 id="perfil-conta" className="perfil__titulo">
            Dados da conta
          </h2>
          <dl className="perfil__dados">
            <div>
              <dt>E-mail</dt>
              <dd>{usuario.email}</dd>
            </div>
            <div>
              <dt>Unidade</dt>
              <dd>{usuario.unidade}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{usuario.cargo?.trim() || rotuloDoPapel(usuario.papel)}</dd>
            </div>
          </dl>
        </section>

        <button type="button" className="perfil__sair" onClick={pedirSaida}>
          <Icone nome="sair" tamanho={16} />
          Sair do painel
        </button>
      </div>

      {editando ? (
        <ModalPerfil
          nomeAtual={usuario.nome}
          email={usuario.email}
          aoSalvar={salvarPerfil}
          aoFechar={() => setEditando(false)}
        />
      ) : null}

      <Toast
        aberto={aviso !== null}
        titulo="Perfil atualizado"
        descricao={aviso ?? undefined}
        aoFechar={() => setAviso(null)}
      />
    </div>
  );
}
