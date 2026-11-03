/** Número de letras de um texto (para encadear animações em blocos seguidos). */
export const letterCount = (text: string) => [...text.replace(/ /g, "")].length;
