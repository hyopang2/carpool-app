// src/components/mission/MissionCard.jsx
function MissionCard({ mission, isCompleted, onComplete, disabled }) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="text-left">
        <p className="font-semibold">{mission.name}</p>
        <p className="text-sm text-gray-500">기본 {mission.basePoint}p</p>
      </div>

      <button
        onClick={() => onComplete(mission)}
        disabled={isCompleted || disabled}
        className={`px-4 py-2 rounded text-sm ${
          isCompleted
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 text-white'
        }`}
      >
        {isCompleted ? '완료됨' : '미션 클리어'}
      </button>
    </div>
  )
}

export default MissionCard