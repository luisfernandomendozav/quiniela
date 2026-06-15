// Reglas de puntuación de la quiniela:
//  - Resultado exacto (marcador idéntico): 2 puntos
//  - Acertar el ganador / empate (1X2) pero no el marcador: 1 punto
//  - Fallar: 0 puntos
export function computePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): number {
  if (predHome === realHome && predAway === realAway) return 2;
  const predSign = Math.sign(predHome - predAway);
  const realSign = Math.sign(realHome - realAway);
  if (predSign === realSign) return 1;
  return 0;
}
