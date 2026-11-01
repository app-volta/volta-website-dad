import type { ReactNode } from "react";

import { useAuth } from "../../context/AuthContext";
import { useAcoesDeSenha } from "../../hooks/useAcoesDeSenha";
import { ModalSenha } from "../ModalSenha";

/**
 * Primeiro acesso: o login devolveu `firstLogin`, então o painel só libera depois
 * que a pessoa troca a senha provisória. Não dá para fechar; a única saída é sair
 * do painel. A volta-api marca `firstLogin = false` quando a troca é gravada.
 */
export function ModalPrimeiroAcesso(): ReactNode {
  const { sessao, concluirPrimeiroAcesso, pedirSaida } = useAuth();
  const senha = useAcoesDeSenha();

  if (!sessao?.primeiroAcesso) return null;

  async function salvar(atual: string, nova: string): Promise<void> {
    await senha.trocar(atual, nova);
    concluirPrimeiroAcesso();
  }

  return <ModalSenha obrigatorio aoSalvar={salvar} aoFechar={pedirSaida} />;
}
