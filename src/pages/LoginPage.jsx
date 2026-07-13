// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: email.split('@')[0],
          total_point: 0,
        })

        if (insertError) {
          setError('프로필 생성 실패: ' + insertError.message)
          setLoading(false)
          return
        }
      }

      alert('회원가입 완료! 로그인 해주세요.')
      setIsSignup(false)
      setLoading(false)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setUser(data.user)
      setLoading(false)
      navigate('/')
    }
  }

  return (
    <div className="page-container center" style={{ paddingTop: '80px' }}>
      <h1 className="auth-title">{isSignup ? '회원가입' : '로그인'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-box"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="input-box"
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
        </button>
      </form>

      <button onClick={() => setIsSignup(!isSignup)} className="switch-btn">
        {isSignup ? '이미 계정이 있어요' : '계정이 없으신가요? 회원가입'}
      </button>
    </div>
  )
}

export default LoginPage