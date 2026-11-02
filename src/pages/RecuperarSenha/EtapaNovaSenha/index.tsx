import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Button } from "../../../components/Button";
import { ForcaDaSenha } from "../../../components/ForcaDaSenha";
import { Icone } from "../../../components/Icone";
import { Input } from "../../../components/Input";
import {
  DICA_DE_SENHA,
  validarConfirmacao,
  validarNovaSenha,
} from "../../../utils/senha";

interface EtapaNovaSenhaProps {
  /** Grava a senha nova; rejeita com o motivo quando o servidor recusa. */
  readonly aoSalvar: (novaSenha: string) => Promise<void>;
}

/** 01d · Nova senha: de 8 a 72 caracteres, com letras e números, e a confirmação. */
export function EtapaNovaSenha({ aoSalvar }: EtapaNovaSenhaProps): ReactNode {
  const [nova, setNova] = useState<string>("");
  const [confirmacao, setConfirmacao] = useState<string>("");
  const [mostrar, setMostrar] = useState<boolean>(false);
  const [tentou, setTentou] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const problemaDaNova = validarNovaSenha(nova);
  const problemaDaConfirmacao = validarConfirmacao(nova, confirmacao);
  const alternarVisibilidade = {
    icone: mostrar ? ("olho" as const) : ("olho-riscado" as const),
    rotulo: mostrar ? "Ocultar senhas" : "Mostrar senhas",
    aoClicar: () => setMostrar((valor) => !valor),
  };

  async function salvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setTentou(true);
    setErro(null);
    if (problemaDaNova !== null || problemaDaConfirmacao !== null) return;
    setSalvando(true);
    try {
      await aoSalvar(nova);
    } catch (excecao: unknown) {
      setErro(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível salvar a senha. Tente de novo.",
      );
      setSalvando(false);
    }
  }

  return (
    <>
      <span className="recuperar__chip" aria-hidden="true">
        <Icone nome="cadeado" tamanho={26} />
      </span>
      <h1 className="login-tela__titulo">Crie uma nova senha</h1>
      <p className="login-tela__descricao">{DICA_DE_SENHA}</p>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível salvar a senha">
          {erro}
        </Alerta>
      ) : null}

      <form onSubmit={(evento) => void salvar(evento)} noValidate>
        <div className="recuperar__nova">
          <Input
            rotulo="Nova senha"
            type={mostrar ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            required
            value={nova}
            onChange={setNova}
            erro={tentou ? problemaDaNova : null}
            iconeEsquerdo="cadeado"
            acaoDireita={alternarVisibilidade}
          />
          <ForcaDaSenha senha={nova} />
        </div>
        <Input
          rotulo="Confirmar nova senha"
          type={mostrar ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={setConfirmacao}
          erro={tentou ? problemaDaConfirmacao : null}
          iconeEsquerdo="cadeado"
          acaoDireita={alternarVisibilidade}
        />
        <Button type="submit" larguraTotal carregando={salvando}>
          Salvar nova senha
        </Button>
      </form>
    </>
  );
}
