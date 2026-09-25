# Padrão de commits — Conventional Commits

Todo commit neste projeto segue [Conventional Commits 1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/).
O objetivo é ter um histórico legível, versionável e que descreva **o
porquê** da mudança, não só o quê.

## Formato

```
<tipo>(<escopo opcional>): <resumo em minúsculas, sem ponto final>

<corpo opcional — quebre em linhas de ~72 colunas>

<rodapé opcional — refs, breaking change, etc.>
```

### Tipos usados no VOLTA

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade visível ao usuário ou nova capacidade do código. |
| `fix` | Correção de bug. |
| `refactor` | Muda a estrutura sem mudar comportamento observável. |
| `docs` | Só documentação (README, este arquivo, ADRs). |
| `chore` | Configuração, tooling, dependências, arquivos de setup. |
| `test` | Adição/ajuste de testes. |
| `style` | Formatação, whitespace, sem mudança de lógica. |
| `perf` | Melhoria de performance. |

### Escopos comuns

`types`, `services`, `hooks`, `components`, `pages`, `auth`, `chat`,
`registrar`, `routing`, `a11y`. Escopo é opcional — use quando ajudar a
localizar a mudança.

## Exemplos concretos deste repositório

Bom (descreve o porquê):
```
feat(hooks): adiciona hooks de dados com AbortController no cleanup

Cada hook retorna { dados, carregando, erro } e cancela a requisição
pendente ao desmontar, evitando setState em componente destruído.
```

Ruim (não descreve nada):
```
ajustes
commit final
mudanças
wip
```

## Boas práticas

1. **Um commit = uma ideia.** Se der pra descrever com "E" (ex.: "adiciona
   Login e refatora hooks"), quebra em dois commits.
2. **Resumo no imperativo.** "adiciona X", "corrige Y", "remove Z" — não
   "adicionado" nem "adicionando".
3. **Fala do porquê no corpo.** O diff mostra o quê; o corpo explica a
   motivação, decisões e trade-offs.
4. **Referencie o ticket no rodapé quando fizer sentido**:
   ```
   Refs: SCRUM-1873
   ```
5. **Breaking change** vai no rodapé:
   ```
   BREAKING CHANGE: assinatura de useOcorrencias mudou de tuple para objeto.
   ```

## Fluxo de branch e PR

- `main` — produção.
- `develop` — integração do sprint. Todo PR mergea aqui.
- `feat/SCRUM-<numero>` — branch de ticket, nasce de `develop`.

```
develop
  ↑ merge --no-ff
feat/SCRUM-1867
feat/SCRUM-1868
feat/SCRUM-1869
...
```

Cada PR:
1. Título descreve o card em uma linha (ex.: `feat: adiciona filtro por material em Ocorrências`).
2. Descrição resume o que muda, o que testar e o que ficou de fora.
3. Merge em `develop` com `--no-ff` (preserva a linha da branch).

## Ferramentas recomendadas

- [commitlint](https://commitlint.js.org/) + [husky](https://typicode.github.io/husky/)
  para bloquear commits fora do padrão. Sugestão: adicionar em uma
  iteração futura.
- No VS Code, extensão "Conventional Commits" acelera a escrita.
