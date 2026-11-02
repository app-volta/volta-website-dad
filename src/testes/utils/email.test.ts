import { describe, expect, it } from "vitest";

import { linksDeEmail } from "../../utils/email";

describe("linksDeEmail", () => {
  const links = linksDeEmail("contato@reciclavida.com.br");

  it("o aplicativo de e-mail usa o endereço como está", () => {
    expect(links.aplicativo).toBe("mailto:contato@reciclavida.com.br");
  });

  it("Gmail e Outlook abrem a janela de nova mensagem já com o destinatário", () => {
    expect(links.gmail).toBe("https://mail.google.com/mail/?view=cm&fs=1&to=contato%40reciclavida.com.br");
    expect(links.outlook).toBe("https://outlook.office.com/mail/deeplink/compose?to=contato%40reciclavida.com.br");
  });

  it("protege nos links da web os caracteres que quebrariam o endereço (+ e &)", () => {
    const especial = linksDeEmail("coleta+sp&rj@coop.com.br");
    expect(especial.gmail).toContain("to=coleta%2Bsp%26rj%40coop.com.br");
    expect(especial.outlook).toContain("to=coleta%2Bsp%26rj%40coop.com.br");
  });

  it("tira os espaços das pontas antes de montar os links", () => {
    expect(linksDeEmail("  contato@coop.com.br \n").aplicativo).toBe("mailto:contato@coop.com.br");
  });
});
