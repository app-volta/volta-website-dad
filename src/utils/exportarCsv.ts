export function montarCsv(
  cabecalho: readonly string[],
  linhas: readonly (readonly (string | number)[])[],
): string {
  const celula = (valor: string | number): string => {
    const texto = String(valor);
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return [cabecalho, ...linhas]
    .map((linha) => linha.map(celula).join(";"))
    .join("\r\n");
}

export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob(["﻿" + conteudo], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
