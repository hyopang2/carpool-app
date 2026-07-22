// src/utils/randomTip.js
const TIP_TABLE = [
  { point: 10, weight: 30 },
  { point: 30, weight: 25 },
  { point: 50, weight: 20 },
  { point: 100, weight: 15 },
  { point: 200, weight: 6 },
  { point: 500, weight: 3 },
  { point: 1000, weight: 1 },
]

export function drawRandomTip() {
  const totalWeight = TIP_TABLE.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of TIP_TABLE) {
    if (random < item.weight) {
      return item.point
    }
    random -= item.weight
  }

  return TIP_TABLE[0].point
}