// src/pages/HomePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'
import { useChatStore } from '../store/chatStore'
import { MISSIONS, WEATHER_OPTIONS } from '../constants/missions'
import { calculateFinalPoint } from '../utils/calculatePoint'
import { getTodayDateString } from '../utils/dateUtils'
import MissionCard from '../components/mission/MissionCard'
import NoticeBoard from '../components/notice/NoticeBoard'
import RandomTipButton from '../components/tip/RandomTipButton'

function HomePage() {
  const user = useUserStore((state) => state.user)
  const navigate = useNavigate()
  const unreadCount = useChatStore((state) => state.unreadCount)

  const [totalPoint, setTotalPoint] = useState(0)
  const [weather, setWeather] = useState('normal')
  const [completedMissionIds, setCompletedMissionIds] = useState([])
  const [processing, setProcessing] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoadingData(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_point')
      .eq('id', user.id)
      .single()
    if (profile) setTotalPoint(profile.total_point)

    const today = getTodayDateString()
    const { data: logs } = await supabase
      .from('mission_logs')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('mission_date', today)
    if (logs) setCompletedMissionIds(logs.map((log) => log.mission_id))

    setLoadingData(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setNotifPermission(result)
  }

  const handleMissionComplete = async (mission) => {
    setProcessing(true)

    const earnedPoint = calculateFinalPoint(mission.basePoint, weather)
    const today = getTodayDateString()

    const { error: insertError } = await supabase.from('mission_logs').insert({
      user_id: user.id,
      mission_id: mission.id,
      weather_status: weather,
      earned_point: earnedPoint,
      mission_date: today,
    })

    if (insertError) {
      alert(
        insertError.code === '23505'
          ? '이미 오늘 완료한 미션이에요!'
          : '미션 완료 처리 실패: ' + insertError.message
      )
      setProcessing(false)
      return
    }

    const newTotal = totalPoint + earnedPoint
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_point: newTotal })
      .eq('id', user.id)

    if (updateError) {
      alert('포인트 업데이트 실패: ' + updateError.message)
      setProcessing(false)
      return
    }

    setTotalPoint(newTotal)
    setCompletedMissionIds([...completedMissionIds, mission.id])
    setProcessing(false)
  }

  if (!user) {
    return (
      <div className="page-container center">
        <h1>메인 화면</h1>
        <p className="muted mt-4">로그인이 필요합니다</p>
        <button onClick={() => navigate('/login')} className="btn-primary mt-6">
          로그인 페이지로 이동
        </button>
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="page-container center">
        <p className="muted">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="top-bar">
        <p className="muted small">{user.email}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/profile')} className="link-btn">
            프로필
          </button>
          <button onClick={() => navigate('/chat')} className="link-btn">
            채팅{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button onClick={handleLogout} className="link-btn muted">
            로그아웃
          </button>
        </div>
      </div>

      {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
        <button
          onClick={handleRequestNotification}
          className="link-btn mb-4"
          style={{ display: 'block' }}
        >
          🔔 채팅 알림 켜기
        </button>
      )}

      <div className="point-card">
        <p className="muted small">누적 포인트</p>
        <p className="point-value">{totalPoint.toLocaleString()}p</p>
      </div>

      <RandomTipButton totalPoint={totalPoint} onEarn={setTotalPoint} />

      <div className="field-group">
        <label className="muted small block mb-1">오늘 날씨</label>
        <select
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          className="select-box"
        >
          {WEATHER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.multiplier}배)
            </option>
          ))}
        </select>
      </div>

      <NoticeBoard />

      <div className="flex flex-col gap-3 mt-6">
        {MISSIONS.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isCompleted={completedMissionIds.includes(mission.id)}
            onComplete={handleMissionComplete}
            disabled={processing}
          />
        ))}
      </div>
    </div>
  )
}

export default HomePage