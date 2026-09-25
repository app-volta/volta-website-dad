import { useReducer } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { CampoFoto } from "../../components/CampoFoto";
import { Input } from "../../components/Input";
import { MaterialBadge } from "../../components/MaterialBadge";
import { Spinner } from "../../components/Spinner";
import { TextArea } from "../../components/TextArea";
import { useAuth } from "../../context/AuthContext";
import { criarOcorrencia } from "../../services/ocorrencias";
import {
  combinar,
  validarDescricao,
  validarFoto,
  validarObrigatorio,
} from "../../utils/validadores";
import { formatarPorcentagem } from "../../utils/formatacao";
import {
  estadoInicial,
  redutor,
  type EstadoRegistrar,
} from "./reducer";
import "./styles.css";

function renderizarConteudo(
  estado: EstadoRegistrar,
  aoAtualizarFoto: (foto: string | null) => void,
  aoAtualizarDescricao: (valor: string) => void,
  aoAtualizarSetor: (valor: string) => void,
  aoAtualizarUnidade: (valor: string) => void,
): ReactNode {
  switch (estado.etapa) {
    case "foto":
      return (
        <CampoFoto
          rotulo="Foto do resíduo"
          ajuda="Enquadre o material com boa iluminação. A IA usa a foto para classificar."
          valor={estado.fotoBase64}
          onMudar={aoAtualizarFoto}
          erro={estado.erroCampo.foto}
        />
      );
    case "descricao":
      return (
        <TextArea
          rotulo="Descrição do que foi encontrado"
          required
          value={estado.descricao}
          onChange={aoAtualizarDescricao}
          ajuda="Fale sobre volume, condição e possível origem. Mínimo 10 caracteres."
          erro={estado.erroCampo.descricao}
        />
      );
    case "localizacao":
      return (
        <>
          <Input
            rotulo="Setor onde o resíduo foi encontrado"
            required
            value={estado.setor}
            onChange={aoAtualizarSetor}
            erro={estado.erroCampo.setor}
          />
          <Input
            rotulo="Unidade / planta"
            required
            value={estado.unidade}
            onChange={aoAtualizarUnidade}
            erro={estado.erroCampo.unidade}
          />
        </>
      );
    case "revisao":
      return (
        <dl className="registrar__revisao">
          <div>
            <dt>Descrição</dt>
            <dd>{estado.descricao}</dd>
          </div>
          <div>
            <dt>Local</dt>
            <dd>
              {estado.setor} — {estado.unidade}
            </dd>
          </div>
          <div>
            <dt>Foto</dt>
            <dd>
              {estado.fotoBase64 ? (
                <img
                  src={estado.fotoBase64}
                  alt="Pré-visualização da foto anexada ao registro"
                  className="registrar__foto-revisao"
                />
              ) : (
                <span>Sem foto anexada.</span>
              )}
            </dd>
          </div>
        </dl>
      );
    case "processando":
      return (
        <div className="registrar__processando">
          <Spinner rotulo="Analisando foto com a IA…" />
          <p>Isso normalmente leva alguns segundos.</p>
        </div>
      );
    case "sucesso":
      return (
        <div className="registrar__sucesso">
          <Alerta variante="sucesso" titulo="Ocorrência registrada">
            Código gerado:{" "}
            <strong>{estado.codigoGerado ?? "—"}</strong>
          </Alerta>
          {estado.classificacao ? (
            <div className="registrar__resumo-ia">
              <p>
                A IA classificou como{" "}
                <MaterialBadge material={estado.classificacao.material} /> com
                confiança de{" "}
                {formatarPorcentagem(estado.classificacao.confianca)}.
              </p>
              <p>{estado.classificacao.recomendacao}</p>
            </div>
          ) : null}
        </div>
      );
  }
}

