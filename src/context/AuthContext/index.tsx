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

interface ValorAuthContext {
  readonly sessao: SessaoAutenticada | null;
  readonly usuario: Usuario | null;
  readonly carregando: boolean;
  readonly erro: string | null;
  readonly entrar: (credenciais: CredenciaisLogin) => Promise<void>;
  readonly cadastrarNovo: (dados: DadosCadastro) => Promise<void>;
  readonly sair: () => void;
  readonly limparErro: () => void;
}

const AuthContext = createContext<ValorAuthContext | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const [sessao, setSessao] = useState<SessaoAutenticada | null>(() =>
    carregar<SessaoAutenticada>(CHAVE_STORAGE, VERSAO_STORAGE),
  );
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

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
        setSessao(nova);
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
    [],
  );

  const cadastrarNovo = useCallback(
    async (dados: DadosCadastro) => {
      setCarregando(true);
      setErro(null);
      try {
        const nova = await cadastrar(dados);
        setSessao(nova);
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
    [],
  );

  const sair = useCallback(() => {
    setSessao(null);
    setErro(null);
  }, []);

  const limparErro = useCallback(() => setErro(null), []);

  const valor = useMemo<ValorAuthContext>(
    () => ({
      sessao,
      usuario: sessao?.usuario ?? null,
      carregando,
      erro,
      entrar,
      cadastrarNovo,
      sair,
      limparErro,
    }),
    [sessao, carregando, erro, entrar, cadastrarNovo, sair, limparErro],
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
