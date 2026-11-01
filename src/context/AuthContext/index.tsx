import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { autenticar, cadastrar } from "../../services/auth";
import { configurarSessaoHttp, encerrarSessaoHttp } from "../../services/http";
import { atualizarPerfil } from "../../services/perfil";
import type { AlteracoesPerfil } from "../../services/perfil";
import type {
  CredenciaisLogin,
  DadosCadastro,
  SessaoAutenticada,
  Usuario,
} from "../../types/usuario";
import { carregar, remover, salvar } from "../../utils/armazenamento";

/**
 * Contexto de autenticação — resolve o prop-drilling do usuário logado.
 *
 * Antes: cada página precisaria receber `usuario`, `token`, `onLogout`, etc.
 * como props ou recarregar do storage.
 * Depois: qualquer descendente do AuthProvider consome via `useAuth()`.
 * O PrivateRoute consulta esse mesmo hook, então a regra de proteção fica
 * em um único lugar.
 */

const CHAVE_STORAGE = "volta:sessao";
const VERSAO_STORAGE = 1;
const LIMITE_TEMPORIZADOR_MS = 2_147_483_000;

/**
 * A camada HTTP precisa do token a cada requisição, e os services não conhecem
 * React. A sessão atual fica neste módulo e é entregue à camada HTTP por
 * ganchos, configurados na importação para valer antes da primeira chamada.
 */
let sessaoAtual: SessaoAutenticada | null = null;
let aoSessaoExpirar: (() => void) | null = null;

configurarSessaoHttp({
  obterToken: () => sessaoAtual?.token ?? null,
  obterUsuario: () =>
    sessaoAtual
      ? {
          id: sessaoAtual.usuario.id,
          nome: sessaoAtual.usuario.nome,
          empresaId: sessaoAtual.usuario.empresaId,
          perfil: sessaoAtual.usuario.perfil,
        }
      : null,
  aoNaoAutorizado: () => aoSessaoExpirar?.(),
});

function lerSessaoSalva(): SessaoAutenticada | null {
  const salva = carregar<SessaoAutenticada>(CHAVE_STORAGE, VERSAO_STORAGE);
  if (!salva) return null;
  return new Date(salva.expiraEm).getTime() > Date.now() ? salva : null;
}

interface ValorAuthContext {
  readonly sessao: SessaoAutenticada | null;
  readonly usuario: Usuario | null;
  readonly carregando: boolean;
  readonly erro: string | null;
  /** A sessão acabou, mas a tela continua visível até a pessoa escolher "Entrar de novo". */
  readonly sessaoExpirada: boolean;
  readonly entrar: (credenciais: CredenciaisLogin) => Promise<void>;
  readonly cadastrarNovo: (dados: DadosCadastro) => Promise<void>;
  readonly sair: () => void;
  /** Encerra a sessão vencida; a rota privada leva ao login e, depois dele, de volta a esta página. */
  readonly entrarDeNovo: () => void;
  /** "Sair do painel?" está aberto: só `sair` encerra a sessão, `cancelarSaida` desiste. */
  readonly confirmandoSaida: boolean;
  readonly pedirSaida: () => void;
  readonly cancelarSaida: () => void;
  /** Grava o perfil (PUT /users/me) e só então atualiza a sessão; rejeita se a gravação falhar. */
  readonly atualizarUsuario: (alteracoes: AlteracoesUsuario) => Promise<void>;
  readonly limparErro: () => void;
}

/** O que a própria pessoa pode alterar no perfil. */
export type AlteracoesUsuario = AlteracoesPerfil;

const AuthContext = createContext<ValorAuthContext | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const [sessao, setSessao] = useState<SessaoAutenticada | null>(() => {
    const inicial = lerSessaoSalva();
    sessaoAtual = inicial;
    return inicial;
  });
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sessaoExpirada, setSessaoExpirada] = useState<boolean>(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState<boolean>(false);

  /** Troca a sessão e manda os services esquecerem o que era da pessoa anterior. */
  const aplicarSessao = useCallback((nova: SessaoAutenticada | null) => {
    sessaoAtual = nova;
    encerrarSessaoHttp();
    setSessaoExpirada(false);
    setConfirmandoSaida(false);
    setSessao(nova);
  }, []);

  useEffect(() => {
    aoSessaoExpirar = () => setSessaoExpirada(true);
    return () => {
      aoSessaoExpirar = null;
    };
  }, []);

  useEffect(() => {
    if (!sessao) return undefined;
    const restante = new Date(sessao.expiraEm).getTime() - Date.now();
    const id = setTimeout(
      () => aoSessaoExpirar?.(),
      Math.min(Math.max(restante, 0), LIMITE_TEMPORIZADOR_MS),
    );
    return () => clearTimeout(id);
  }, [sessao]);

  useEffect(() => {
    if (sessao) {
      salvar(CHAVE_STORAGE, VERSAO_STORAGE, sessao);
    } else {
      remover(CHAVE_STORAGE);
    }
  }, [sessao]);

  const entrar = useCallback(
    async (credenciais: CredenciaisLogin) => {
      setCarregando(true);
      setErro(null);
      try {
        const nova = await autenticar(credenciais);
        aplicarSessao(nova);
      } catch (excecao) {
        const mensagem =
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível entrar. Tente novamente.";
        setErro(mensagem);
        throw excecao;
      } finally {
        setCarregando(false);
      }
    },
    [aplicarSessao],
  );

  const cadastrarNovo = useCallback(
    async (dados: DadosCadastro) => {
      setCarregando(true);
      setErro(null);
      try {
        const nova = await cadastrar(dados);
        aplicarSessao(nova);
      } catch (excecao) {
        const mensagem =
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível concluir o cadastro.";
        setErro(mensagem);
        throw excecao;
      } finally {
        setCarregando(false);
      }
    },
    [aplicarSessao],
  );

  const sair = useCallback(() => {
    aplicarSessao(null);
    setErro(null);
  }, [aplicarSessao]);

  const atualizarUsuario = useCallback(
    async (alteracoes: AlteracoesUsuario) => {
      const atual = sessaoAtual;
      if (!atual) return;
      const gravado = await atualizarPerfil(atual.usuario, alteracoes);
      setSessao((corrente) => {
        // A pessoa pode ter saído enquanto a gravação voltava.
        if (!corrente || corrente.usuario.id !== atual.usuario.id) return corrente;
        const proxima = {
          ...corrente,
          usuario: { ...corrente.usuario, ...gravado },
        };
        sessaoAtual = proxima;
        return proxima;
      });
    },
    [],
  );

  const pedirSaida = useCallback(() => setConfirmandoSaida(true), []);
  const cancelarSaida = useCallback(() => setConfirmandoSaida(false), []);

  const limparErro = useCallback(() => setErro(null), []);

  const valor = useMemo<ValorAuthContext>(
    () => ({
      sessao,
      usuario: sessao?.usuario ?? null,
      carregando,
      erro,
      sessaoExpirada,
      entrar,
      cadastrarNovo,
      sair,
      entrarDeNovo: sair,
      confirmandoSaida,
      pedirSaida,
      cancelarSaida,
      atualizarUsuario,
      limparErro,
    }),
    [
      sessao,
      carregando,
      erro,
      sessaoExpirada,
      entrar,
      cadastrarNovo,
      sair,
      confirmandoSaida,
      pedirSaida,
      cancelarSaida,
      atualizarUsuario,
      limparErro,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): ValorAuthContext {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error(
      "useAuth precisa ser usado dentro de <AuthProvider>. " +
        "Verifique se o Provider envolve <App /> em main.tsx.",
    );
  }
  return contexto;
}
