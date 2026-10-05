import type { ReactNode } from "react";

interface FatiaDonut {
  readonly rotulo: string;
  readonly valor: number;
  readonly cor: string;
}

interface GraficoDonutProps {
  readonly fatias: readonly FatiaDonut[];
  readonly tamanho?: number;
  readonly espessura?: number;
  readonly centroTitulo: string;
  readonly centroRotulo: string;
}

export function GraficoDonut({
  fatias,
  tamanho = 160,
  espessura = 20,
  centroTitulo,
  centroRotulo,
}: GraficoDonutProps): ReactNode {
  const total = fatias.reduce((acc, f) => acc + f.valor, 0);
  if (total === 0) return null;

  const raio = tamanho / 2 - espessura / 2;
  const circunferencia = 2 * Math.PI * raio;
  const cx = tamanho / 2;
  const cy = tamanho / 2;

  let acumulado = 0;

  return (
    <svg
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={`Distribuição: ${fatias
        .map((f) => `${f.rotulo} ${Math.round((f.valor / total) * 100)}%`)
        .join(", ")}`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={raio}
        fill="none"
        stroke="var(--borda)"
        strokeWidth={espessura}
      />

      {fatias.map((fatia) => {
        const fracao = fatia.valor / total;
        const comprimento = fracao * circunferencia;
        const offset = -acumulado * circunferencia;
        acumulado += fracao;

        return (
          <circle
            key={fatia.rotulo}
            cx={cx}
            cy={cy}
            r={raio}
            fill="none"
            stroke={fatia.cor}
            strokeWidth={espessura}
            strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}

      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="var(--verde-escuro)"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {centroTitulo}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="10"
        fill="var(--texto-suave)"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {centroRotulo}
      </text>
    </svg>
  );
}
