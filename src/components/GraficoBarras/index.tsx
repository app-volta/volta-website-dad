import { useId, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarShapeProps, TooltipContentProps } from "recharts";

import "./styles.css";

/** Degradê padrão das barras: o verde da marca. */
const DEGRADE_PADRAO: readonly [string, string] = ["#15874c", "#0e7c48"];
const ALTURA_POR_BARRA = 44;
const ALTURA_COLUNAS = 220;
/** Abaixo desta largura (px), o gráfico em linhas encolhe nomes e margens. */
const LARGURA_ESTREITA = 420;

export interface BarraDoGrafico {
  readonly chave: string;
  readonly rotulo: string;
  readonly valor: number;
  /** Cores do degradê, da ponta para a base; sem elas, o verde da marca. */
  readonly degrade?: readonly [string, string];
}

interface GraficoBarrasProps {
  readonly barras: readonly BarraDoGrafico[];
  /** "linhas": uma barra por linha, bom para nomes longos; "colunas": uma coluna por item. */
  readonly direcao: "linhas" | "colunas";
  /** Nome do gráfico para leitores de tela. */
  readonly rotulo: string;
  /** Escreve o valor na dica ao passar o mouse e na lista para leitores de tela. */
  readonly formatarValor: (valor: number) => string;
  /** Escreve o valor em cima de cada barra; sem ela, vale `formatarValor`. */
  readonly formatarRotulo?: (valor: number) => string;
}

function abreviar(texto: string, limite: number): string {
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

interface DicaProps extends TooltipContentProps {
  readonly formatarValor: (valor: number) => string;
}

function Dica({ active, payload, formatarValor }: DicaProps): ReactNode {
  const barra = payload[0]?.payload as BarraDoGrafico | undefined;
  if (!active || !barra) return null;
  return (
    <div className="grafico-barras__dica">
      <span>{barra.rotulo}</span>
      <b>{formatarValor(barra.valor)}</b>
    </div>
  );
}

/**
 * Gráfico de barras (Recharts) com dica ao passar o mouse e o valor escrito em
 * cada barra. O desenho é escondido de leitores de tela; no lugar dele vai uma
 * lista com os mesmos números.
 */
export function GraficoBarras({
  barras,
  direcao,
  rotulo,
  formatarValor,
  formatarRotulo = formatarValor,
}: GraficoBarrasProps): ReactNode {
  const prefixo = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [largura, setLargura] = useState<number>(0);
  const emLinhas = direcao === "linhas";
  const estreito = largura > 0 && largura < LARGURA_ESTREITA;
  const altura = emLinhas
    ? Math.max(barras.length * ALTURA_POR_BARRA, ALTURA_POR_BARRA)
    : ALTURA_COLUNAS;
  // O id usa a posição da barra: a chave pode ter espaços e acentos, que quebram o url(#...).
  const idDoDegrade = (indice: number): string => `${prefixo}-${indice}`;

  function desenharBarra(props: BarShapeProps): ReactNode {
    return (
      <Rectangle
        {...props}
        fill={`url(#${idDoDegrade(props.index)})`}
        radius={emLinhas ? [0, 8, 8, 0] : [10, 10, 10, 10]}
      />
    );
  }

  return (
    <figure className="grafico-barras" aria-label={rotulo}>
      <div className="grafico-barras__area" style={{ height: altura }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" onResize={setLargura}>
          <BarChart
            data={[...barras]}
            layout={emLinhas ? "vertical" : "horizontal"}
            margin={
              emLinhas
                ? { top: 4, right: estreito ? 36 : 64, bottom: 4, left: 0 }
                : { top: 26, right: 8, bottom: 0, left: 8 }
            }
            accessibilityLayer={false}
          >
            <defs>
              {barras.map((barra, indice) => {
                const [inicio, fim] = barra.degrade ?? DEGRADE_PADRAO;
                return (
                  <linearGradient
                    key={barra.chave}
                    id={idDoDegrade(indice)}
                    x1="0"
                    y1="0"
                    x2={emLinhas ? "1" : "0"}
                    y2={emLinhas ? "0" : "1"}
                  >
                    <stop offset="0%" stopColor={inicio} />
                    <stop offset="100%" stopColor={fim} />
                  </linearGradient>
                );
              })}
            </defs>
            {emLinhas ? (
              <>
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="rotulo"
                  width={estreito ? 104 : 140}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(nome: string) => abreviar(nome, estreito ? 15 : 20)}
                  interval={0}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey="rotulo"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis type="number" hide domain={[0, "dataMax"]} />
              </>
            )}
            <Tooltip
              isAnimationActive={false}
              cursor={{ fill: "var(--verde-suave)", opacity: 0.6 }}
              content={(props) => <Dica {...props} formatarValor={formatarValor} />}
            />
            <Bar
              dataKey="valor"
              barSize={emLinhas ? 16 : 55}
              minPointSize={6}
              isAnimationActive={false}
              shape={desenharBarra}
            >
              <LabelList
                dataKey="valor"
                position={emLinhas ? "right" : "top"}
                offset={8}
                className="grafico-barras__valor"
                formatter={(valor: unknown) => formatarRotulo(Number(valor))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {barras.map((barra) => (
          <li key={barra.chave}>
            {barra.rotulo}: {formatarValor(barra.valor)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
