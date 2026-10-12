# Acessibilidade (WCAG 2.1 AA)

Este documento mapeia, item por item, como o VOLTA atende aos critérios WCAG
2.1 AA e onde cada verificação vive no código. Serve tanto como checklist de
auditoria quanto como referência para revisores de PR.

## Perceptível

### 1.1.1 Conteúdo não textual
- `<img>` sempre com `alt` descritivo. Exemplos:
  [`OcorrenciaCard/index.tsx`](../src/components/OcorrenciaCard/index.tsx),
  [`OcorrenciaDetalhe/index.tsx`](../src/pages/OcorrenciaDetalhe/index.tsx).
- Emoji e ícones puramente decorativos escondidos com `aria-hidden="true"`
  (badges de material, logo da Sidebar, ícone da 404, mascote do cartão de
  ajuda). Botões só com ícone, como o assistente e o sino da barra superior,
  têm `aria-label`.

### 1.3.1 Informações e relações
- Landmarks do shell V2: `<aside aria-label="Navegação principal">` com
  `<nav aria-label="Menu">` (Sidebar), `<header role="banner">` (Topbar) e
  `<main id="conteudo">`. Diálogos e gavetas usam `<div role="dialog">` e não
  declaram `<header>`/`<aside>`, para não virarem um segundo banner nem um
  complementar dentro de outro ponto de referência.
- Hierarquia de títulos: o `h1` é o título da Topbar; cada cartão ou seção da
  página usa `h2` e subseções usam `h3`, sem pular nível.
- Listas dinâmicas usam `<ul>`/`<ol>` com `key` do id do dado — nunca
  `key={index}`.
- Formulários agrupam radios com `<fieldset>` + `<legend>`.

### 1.4.3 / 1.4.11 Contraste
Paleta calibrada em `src/index.css`. Mínimo de 4,5:1 para texto e 3:1 para
componentes e ícones. Combinações verificadas:

| Uso | Cores | Contraste |
|---|---|---|
| Texto padrão | `#12241C` sobre `#F7F8FA` | 15,3:1 |
| Texto auxiliar (`--texto-suave`) | `#5D6961` sobre `#F7F8FA` | 5,4:1 |
| Texto auxiliar em selos cinza | `#5D6961` sobre `#E3E9E5` | 4,7:1 |
| Verde de links (`--verde-medio`) | `#1B7742` sobre `#FFFFFF` | 5,6:1 |
| Botão primário (`--verde-primario`) | `#FFFFFF` sobre `#15874C` | 4,6:1 |
| Fim do gradiente dos botões | `#FFFFFF` sobre `#0E7C48` | 5,3:1 |
| Selo âmbar / vermelho / azul / roxo | `#92660C`, `#CF1C38`, `#0B60EC`, `#7250D9` sobre o tom claro de cada um | 4,6:1 a 4,7:1 |
| Rótulos da Sidebar | `#E6F4EC` com 82% a 84% de opacidade sobre o gradiente verde | 4,5:1 a 6,7:1 |

Os gradientes verdes que carregam texto branco começam em `#15874C`, que já
atinge 4,5:1. Texto sobre gradiente não é medido por ferramentas automáticas;
nesses casos (Sidebar, hero da Home, painel de acesso) o contraste foi
calculado no pior ponto do gradiente.

## Operável

### 2.1.1 Teclado
- Toda ação é `<button>` semântico. `grep -R "onClick" src` retorna zero
  `<div onClick>` ou `<span onClick>` que ativem lógica.
- `<a>`/`<Link>` para navegação, `<button>` para ação. Nunca
  `window.location.href` — usa `useNavigate`/`<Link>`.

### 2.4.1 Pular blocos
- Skip-link no topo da Sidebar (`Pular para o conteúdo principal`, visível
  apenas ao receber foco). Aponta para `#conteudo`, que é o `<main>` do shell
  privado e também da página 404.

### 2.4.3 Ordem de foco
- Modal preserva a ordem natural do DOM e não usa `tabindex` positivo.
- FiltroTabs adota o padrão WAI-ARIA APG: apenas a aba ativa fica no fluxo
  do Tab; setas ←/→ movem entre abas.

### 2.4.7 Foco visível
- `:focus-visible` global no `src/index.css` aplica um `box-shadow` verde.
  Nenhum `outline: none` foi introduzido sem substituição por foco visível
  equivalente.

