import type { Dispatch, ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import { PRIORIDADES } from "../constantes";
import type { AcaoRegistrar, EstadoRegistrar } from "../reducer";

interface PainelDetalhesProps {
  readonly estado: EstadoRegistrar;
  readonly setores: readonly string[];
  /** Mensagem do peso digitado, ou nulo quando ele está vazio ou válido. */
  readonly erroPeso: string | null;
  readonly despachar: Dispatch<AcaoRegistrar>;
  readonly aoAnalisar: () => void;
}

/** Primeira etapa: descrição, setor, peso, prioridade e o botão que chama a IA. */
export function PainelDetalhes({
  estado,
  setores,
  erroPeso,
  despachar,
  aoAnalisar,
}: PainelDetalhesProps): ReactNode {
  return (
    <section className="registrar__painel" aria-labelledby="reg-titulo">
      <h2 id="reg-titulo" className="registrar__painel-titulo">
        Detalhes da ocorrência
      </h2>

      <div className="registrar__campo">
        <label htmlFor="reg-desc" className="registrar__rotulo">
          Descrição <span className="registrar__opcional">· opcional</span>
        </label>
        <textarea
          id="reg-desc"
          className={
            estado.erroCampo.descricao
              ? "registrar__textarea registrar__textarea--erro"
              : "registrar__textarea"
          }
          placeholder="Ex.: caixas de papelão molhadas ao lado da câmara fria"
          value={estado.descricao}
          onChange={(e) =>
            despachar({
              tipo: "definir_descricao",
              descricao: e.target.value,
            })
          }
          aria-invalid={Boolean(estado.erroCampo.descricao) || undefined}
          aria-describedby={
            estado.erroCampo.descricao ? "reg-desc-erro" : undefined
          }
        />
        {estado.erroCampo.descricao ? (
          <p id="reg-desc-erro" role="alert" className="registrar__erro-campo">
            {estado.erroCampo.descricao}
          </p>
        ) : null}
      </div>

      <div className="registrar__campo">
        <label htmlFor="reg-setor" className="registrar__rotulo">
          Onde está?
        </label>
        <div
          className={
            estado.erroCampo.setor
              ? "registrar__select registrar__select--erro"
              : "registrar__select"
          }
        >
          <Icone nome="pin" tamanho={18} />
          <select
            id="reg-setor"
            value={estado.setor}
            onChange={(e) =>
              despachar({ tipo: "definir_setor", setor: e.target.value })
            }
          >
            {setores.includes(estado.setor) ? null : (
              <option value={estado.setor}>{estado.setor}</option>
            )}
            {setores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Icone nome="seta-baixo" tamanho={18} />
        </div>
        {estado.erroCampo.setor ? (
          <p role="alert" className="registrar__erro-campo registrar__erro-campo--icone">
            <Icone nome="alerta" tamanho={13} /> {estado.erroCampo.setor}
          </p>
        ) : null}
      </div>

      <div className="registrar__campo">
        <label htmlFor="reg-peso" className="registrar__rotulo">
          Peso aproximado <span className="registrar__opcional">· opcional</span>
        </label>
        <div
          className={
            estado.erroCampo.peso
              ? "registrar__peso registrar__peso--erro"
              : "registrar__peso"
          }
        >
          <input
            id="reg-peso"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 12,5"
            value={estado.pesoInformado}
            onChange={(e) =>
              despachar({ tipo: "definir_peso", peso: e.target.value })
            }
            aria-invalid={Boolean(estado.erroCampo.peso) || undefined}
            aria-describedby={
              estado.erroCampo.peso ? "reg-peso-ajuda reg-peso-erro" : "reg-peso-ajuda"
            }
          />
          <span aria-hidden="true">kg</span>
        </div>
        <p id="reg-peso-ajuda" className="registrar__ajuda">
          Se não souber, deixe em branco. A IA só estima o peso quando a
          foto permite; em saco fechado, por exemplo, ela não consegue.
        </p>
        {estado.erroCampo.peso ? (
          <p id="reg-peso-erro" role="alert" className="registrar__erro-campo">
            {estado.erroCampo.peso}
          </p>
        ) : null}
      </div>

      <fieldset className="registrar__campo registrar__prioridades">
        <legend className="registrar__rotulo">Prioridade</legend>
        <div className="registrar__prio-grid">
          {PRIORIDADES.map((p) => (
            <button
              key={p.valor}
              type="button"
              className={
                estado.prioridade === p.valor
                  ? `registrar__prio registrar__prio--${p.valor} registrar__prio--ativa`
                  : `registrar__prio registrar__prio--${p.valor}`
              }
              onClick={() =>
                despachar({
                  tipo: "definir_prioridade",
                  prioridade: p.valor,
                })
              }
              aria-pressed={estado.prioridade === p.valor}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="registrar__toggle-linha">
        <div>
          <p className="registrar__toggle-titulo">
            Avisar quem cuida do descarte
          </p>
          <p className="registrar__toggle-sub">
            A pessoa recebe assim que a análise concluir.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={estado.avisarResponsavel}
          onClick={() => despachar({ tipo: "alternar_avisar" })}
          className={
            estado.avisarResponsavel
              ? "registrar__toggle registrar__toggle--on"
              : "registrar__toggle"
          }
          aria-label="Avisar quem cuida do descarte"
        >
          <span className="registrar__toggle-bolinha" />
        </button>
      </div>

      <div className="registrar__analisar">
        <button
          type="button"
          className="registrar__botao registrar__botao--primario registrar__botao--largo"
          onClick={aoAnalisar}
          disabled={estado.fotoRecusada}
        >
          <Icone nome="brilho" tamanho={16} /> Analisar com IA
        </button>
        {estado.fotoRecusada ? (
          <p className="registrar__dica">
            Adicione uma foto pra liberar a análise
          </p>
        ) : null}
        {estado.classificacao ? (
          <button
            type="button"
            className="registrar__botao registrar__botao--contorno registrar__botao--largo"
            onClick={() =>
              erroPeso
                ? despachar({ tipo: "definir_erros", erros: { peso: erroPeso } })
                : despachar({ tipo: "voltar_a_analise" })
            }
          >
            Voltar à análise
          </button>
        ) : null}
      </div>
    </section>
  );
}
