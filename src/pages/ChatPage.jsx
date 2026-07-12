// src/pages/ChatPage.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/userStore'
import { useChatStore } from '../store/chatStore'

function ChatPage() {
  const user = useUserStore((state) => state.user)
  const navigate = useNavigate()
  const messages = useChatStore((state) => state.messages)
  const setMessages = useChatStore((state) => state.setMessages)
  const addMessage = useChatStore((state) => state.addMessage)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) return

    loadMessages()

    // 실시간 구독
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // 새 메시지의 보낸 사람 이름도 같이 조회
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single()

          addMessage({
            ...payload.new,
            profiles: { name: profile?.name ?? '알 수 없음' },
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, user_id, created_at, profiles(name)')
      .order('created_at', { ascending: true })
      .limit(50)

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const content = input
    setInput('')

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      content,
    })

    if (error) {
      alert('메시지 전송 실패: ' + error.message)
    }
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6 text-center">
        <p>로그인이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-8 p-6 flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">채팅</h1>
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 underline">
          메인으로
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border rounded p-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user_id === user.id
            return (
              <div
                key={msg.id}
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm text-left ${
                  isMine
                    ? 'bg-purple-600 text-white self-end'
                    : 'bg-gray-100 text-gray-800 self-start'
                }`}
              >
                {!isMine && (
                  <p className="text-xs text-gray-400 mb-1">
                    {msg.profiles?.name ?? '알 수 없음'}
                  </p>
                )}
                <p>{msg.content}</p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white rounded px-4 py-2 text-sm"
        >
          전송
        </button>
      </form>
    </div>
  )
}

export default ChatPage