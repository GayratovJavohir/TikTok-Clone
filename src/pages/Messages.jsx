'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Send, Smile } from 'lucide-react'
import '../styles/messages.css'
import Layout from '../components/Layout'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE = 'http://135.136.181.116'
const WS_BASE = 'ws://135.136.181.116'

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
        return null
    }
}

export default function Messages() {
    const { userId } = useParams()
    const navigate = useNavigate()

    const [conversations, setConversations] = useState([])
    const [activeConversation, setActiveConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [roomsLoading, setRoomsLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [socketConnected, setSocketConnected] = useState(false)

    const chatMessagesRef = useRef(null)
    const socketRef = useRef(null)

    const token = localStorage.getItem('access_token')
    const decoded = parseJwt(token)
    const currentUserId = decoded?.user_id || decoded?.id || null

    const axiosInstance = useMemo(() => {
        return axios.create({
            baseURL: API_BASE,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        })
    }, [token])

    const normalizeRoom = (room) => ({
        id: String(room.id),
        name: room.name || room.other_user_name || room.username || room.title || 'Unknown User',
        username: room.username || room.other_user_username || room.participant_username || '@user',
        avatar: room.avatar || room.other_user_avatar || room.profile_photo || null,
        timestamp: room.last_message_at || room.timestamp || room.updated_at || room.created_at || '',
        isActive: room.is_active ?? false,
        other_user_id: String(room.other_user_id || room.participant_id || ''),
        raw: room,
    })

    const normalizeMessage = (msg) => ({
        id: msg.id ?? `temp-${Date.now()}-${Math.random()}`,
        text: msg.text || msg.message || '',
        sender: msg.sender || null,
        sender_username: msg.sender?.username || msg.sender_username || msg.username || 'User',
        is_me: currentUserId
            ? Number(msg.sender?.id || msg.sender_id) === Number(currentUserId)
            : false,
        created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
        message_type: msg.message_type || 'text',
        shared_post: msg.shared_post || null,
        media_url: msg.media_url || null,
        raw: msg,
    })

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
        }
    }

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        if (Number.isNaN(date.getTime())) return ''
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const createOrOpenRoom = async (targetUserId, roomsList) => {
        const existing = roomsList.find(
            (c) => String(c.other_user_id) === String(targetUserId)
        )
        if (existing) {
            setActiveConversation(existing.id)
            return
        }
        try {
            const res = await axiosInstance.post('/chat/rooms/create/', {
                room_type: 'direct',
                participant_ids: [Number(targetUserId)]
            })
            const newRoom = normalizeRoom(res.data)
            setConversations(prev => {
                const exists = prev.find(c => c.id === newRoom.id)
                if (exists) return prev
                return [newRoom, ...prev]
            })
            setActiveConversation(newRoom.id)
        } catch (err) {
            console.error('Room yaratishda xatolik:', err)
            setError('Foydalanuvchi bilan chat ochishda xatolik')
        }
    }

    const fetchRooms = async () => {
        if (!token) {
            setError('Login qilinmagan')
            setRoomsLoading(false)
            return
        }
        try {
            setRoomsLoading(true)
            setError('')
            const res = await axiosInstance.get('/chat/rooms/')
            const roomData = Array.isArray(res.data) ? res.data : res.data.results || []
            const normalizedRooms = roomData.map(normalizeRoom)
            setConversations(normalizedRooms)

            if (userId) {
                await createOrOpenRoom(userId, normalizedRooms)
            } else if (normalizedRooms.length > 0) {
                setActiveConversation(normalizedRooms[0].id)
            }
        } catch (err) {
            console.error('Rooms fetch error:', err)
            setError('Chat roomlarni olishda xatolik')
        } finally {
            setRoomsLoading(false)
        }
    }

    const fetchMessages = async (roomId) => {
        if (!roomId || !token) return
        try {
            setMessagesLoading(true)
            setError('')
            const res = await axiosInstance.get(`/chat/messages/?room=${roomId}`)
            const messageData = Array.isArray(res.data) ? res.data : res.data.results || []
            const normalizedMessages = messageData.map(normalizeMessage).reverse()
            setMessages(normalizedMessages)
            setTimeout(scrollToBottom, 100)
        } catch (err) {
            console.error('Messages fetch error:', err)
            setError('Xabarlarni olishda xatolik')
            setMessages([])
        } finally {
            setMessagesLoading(false)
        }
    }

    const connectWebSocket = (roomId) => {
        if (!roomId || !token) return
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
        const socket = new WebSocket(`${WS_BASE}/ws/chat/${roomId}/?token=${token}`)
        socketRef.current = socket

        socket.onopen = () => setSocketConnected(true)

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                const payload = data.message || data.data || data
                const incomingMessage = normalizeMessage(payload)
                setMessages((prev) => {
                    const exists = prev.some((msg) => String(msg.id) === String(incomingMessage.id))
                    if (exists) return prev
                    return [...prev, incomingMessage]
                })
                setTimeout(scrollToBottom, 50)
            } catch (err) {
                console.error('WS parse error:', err)
            }
        }

        socket.onerror = () => setSocketConnected(false)
        socket.onclose = () => setSocketConnected(false)
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        if (!activeConversation) return
        fetchMessages(activeConversation)
        connectWebSocket(activeConversation)
        return () => {
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
        }
    }, [activeConversation])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const activeChat = conversations.find((c) => String(c.id) === String(activeConversation))

    const handleSendMessage = async () => {
        if (!message.trim() || !activeConversation || sending) return
        const socket = socketRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setError('WebSocket ulanmagan')
            return
        }
        try {
            setSending(true)
            setError('')
            socket.send(JSON.stringify({
                type: 'message',
                text: message.trim(),
                message_type: 'text',
            }))
            setMessage('')
        } catch (err) {
            console.error('Send message error:', err)
            setError('Xabar yuborishda xatolik')
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const getAvatarSrc = (avatar) => {
        if (!avatar) return null
        if (typeof avatar === 'string' && avatar.startsWith('http')) return avatar
        if (typeof avatar === 'string' && avatar.startsWith('/')) return `${API_BASE}${avatar}`
        return null
    }

    const AvatarCircle = ({ avatar, name, size = 40 }) => {
        const src = getAvatarSrc(avatar)
        const initials = name ? name.charAt(0).toUpperCase() : '?'
        if (src) {
            return <img src={src} alt={name} className="avatar-img" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        }
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-background-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: 'var(--color-text-info)', flexShrink: 0 }}>
                {initials}
            </div>
        )
    }

    return (
        <Layout>
            <div className="messages-container">
                <div className="messages-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                    </div>
                    <div className="conversations-list">
                        {roomsLoading ? (
                            <div className="empty-state">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-state">No conversations yet</div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${String(conv.id) === String(activeConversation) ? 'active' : ''}`}
                                    onClick={() => setActiveConversation(conv.id)}
                                >
                                    <div className="conversation-avatar">
                                        <AvatarCircle avatar={conv.avatar} name={conv.name} size={40} />
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-name">{conv.name}</div>
                                        <div className="conversation-username">{conv.username}</div>
                                    </div>
                                    <div className="conversation-timestamp">
                                        {conv.timestamp ? formatTime(conv.timestamp) : ''}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="messages-main">
                    {activeChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-content">
                                    <AvatarCircle avatar={activeChat.avatar} name={activeChat.name} size={36} />
                                    <div className="chat-user-info">
                                        <span className="chat-username">{activeChat.name}</span>
                                        <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 8 }}>
                                            {socketConnected ? '● Online' : '● Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="chat-error">{error}</div>}

                            <div className="chat-messages" ref={chatMessagesRef}>
                                {messagesLoading ? (
                                    <div className="empty-state">Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-state">No messages yet</div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={`message-row ${msg.is_me ? 'my-message' : 'other-message'}`}>
                                            <div className="message-bubble">
                                                {!msg.is_me && (
                                                    <div className="message-sender">{msg.sender_username}</div>
                                                )}

                                                {msg.message_type === 'post' && msg.shared_post ? (
                                                    <div className="shared-post-card">
                                                        <div className="shared-post-media">
                                                            {msg.shared_post.image ? (
                                                                <img src={msg.shared_post.image} alt={msg.shared_post.title || 'shared post'} className="shared-post-image" />
                                                            ) : msg.shared_post.video ? (
                                                                <video src={msg.shared_post.video} controls className="shared-post-video" />
                                                            ) : null}
                                                        </div>
                                                        <div className="shared-post-body">
                                                            <div className="shared-post-author">@{msg.shared_post.author?.username || 'user'}</div>
                                                            <div className="shared-post-title">{msg.shared_post.caption || msg.shared_post.title || 'Shared post'}</div>
                                                            {msg.text && <div className="shared-post-caption">{msg.text}</div>}
                                                        </div>
                                                    </div>
                                                ) : msg.message_type === 'image' && msg.media_url ? (
                                                    <div className="media-message-card">
                                                        <img src={msg.media_url} alt="media" className="chat-media-image" />
                                                        {msg.text && <div className="message-content">{msg.text}</div>}
                                                    </div>
                                                ) : msg.message_type === 'video' && msg.media_url ? (
                                                    <div className="media-message-card">
                                                        <video src={msg.media_url} controls className="chat-media-video" />
                                                        {msg.text && <div className="message-content">{msg.text}</div>}
                                                    </div>
                                                ) : (
                                                    <div className="message-content">{msg.text}</div>
                                                )}

                                                <div className="message-time">{formatTime(msg.created_at)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="chat-input-container">
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Send a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="message-input"
                                    />
                                    <div className="input-actions">
                                        <button className="action-btn" title="Emoji" type="button">
                                            <Smile size={20} />
                                        </button>
                                        <button className="action-btn send-btn" onClick={handleSendMessage} title="Send" disabled={sending} type="button">
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                                <button className="voice-btn" title="Voice message" type="button">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                        <path d="M17 16.91c-1.04.49-2.18.75-3.5.91V20h-3v-2.18c-1.32-.16-2.46-.42-3.5-.91l1.42-1.41c.9.43 1.97.68 3.08.68s2.18-.25 3.08-.68l1.42 1.41z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            {roomsLoading ? 'Loading...' : 'Select a conversation'}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}