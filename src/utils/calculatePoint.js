// src/utils/calculatePoint.js
export function calculateFinalPoint(basePoint, weatherValue) {
  const multiplierMap = {
    normal: 1,
    rain_wind: 2,
    warning: 3,
  }
  const multiplier = multiplierMap[weatherValue] ?? 1
  return basePoint * multiplier
}