### 2.5.5 Tamanho do alvo (AAA — mas seguido aqui)
- Botões têm `min-height: 44px` (declarado em
  [`Button/styles.css`](../src/components/Button/styles.css)).
- Campos e abas seguem o mesmo mínimo.

## Compreensível

### 3.3.1 / 3.3.2 Erros e rótulos
- Todo `<input>` tem `<label htmlFor>` associado.
- Mensagens de erro no DOM com `role="alert"` (via componente
  [`Alerta`](../src/components/Alerta/index.tsx) e via `<p role="alert">`
  em [`Input`](../src/components/Input/index.tsx) e
  [`TextArea`](../src/components/TextArea/index.tsx)).
- Ajuda contextual usa `aria-describedby` para vincular ao campo.

### 3.2.4 Identificação consistente
- Componentes reutilizados em todas as páginas (Button, Input, Alerta,
  FiltroTabs, Modal). Mesma variante gera mesmo comportamento.

## Robusto

### 4.1.2 Nome, função, valor
- Modal: `role="dialog"`, `aria-modal`, `aria-labelledby` apontando para o
  título.
- FiltroTabs: `role="tablist"` + `role="tab"` + `aria-selected` + `tabIndex`
  controlado.
- Sidebar: `<nav aria-label="Menu">` com `<ul>` de links; o item atual usa
  `aria-current="page"` (via `NavLink`). Recolhida em 72px, o rótulo some só
  visualmente e continua sendo lido; a contagem de ocorrências vira um ponto
  com o texto "aguardando aprovação" para leitores de tela.
- Interruptor: `<input type="checkbox" role="switch">` nativo dentro de um
  `<label>`, com foco visível no trilho.
- Busca rápida: padrão combobox com `aria-activedescendant`; notificações e
  assistente abrem como `role="dialog"` e devolvem o foco ao botão que abriu.
- Barra de progresso da meta: `role="progressbar"` com `aria-label`.
- Estados dinâmicos comunicados via `role="status"` + `aria-live="polite"`
  (Spinner, SkeletonList, alerta de sucesso) e `role="alert"` para erros.

### 4.1.3 Mensagens de status (AA)
- Toasts/alertas de sucesso após ações (encaminhar, finalizar,
  reclassificar) usam `role="status"`. Erros de envio usam `role="alert"`
  para interrupção imediata.

## Gerenciamento de foco em modais

`useFocoModal` (em [`src/hooks/useFocoModal.ts`](../src/hooks/useFocoModal.ts))
guarda o elemento focado antes de abrir e devolve o foco a ele quando o
modal fecha. Ao abrir, procura o primeiro elemento focável dentro do modal
e move o foco para lá. Tecla ESC dispara o `onFechar`.

## Preferência de movimento reduzido

`@media (prefers-reduced-motion: reduce)` em `src/index.css` desliga
animações e transições — o skeleton "brilho", o spinner, e transições de
botões param de animar para pessoas com sensibilidade a movimento.

## Como validar manualmente

1. **Teclado apenas**: Tab pela home, entre em /registrar, complete o fluxo
   inteiro sem tocar no mouse. Ao chegar em um Modal, ESC fecha; foco volta
   para o botão que abriu.
2. **Leitor de tela**: NVDA (Windows) ou VoiceOver (macOS). Anúncios
   esperados: skip-link no início, contagens dos filtros ("Todas, 4 itens"),
   alertas de erro imediatos, título do modal ao abrir.
3. **Contraste e estrutura automáticos**: axe-core 4.10 nas regras WCAG 2.0 e
   2.1 níveis A e AA mais as boas práticas.

## Última auditoria automatizada

Rodada em 30 telas e estados com axe-core, em 1440px e 390px: início,
registrar, ocorrências (lista e gaveta), detalhe e seus cinco modais,
cooperativas (lista e cadastro), chat, relatórios, equipe (lista, convite e
menu), configurações (visão e edição de perfil), perfil, 404, login, cadastro,
notificações, assistente, busca rápida e as versões de 390px.
Resultado: nenhuma violação. Ficam apenas os itens "para revisar" que a
ferramenta não consegue decidir sozinha (texto sobre gradiente ou imagem),
conferidos manualmente na tabela de contraste acima.
