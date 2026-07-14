// src/pages/HomePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'
import { MISSIONS, WEATHER_OPTIONS } from '../constants/missions'
import { calculateFinalPoint } from '../utils/calculatePoint'
import MissionCard from '../components/mission/MissionCard'
import NoticeBoard from '../components/notice/NoticeBoard'

function HomePage() {
  const user = useUserStore((state) => state.user)
  const navigate = useNavigate()

  const [totalPoint, setTotalPoint] = useState(0)
  const [weather, setWeather] = useState('normal')
  const [completedMissionIds, setCompletedMissionIds] = useState([])
  const [processing, setProcessing] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoadingData(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_point')
      .eq('id', user.id)
      .single()

    if (profile) {
      setTotalPoint(profile.total_point)
    }

    const today = new Date().toISOString().slice(0, 10)
    const { data: logs } = await supabase
      .from('mission_logs')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('mission_date', today)

    if (logs) {
      setCompletedMissionIds(logs.map((log) => log.mission_id))
    }

    setLoadingData(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleMissionComplete = async (mission) => {
    setProcessing(true)

    const earnedPoint = calculateFinalPoint(mission.basePoint, weather)
    const today = new Date().toISOString().slice(0, 10)

    const { error: insertError } = await supabase.from('mission_logs').insert({
      user_id: user.id,
      mission_id: mission.id,
      weather_status: weather,
      earned_point: earnedPoint,
      mission_date: today,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        alert('이미 오늘 완료한 미션이에요!')
      } else {
        alert('미션 완료 처리 실패: ' + insertError.message)
      }
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
      <div className="max-w-sm mx-auto mt-20 p-6 text-center">
        <h1 className="text-2xl font-bold">같이가U</h1>
        <p className="mt-4">로그인이 필요합니다</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-6 bg-purple-600 text-white rounded px-4 py-2 text-sm"
        >
          로그인 페이지로 이동
        </button>
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6 text-center">
        <p>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">{user.email}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/profile')} className="link-btn">
  프로필
</button>
          <button
            onClick={() => navigate('/chat')}
            className="text-sm text-purple-600 underline"
          >
            채팅
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-400 underline">
            로그아웃
          </button>
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">누적 포인트</p>
        <p className="text-4xl font-bold text-purple-600">{totalPoint}p</p>
      </div>

      <div className="mb-6 text-left">
        <label className="text-sm text-gray-500 block mb-1">할증</label>
        <select
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          {WEATHER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.multiplier}배)
            </option>
          ))}
        </select>
      </div>

<NoticeBoard />

      <div className="flex flex-col gap-3">
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