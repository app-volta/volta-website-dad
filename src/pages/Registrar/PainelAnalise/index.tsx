import type { Dispatch, ReactNode } from "react";

import mascoteCompleto from "../../../assets/mascote-completo.svg";
import { Icone } from "../../../components/Icone";
import type {
  NivelContaminacao,
  OpcaoTipoResiduo,
} from "../../../types/classificacao";
import { contaminacao } from "../../../utils/analiseOcorrencia";
import { descreverPeso } from "../../../utils/formatacao";
import { DE_ONDE_VEM_O_PESO, NIVEIS_DE_CONTAMINACAO } from "../constantes";
import type { DerivadosDoRegistro } from "../derivados";
import type { AcaoRegistrar, EstadoRegistrar, PesoDaOcorrencia } from "../reducer";

interface PainelAnaliseProps {
  readonly estado: EstadoRegistrar;
  readonly derivados: DerivadosDoRegistro;
  readonly opcoesDeTipo: readonly OpcaoTipoResiduo[];
  readonly peso: PesoDaOcorrencia;
  /** Mensagem do peso digitado, ou nulo quando ele está vazio ou válido. */
  readonly erroPeso: string | null;
  readonly despachar: Dispatch<AcaoRegistrar>;
  readonly aoEscolherTipo: (valor: string) => void;
  readonly aoRegistrar: () => void;
}

