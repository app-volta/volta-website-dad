# VOLTA — reciclagem industrial inteligente

Plataforma que conecta indústrias (frigoríficos) a cooperativas de
reciclagem: o operador registra um resíduo com foto, uma IA classifica o
material (papelão, plástico, metal ou vidro) e o responsável PGRS acompanha
o relatório, corrige a classificação se necessário, encaminha para a
cooperativa parceira, conversa por chat e finaliza a ocorrência.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) para dev server e build
- [React Router v7](https://reactrouter.com/) para navegação
- [oxlint](https://oxc.rs/) para linting rápido
- Deploy configurado para Vercel (SPA rewrites via `vercel.json`)

## Rodando localmente

Pré-requisitos: Node.js 20+ e npm 10+.

```bash
# instalar dependências
npm install

# copiar variáveis de ambiente (opcional — os mocks funcionam sem back)
cp .env.example .env

# subir o dev server em http://localhost:5173
npm run dev

# build de produção em ./dist
npm run build

# preview do build
npm run preview

# linter
npm run lint
```

## Variáveis de ambiente

Elas ficam no `.env` (não versionado). O `.env.example` documenta cada uma.

| Nome | Descrição |
|------|-----------|
| `VITE_API_BASE_URL` | URL base da API do VOLTA (quando existir). |
| `VITE_CLASSIFICACAO_API_KEY` | Chave (opcional) do serviço de classificação. |
| `VITE_USAR_MOCKS` | `true` mantém os mocks locais mesmo com API configurada. |

Enquanto o backend real não estiver disponível, tudo passa pelos mocks em
`src/services/`. As assinaturas exportadas já batem com o formato pretendido
para o backend, então a troca depois é substituir a implementação sem tocar
componentes/páginas.

## Estrutura de pastas

```
src/
├─ components/<Nome>/index.tsx     # cada componente na sua pasta
├─ pages/<Nome>/index.tsx          # cada página na sua pasta
├─ services/<recurso>.ts           # ÚNICA camada que chama APIs externas
├─ types/<dominio>.ts              # interfaces por domínio, zero `any`
├─ context/<Nome>/index.tsx        # Contextos + Providers
├─ hooks/use<Nome>.ts              # hooks customizados (data-fetching)
├─ utils/                          # validadores, storage, formatação
└─ App.tsx                         # roteamento + lazy loading
```

Regras estritas:

- **Zero `any` em `src/`.** Todas as entidades e props têm interfaces em
  `src/types/`.
- **Nenhum `fetch` fora de `src/services/`.** Páginas e componentes chamam
  funções do services, que sempre retornam `Promise<Tipo>`.
- **Toda ação usa `<button>` semântico** — nada de `<div onClick>`.
- **Todo input tem `<label htmlFor>`** e mensagens de erro com `role="alert"`.
- **`localStorage` com envelope `{ _versao, dados }`** — versão diferente
  descarta com segurança em vez de quebrar a aplicação.

## Rotas

| Caminho | Página | Acesso |
|---------|--------|--------|
| `/login` | Login | Público |
| `/cadastro` | Cadastro | Público |
| `/` | Home (dashboard) | Privado |
| `/registrar` | Registrar ocorrência (`useReducer`) | Privado |
| `/ocorrencias` | Lista com filtro por material | Privado |
| `/ocorrencias/:id` | Detalhe + ações (reclassificar / encaminhar / finalizar) | Privado |
| `/cooperativas` | Lista de cooperativas parceiras | Privado |
| `/cooperativas/:id/chat` | Chat com uma cooperativa | Privado |
| `/perfil` | Dados do usuário logado | Privado |
| `*` | Página 404 com botão de retorno | Pública |

Rotas privadas passam por `<PrivateRoute>`, que consome só o `AuthContext`
(nenhuma página checa autenticação diretamente).

## Acessibilidade (WCAG 2.1 AA)

- Skip-link no topo (`Pular para o conteúdo principal`)
- Landmarks semânticos (`<header>`, `<nav>`, `<main>`, `<footer>`) em todas
  as páginas
- Foco visível global (`:focus-visible` → `box-shadow`), sem remover
  `outline` sem substituto
- Modais com `role="dialog"`, `aria-modal`, ESC fecha e foco devolvido ao
  trigger
- Abas com `role="tablist"`, `aria-selected`, navegação por seta horizontal
- Estados de carregamento anunciados em `role="status"` + `aria-live`,
  erros em `role="alert"`
- Alvos de toque com ao menos 44 px de altura
- Contraste conferido nas variáveis da paleta

## Deploy na Vercel

O `vercel.json` já contém o rewrite de SPA (`/(.*)` → `/index.html`) para
que rotas como `/ocorrencias/1234` funcionem em recarga direta. Ao
importar o repo na Vercel, os padrões do Vite (`npm run build` / pasta
`dist`) já funcionam. Configure `VITE_API_BASE_URL` em Environment
Variables se o backend estiver disponível.

## Padrão de commits

Este projeto segue [Conventional Commits](https://www.conventionalcommits.org/).
Prefixos usados: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`.
Escopos comuns: `types`, `services`, `hooks`, `components`, `pages`,
`auth`, `chat`, `registrar`, `routing`, `a11y`.

## Branches

O trabalho é dividido nas branches de ticket do SCRUM, todas nascidas de
`feat/SCRUM-1934`:

| Branch | Ticket |
|--------|--------|
| `feat/SCRUM-1867` | 6+ componentes com responsabilidade única |
| `feat/SCRUM-1868` | Página 404 + rota curinga |
| `feat/SCRUM-1869` | Acessibilidade WCAG 2.1 AA |
| `feat/SCRUM-1870` | Feedback visual em ações assíncronas |
| `feat/SCRUM-1871` | Deploy na Vercel |
| `feat/SCRUM-1872` | Conventional Commits |
| `feat/SCRUM-1873` | Context API + hooks customizados |
| `feat/SCRUM-1874` | Zero `any` no TypeScript |
