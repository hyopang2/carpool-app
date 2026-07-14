// src/utils/calculatePoint.js
export function calculateFinalPoint(basePoint, weatherValue) {
  const multiplierMap = {
    normal: 1,
    rain_wind: 1.5,
    warning: 2,
    sos: 5,
  }
  const multiplier = multiplierMap[weatherValue] ?? 1
  return Math.round(basePoint * multiplier)
}