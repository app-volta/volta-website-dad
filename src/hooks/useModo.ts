import { USAR_MOCKS } from "../services/http";

/**
 * Os dados vêm da volta-api (e não do protótipo local)? Telas usam isto para
 * pedir o que a API exige a mais (coordenadas da cooperativa, senha da pessoa
 * cadastrada) e esconder o que ela não tem.
 */
export function useDadosReais(): boolean {
  return !USAR_MOCKS;
}