/** Segunda etapa: o que a IA encontrou, a correção pela pessoa e o botão que registra. */
export function PainelAnalise({
  estado,
  derivados,
  opcoesDeTipo,
  peso,
  erroPeso,
  despachar,
  aoEscolherTipo,
  aoRegistrar,
}: PainelAnaliseProps): ReactNode {
  const {
    concluida,
    analisando,
    analiseFalhou,
    rotuloPrioridade,
    tipoRotulo,
    unidades,
    valorDoTipo,
    nivelDeContaminacao,
  } = derivados;
  const valorAusente = analiseFalhou ? (
    <p className="registrar__ia-valor">—</p>
  ) : (
    <span className="registrar__ia-esqueleto" />
  );

  return (
    <section className="registrar__painel" aria-labelledby="reg-titulo">
      <div className="registrar__painel-topo">
        <h2 id="reg-titulo" className="registrar__painel-titulo">
          O que a IA encontrou
        </h2>
        {concluida ? (
          <span
            className={`registrar__chip-prio registrar__chip-prio--${estado.prioridade}`}
          >
            {rotuloPrioridade.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div
        className={
          analisando
            ? "registrar__ia-grid registrar__ia-grid--carregando"
            : "registrar__ia-grid"
        }
      >
        <div className="registrar__ia-card" data-cor="papelao">
          <p className="registrar__ia-rotulo">Tipo</p>
          {concluida ? (
            estado.editando ? (
              <select
                aria-label="Tipo de resíduo"
                className="registrar__ia-campo"
                value={valorDoTipo}
                onChange={(e) => aoEscolherTipo(e.target.value)}
              >
                {valorDoTipo === "" ? (
                  <option value="">{tipoRotulo || "Escolha o tipo"}</option>
                ) : null}
                {opcoesDeTipo.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            ) : (
              <p className="registrar__ia-valor">{tipoRotulo || "—"}</p>
            )
          ) : (
            valorAusente
          )}
        </div>
        <div className="registrar__ia-card" data-cor="vidro">
          <p className="registrar__ia-rotulo">Contaminação</p>
          {concluida ? (
            estado.editando ? (
              <select
                aria-label="Nível de contaminação"
                className="registrar__ia-campo"
                value={nivelDeContaminacao}
                onChange={(e) =>
                  despachar({
                    tipo: "ajustar_analise",
                    ajuste: {
                      contaminacao: (e.target.value || undefined) as
                        | NivelContaminacao
                        | undefined,
                    },
                  })
                }
              >
                {nivelDeContaminacao === "" ? (
                  <option value="">Não informada</option>
                ) : null}
                {NIVEIS_DE_CONTAMINACAO.map((nivel) => (
                  <option key={nivel.valor} value={nivel.valor}>
                    {nivel.rotulo}
                  </option>
                ))}
              </select>
            ) : (
              <p className="registrar__ia-valor">
                {contaminacao(estado.classificacao)}
              </p>
            )
          ) : (
            valorAusente
          )}
        </div>
        <div className="registrar__ia-card" data-cor="plastico">
          <p className="registrar__ia-rotulo">Peso aproximado</p>
          {concluida ? (
            estado.editando ? (
              <>
                <span className="registrar__ia-quilos">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="Peso aproximado em quilos"
                    aria-invalid={erroPeso ? true : undefined}
                    aria-describedby={erroPeso ? "reg-ia-peso-erro" : undefined}
                    className="registrar__ia-campo"
                    placeholder={
                      estado.classificacao?.pesoEstimadoKg
                        ? estado.classificacao.pesoEstimadoKg.toLocaleString("pt-BR")
                        : "Ex.: 12,5"
                    }
                    value={estado.pesoInformado}
                    onChange={(e) =>
                      despachar({ tipo: "definir_peso", peso: e.target.value })
                    }
                  />
                  <span aria-hidden="true">kg</span>
                </span>
                {erroPeso ? (
                  <p id="reg-ia-peso-erro" role="alert" className="registrar__erro-campo">
                    {erroPeso}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="registrar__ia-valor">
                  {peso.kg === null ? "Não informado" : descreverPeso(peso.kg)}
                </p>
                <p className="registrar__ia-origem">
                  {DE_ONDE_VEM_O_PESO[peso.origem]}
                </p>
              </>
            )
          ) : (
            valorAusente
          )}
        </div>
        <div className="registrar__ia-card" data-cor="metal">
          <p className="registrar__ia-rotulo">
            {unidades !== null ? "Caixas" : "Revisão"}
          </p>
          {concluida ? (
            <p className="registrar__ia-valor">
              {unidades !== null
                ? `${unidades} un.`
                : estado.classificacao?.exigeValidacao
                  ? "Pelo gestor"
                  : "—"}
            </p>
          ) : (
            valorAusente
          )}
        </div>
      </div>

      {analisando || analiseFalhou ? (
        <div className="registrar__olhando">
          <img
            src={mascoteCompleto}
            alt=""
            width={118}
            height={179}
            className="registrar__olhando-mascote"
          />
          <p>
            {analiseFalhou
              ? "A análise não terminou. Tente de novo ou preencha os dados sem a IA."
              : "O VOLTA está olhando a foto com atenção…"}
          </p>
        </div>
      ) : null}

      {concluida && estado.classificacao ? (
        <>
          {estado.semIA ? null : (
            <div className="registrar__recomenda">
              <img
                src={mascoteCompleto}
                alt=""
                width={84}
                height={127}
                className="registrar__recomenda-mascote"
              />
              <div>
                <p className="registrar__recomenda-titulo">
                  <Icone nome="brilho" tamanho={14} /> VOLTA recomenda
                </p>
                <p className="registrar__recomenda-texto">
                  {estado.classificacao.recomendacao}
                </p>
              </div>
            </div>
          )}

          {estado.editando ? (
            <p className="registrar__dica">
              {estado.semIA
                ? "Escolha o tipo do resíduo, preencha o que souber e confirme."
                : "Corrija o que a IA errou e toque em Concluir edição."}
            </p>
          ) : null}

          <div className="registrar__acoes">
            <button
              type="button"
              className="registrar__botao registrar__botao--primario registrar__botao--largo"
              onClick={aoRegistrar}
              disabled={
                estado.registrando ||
                erroPeso !== null ||
                (estado.semIA && valorDoTipo === "")
              }
            >
              {estado.registrando ? "Registrando…" : "Confirmar e registrar"}
            </button>
            <button
              type="button"
              className="registrar__botao registrar__botao--contorno"
              aria-pressed={estado.editando}
              onClick={() => despachar({ tipo: "alternar_edicao" })}
              disabled={estado.registrando}
            >
              {estado.editando ? "Concluir edição" : "Editar dados"}
            </button>
          </div>
          <button
            type="button"
            className="registrar__link"
            onClick={() => despachar({ tipo: "voltar_aos_detalhes" })}
            disabled={estado.registrando}
          >
            Mudar descrição, setor ou prioridade
          </button>
        </>
      ) : null}
    </section>
  );
}
