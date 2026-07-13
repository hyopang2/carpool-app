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

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
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

    if (!error && data) setMessages(data)
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

    if (error) alert('메시지 전송 실패: ' + error.message)
  }

  if (!user) {
    return (
      <div className="page-container center">
        <p className="muted">로그인이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="chat-title">채팅</h1>
        <button onClick={() => navigate('/')} className="link-btn muted">
          메인으로
        </button>
      </div>

      <div className="chat-messages">
        {loading ? (
          <p className="muted small">불러오는 중...</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user_id === user.id
            return (
              <div key={msg.id} className={`bubble ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && (
                  <p className="bubble-name">{msg.profiles?.name ?? '알 수 없음'}</p>
                )}
                <p>{msg.content}</p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="input-box"
        />
        <button type="submit" className="send-btn">
          전송
        </button>
      </form>
    </div>
  )
}

export default ChatPage