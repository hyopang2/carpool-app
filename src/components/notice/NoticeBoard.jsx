// src/components/notice/NoticeBoard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useUserStore } from '../../store/userStore'

function NoticeBoard() {
  const user = useUserStore((state) => state.user)

  const [myNotice, setMyNotice] = useState('')
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadNotices()
  }, [user])

  const today = new Date().toISOString().slice(0, 10)

  const loadNotices = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('notices')
      .select('id, user_id, content, created_at, profiles(name)')
      .eq('notice_date', today)
      .order('created_at', { ascending: false })

    if (data) {
      setNotices(data)
      const mine = data.find((n) => n.user_id === user.id)
      if (mine) setMyNotice(mine.content)
    }

    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!myNotice.trim()) return

    setSaving(true)

    const { error } = await supabase.from('notices').upsert(
      {
        user_id: user.id,
        content: myNotice.trim(),
        notice_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,notice_date' }
    )

    if (error) {
      alert('공지 저장 실패: ' + error.message)
      setSaving(false)
      return
    }

    await loadNotices()
    setSaving(false)
  }

  return (
    <div className="notice-board">
      <p className="muted small block mb-1">오늘의 공지</p>

      <form onSubmit={handleSave} className="flex gap-2 mb-3">
        <input
          type="text"
          value={myNotice}
          onChange={(e) => setMyNotice(e.target.value)}
          placeholder="예: 오늘 퇴근 하차 지점: 마트 근처"
          className="input-box"
          maxLength={60}
        />
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? '저장 중...' : '등록'}
        </button>
      </form>

      {loading ? (
        <p className="muted small">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <p className="muted small">오늘 등록된 공지가 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notices.map((notice) => (
            <div key={notice.id} className="notice-item">
              <span className="notice-name">{notice.profiles?.name ?? '알 수 없음'}</span>
              <span className="notice-content">{notice.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NoticeBoard