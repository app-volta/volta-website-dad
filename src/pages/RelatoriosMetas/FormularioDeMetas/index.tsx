import { useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import type { NomeIcone } from "../../../components/Icone";
import { Mascote } from "../../../components/Mascote";
import type {
  AvisosDaMeta,
  Configuracoes,
  MetaPorMaterial,
  ModoMetaDoDia,
} from "../../../types/configuracao";
import { MATERIAIS } from "../../../types/material";
import type { Material } from "../../../types/material";
import type { RecuperadoDoMaterial } from "../../../types/painel";
import {
  lerQuilos,
  percentualDaMeta,
  validarMeta,
} from "../../../utils/configuracoes";
import {
  distribuirMeta,
  diasDeOperacaoDoMes,
  diasDeOperacaoPadrao,
  divisaoInicial,
  mensagemDaSomaDiferente,
  metaDoDiaKg,
  nomeDoMes,
  somaDasMetas,
  validarDias,
  validarValorFixoDoDia,
} from "../../../utils/metas";
import { CartaoAvisosDaMeta } from "../CartaoAvisosDaMeta";
import { CartaoMetaPorMaterial } from "../CartaoMetaPorMaterial";

/** As metas já conferidas, prontas para gravar. */
export interface ValoresDeMetas {
  readonly metaMensalKg: number;
  readonly dias: number;
  readonly modo: ModoMetaDoDia;
  readonly valorFixoKg: number;
  readonly metaPorMaterial: MetaPorMaterial;
  readonly avisos: AvisosDaMeta;
}

interface FormularioDeMetasProps {
  readonly configuracoes: Configuracoes;
  readonly agora: Date;
  readonly recuperadoMesKg: number;
  readonly recuperadoHojeKg: number;
  readonly recuperadoPorMaterial: readonly RecuperadoDoMaterial[];
  readonly outrosKg: number;
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

function comoMapa(lista: readonly RecuperadoDoMaterial[]): Record<Material, number> {
  return Object.fromEntries(
    MATERIAIS.map((material) => [
      material,
      lista.find((item) => item.material === material)?.kg ?? 0,
    ]),
  ) as Record<Material, number>;
}

function comoTextos(
  valores: Readonly<Record<Material, number>> | null,
): Record<Material, string> {
  return Object.fromEntries(
    MATERIAIS.map((material) => [material, valores ? String(valores[material]) : ""]),
  ) as Record<Material, string>;
}

/** 20e · Metas do mês e do dia: meta mensal, dias de operação, meta do dia, meta por material e avisos. */
export function FormularioDeMetas({
  configuracoes,
  agora,
  recuperadoMesKg,
  recuperadoHojeKg,
  recuperadoPorMaterial,
  outrosKg,
  salvando,
  erroDoServidor,
  aoSalvar,
}: FormularioDeMetasProps): ReactNode {
  const idBase = useId();
  const idMeta = `${idBase}-meta`;
  const idDias = `${idBase}-dias`;
  const idFixo = `${idBase}-fixo`;
  const formulario = useRef<HTMLFormElement | null>(null);
  const recuperadoDosMateriais = useMemo(
    () => comoMapa(recuperadoPorMaterial),
    [recuperadoPorMaterial],
  );
  const [inicial] = useState(() =>
    divisaoInicial(
      configuracoes.metaRecuperacaoKg,
      configuracoes.metaPorMaterial,
      recuperadoDosMateriais,
    ),
  );
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
  const [textosDosMateriais, setTextosDosMateriais] = useState<Record<Material, string>>(
    () => comoTextos(inicial.valores),
  );
  // Depois que a pessoa mexe numa meta de material, a meta do mês deixa de repartir sozinha.
  const [divisaoManual, setDivisaoManual] = useState<boolean>(false);
  const [ultimoMaterial, setUltimoMaterial] = useState<Material | null>(null);
  const [avisos, setAvisos] = useState<AvisosDaMeta>(configuracoes.avisosDaMeta);
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

  const valoresDosMateriais = Object.fromEntries(
    MATERIAIS.map((material) => [material, lerQuilos(textosDosMateriais[material])]),
  ) as Record<Material, number>;
  const todosOsMateriaisValidos = MATERIAIS.every(
    (material) => !Number.isNaN(valoresDosMateriais[material]),
  );
  const errosDosMateriais: Partial<Record<Material, string>> = tentou
    ? Object.fromEntries(
        MATERIAIS.filter((material) => Number.isNaN(valoresDosMateriais[material])).map(
          (material) => [material, "Informe a meta, só com números."],
        ),
      )
    : {};
  const somaDosMateriais = somaDasMetas(valoresDosMateriais);
  // E19: a soma só precisa fechar a meta do mês quando os dois lados estão certos.
  const somaNaoFecha =
    problemaDaMeta === null && todosOsMateriaisValidos && somaDosMateriais !== metaKg;
  const mensagemDaSoma = somaNaoFecha ? mensagemDaSomaDiferente(somaDosMateriais, metaKg) : null;

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

  function mudarMeta(texto: string): void {
    setMetaTexto(texto);
    const nova = lerQuilos(texto);
    // A meta do mês repartida sozinha acompanha a nova meta, sem desmanchar a divisão que a pessoa escolheu.
    if (!divisaoManual && !Number.isNaN(nova) && validarMeta(nova) === null) {
      setTextosDosMateriais(comoTextos(distribuirMeta(nova, inicial.partes)));
    }
  }

  function mudarMaterial(material: Material, texto: string): void {
    setTextosDosMateriais((atuais) => ({ ...atuais, [material]: texto }));
    setDivisaoManual(true);
    setUltimoMaterial(material);
  }

  function refazerDivisao(): void {
    if (problemaDaMeta === null) {
      setTextosDosMateriais(comoTextos(distribuirMeta(metaKg, inicial.partes)));
    }
    setDivisaoManual(false);
    setUltimoMaterial(null);
  }

  function focarPrimeiroInvalido(): void {
    requestAnimationFrame(() =>
      formulario.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    );
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setTentou(true);
    if (
      problemaDaMeta ||
      problemaDosDias ||
      problemaDoFixo ||
      !todosOsMateriaisValidos ||
      somaNaoFecha
    ) {
      focarPrimeiroInvalido();
      return;
    }
    aoSalvar({
      metaMensalKg: metaKg,
      dias,
      modo,
      valorFixoKg: modo === "fixo" ? fixoKg : configuracoes.metaDoDia.valorFixoKg,
      metaPorMaterial: valoresDosMateriais,
      avisos,
    });
  }

  return (
    <form className="metas" ref={formulario} onSubmit={enviar} noValidate>
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
                  aoMudar={mudarMeta}
                />
                {tentou && problemaDaMeta ? (
                  <p className="metas__erro" id={`${idMeta}-erro`}>
                    {problemaDaMeta}
                  </p>
                ) : null}
                <p className="metas__ajuda" id={`${idMeta}-ajuda`}>
                  Aparece no Início, nas notificações e no relatório PGRS.
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

          <CartaoMetaPorMaterial
            textos={textosDosMateriais}
            valores={valoresDosMateriais}
            recuperadoKg={recuperadoDosMateriais}
            outrosKg={outrosKg}
            dias={diasDoMes}
            legenda={
              modo === "fixo"
                ? `A soma fecha a meta do mês. Por dia é a meta de cada material ÷ ${diasDoMes} dias.`
                : `A soma fecha a meta do mês. A meta do dia é a do mês ÷ ${diasDoMes} dias.`
            }
            mensagemDaSoma={mensagemDaSoma}
            campoComAlerta={somaNaoFecha ? (ultimoMaterial ?? MATERIAIS[0]) : null}
            errosDosCampos={errosDosMateriais}
            dividido={!divisaoManual}
            aoMudar={mudarMaterial}
            aoRefazer={refazerDivisao}
          />
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

          <CartaoAvisosDaMeta
            avisos={avisos}
            aoAlterar={(chave, ligado) =>
              setAvisos((atuais) => ({ ...atuais, [chave]: ligado }))
            }
          />

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
                Mudou a meta do mês ou os dias de operação? A meta do dia e a de
                cada material se recalculam sozinhas.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
