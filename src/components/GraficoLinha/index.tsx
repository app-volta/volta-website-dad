import type { ReactNode } from "react";

interface PontoSerie {
  readonly rotulo: string;
  readonly valor: number;
  readonly meta?: number;
}

interface GraficoLinhaProps {
  readonly pontos: readonly PontoSerie[];
  readonly altura?: number;
  readonly rotulo?: string;
}

export function GraficoLinha({
  pontos,
  altura = 220,
  rotulo = "Gráfico de linha",
}: GraficoLinhaProps): ReactNode {
  if (pontos.length < 2) return null;

  const largura = 640;
  const padLeft = 24;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 40;
  const w = largura - padLeft - padRight;
  const h = altura - padTop - padBottom;

  const valores = pontos.flatMap((p) =>
    p.meta !== undefined ? [p.valor, p.meta] : [p.valor],
  );
  const maximo = Math.max(...valores);
  const minimo = Math.min(0, Math.min(...valores));
  const variacao = maximo - minimo || 1;

  const passo = w / (pontos.length - 1);

  function coord(valor: number, idx: number): { x: number; y: number } {
    return {
      x: padLeft + idx * passo,
      y: padTop + h - ((valor - minimo) / variacao) * h,
    };
  }

  const linhaValores = pontos
    .map((p, i) => {
      const c = coord(p.valor, i);
      return (i === 0 ? "M" : "L") + ` ${c.x} ${c.y}`;
    })
    .join(" ");

  const linhaMetas = pontos.every((p) => p.meta !== undefined)
    ? pontos
        .map((p, i) => {
          const c = coord(p.meta ?? 0, i);
          return (i === 0 ? "M" : "L") + ` ${c.x} ${c.y}`;
        })
        .join(" ")
    : null;

  const area = `${linhaValores} L ${padLeft + w} ${padTop + h} L ${padLeft} ${padTop + h} Z`;

  const linhasHorizontais = [0.25, 0.5, 0.75, 1].map((f) => padTop + h - f * h);

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={rotulo}
      className="grafico-linha"
    >
      {linhasHorizontais.map((y) => (
        <line
          key={y}
          x1={padLeft}
          x2={padLeft + w}
          y1={y}
          y2={y}
          stroke="var(--borda)"
          strokeDasharray="2 4"
        />
      ))}

      <path d={area} fill="var(--verde-primario)" opacity="0.08" />

      {linhaMetas ? (
        <path
          d={linhaMetas}
          stroke="var(--texto-suave)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
        />
      ) : null}

      <path
        d={linhaValores}
        stroke="var(--verde-primario)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pontos.map((p, i) => {
        const c = coord(p.valor, i);
        return (
          <circle
            key={p.rotulo}
            cx={c.x}
            cy={c.y}
            r="4"
            fill="#FFFFFF"
            stroke="var(--verde-primario)"
            strokeWidth="2"
          />
        );
      })}

      {pontos.map((p, i) => (
        <text
          key={p.rotulo}
          x={padLeft + i * passo}
          y={altura - 12}
          textAnchor="middle"
          fontSize="11"
          fill="var(--texto-suave)"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {p.rotulo}
        </text>
      ))}
    </svg>
  );
}
