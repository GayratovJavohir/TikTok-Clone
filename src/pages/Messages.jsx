'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Send, Smile } from 'lucide-react'
import '../styles/messages.css'
import Layout from '../components/Layout'

const API_BASE = 'https://tiktok-clone-backend-hb85.onrender.com'
const WS_BASE = 'https://tiktok-clone-backend-hb85.onrender.com'

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
        return null
    }
}

export default function Messages() {
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

    const normalizeRoom = (room) => {
        return {
            id: String(room.id),
            name:
                room.name ||
                room.other_user_name ||
                room.username ||
                room.title ||
                'Unknown User',
            username:
                room.username ||
                room.other_user_username ||
                room.participant_username ||
                '@user',
            avatar:
                room.avatar ||
                room.other_user_avatar ||
                room.profile_photo ||
                '👤',
            timestamp:
                room.last_message_at ||
                room.timestamp ||
                room.updated_at ||
                room.created_at ||
                '',
            isActive: room.is_active ?? false,
            raw: room,
        }
    }

    const normalizeMessage = (msg) => {
        return {
            id: msg.id ?? `temp-${Date.now()}-${Math.random()}`,
            text: msg.text || msg.message || '',
            sender: msg.sender || null,
            sender_username:
                msg.sender?.username ||
                msg.sender_username ||
                msg.username ||
                'User',
            is_me: currentUserId
                ? Number(msg.sender?.id || msg.sender_id) === Number(currentUserId)
                : false,
            created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
            message_type: msg.message_type || 'text',
            shared_post: msg.shared_post || null,
            media_url: msg.media_url || null,
            raw: msg,
        }
    }

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
        }
    }

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        if (Number.isNaN(date.getTime())) return dateString

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
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
            const roomData = Array.isArray(res.data)
                ? res.data
                : res.data.results || []

            const normalizedRooms = roomData.map(normalizeRoom)
            setConversations(normalizedRooms)

            if (normalizedRooms.length > 0) {
                setActiveConversation(String(normalizedRooms[0].id))
            } else {
                setActiveConversation(null)
            }
        } catch (err) {
            console.error('Rooms fetch error:', err)
            setError('Chat roomlarni olishda xatolik yuz berdi')
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
            const messageData = Array.isArray(res.data)
                ? res.data
                : res.data.results || []

            const normalizedMessages = messageData.map(normalizeMessage).reverse()
            setMessages(normalizedMessages)

            console.log('messageData:', messageData)

            setTimeout(() => {
                scrollToBottom()
            }, 100)
        } catch (err) {
            console.error('Messages fetch error:', err)
            setError('Xabarlarni olishda xatolik yuz berdi')
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

        const socketUrl = `${WS_BASE}/ws/chat/${roomId}/?token=${token}`
        const socket = new WebSocket(socketUrl)

        socketRef.current = socket

        socket.onopen = () => {
            console.log('WebSocket connected')
            setSocketConnected(true)
        }

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                console.log('WS incoming:', data)

                // backend format har xil bo‘lishi mumkin
                const payload =
                    data.message ||
                    data.data ||
                    data

                const incomingMessage = normalizeMessage(payload)

                setMessages((prev) => {
                    const exists = prev.some(
                        (msg) => String(msg.id) === String(incomingMessage.id)
                    )
                    if (exists) return prev
                    return [...prev, incomingMessage]
                })

                setTimeout(() => {
                    scrollToBottom()
                }, 50)
            } catch (error) {
                console.error('WS parse error:', error)
            }
        }

        socket.onerror = (error) => {
            console.error('WebSocket error:', error)
            setSocketConnected(false)
        }

        socket.onclose = (event) => {
            console.log('WebSocket disconnected', event)
            setSocketConnected(false)
        }
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

    const activeChat = conversations.find(
        (c) => String(c.id) === String(activeConversation)
    )

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

            const payload = {
                type: 'message',
                text: message.trim(),
                message_type: 'text',
            }

            socket.send(JSON.stringify(payload))
            setMessage('')
        } catch (err) {
            console.error('Send message error:', err)
            setError('Xabar yuborishda xatolik yuz berdi')
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

    return (
        <Layout>
            <div className="messages-container">
                <div className="messages-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                    </div>

                    <div className="conversations-list">
                        {roomsLoading ? (
                            <div className="empty-state">Loading rooms...</div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-state">No conversations yet</div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${String(conv.id) === String(activeConversation)
                                        ? 'active'
                                        : ''
                                        }`}
                                    onClick={() => setActiveConversation(conv.id)}
                                >
                                    <div className="conversation-avatar">
                                        {conv.avatar ? (
                                            typeof conv.avatar === 'string' &&
                                                conv.avatar.startsWith('http') ? (
                                                <img
                                                    src={conv.avatar}
                                                    alt={conv.name}
                                                    className="avatar-img"
                                                />
                                            ) : (
                                                conv.avatar
                                            )
                                        ) : (
                                            '👤'
                                        )}
                                    </div>

                                    <div className="conversation-info">
                                        <div className="conversation-name">{conv.name}</div>
                                        <div className="conversation-username">
                                            {conv.username}
                                        </div>
                                        <div className="conversation-menu">
                                            <span className="menu-icon">⋯</span>
                                        </div>
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
                                    <div className="chat-avatar">
                                        {activeChat.avatar ? (
                                            typeof activeChat.avatar === 'string' &&
                                                activeChat.avatar.startsWith('http') ? (
                                                <img
                                                    src={activeChat.avatar}
                                                    alt={activeChat.name}
                                                    className="avatar-img"
                                                />
                                            ) : (
                                                activeChat.avatar
                                            )
                                        ) : (
                                            '👤'
                                        )}
                                    </div>

                                    <div className="chat-user-info">
                                        <span className="chat-menu">⋯</span>
                                        <span className="chat-username">
                                            {activeChat.username}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: '10px',
                                                fontSize: '12px',
                                                opacity: 0.7,
                                            }}
                                        >
                                            {socketConnected ? '● Online' : '● Connecting...'}
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
                                        <div
                                            key={msg.id}
                                            className={`message-row ${msg.is_me ? 'my-message' : 'other-message'}`}
                                        >
                                            <div className="message-bubble">
                                                <div className="message-sender">
                                                    {msg.sender_username}
                                                </div>

                                                {msg.message_type === 'post' && msg.shared_post ? (
                                                    <div className="shared-post-card">
                                                        <div className="shared-post-media">
                                                            {msg.shared_post.image ? (
                                                                <img
                                                                    src={msg.shared_post.image}
                                                                    alt={msg.shared_post.title || 'shared post'}
                                                                    className="shared-post-image"
                                                                />
                                                            ) : msg.shared_post.video ? (
                                                                <video
                                                                    src={msg.shared_post.video}
                                                                    controls
                                                                    className="shared-post-video"
                                                                />
                                                            ) : null}
                                                        </div>

                                                        <div className="shared-post-body">
                                                            <div className="shared-post-author">
                                                                @{msg.shared_post.author?.username || 'user'}
                                                            </div>

                                                            <div className="shared-post-title">
                                                                {msg.shared_post.caption || msg.shared_post.title || 'Shared post'}
                                                            </div>

                                                            {msg.text ? (
                                                                <div className="shared-post-caption">
                                                                    {msg.text}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ) : msg.message_type === 'image' && msg.media_url ? (
                                                    <div className="media-message-card">
                                                        <img src={msg.media_url} alt="message media" className="chat-media-image" />
                                                        {msg.text ? <div className="message-content">{msg.text}</div> : null}
                                                    </div>
                                                ) : msg.message_type === 'video' && msg.media_url ? (
                                                    <div className="media-message-card">
                                                        <video src={msg.media_url} controls className="chat-media-video" />
                                                        {msg.text ? <div className="message-content">{msg.text}</div> : null}
                                                    </div>
                                                ) : (
                                                    <div className="message-content">
                                                        {msg.text}
                                                    </div>
                                                )}

                                                <div className="message-time">
                                                    {formatTime(msg.created_at)}
                                                </div>
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
                                        <button
                                            className="action-btn"
                                            title="Emoji"
                                            type="button"
                                        >
                                            <Smile size={20} />
                                        </button>

                                        <button
                                            className="action-btn send-btn"
                                            onClick={handleSendMessage}
                                            title="Send"
                                            disabled={sending}
                                            type="button"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="voice-btn"
                                    title="Voice message"
                                    type="button"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                        <path d="M17 16.91c-1.04.49-2.18.75-3.5.91V20h-3v-2.18c-1.32-.16-2.46-.42-3.5-.91l1.42-1.41c.9.43 1.97.68 3.08.68s2.18-.25 3.08-.68l1.42 1.41zM12 20c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">Select a conversation</div>
                    )}
                </div>
            </div>
        </Layout>
    )
}