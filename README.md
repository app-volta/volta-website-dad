# VOLTA — reciclagem industrial inteligente

**Aplicação publicada:** https://volta-website-dad.vercel.app

Plataforma que conecta indústrias (frigoríficos) a cooperativas de
reciclagem: o operador registra um resíduo com foto, uma IA classifica o
material (papelão, plástico, metal ou vidro) e o responsável PGRS acompanha
o relatório, corrige a classificação se necessário, encaminha para a
cooperativa parceira e finaliza a ocorrência.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) para dev server e build
- [React Router v7](https://reactrouter.com/) para navegação
- [Recharts](https://recharts.org/) para os gráficos de barras de Relatórios
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
| `VITE_API_BASE_URL` | Base das chamadas à API. Use `/api`: o proxy repassa à volta-api. |
| `VITE_CHAT_API_BASE_URL` | Base do chatbot. Use `/chat-api` (também por proxy). |
| `VITE_RANKING_API_BASE_URL` | Base da API de ranking (volta-api-redis). Use `/ranking-api` (também por proxy). |
| `VITE_USAR_MOCKS` | `false` liga as APIs; `true` usa os mocks locais. A Vercel usa `false` via `.env.production`; o Docker usa `true` por padrão (sobrescreva com `--build-arg VITE_USAR_MOCKS=false`). |
| `VITE_API_PROXY_TARGET` | Destino do proxy do Vite, só no desenvolvimento. Padrão: a API de QA. |
| `VITE_CHAT_PROXY_TARGET` | Destino do proxy do chatbot, só no desenvolvimento. Padrão: o chatbot de QA. |
| `VITE_RANKING_PROXY_TARGET` | Destino do proxy da API de ranking, só no desenvolvimento. Padrão: o ranking de QA. |
| `VITE_CLOUDINARY_CLOUD_NAME` | Conta do Cloudinary onde ficam as fotos das ocorrências. Não é segredo. |
| `VITE_CLOUDINARY_PRESET_OCORRENCIA` | Configuração de envio (sem assinatura) das fotos: `AI-Analysis`, que guarda em `Ocorrencia/Assets/Images`. Não é segredo. |
| `VITE_CLOUDINARY_API_URL` | Opcional: troca a base do envio (por padrão `https://api.cloudinary.com/v1_1`), útil em testes. |

### Integração com a volta-api

O `.env.example` mantém os mocks para desenvolvimento local. Na Vercel, builds
usam as APIs por padrão; confirme que uma variável do painel não sobrescreve
`VITE_USAR_MOCKS` com `true`. O Docker usa mocks por padrão. Para desenvolvimento
com a API real, crie um `.env.local` (não versionado):

```
VITE_API_BASE_URL=/api
VITE_USAR_MOCKS=false
```

O navegador chama `/api/...` na própria origem. Em desenvolvimento, o Vite
repassa para a API de QA (`vite.config.ts`); na Vercel, o `rewrite` do
`vercel.json` faz o mesmo. Isso evita o CORS, que a API ainda não libera, e o
bloqueio de conteúdo misto (site HTTPS chamando API HTTP).

| Tela | Endpoints |
|------|-----------|
| Login e senha | `POST /auth/login` (devolve `firstLogin`) e `GET /users/me`; esqueci minha senha: `POST /auth/forgot-password`, `POST /auth/verify-code` e `POST /auth/reset-password`; trocar a senha: `PUT /users/me/password` |
| Ocorrências (lista, detalhe) | `GET /incidents`, `GET /incidents/{id}`, `GET /incidents/{id}/ai-report` e, no histórico, `GET /collections` e `GET /collections/{id}/history` (ADMIN ou MANAGER) |
| Registrar | `GET /areas/mine`, `GET /waste-types`, `POST /incidents` (perfis EMPLOYEE e MANAGER; o tipo vai em `wasteTypeIds`) e, para a análise da foto, volta-chatbot `POST /v1/occurrences/predict`. A foto vai ao Cloudinary e a API guarda o endereço em `photoUrl` |
| Aprovar e recusar | `PATCH /incidents/{id}/approve` e `PATCH /incidents/{id}/reject` com `reason`, máximo de 200 caracteres (perfil ADMIN ou MANAGER). Encerrar (`/close`) vem depois da coleta e não é feito pelo painel |
| Assistente VOLTA | volta-chatbot: `POST /v1/sessions` e `POST /v1/chat` (mesmo token da volta-api) |
| Início | números calculados das ocorrências já carregadas; "VOLTA notou" em `GET /v1/occurrences/reports/ai_summary` e a dica do mascote em `GET /v1/occurrences/areas/{id}/predict_capacity` (volta-chatbot) |
| Notificações | montadas das ocorrências (últimos registros, fila, meta do mês) |
| Perfil e Configurações | `PUT /users/me` (nome e cargo); meta mensal em `GET /goals` e `PUT /goals` (ADMIN e MANAGER gravam); cartão da unidade em `GET /companies/me` (ADMIN e MANAGER) e `GET /areas/mine` |
| Relatórios | calculados de `GET /incidents` e `GET /collections`, com `GET /esg/metrics` e `GET /esg/score` (ADMIN ou MANAGER); o gráfico "Ocorrências por setor" conta as próprias ocorrências, sem endpoint extra |
| Cooperativas | `GET /cooperatives` e `POST /cooperatives` (ADMIN), mais `GET /collections` para o volume mensal |
| Equipe | `GET /users`, `POST /users` e `PATCH /users/{id}/role` (ADMIN) |
| Ranking (volta-api-redis) | Relatórios: `GET /api/v1/ranking/{companyId}/position`. Cooperativas: `GET /api/v1/cooperatives/nearby` (distância) e `PUT /api/v1/cooperatives/{id}/location` ao cadastrar (ADMIN). Detalhe da ocorrência: `GET /api/v1/incidents/{id}/cooperative-scores` no cartão "VOLTA recomenda" |

**Registro de ocorrência.** A IA analisa a foto, mas nada é gravado até a pessoa
tocar em "Confirmar e registrar". Antes disso, "Editar dados" deixa corrigir o
tipo, a contaminação e o peso, e o que foi corrigido é o que vai para a API.
O peso aproximado (em kg) tem um campo opcional já na primeira etapa: se a
pessoa informar, esse valor vai para `estimatedQuantity`; se deixar em branco,
vai a estimativa da IA, quando ela existir; sem as duas, vai `null`. O peso
nunca é inventado a partir da foto, e a tela sempre o mostra como aproximado
("≈ 12 kg") e diz de onde ele veio.
Ao registrar, a foto é enviada ao Cloudinary; se o envio falhar, a ocorrência é
registrada sem foto e a tela avisa. Contaminação, peso e foto ficam na
própria ocorrência. A recomendação e o relatório da IA, porém, a volta-api só
devolve se alguém gravar o laudo (`ai_report`), e hoje nada no front consegue
fazer isso: por enquanto eles ficam guardados neste navegador, por usuário, e
outra pessoa ou outro aparelho não os vê.

Quem não tem permissão para um endpoint vê o aviso "Você não tem permissão para
esta ação" na tela (Cooperativas e Equipe exigem ADMIN) ou o dado que dá para
calcular sem ele (Relatórios sem ESG e sem coletas). Para ver tudo, entre com um
usuário ADMIN.

Alguns números não têm endpoint e são calculados no app: o Início e os
Relatórios contam as ocorrências por data de registro (a API não informa a data
da aprovação), o desvio do aterro usa as métricas ESG quando existem e, sem
elas, o que foi aprovado sobre o registrado, e o volume das cooperativas vem do
peso estimado das ocorrências que originaram cada coleta. A API de usuários
devolve as pessoas de todas as empresas; a tela filtra pela empresa de quem
está logado.

O que a volta-api não guarda aparece como "—" ou "Não informada": cidade,
contato, distância, capacidade e licença das cooperativas, setor das pessoas e
confiança da IA. Cadastrar cooperativa pede latitude e longitude e não envia a
licença em PDF; cadastrar pessoa cria a conta na hora, com a senha informada,
porque não há convite por e-mail.

A API de ranking usa o mesmo token e é um complemento: se ela estiver fora do ar
ou sem dados, a tela segue sem o que vem dela. A distância das cooperativas sai
do índice do Redis e, para a cooperativa que ainda não está nele, é calculada
das coordenadas da volta-api. O ponto de partida são as coordenadas da empresa,
que a volta-api só expõe em `GET /incidents/{id}/scoring-context`; sem nenhuma
ocorrência, não há distância. As cooperativas indicadas aparecem só enquanto a
ocorrência espera decisão. Nada disso roda no modo mock.

Ainda sem conexão: avaliação de coleta (`POST /collections/{id}/review`) e
pedido, agendamento e status de coleta (`POST /collections`,
`PATCH /collections/{id}/schedule` e `/status`), que não têm tela no layout, e
o cadastro de pontuação do ranking (`POST /api/v1/ranking/score`).

O que a API ainda não oferece fica só neste navegador (`localStorage`, por
usuário): meta, notificações e insights, em Configurações, e recusar, encaminhar,
observação e reclassificação das ocorrências. A foto do registro vai para a IA
do chatbot, mas não é guardada: a volta-api recebe uma URL, e o upload depende
do armazenamento (S3). Se a IA não confirma o resíduo na foto, o app não cria a
ocorrência e pede outra foto.

Os contratos estão em `src/types/api.ts`; a tradução para os tipos do app, em
`src/services/adaptadores.ts`.

## Estrutura de pastas

```
src/
├─ components/<Nome>/index.tsx     # cada componente na sua pasta
├─ pages/<Nome>/index.tsx          # cada página na sua pasta
├─ pages/<Nome>/<Parte>/index.tsx  # parte que só aquela página usa (modal, tabela), também na sua pasta
├─ services/<recurso>.ts           # ÚNICA camada que chama APIs externas
├─ types/<dominio>.ts              # interfaces por domínio, zero `any`
├─ context/<Nome>/index.tsx        # Contextos + Providers
├─ hooks/use<Nome>.ts              # hooks customizados (data-fetching)
├─ utils/                          # validadores, storage, formatação
└─ App.tsx                         # roteamento + lazy loading
```

Regras estritas:

- **Todo componente fica em pasta própria, com `index.tsx`.** O que várias
  telas usam vai para `src/components/`; o que só uma página usa fica dentro
  da pasta dela, também em pasta própria (por exemplo
  `src/pages/Cooperativas/ModalAdicionar/index.tsx`).
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
| `/perfil` | Dados do usuário logado | Privado |
| `*` | Página 404: dentro do painel para quem está logado (com "Voltar ao início" e "Ver ocorrências") e sozinha, com logo e rodapé, para quem não está | Pública |

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

A branch `main` é publicada em https://volta-website-dad.vercel.app. O build
de produção lê o `.env.production`, que liga as APIs (`VITE_USAR_MOCKS=false`);
por isso o login e as telas dependem do ambiente de QA estar ligado. Para um
deploy só com os mocks (qualquer e-mail e senha com 6 caracteres ou mais
entram), defina `VITE_USAR_MOCKS=true` nas variáveis do projeto na Vercel.

O `vercel.json` já contém o rewrite de SPA (`/(.*)` → `/index.html`) para
que rotas como `/ocorrencias/1234` funcionem em recarga direta. Ao
importar o repo na Vercel, os padrões do Vite (`npm run build` / pasta
`dist`) já funcionam. Para usar a API real, configure em Environment
Variables `VITE_API_BASE_URL=/api` e `VITE_USAR_MOCKS=false`; o `rewrite` de
`/api` no `vercel.json` aponta para a API de QA.

O `vercel.json` também manda os cabeçalhos de segurança: `Content-Security-Policy`
(o navegador só carrega script, imagem e conexão da própria aplicação e do
Cloudinary), `X-Frame-Options: DENY` (o site não abre dentro de outro),
`Permissions-Policy` (só a câmera é liberada), `nosniff` e `Referrer-Policy`. Se
o app passar a usar um serviço externo (outra CDN de imagens, outra API), o
domínio dele precisa entrar no `connect-src` ou no `img-src` da CSP; sem isso o
navegador bloqueia a chamada e o console mostra qual domínio faltou.

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

## Histórico de desenvolvimento

- **Aplicação publicada:** https://volta-website-dad.vercel.app
- **Primeiro commit do projeto:** feito em 15/09/2026 na branch
  [`feat/SCRUM-1934`](https://github.com/app-volta/volta-website-dad/tree/feat/SCRUM-1934)
  (card "Criar base do projeto com vite"). Ela entrou na `develop` pela
  [PR #17](https://github.com/app-volta/volta-website-dad/pull/17) em
  25/09/2026. O repositório já existia desde 27/06/2026, só com o commit
  automático "Initial commit" do GitHub.
- **Histórico completo de commits:**
  [`develop`](https://github.com/app-volta/volta-website-dad/commits/develop).
  A `main` só recebe a junção (squash) da `develop`, por Pull Request com
  aprovação, e por isso tem poucos commits; o dia a dia está na `develop`.
- **Período:** do primeiro commit (15/09/2026) até o fim de outubro de 2026.
  Cada tarefa nasce de um card do Jira (projeto SCRUM), vira uma branch
  `feat|fix|chore/SCRUM-N` e entra na `develop` por Pull Request.
