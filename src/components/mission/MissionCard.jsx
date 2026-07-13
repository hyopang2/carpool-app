// src/components/mission/MissionCard.jsx
function MissionCard({ mission, isCompleted, onComplete, disabled }) {
  return (
    <div className="mission-card">
      <div>
        <p className="mission-name">{mission.name}</p>
        <p className="mission-point">기본 {mission.basePoint}p</p>
      </div>

      <button
        onClick={() => onComplete(mission)}
        disabled={isCompleted || disabled}
        className="btn-primary"
      >
        {isCompleted ? '완료됨' : '미션 클리어'}
      </button>
    </div>
  )
}

export default MissionCard