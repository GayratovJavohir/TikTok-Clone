"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"

export default function TikTokFeed({
    post,
    liked,
    bookmarked,
    reposted,
    repostsCount,
    onLike,
    onBookmark,
    onRepost,
    onProfileClick,
    onComment,
    conversations = [],
    onShareToChat,
    sharing = false,
}) {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [isPlaying, setIsPlaying] = useState(true)
    const [showShareModal, setShowShareModal] = useState(false)
    const [chatSearch, setChatSearch] = useState("")
    const videoRef = useRef(null)

    const author = post?.author || {}

    useEffect(() => {
        setIsVideoLoaded(false)
        setHasError(false)
        setIsMuted(true)
        setIsPlaying(true)
    }, [post?.id])

    useEffect(() => {
        if (videoRef.current && post?.video) {
            videoRef.current.load()
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false)
                })
            }
        }
    }, [post?.id, post?.video])

    const username = (post?.author?.username || "user").toLowerCase().replace(/\s+/g, "")

    const filteredConversations = useMemo(() => {
        const q = chatSearch.trim().toLowerCase()
        if (!q) return conversations

        return conversations.filter((conv) => {
            const name = (conv.name || "").toLowerCase()
            const username = (conv.username || "").toLowerCase()
            return name.includes(q) || username.includes(q)
        })
    }, [chatSearch, conversations])

    if (!post) return null

    const handleVideoLoad = () => {
        setIsVideoLoaded(true)
    }

    const handleMediaError = () => {
        setHasError(true)
    }

    console.log("showShareModal:", showShareModal)
    console.log("conversations:", conversations)
    const handleVideoClick = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play()
                setIsPlaying(true)
            } else {
                videoRef.current.pause()
                setIsPlaying(false)
            }
        }
    }

    const toggleMute = (e) => {
        e.stopPropagation()
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted
            setIsMuted(!isMuted)
        }
    }

    const openShareModal = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("share clicked")
        setShowShareModal(true)
    }
    const closeShareModal = () => {
        setShowShareModal(false)
        setChatSearch("")
    }

    const handleShareToRoom = async (roomId) => {
        if (!onShareToChat) return
        await onShareToChat(post, roomId)
        closeShareModal()
    }

    return (
        <>
            <div className="tiktok-feed">
                <div className="video-container">
                    {post.video && (
                        <button
                            className="mute-button"
                            onClick={toggleMute}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 5L6 9H2v6h4l5 4V5zM19 9l-6 6M13 9l6 6" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M18.36 5.64a10 10 0 0 1 0 14.14" />
                                </svg>
                            )}
                        </button>
                    )}

                    <div className="video-content" onClick={handleVideoClick}>
                        {hasError ? (
                            <div className="error-media">
                                <div className="error-icon">❌</div>
                                <p>Media failed to load</p>
                            </div>
                        ) : (
                            <>
                                {post.image && (
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="media-content"
                                        onLoad={handleVideoLoad}
                                        onError={handleMediaError}
                                    />
                                )}
                                {post.video && (
                                    <div className="video-wrapper">
                                        <video
                                            ref={videoRef}
                                            src={post.video}
                                            className="media-content"
                                            onLoadedData={handleVideoLoad}
                                            onError={handleMediaError}
                                            playsInline
                                            loop
                                            muted={isMuted}
                                        />
                                        {!isPlaying && (
                                            <div className="play-overlay">
                                                <div className="play-icon">
                                                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                                        <circle cx="30" cy="30" r="30" fill="rgba(0,0,0,0.5)" />
                                                        <path d="M25 20L40 30L25 40V20Z" fill="white" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!post.image && !post.video && (
                                    <div className="no-media">
                                        <div className="no-media-icon">📁</div>
                                        <p>No media available</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bottom-overlay">
                        <div className="user-info">
                            <div className="user-details">
                                {post.reposted_by_followers && (
                                    <div className="repost-info">
                                        🔁 @{post.reposted_by_followers.username} reposted
                                    </div>
                                )}
                                <div className="user-detail-container">
                                    <div className="user-avatar-container">
                                        <img
                                            src={post.author.avatar || `https://i.pravatar.cc/150?img=${(post.author.id % 10) + 1}`}
                                            alt={username}
                                            className="user-avatar"
                                            style={{ cursor: 'pointer' }}
                                            onClick={onProfileClick}
                                        />
                                        <button className="follow-btn-small">+</button>
                                    </div>
                                    <span
                                        className="username"
                                        style={{ cursor: "pointer" }}
                                        onClick={onProfileClick}
                                    >
                                        @{username}
                                    </span>
                                </div>
                                <p className="caption">{post.caption || post.title}</p>
                                <div className="tags">
                                    <span className="tag">#pov</span>
                                    <span className="tag">#tiktok</span>
                                    <span className="tag">#fyp</span>
                                </div>
                            </div>
                        </div>
                        <div className="sound-info">
                            <div className="sound-avatar">
                                <img
                                    src={post.author.avatar || "https://i.pravatar.cc/150"}
                                    alt="Sound"
                                />
                            </div>
                            <span className="sound-text">Original sound</span>
                        </div>
                    </div>

                    <div className="engagement-buttons">
                        <div className="engagement-group">
                            <div className="profile-mini">
                                <img
                                    style={{ cursor: "pointer" }}
                                    src={post.author.avatar || `https://i.pravatar.cc/150?img=${(post.author.id % 10) + 1}`}
                                    alt="Profile"
                                    className="profile-mini-img"
                                    onClick={onProfileClick}
                                />
                                <button className="follow-mini">+</button>
                            </div>

                            <div className="engagement-item">
                                <button
                                    className={`engagement-btn ${liked ? 'liked' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onLike()
                                    }}
                                    aria-label={liked ? "Unlike" : "Like"}
                                >
                                    {liked ? (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    )}
                                </button>
                                <span className="engagement-count">{post.likes > 1000 ? (post.likes / 1000).toFixed(1) + 'K' : post.likes}</span>
                            </div>

                            <div className="engagement-item">
                                <button
                                    className="engagement-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onComment()
                                    }}
                                    aria-label="Comment"
                                >
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                </button>

                                <span className="engagement-count">
                                    {post.comments_count > 1000
                                        ? (post.comments_count / 1000).toFixed(1) + "K"
                                        : post.comments_count}
                                </span>
                            </div>

                            <div className="engagement-item">
                                <button
                                    className={`engagement-btn ${bookmarked ? 'bookmarked' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onBookmark()
                                    }}
                                    aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
                                >
                                    {bookmarked ? (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                        </svg>
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                        </svg>
                                    )}
                                </button>
                                <span className="engagement-count">{post.bookmarks_count > 1000 ? (post.bookmarks_count / 1000).toFixed(1) + 'K' : post.bookmarks_count}</span>
                            </div>

                            <div className="engagement-item">
                                <button
                                    className="engagement-btn"
                                    onClick={openShareModal}
                                    aria-label="Share"
                                >
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                                    </svg>
                                </button>
                                <span className="engagement-count">{post.shares > 1000 ? (post.shares / 1000).toFixed(1) + 'K' : post.shares}</span>
                            </div>

                            <button
                                onClick={onRepost}
                                className="action-btn"
                                style={{ color: reposted ? "#00ff88" : "#fff" }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 1l4 4-4 4" />
                                    <path d="M3 11V9a4 4 0 014-4h14" />
                                    <path d="M7 23l-4-4 4-4" />
                                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                                </svg>
                                <span>{repostsCount}</span>
                            </button>

                            <div className="engagement-item music-item">
                                <div className="music-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showShareModal &&
                createPortal(
                    <div className="share-modal-overlay" onClick={closeShareModal}>
                        <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="share-modal-header">
                                <h3>Send to</h3>
                                <button
                                    type="button"
                                    className="share-close-btn"
                                    onClick={closeShareModal}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="share-post-preview">
                                <div className="share-post-thumb">
                                    {post.image ? (
                                        <img src={post.image} alt={post.title || "post"} />
                                    ) : post.video ? (
                                        <video src={post.video} muted />
                                    ) : (
                                        <div className="share-post-fallback">Post</div>
                                    )}
                                </div>

                                <div className="share-post-meta">
                                    <div className="share-post-user">@{username}</div>
                                    <div className="share-post-caption">
                                        {post.caption || post.title || "No caption"}
                                    </div>
                                </div>
                            </div>

                            <input
                                type="text"
                                className="share-search-input"
                                placeholder="Search chats..."
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                            />

                            <div className="share-chat-list">
                                {filteredConversations.length === 0 ? (
                                    <div className="share-empty">No chats found</div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <button
                                            type="button"
                                            key={conv.id}
                                            className="share-chat-item"
                                            onClick={() => handleShareToRoom(conv.id)}
                                            disabled={sharing}
                                        >
                                            <div className="share-chat-avatar">
                                                {typeof conv.avatar === "string" && conv.avatar ? (
                                                    <img src={conv.avatar} alt={conv.name} />
                                                ) : (
                                                    "👤"
                                                )}
                                            </div>

                                            <div className="share-chat-info">
                                                <div className="share-chat-name">{conv.name}</div>
                                                <div className="share-chat-username">{conv.username}</div>
                                            </div>

                                            <div className="share-chat-action">
                                                {sharing ? "Sending..." : "Send"}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    )
}