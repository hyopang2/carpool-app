// src/components/tip/RandomTipButton.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useUserStore } from '../../store/userStore'
import { getTodayDateString } from '../../utils/dateUtils'
import { drawRandomTip } from '../../utils/randomTip'

function RandomTipButton({ totalPoint, onEarn }) {
  const user = useUserStore((state) => state.user)

  const [alreadyUsed, setAlreadyUsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState(null)

  const today = getTodayDateString()

  useEffect(() => {
    if (user) checkUsage()
  }, [user])

  const checkUsage = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('random_tips')
      .select('earned_point')
      .eq('user_id', user.id)
      .eq('tip_date', today)
      .maybeSingle()

    if (data) {
      setAlreadyUsed(true)
      setResult(data.earned_point)
    }
    setLoading(false)
  }

  const handleDraw = async () => {
    setDrawing(true)
    const point = drawRandomTip()

    const { error: insertError } = await supabase.from('random_tips').insert({
      user_id: user.id,
      earned_point: point,
      tip_date: today,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        alert('오늘은 이미 랜덤 팁을 받았어요!')
        setAlreadyUsed(true)
      } else {
        alert('랜덤 팁 처리 실패: ' + insertError.message)
      }
      setDrawing(false)
      return
    }

    const newTotal = totalPoint + point
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_point: newTotal })
      .eq('id', user.id)

    if (updateError) {
      alert('포인트 업데이트 실패: ' + updateError.message)
      setDrawing(false)
      return
    }

    setResult(point)
    setAlreadyUsed(true)
    setDrawing(false)
    onEarn(newTotal)
  }

  if (loading) return null

  return (
    <div className="tip-box">
      {alreadyUsed ? (
        <p className="tip-result">🎉 오늘 획득한 랜덤 팁: {result}p</p>
      ) : (
        <button onClick={handleDraw} disabled={drawing} className="btn-primary w-full">
          {drawing ? '뽑는 중...' : '🎁 랜덤 팁 받기'}
        </button>
      )}
    </div>
  )
}

export default RandomTipButton