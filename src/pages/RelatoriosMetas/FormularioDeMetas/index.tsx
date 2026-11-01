import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import type { NomeIcone } from "../../../components/Icone";
import { Mascote } from "../../../components/Mascote";
import type { Configuracoes, ModoMetaDoDia } from "../../../types/configuracao";
import {
  lerQuilos,
  percentualDaMeta,
  validarMeta,
} from "../../../utils/configuracoes";
import {
  diasDeOperacaoDoMes,
  diasDeOperacaoPadrao,
  metaDoDiaKg,
  nomeDoMes,
  validarDias,
  validarValorFixoDoDia,
} from "../../../utils/metas";

/** As metas já conferidas, prontas para gravar. */
export interface ValoresDeMetas {
  readonly metaMensalKg: number;
  readonly dias: number;
  readonly modo: ModoMetaDoDia;
  readonly valorFixoKg: number;
}

interface FormularioDeMetasProps {
  readonly configuracoes: Configuracoes;
  readonly agora: Date;
  readonly recuperadoMesKg: number;
  readonly recuperadoHojeKg: number;
  readonly salvando: boolean;
  /** Por que o servidor não gravou (por exemplo, a empresa ainda não tem métrica ESG). */
  readonly erroDoServidor: string | null;
  readonly aoSalvar: (valores: ValoresDeMetas) => void;
}

interface CampoNumericoProps {
  readonly id: string;
  readonly icone: NomeIcone;
  readonly valor: string;
  readonly unidade: string;
  readonly rotuloAcessivel: string;
  readonly erro: string | null;
  readonly descritoPor: string;
  readonly aoMudar: (valor: string) => void;
}

function CampoNumerico({
  id,
  icone,
  valor,
  unidade,
  rotuloAcessivel,
  erro,
  descritoPor,
  aoMudar,
}: CampoNumericoProps): ReactNode {
  return (
    <div className={`metas__campo${erro ? " metas__campo--erro" : ""}`}>
      <span className="metas__campo-icone" aria-hidden="true">
        <Icone nome={icone} tamanho={16} />
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={rotuloAcessivel}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
      <span className="metas__campo-unidade" aria-hidden="true">
        {unidade}
      </span>
    </div>
  );
}

function kg(valor: number): string {
  return `${valor.toLocaleString("pt-BR")} kg`;
}

