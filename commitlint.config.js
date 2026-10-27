// Padrão de commits do VOLTA — ver docs/COMMITS.md.
// Os tipos abaixo são os mesmos da tabela de lá; qualquer outro é recusado.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "test", "chore", "style", "perf"],
    ],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "header-max-length": [2, "always", 100],
  },
};
