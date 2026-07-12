// src/constants/missions.js
export const MISSIONS = [
  { id: 1, name: '퇴근길 카풀', basePoint: 100 },
  { id: 2, name: '출근길 카풀', basePoint: 150 },
]

export const WEATHER_OPTIONS = [
  { value: 'normal', label: '맑음/보통', multiplier: 1 },
  { value: 'rain_wind', label: '비/바람', multiplier: 2 },
  { value: 'warning', label: '태풍/폭우 등 특보', multiplier: 3 },
]