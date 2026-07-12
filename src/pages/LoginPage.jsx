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
      // 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('회원가입 에러:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      // 회원가입 성공 시 profiles 테이블에도 유저 추가
      if (data.user) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: email.split('@')[0],
          total_point: 0,
        })

        if (insertError) {
          console.error('profiles insert 에러:', insertError)
          setError('프로필 생성 실패: ' + insertError.message)
          setLoading(false)
          return
        }
      }

      alert('회원가입 완료! 로그인 해주세요.')
      setIsSignup(false)
      setLoading(false)
    } else {
      // 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('로그인 에러:', error)
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
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isSignup ? '회원가입' : '로그인'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border rounded px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white rounded py-2 mt-2 disabled:opacity-50"
        >
          {loading ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
        </button>
      </form>

      <button
        onClick={() => setIsSignup(!isSignup)}
        className="text-sm text-gray-500 mt-4 underline w-full text-center"
      >
        {isSignup ? '이미 계정이 있어요' : '계정이 없으신가요? 회원가입'}
      </button>
    </div>
  )
}

export default LoginPage