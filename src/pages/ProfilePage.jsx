// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'

function ProfilePage() {
  const user = useUserStore((state) => state.user)
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    if (data) setNickname(data.name ?? '')
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const trimmed = nickname.trim()
    if (!trimmed) {
      setError('닉네임을 입력해주세요')
      return
    }
    if (trimmed.length > 12) {
      setError('닉네임은 12자 이내로 입력해주세요')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', user.id)

    if (updateError) {
      setError('저장 실패: ' + updateError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="page-container center">
        <p className="muted">로그인이 필요합니다</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-container center">
        <p className="muted">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="top-bar">
        <h1 className="chat-title">프로필 수정</h1>
        <button onClick={() => navigate('/')} className="link-btn muted">
          메인으로
        </button>
      </div>

      <p className="muted small mb-4">{user.email}</p>

      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="input-box"
          maxLength={12}
        />

        {error && <p className="error-text">{error}</p>}
        {success && (
          <p className="small" style={{ color: 'var(--accent)', textAlign: 'center' }}>
            저장되었습니다!
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}

export default ProfilePage