/** Onde a pessoa pode escrever a mensagem para um e-mail, conforme a caixa de entrada que usa. */
export interface LinksDeEmail {
  /** Abre o programa de e-mail do computador; sem nenhum configurado, o navegador não faz nada visível. */
  readonly aplicativo: string;
  readonly gmail: string;
  /** Outlook na web (contas de trabalho e pessoais): abre a janela de nova mensagem. */
  readonly outlook: string;
}

export function linksDeEmail(email: string): LinksDeEmail {
  const endereco = email.trim();
  const para = encodeURIComponent(endereco);
  return {
    aplicativo: `mailto:${endereco}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${para}`,
    outlook: `https://outlook.office.com/mail/deeplink/compose?to=${para}`,
  };
}
