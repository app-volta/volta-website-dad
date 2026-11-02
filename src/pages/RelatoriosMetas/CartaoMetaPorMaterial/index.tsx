import { useId } from "react";
import type { ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import { MATERIAIS, METADADOS_MATERIAL } from "../../../types/material";
import type { Material } from "../../../types/material";
import { percentualDaMeta } from "../../../utils/configuracoes";
import { somaDasMetas } from "../../../utils/metas";

interface CartaoMetaPorMaterialProps {
  readonly textos: Readonly<Record<Material, string>>;
  /** As metas já lidas dos textos; um campo em branco ou inválido vira NaN. */
  readonly valores: Readonly<Record<Material, number>>;
  readonly recuperadoKg: Readonly<Record<Material, number>>;
  /** Recuperado em materiais fora dos quatro (madeira, perigoso...): conta no mês, mas não tem meta própria. */
  readonly outrosKg: number;
  /** Dias de operação do mês, para a coluna "Por dia". */
  readonly dias: number;
  /** Explica como a meta do dia se liga à de cada material. */
  readonly legenda: string;
  /** E19: a soma dos materiais não fecha a meta do mês. */
  readonly mensagemDaSoma: string | null;
  /** O campo que a pessoa mexeu por último, destacado enquanto a soma não fecha. */
  readonly campoComAlerta: Material | null;
  readonly errosDosCampos: Readonly<Partial<Record<Material, string>>>;
  /** A meta do mês ainda reparte os materiais sozinha (ninguém mexeu na divisão). */
  readonly dividido: boolean;
  readonly aoMudar: (material: Material, texto: string) => void;
  readonly aoRefazer: () => void;
}

function kg(valor: number): string {
  return `${valor.toLocaleString("pt-BR")} kg`;
}

function porDia(metaKg: number, dias: number): number {
  return dias > 0 && !Number.isNaN(metaKg) ? Math.round(metaKg / dias) : 0;
}

/** 20e · Meta por material: a soma das metas dos quatro materiais fecha a meta do mês. */
export function CartaoMetaPorMaterial({
  textos,
  valores,
  recuperadoKg,
  outrosKg,
  dias,
  legenda,
  mensagemDaSoma,
  campoComAlerta,
  errosDosCampos,
  dividido,
  aoMudar,
  aoRefazer,
}: CartaoMetaPorMaterialProps): ReactNode {
  const idBase = useId();
  const metaTotal = somaDasMetas(valores);
  const recuperadoTotal = MATERIAIS.reduce((soma, material) => soma + recuperadoKg[material], 0);

  return (
    <section className="metas__cartao" aria-labelledby={`${idBase}-titulo`}>
      <div className="metas__cabecalho">
        <h2 id={`${idBase}-titulo`} className="metas__titulo">
          Meta por material
        </h2>
        {dividido ? null : (
          <button type="button" className="metas__refazer" onClick={aoRefazer}>
            Refazer a divisão
          </button>
        )}
      </div>
      {mensagemDaSoma ? (
        <p className="metas__sub metas__sub--erro" role="alert">
          <Icone nome="alerta" tamanho={13} />
          {mensagemDaSoma}
        </p>
      ) : (
        <p className="metas__sub">{legenda}</p>
      )}

      <div className="metas__tabela-rolagem">
        <table className="metas__tabela">
          <caption className="sr-only">
            Meta de cada material, o que já foi recuperado e quanto isso dá por dia
          </caption>
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col">Recuperado</th>
              <th scope="col">Meta do mês</th>
              <th scope="col">Por dia</th>
              <th scope="col">Atingido</th>
            </tr>
          </thead>
          <tbody>
            {MATERIAIS.map((material) => {
              const rotulo = METADADOS_MATERIAL[material].rotulo;
              const erro = errosDosCampos[material] ?? null;
              const comAlerta = erro !== null || campoComAlerta === material;
              const percentual = percentualDaMeta(
                recuperadoKg[material],
                Number.isNaN(valores[material]) ? 0 : valores[material],
              );
              return (
                <tr key={material} data-material={material}>
                  <th scope="row">
                    <span className="metas__material">
                      <span className="metas__ponto" aria-hidden="true" />
                      {rotulo}
                    </span>
                  </th>
                  <td>{kg(recuperadoKg[material])}</td>
                  <td>
                    <div
                      className={`metas__campo metas__campo--compacto${comAlerta ? " metas__campo--erro" : ""}`}
                    >
                      <input
                        id={`${idBase}-${material}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={`Meta de ${rotulo} em quilos por mês`}
                        aria-invalid={comAlerta ? true : undefined}
                        aria-describedby={erro ? `${idBase}-${material}-erro` : undefined}
                        value={textos[material]}
                        onChange={(evento) => aoMudar(material, evento.target.value)}
                      />
                      <span className="metas__campo-unidade" aria-hidden="true">
                        kg
                      </span>
                    </div>
                    {erro ? (
                      <span className="metas__erro metas__erro--tabela" id={`${idBase}-${material}-erro`}>
                        {erro}
                      </span>
                    ) : null}
                  </td>
                  <td>{kg(porDia(valores[material], dias))}</td>
                  <td>
                    <span className="metas__atingido">
                      <span className="metas__mini-trilho" aria-hidden="true">
                        <span style={{ width: `${Math.min(percentual, 100)}%` }} />
                      </span>
                      <strong>{percentual}%</strong>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total da unidade</th>
              <td>{kg(recuperadoTotal)}</td>
              <td>{kg(metaTotal)}</td>
              <td>{kg(porDia(metaTotal, dias))}</td>
              <td>
                <span className="metas__atingido">
                  <span className="metas__mini-trilho" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.min(percentualDaMeta(recuperadoTotal, metaTotal), 100)}%`,
                      }}
                    />
                  </span>
                  <strong>{percentualDaMeta(recuperadoTotal, metaTotal)}%</strong>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {outrosKg > 0 ? (
        <p className="metas__ajuda">
          Mais {kg(outrosKg)} recuperados em outros materiais, que não têm meta própria.
        </p>
      ) : null}
    </section>
  );
}
