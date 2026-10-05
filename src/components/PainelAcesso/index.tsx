import type { ReactNode } from "react";

import mascoteCompleto from "../../assets/mascote-completo.svg";
import { Icone } from "../Icone";
import { LogoVolta } from "../LogoVolta";
import "./styles.css";

interface PainelAcessoProps {
  readonly titulo: readonly string[];
  readonly texto: string;
  readonly destaques: readonly string[];
}

export function PainelAcesso({
  titulo,
  texto,
  destaques,
}: PainelAcessoProps): ReactNode {
  return (
    <aside className="painel-acesso" aria-hidden="true">
      <svg
        className="painel-acesso__setas"
        viewBox="0 0 834 900"
        width="834"
        height="900"
        fill="none"
      >
        <g opacity="0.1">
          <path
            d="M762.806 99.1681C783.717 129.549 794.603 165.709 793.94 202.585C793.277 239.46 781.099 275.206 759.11 304.816C737.121 334.426 706.423 356.418 671.313 367.713C636.203 379.007 598.441 379.04 563.312 367.805C528.183 356.57 497.447 334.631 475.407 305.058C453.368 275.486 441.128 239.762 440.402 202.887C439.676 166.013 450.501 129.834 471.359 99.4174C492.218 69.0006 522.066 45.8684 556.726 33.2597"
            stroke="white"
            strokeWidth="62.4001"
            strokeLinecap="round"
          />
          <path
            d="M525.507 -22.9766L630.049 5.53757L567.853 94.8794L525.507 -22.9766Z"
            fill="white"
            stroke="white"
            strokeWidth="20.8"
            strokeLinejoin="round"
          />
        </g>
        <g opacity="0.1">
          <path
            d="M149.495 599.534C177.129 731.012 113.852 834.92 11.9254 888.194"
            stroke="white"
            strokeWidth="49.4001"
            strokeLinecap="round"
          />
          <path
            d="M32.8779 929.095L-42.6086 916.131L-9.02691 847.294L32.8779 929.095Z"
            fill="white"
            stroke="white"
            strokeWidth="15.2"
            strokeLinejoin="round"
          />
        </g>
        <g opacity="0.07">
          <path
            d="M311.021 529.648C362.569 467.658 392.708 584.669 455.84 514.567"
            stroke="white"
            strokeWidth="22.0001"
            strokeLinecap="round"
          />
          <path
            d="M439.213 499.45L475.939 492.725L472.468 529.684L439.213 499.45Z"
            fill="white"
            stroke="white"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="painel-acesso__logo">
        <LogoVolta altura={40} variante="clara" />
      </div>

      <div className="painel-acesso__balao">
        <p>Oi! Eu sou o VOLTA.</p>
        <p>Bora deixar a unidade em dia?</p>
      </div>

      <img
        className="painel-acesso__mascote"
        src={mascoteCompleto}
        alt=""
        width={214}
        height={324}
        draggable={false}
      />

      <div className="painel-acesso__copy">
        <span className="painel-acesso__kicker">Painel do gestor</span>
        <h2 className="painel-acesso__titulo">
          {titulo.map((linha) => (
            <span key={linha}>{linha}</span>
          ))}
        </h2>
        <p className="painel-acesso__texto">{texto}</p>
        <ul className="painel-acesso__lista">
          {destaques.map((destaque) => (
            <li key={destaque}>
              <Icone nome="check" tamanho={14} />
              <span>{destaque}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
