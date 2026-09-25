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
  (badges de material, logo do Header, ícone da 404).

### 1.3.1 Informações e relações
- Landmarks: `<header role="banner">`, `<nav aria-label>`, `<main>`,
  `<footer role="contentinfo">` estruturam cada página.
- Listas dinâmicas usam `<ul>`/`<ol>` com `key` do id do dado — nunca
  `key={index}`.
- Formulários agrupam radios com `<fieldset>` + `<legend>`.

### 1.4.3 / 1.4.11 Contraste
Paleta calibrada em `src/index.css`. Combinações verificadas:
- Texto padrão `#10241c` sobre `#f7f8fc` → contraste 15.4:1
- Texto de botão primário `#ffffff` sobre `#063300` → 13.9:1
- Badges pastel (`--papelao-fg` sobre `--papelao-bg`, etc.) mantém no
  mínimo 4.5:1 — cores escolhidas para preservar leitura no fundo pastel.
- Estados de erro/sucesso/info seguem o mesmo cálculo.

## Operável

### 2.1.1 Teclado
- Toda ação é `<button>` semântico. `grep -R "onClick" src` retorna zero
  `<div onClick>` ou `<span onClick>` que ativem lógica.
- `<a>`/`<Link>` para navegação, `<button>` para ação. Nunca
  `window.location.href` — usa `useNavigate`/`<Link>`.

### 2.4.1 Pular blocos
- Skip-link no topo do Header (`Pular para o conteúdo principal`,
  visível apenas ao receber foco). Aponta para `#conteudo`, que é o `<main>`
  do shell privado.

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
- Header: `<nav aria-label="Navegação principal">` com `<ul>` de links.
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
3. **Contraste automático**: rodar Lighthouse ou axe-core na build de
   produção — a meta é score ≥ 95.