/** 20e · Metas do mês e do dia: a meta mensal, os dias de operação e como a meta do dia é calculada. */
export function FormularioDeMetas({
  configuracoes,
  agora,
  recuperadoMesKg,
  recuperadoHojeKg,
  salvando,
  erroDoServidor,
  aoSalvar,
}: FormularioDeMetasProps): ReactNode {
  const idBase = useId();
  const idMeta = `${idBase}-meta`;
  const idDias = `${idBase}-dias`;
  const idFixo = `${idBase}-fixo`;
  const [metaTexto, setMetaTexto] = useState<string>(
    configuracoes.metaRecuperacaoKg > 0
      ? String(Math.round(configuracoes.metaRecuperacaoKg))
      : "",
  );
  const [diasTexto, setDiasTexto] = useState<string>(
    String(diasDeOperacaoDoMes(configuracoes.diasDeOperacao, agora)),
  );
  const [modo, setModo] = useState<ModoMetaDoDia>(configuracoes.metaDoDia.modo);
  const [fixoTexto, setFixoTexto] = useState<string>(
    configuracoes.metaDoDia.valorFixoKg > 0
      ? String(configuracoes.metaDoDia.valorFixoKg)
      : "",
  );
  const [tentou, setTentou] = useState<boolean>(false);

  const metaKg = lerQuilos(metaTexto);
  const dias = lerQuilos(diasTexto);
  const fixoKg = lerQuilos(fixoTexto);
  const problemaDaMeta = Number.isNaN(metaKg)
    ? "Informe a meta em quilos."
    : validarMeta(metaKg);
  const problemaDosDias = Number.isNaN(dias)
    ? "Informe os dias de operação."
    : validarDias(dias);
  const problemaDoFixo =
    modo !== "fixo"
      ? null
      : Number.isNaN(fixoKg)
        ? "Informe quantos quilos por dia."
        : validarValorFixoDoDia(fixoKg, problemaDaMeta ? Infinity : metaKg);

  // Enquanto um campo está inválido, o resumo usa 0 (meta) ou o padrão do mês (dias).
  const metaDoMesKg = problemaDaMeta === null ? metaKg : 0;
  const diasDoMes = problemaDosDias === null ? dias : diasDeOperacaoPadrao(agora);
  const metaDoDia = metaDoDiaKg(metaDoMesKg, diasDoMes, {
    modo,
    valorFixoKg: problemaDoFixo === null && modo === "fixo" ? fixoKg : 0,
  });
  const percentualDoMes = percentualDaMeta(recuperadoMesKg, metaDoMesKg);
  const percentualDeHoje = percentualDaMeta(recuperadoHojeKg, metaDoDia);
  const faltamKg = Math.max(0, metaDoMesKg - recuperadoMesKg);
  const mes = nomeDoMes(agora);

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setTentou(true);
    if (problemaDaMeta || problemaDosDias || problemaDoFixo) return;
    aoSalvar({
      metaMensalKg: metaKg,
      dias,
      modo,
      valorFixoKg: modo === "fixo" ? fixoKg : configuracoes.metaDoDia.valorFixoKg,
    });
  }

  return (
    <form className="metas" onSubmit={enviar} noValidate>
      <div className="metas__topo">
        <Link to="/relatorios" className="metas__botao">
          <Icone nome="seta-esquerda" tamanho={14} />
          Voltar pros relatórios
        </Link>
        <div className="metas__acoes">
          <Link to="/relatorios" className="metas__botao">
            Cancelar
          </Link>
          <button type="submit" className="metas__salvar" disabled={salvando}>
            <Icone nome="check" tamanho={14} />
            {salvando ? "Salvando…" : "Salvar metas"}
          </button>
        </div>
      </div>

      {erroDoServidor ? (
        <Alerta variante="erro" titulo="Não foi possível salvar as metas">
          {erroDoServidor}
        </Alerta>
      ) : null}

      <div className="metas__grade">
        <div className="metas__coluna">
          <section className="metas__cartao" aria-labelledby={`${idBase}-titulo-mes`}>
            <div className="metas__cabecalho">
              <h2 id={`${idBase}-titulo-mes`} className="metas__titulo">
                Meta do mês
              </h2>
              <span className="metas__selo">
                {metaDoMesKg > 0 ? `${percentualDoMes}% atingido` : "Sem meta"}
              </span>
            </div>
            <p className="metas__sub">Quanto a unidade quer recuperar em {mes}</p>

            <div className="metas__campos">
              <div>
                <label className="metas__rotulo" htmlFor={idMeta}>
                  Meta mensal
                </label>
                <CampoNumerico
                  id={idMeta}
                  icone="alvo"
                  valor={metaTexto}
                  unidade="kg/mês"
                  rotuloAcessivel="Meta mensal em quilos por mês"
                  erro={tentou ? problemaDaMeta : null}
                  descritoPor={`${idMeta}-ajuda ${idMeta}-erro`}
                  aoMudar={setMetaTexto}
                />
                {tentou && problemaDaMeta ? (
                  <p className="metas__erro" id={`${idMeta}-erro`}>
                    {problemaDaMeta}
                  </p>
                ) : null}
                <p className="metas__ajuda" id={`${idMeta}-ajuda`}>
                  Aparece no Início e nas notificações do painel.
                </p>
              </div>
              <div>
                <label className="metas__rotulo" htmlFor={idDias}>
                  Dias de operação no mês
                </label>
                <CampoNumerico
                  id={idDias}
                  icone="relogio"
                  valor={diasTexto}
                  unidade="dias"
                  rotuloAcessivel="Dias de operação no mês"
                  erro={tentou ? problemaDosDias : null}
                  descritoPor={`${idDias}-ajuda ${idDias}-erro`}
                  aoMudar={setDiasTexto}
                />
                {tentou && problemaDosDias ? (
                  <p className="metas__erro" id={`${idDias}-erro`}>
                    {problemaDosDias}
                  </p>
                ) : null}
                <p className="metas__ajuda" id={`${idDias}-ajuda`}>
                  Seg. a sáb. dá {diasDeOperacaoPadrao(agora)} dias neste mês. Fica
                  salvo neste navegador.
                </p>
              </div>
            </div>

            <div className="metas__progresso">
              <div className="metas__progresso-linha">
                <span>
                  {kg(recuperadoMesKg)} de {kg(metaDoMesKg)} recuperados em {mes}
                </span>
                <span className="metas__mudo">
                  {metaDoMesKg <= 0
                    ? ""
                    : faltamKg > 0
                      ? `faltam ${kg(faltamKg)}`
                      : "meta batida"}
                </span>
              </div>
              <div
                className="metas__trilho"
                role="progressbar"
                aria-label="Meta do mês atingida"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(percentualDoMes, 100)}
              >
                <span style={{ width: `${Math.min(percentualDoMes, 100)}%` }} />
              </div>
            </div>
          </section>
        </div>

        <div className="metas__coluna">
          <section className="metas__cartao" aria-labelledby={`${idBase}-titulo-dia`}>
            <div className="metas__cabecalho">
              <h2 id={`${idBase}-titulo-dia`} className="metas__titulo">
                Meta do dia
              </h2>
              <span className="metas__selo">{metaDoDia.toLocaleString("pt-BR")} kg por dia</span>
            </div>
            <p className="metas__sub">Quanto registrar em cada dia de operação</p>

            <fieldset className="metas__opcoes">
              <legend className="sr-only">Como calcular a meta do dia</legend>
              <label className="metas__opcao">
                <input
                  type="radio"
                  name={`${idBase}-modo`}
                  className="metas__opcao-entrada"
                  checked={modo === "dividir"}
                  onChange={() => setModo("dividir")}
                />
                <span className="metas__opcao-corpo">
                  <span>
                    <strong>Dividir a meta do mês</strong>
                    <small>
                      {kg(metaDoMesKg)} ÷ {diasDoMes} dias ={" "}
                      {kg(metaDoDiaKg(metaDoMesKg, diasDoMes, { modo: "dividir", valorFixoKg: 0 }))}{" "}
                      por dia
                    </small>
                  </span>
                  <span className="metas__opcao-marca" aria-hidden="true">
                    <Icone nome="check" tamanho={12} />
                  </span>
                </span>
              </label>
              <label className="metas__opcao">
                <input
                  type="radio"
                  name={`${idBase}-modo`}
                  className="metas__opcao-entrada"
                  checked={modo === "fixo"}
                  onChange={() => setModo("fixo")}
                />
                <span className="metas__opcao-corpo">
                  <span>
                    <strong>Valor fixo por dia</strong>
                    <small>Você escolhe um número pra todos os dias</small>
                  </span>
                  <span className="metas__opcao-marca" aria-hidden="true">
                    <Icone nome="check" tamanho={12} />
                  </span>
                </span>
              </label>
            </fieldset>

            {modo === "fixo" ? (
              <div className="metas__fixo">
                <label className="metas__rotulo" htmlFor={idFixo}>
                  Meta por dia
                </label>
                <CampoNumerico
                  id={idFixo}
                  icone="alvo"
                  valor={fixoTexto}
                  unidade="kg/dia"
                  rotuloAcessivel="Meta por dia em quilos"
                  erro={tentou ? problemaDoFixo : null}
                  descritoPor={`${idFixo}-erro`}
                  aoMudar={setFixoTexto}
                />
                {tentou && problemaDoFixo ? (
                  <p className="metas__erro" id={`${idFixo}-erro`}>
                    {problemaDoFixo}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="metas__progresso">
              <div className="metas__progresso-linha">
                <span>
                  Hoje · {recuperadoHojeKg.toLocaleString("pt-BR")} de {kg(metaDoDia)}
                </span>
                <span className="metas__mudo">{metaDoDia > 0 ? `${percentualDeHoje}%` : ""}</span>
              </div>
              <div
                className="metas__trilho"
                role="progressbar"
                aria-label="Meta de hoje atingida"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(percentualDeHoje, 100)}
              >
                <span style={{ width: `${Math.min(percentualDeHoje, 100)}%` }} />
              </div>
            </div>
          </section>

          <aside className="metas__dica">
            <div className="metas__dica-mascote" aria-hidden="true">
              <Mascote tamanho={49} altura={85} />
            </div>
            <div>
              <h2 className="metas__dica-titulo">
                <Icone nome="brilho" tamanho={13} />
                Dica do VOLTA
              </h2>
              <p className="metas__dica-texto">
                Mudou a meta do mês ou os dias de operação? A meta do dia se
                recalcula sozinha.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