export default function Registrar(): ReactNode {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [estado, despachar] = useReducer(
    redutor,
    usuario?.unidade ?? "",
    estadoInicial,
  );

  function tentarAvancar(): void {
    if (estado.etapa === "foto") {
      const erro = validarFoto(estado.fotoBase64);
      if (erro) {
        despachar({ tipo: "definir_erros", erros: { foto: erro } });
        return;
      }
    }
    if (estado.etapa === "descricao") {
      const erro = validarDescricao(estado.descricao);
      if (erro) {
        despachar({ tipo: "definir_erros", erros: { descricao: erro } });
        return;
      }
    }
    if (estado.etapa === "localizacao") {
      const validacao = combinar({
        setor: validarObrigatorio(estado.setor, "o setor", 80),
        unidade: validarObrigatorio(estado.unidade, "a unidade", 80),
      });
      if (!validacao.valido) {
        despachar({ tipo: "definir_erros", erros: validacao.erros });
        return;
      }
    }
    despachar({ tipo: "prosseguir" });
  }

  async function enviar(): Promise<void> {
    if (!estado.fotoBase64) return;
    despachar({ tipo: "iniciar_envio" });
    try {
      const criada = await criarOcorrencia({
        descricao: estado.descricao,
        localizacao: { setor: estado.setor, unidade: estado.unidade },
        fotoBase64: estado.fotoBase64,
      });
      if (!criada.classificacao) {
        throw new Error("Classificação vazia recebida.");
      }
      despachar({
        tipo: "envio_sucesso",
        classificacao: criada.classificacao,
        codigo: criada.codigo,
      });
    } catch (excecao) {
      const mensagem =
        excecao instanceof Error
          ? excecao.message
          : "Falha ao enviar o registro.";
      despachar({ tipo: "envio_erro", mensagem });
    }
  }

  const passos: readonly {
    readonly chave: EstadoRegistrar["etapa"];
    readonly rotulo: string;
  }[] = [
    { chave: "foto", rotulo: "Foto" },
    { chave: "descricao", rotulo: "Descrição" },
    { chave: "localizacao", rotulo: "Local" },
    { chave: "revisao", rotulo: "Revisão" },
  ];
  const indiceAtual = passos.findIndex((p) => p.chave === estado.etapa);
  const total = passos.length;

  return (
    <section aria-labelledby="titulo-registrar">
      <h1 id="titulo-registrar">Registrar resíduo</h1>
      <p className="registrar__descricao">
        Em quatro passos você cria o registro e recebe a classificação
        automática da IA.
      </p>

      {estado.etapa !== "processando" && estado.etapa !== "sucesso" ? (
        <ol
          className="registrar__passos"
          aria-label={`Passo ${indiceAtual + 1} de ${total}`}
        >
          {passos.map((passo, indice) => {
            const ativo = passo.chave === estado.etapa;
            const concluido = indice < indiceAtual;
            return (
              <li
                key={passo.chave}
                className={
                  ativo
                    ? "registrar__passo registrar__passo--ativo"
                    : concluido
                      ? "registrar__passo registrar__passo--ok"
                      : "registrar__passo"
                }
                aria-current={ativo ? "step" : undefined}
              >
                <span className="registrar__passo-numero" aria-hidden="true">
                  {indice + 1}
                </span>
                <span>{passo.rotulo}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {estado.erroEnvio ? (
        <Alerta variante="erro" titulo="Não conseguimos registrar">
          {estado.erroEnvio}
        </Alerta>
      ) : null}

      <div className="card">
        {renderizarConteudo(
          estado,
          (foto) => despachar({ tipo: "definir_foto", foto }),
          (descricao) => despachar({ tipo: "definir_descricao", descricao }),
          (setor) => despachar({ tipo: "definir_setor", setor }),
          (unidade) => despachar({ tipo: "definir_unidade", unidade }),
        )}

        <div className="registrar__acoes">
          {estado.etapa !== "processando" && estado.etapa !== "sucesso" ? (
            <>
              <Button
                variante="sutil"
                onClick={() => despachar({ tipo: "voltar" })}
                disabled={estado.etapa === "foto"}
              >
                Voltar
              </Button>
              {estado.etapa === "revisao" ? (
                <Button variante="primario" onClick={enviar}>
                  Enviar para classificação
                </Button>
              ) : (
                <Button variante="primario" onClick={tentarAvancar}>
                  Próximo
                </Button>
              )}
            </>
          ) : null}

          {estado.etapa === "sucesso" ? (
            <>
              <Button
                variante="sutil"
                onClick={() =>
                  despachar({
                    tipo: "reiniciar",
                    unidade: usuario?.unidade ?? "",
                  })
                }
              >
                Registrar outra
              </Button>
              <Button
                variante="primario"
                onClick={() => navegar("/ocorrencias")}
              >
                Ver ocorrências
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
