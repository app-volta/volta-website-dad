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

## Hooks de commit (husky + commitlint)

O padrão deste documento é verificado automaticamente em cada commit por
[husky](https://typicode.github.io/husky/) e
[commitlint](https://commitlint.js.org/). Os hooks são instalados sozinhos
no `npm install` (script `prepare`); não há nada para configurar na mão.

| Hook | O que roda | Quando barra o commit |
|------|------------|-----------------------|
| `pre-commit` | `oxlint --quiet` | Erro de lint (por exemplo, hook do React chamado dentro de `if`). Avisos não barram. |
| `commit-msg` | `commitlint` com `commitlint.config.js` | Tipo fora de `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, ou resumo vazio, com maiúscula inicial ou com mais de 100 caracteres no cabeçalho. |

Exemplo de commit recusado:

```
$ git commit -m "ajustes"
✖ subject may not be empty [subject-empty]
✖ type may not be empty [type-empty]
husky - commit-msg script failed (code 1)
```

Para conferir uma mensagem sem commitar:

```bash
echo "feat(auth): adiciona o login" | ./node_modules/.bin/commitlint
```

Os hooks chamam `node_modules/.bin` direto, sem `npx`, porque o `npx.cmd`
do Windows quebra em pastas com `&` no caminho (como `Instituto J&F`).

## Outras ferramentas

- No VS Code, a extensão "Conventional Commits" acelera a escrita.
