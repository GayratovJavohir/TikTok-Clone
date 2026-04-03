"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import TikTokFeed from "../components/TikTokFeed"
import "../styles/pages.css"
import { useNavigate } from "react-router-dom"
import { useDoubleTap } from "use-double-tap"

const API = "https://fiscal-convert-tension-electronics.trycloudflare.com"

export default function Home() {
    const navigate = useNavigate()
    const myId = Number(localStorage.getItem("my_user_id"))
    const myUsername = localStorage.getItem("my_username") || "You"

    // POSTS
    const [posts, setPosts] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isAnimating, setIsAnimating] = useState(false)

    // STORIES
    const [stories, setStories] = useState([])
    const [storiesLoading, setStoriesLoading] = useState(true)
    const [showStoryViewer, setShowStoryViewer] = useState(false)
    const [storyGroups, setStoryGroups] = useState([]) // grouped by author
    const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState(0)
    const [activeStoryIndex, setActiveStoryIndex] = useState(0)
    const storyTimerRef = useRef(null)
    const progressTimerRef = useRef(null)
    const [storyProgress, setStoryProgress] = useState(0) // 0..100

    // COMMENTS
    const containerRef = useRef(null)
    const touchStartY = useRef(0)
    const lastScrollTime = useRef(0)

    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState("")
    const [expandedComments, setExpandedComments] = useState(new Set())
    const [replyingToReplyId, setReplyingToReplyId] = useState(null)

    const currentPost = posts[currentIndex]


    const [conversations, setConversations] = useState([])
    const [sharingPostId, setSharingPostId] = useState(null)

    const handleShareToChat = async (post, roomId) => {
        try {
            setSharingPostId(post.id)

            const token = localStorage.getItem("access_token")

            await axios.post(
                "https://fiscal-convert-tension-electronics.trycloudflare.com/chat/messages/",
                {
                    room: Number(roomId),
                    text: post.caption || post.title || "Shared post",
                    message_type: "post",
                    shared_post_id: post.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            localStorage.setItem("last_shared_room_id", String(roomId))
            alert("Post sent successfully")
        } catch (error) {
            console.error("Share to chat error:", error)
            console.error("Backend response:", error.response?.data)
        } finally {
            setSharingPostId(null)
        }
    }

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = localStorage.getItem("access_token")
                if (!token) return

                const res = await axios.get(`${API}/chat/rooms/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const roomData = Array.isArray(res.data) ? res.data : res.data.results || []

                const normalizedRooms = roomData.map((room) => ({
                    id: String(room.id),
                    name:
                        room.name ||
                        room.other_user_name ||
                        room.username ||
                        room.title ||
                        "Unknown User",
                    username:
                        room.username ||
                        room.other_user_username ||
                        room.participant_username ||
                        "@user",
                    avatar:
                        room.avatar ||
                        room.other_user_avatar ||
                        room.profile_photo ||
                        "",
                }))

                setConversations(normalizedRooms)
            } catch (err) {
                console.error("Rooms fetch error:", err)
            }
        }

        fetchConversations()
    }, [])

    const bind = useDoubleTap(() => {
        if (currentPost) toggleLike(currentPost.id)
    })

    // ----------------------- HELPERS -----------------------
    const authHeaders = () => {
        const token = localStorage.getItem("access_token")
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    const mediaUrl = (path) => {
        if (!path) return null
        // agar backend full url qaytarsa ham ishlaydi
        if (path.startsWith("http")) return path
        return `${API}${path}`
    }

    const groupStoriesByAuthor = (storyList) => {
        const map = new Map()
        for (const s of storyList) {
            const author = s.author_obj || s.author_detail || s.author_user || s.author || null
            // s.author serializerda StringRelatedField bo'lsa string bo'ladi -> fallback
            const authorId = author?.id ?? s.author_id ?? s.author?.id ?? s.authorId ?? s.author_pk ?? s.author_user_id ?? null

            const authorName =
                author?.username ||
                author?.first_name ||
                (typeof s.author === "string" ? s.author : null) ||
                "User"

            const avatar = author?.avatar ? mediaUrl(author.avatar) : null

            const key = authorId ?? authorName

            if (!map.has(key)) {
                map.set(key, {
                    author: {
                        id: authorId,
                        username: authorName,
                        avatar,
                    },
                    items: [],
                    latestCreatedAt: s.created_at,
                })
            }

            map.get(key).items.push({
                id: s.id,
                image: s.image ? mediaUrl(s.image) : null,
                video: s.video ? mediaUrl(s.video) : null,
                created_at: s.created_at,
                expires_at: s.expires_at,
            })

            // latest for sorting groups
            if (new Date(s.created_at) > new Date(map.get(key).latestCreatedAt)) {
                map.get(key).latestCreatedAt = s.created_at
            }
        }

        // sort items inside group by created_at asc (story flow)
        const groups = Array.from(map.values()).map((g) => ({
            ...g,
            items: g.items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        }))

        // sort groups by latestCreatedAt desc (fresh first)
        groups.sort((a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt))
        return groups
    }

    // ----------------------- FETCH -----------------------
    useEffect(() => {
        fetchPosts()
        fetchStories()
    }, [])

    const fetchStories = async () => {
        try {
            setStoriesLoading(true)
            const res = await axios.get(`${API}/posts/stories/`, { headers: authHeaders() })
            const data = res.data?.results || res.data || []
            setStories(data)

            const groups = groupStoriesByAuthor(data)
            setStoryGroups(groups)
            console.log("STORY GROUPS:", groups)
        } catch (err) {
            console.error("FETCH STORIES ERROR:", err)
            setStories([])
            setStoryGroups([])
        } finally {
            setStoriesLoading(false)
        }
    }

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${API}/posts/posts/`, { headers: authHeaders() })
            const data = res.data?.results || res.data || []

            const formatted = data.map((post) => ({
                id: post.id,
                title: post.title,
                caption: post.caption,
                image: post.image,
                video: post.video,
                author: {
                    id: post.author?.id,
                    username: `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() || "User",
                    avatar: post.author?.avatar ? `${API}${post.author.avatar}` : null,
                },
                likes: post.likes_count,
                isLiked: post.is_liked,
                isSaved: post.is_saved,
                isReposted: post.is_reposted,
                reposts_count: post.reposts_count,
                comments_count: post.comments_count,
                bookmarks_count: post.bookmarks_count,
                reposted_by_followers: post.reposted_by_followers,
                shares: 0,
            }))

            setPosts(formatted)
            setCurrentIndex(0)
            setError(null)
        } catch (err) {
            console.error("FETCH POSTS ERROR:", err)
            setError(err.response?.data || "Backend error")
        } finally {
            setLoading(false)
        }
    }

    // ----------------------- NAV POSTS -----------------------
    const nextPost = useCallback(() => {
        if (isAnimating || currentIndex >= posts.length - 1) return
        setIsAnimating(true)
        setDirection("up")
        setTimeout(() => {
            setCurrentIndex((i) => i + 1)
            setDirection(null)
            setIsAnimating(false)
        }, 400)
    }, [isAnimating, currentIndex, posts.length])

    const prevPost = useCallback(() => {
        if (isAnimating || currentIndex <= 0) return
        setIsAnimating(true)
        setDirection("down")
        setTimeout(() => {
            setCurrentIndex((i) => i - 1)
            setDirection(null)
            setIsAnimating(false)
        }, 400)
    }, [isAnimating, currentIndex])

    useEffect(() => {
        const handleWheel = (e) => {
            if (isAnimating) return
            e.preventDefault()

            const now = Date.now()
            if (now - lastScrollTime.current < 400) return
            lastScrollTime.current = now

            if (e.deltaY > 10) nextPost()
            else if (e.deltaY < -10) prevPost()
        }

        const container = containerRef.current
        if (container) container.addEventListener("wheel", handleWheel, { passive: false })
        return () => {
            if (container) container.removeEventListener("wheel", handleWheel)
        }
    }, [isAnimating, nextPost, prevPost])

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
        if (isAnimating) return
        const touchEndY = e.changedTouches[0].clientY
        const diff = touchStartY.current - touchEndY
        if (Math.abs(diff) < 50) return
        if (diff > 0) nextPost()
        else prevPost()
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isAnimating) return
            if (e.key === "ArrowUp") {
                e.preventDefault()
                prevPost()
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                nextPost()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isAnimating, nextPost, prevPost])

    // ----------------------- PROFILE NAV -----------------------
    const goToProfile = (authorId) => {
        if (authorId === myId) navigate("/profile")
        else navigate(`/profile/${authorId}`)
    }

    // ----------------------- LIKE/SAVE/REPOST -----------------------
    const toggleLike = async (postId) => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                    : p
            )
        )

        try {
            const res = await axios.post(`${API}/posts/posts/${postId}/like_toggle/`, {}, { headers: authHeaders() })
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, isLiked: res.data.liked, likes: res.data.likes_count } : p))
            )
        } catch (err) {
            console.error("LIKE ERROR:", err)
        }
    }

    const toggleSave = async (postId) => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? {
                        ...p,
                        isSaved: !p.isSaved,
                        bookmarks_count: p.isSaved ? p.bookmarks_count - 1 : p.bookmarks_count + 1,
                    }
                    : p
            )
        )

        try {
            const res = await axios.post(`${API}/posts/posts/${postId}/save_toggle/`, {}, { headers: authHeaders() })
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? { ...p, isSaved: res.data.bookmarked, bookmarks_count: res.data.bookmarks_count }
                        : p
                )
            )
        } catch (err) {
            console.error("SAVE ERROR:", err)
        }
    }

    const toggleRepost = async (postId) => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? {
                        ...p,
                        isReposted: !p.isReposted,
                        reposts_count: p.isReposted ? p.reposts_count - 1 : p.reposts_count + 1,
                    }
                    : p
            )
        )

        try {
            const res = await axios.post(`${API}/posts/posts/${postId}/repost_toggle/`, {}, { headers: authHeaders() })
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, isReposted: res.data.reposted, reposts_count: res.data.reposts_count } : p
                )
            )
        } catch (err) {
            console.error("REPOST ERROR:", err)
        }
    }


    const toggleCommentLike = async (commentId) => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        // optimistic
        setComments(prev =>
            prev.map(c =>
                c.id === commentId
                    ? {
                        ...c,
                        liked_by_me: !c.liked_by_me,
                        likes_count: c.liked_by_me ? c.likes_count - 1 : c.likes_count + 1
                    }
                    : c
            )
        )

        try {
            const res = await axios.post(
                `${API}/posts/comments/${commentId}/like_toggle/`,
                {},
                { headers: authHeaders() }
            )

            setComments(prev =>
                prev.map(c =>
                    c.id === commentId
                        ? {
                            ...c,
                            liked_by_me: res.data.liked_by_me ?? c.liked_by_me,
                            likes_count: res.data.likes_count ?? c.likes_count
                        }
                        : c
                )
            )
        } catch (err) {
            console.error("COMMENT LIKE ERROR:", err)

            // rollback
            setComments(prev =>
                prev.map(c =>
                    c.id === commentId
                        ? {
                            ...c,
                            liked_by_me: !c.liked_by_me,
                            likes_count: c.liked_by_me ? c.likes_count - 1 : c.likes_count + 1
                        }
                        : c
                )
            )
        }
    }

    const toggleReplyLike = async (commentId, replyId) => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        // optimistic
        setComments(prev =>
            prev.map(comment => {
                if (comment.id !== commentId) return comment
                return {
                    ...comment,
                    reply_comments: (comment.reply_comments || []).map(reply =>
                        reply.id === replyId
                            ? {
                                ...reply,
                                liked_by_me: !reply.liked_by_me,
                                likes_count: reply.liked_by_me ? reply.likes_count - 1 : reply.likes_count + 1
                            }
                            : reply
                    )
                }
            })
        )

        try {
            const res = await axios.post(
                `${API}/posts/reply_comments/${replyId}/like_toggle/`,
                {},
                { headers: authHeaders() }
            )

            setComments(prev =>
                prev.map(comment => {
                    if (comment.id !== commentId) return comment
                    return {
                        ...comment,
                        reply_comments: (comment.reply_comments || []).map(reply =>
                            reply.id === replyId
                                ? {
                                    ...reply,
                                    liked_by_me: res.data.liked_by_me ?? reply.liked_by_me,
                                    likes_count: res.data.likes_count ?? reply.likes_count
                                }
                                : reply
                        )
                    }
                })
            )
        } catch (err) {
            console.error("REPLY LIKE ERROR:", err)

            // rollback
            setComments(prev =>
                prev.map(comment => {
                    if (comment.id !== commentId) return comment
                    return {
                        ...comment,
                        reply_comments: (comment.reply_comments || []).map(reply =>
                            reply.id === replyId
                                ? {
                                    ...reply,
                                    liked_by_me: !reply.liked_by_me,
                                    likes_count: reply.liked_by_me ? reply.likes_count - 1 : reply.likes_count + 1
                                }
                                : reply
                        )
                    }
                })
            )
        }
    }

    // ----------------------- COMMENTS -----------------------
    const openComments = async (postId) => {
        setShowComments(true)

        try {
            const res = await axios.get(`${API}/posts/comments/?post=${postId}`, { headers: authHeaders() })

            let formattedComments = (res.data.results || []).map((c) => ({
                ...c,
                liked_by_me: c.liked_by_me ?? false,
                likes_count: c.likes_count ?? 0,
                reply_comments: (c.reply_comments || [])
                    .map((r) => ({
                        ...r,
                        liked_by_me: r.liked_by_me ?? false,
                        likes_count: r.likes_count ?? 0,
                    }))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
            }))

            formattedComments = formattedComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setComments(formattedComments)
        } catch (err) {
            console.error("COMMENTS FETCH ERROR", err)
            setComments([])
        }
    }

    const sendComment = async () => {
        if (!commentText.trim()) return
        const token = localStorage.getItem("access_token")
        if (!token) return

        const fake = {
            id: Date.now(),
            text: commentText,
            user: { id: myId, username: myUsername },
            liked_by_me: false,
            likes_count: 0,
            reply_comments: [],
            created_at: new Date().toISOString(),
            optimistic: true,
        }

        setComments((prev) => [...prev, fake].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        setCommentText("")

        try {
            const res = await axios.post(
                `${API}/posts/comments/`,
                { post_id: currentPost.id, text: fake.text },
                { headers: authHeaders() }
            )

            setComments((prev) =>
                prev
                    .map((c) =>
                        c.id === fake.id
                            ? {
                                ...res.data,
                                liked_by_me: res.data.liked_by_me ?? false,
                                likes_count: res.data.likes_count ?? 0,
                                reply_comments: res.data.reply_comments || [],
                            }
                            : c
                    )
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            )
        } catch (err) {
            console.error("SEND COMMENT ERROR", err)
            setComments((prev) => prev.filter((c) => c.id !== fake.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        }
    }

    const sendReply = async (commentId, mentionedUsername = null) => {
        if (!replyText.trim()) return
        const token = localStorage.getItem("access_token")
        if (!token) return

        const textWithMention = mentionedUsername ? `@${mentionedUsername} ${replyText}` : replyText

        const fakeReply = {
            id: Date.now(),
            text: textWithMention,
            user: { id: myId, username: myUsername },
            liked_by_me: false,
            likes_count: 0,
            created_at: new Date().toISOString(),
            optimistic: true,
        }

        setComments((prev) =>
            prev.map((comment) => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        reply_comments: [...(comment.reply_comments || []), fakeReply].sort(
                            (a, b) => new Date(b.created_at) - new Date(a.created_at)
                        ),
                    }
                }
                return comment
            })
        )

        setReplyText("")
        setReplyingTo(null)
        setReplyingToReplyId(null)

        try {
            const res = await axios.post(
                `${API}/posts/reply_comments/`,
                { parent_comment: commentId, text: textWithMention },
                { headers: authHeaders() }
            )

            setComments((prev) =>
                prev.map((comment) => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            reply_comments: comment.reply_comments
                                .map((reply) =>
                                    reply.id === fakeReply.id
                                        ? { ...res.data, liked_by_me: res.data.liked_by_me ?? false, likes_count: res.data.likes_count ?? 0 }
                                        : reply
                                )
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
                        }
                    }
                    return comment
                })
            )
        } catch (err) {
            console.error("SEND REPLY ERROR", err)
            setComments((prev) =>
                prev.map((comment) => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            reply_comments: comment.reply_comments.filter((r) => r.id !== fakeReply.id).sort(
                                (a, b) => new Date(b.created_at) - new Date(a.created_at)
                            ),
                        }
                    }
                    return comment
                })
            )
        }
    }

    const toggleReplies = (commentId) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(commentId)) newSet.delete(commentId)
            else newSet.add(commentId)
            return newSet
        })
    }

    // ----------------------- STORIES VIEWER -----------------------
    const clearStoryTimers = () => {
        if (storyTimerRef.current) clearTimeout(storyTimerRef.current)
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        storyTimerRef.current = null
        progressTimerRef.current = null
    }

    const closeStoryViewer = () => {
        clearStoryTimers()
        setShowStoryViewer(false)
        setStoryProgress(0)
        setActiveStoryGroupIndex(0)
        setActiveStoryIndex(0)
    }

    const openStoryGroup = (groupIndex) => {
        if (!storyGroups?.length) return
        clearStoryTimers()
        setActiveStoryGroupIndex(groupIndex)
        setActiveStoryIndex(0)
        setStoryProgress(0)
        setShowStoryViewer(true)
    }

    const activeGroup = storyGroups[activeStoryGroupIndex]
    const activeStory = activeGroup?.items?.[activeStoryIndex]

    const goNextStory = useCallback(() => {
        if (!activeGroup) return

        const isLastStoryInGroup = activeStoryIndex >= activeGroup.items.length - 1
        const isLastGroup = activeStoryGroupIndex >= storyGroups.length - 1

        clearStoryTimers()
        setStoryProgress(0)

        if (!isLastStoryInGroup) {
            setActiveStoryIndex((i) => i + 1)
            return
        }

        if (!isLastGroup) {
            setActiveStoryGroupIndex((g) => g + 1)
            setActiveStoryIndex(0)
            return
        }

        // end
        closeStoryViewer()
    }, [activeGroup, activeStoryIndex, activeStoryGroupIndex, storyGroups.length])

    const goPrevStory = useCallback(() => {
        if (!activeGroup) return

        clearStoryTimers()
        setStoryProgress(0)

        if (activeStoryIndex > 0) {
            setActiveStoryIndex((i) => i - 1)
            return
        }

        if (activeStoryGroupIndex > 0) {
            const prevGroup = storyGroups[activeStoryGroupIndex - 1]
            setActiveStoryGroupIndex((g) => g - 1)
            setActiveStoryIndex(prevGroup.items.length - 1)
            return
        }

        // boshida bo'lsa, qayta start
        setActiveStoryIndex(0)
    }, [activeGroup, activeStoryIndex, activeStoryGroupIndex, storyGroups])

    // auto progress for image stories
    useEffect(() => {
        if (!showStoryViewer || !activeStory) return

        clearStoryTimers()
        setStoryProgress(0)

        // duration: image 5s default
        const isVideo = !!activeStory.video
        const DURATION_MS = isVideo ? 9999999 : 5000

        // progress interval
        const startedAt = Date.now()
        progressTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startedAt
            const p = Math.min(100, (elapsed / (isVideo ? 5000 : DURATION_MS)) * 100) // video'da progress bar 5s loop tarzida ko'rinsin
            setStoryProgress(p)
        }, 50)

        if (!isVideo) {
            storyTimerRef.current = setTimeout(() => {
                goNextStory()
            }, DURATION_MS)
        }

        return () => clearStoryTimers()
    }, [showStoryViewer, activeStory?.id, goNextStory])

    return (
        <Layout>
            <div className="tiktok-wrapper">
                <div className="stories-bar">
                    <div className="stories-inner">
                        {storiesLoading && (
                            <>
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div className="story-skeleton" key={idx}>
                                        <div className="story-skeleton-ring" />
                                        <div className="story-skeleton-text" />
                                    </div>
                                ))}
                            </>
                        )}

                        {!storiesLoading && storyGroups.length === 0 && (
                            <div className="stories-empty">No stories yet</div>
                        )}

                        {!storiesLoading &&
                            storyGroups.map((g, idx) => {
                                const avatar =
                                    g.author.avatar ||
                                    `https://i.pravatar.cc/150?img=${(((g.author.id || idx) % 10) + 1)}`
                                const name = g.author.username || "User"
                                return (
                                    <button
                                        key={`${g.author.id ?? name}-${idx}`}
                                        className="story-bubble"
                                        onClick={() => openStoryGroup(idx)}
                                    >
                                        <div className="story-ring">
                                            <img className="story-avatar" src={avatar} alt={name} />
                                        </div>
                                        <div className="story-name">{name}</div>
                                    </button>
                                )
                            })}
                    </div>
                </div>

                {loading && <p style={{ textAlign: "center", color: "#fff" }}>Loading...</p>}
                {error && <p style={{ textAlign: "center", color: "red" }}>{String(error)}</p>}

                {!loading && posts.length > 0 && (
                    <div
                        ref={containerRef}
                        className="tiktok-feed-container"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="nav-arrows-black-area">
                            <button
                                className="nav-arrow up-arrow"
                                onClick={prevPost}
                                disabled={currentIndex === 0}
                                aria-label="Previous video"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                </svg>
                            </button>
                            <button
                                className="nav-arrow down-arrow"
                                onClick={nextPost}
                                disabled={currentIndex === posts.length - 1}
                                aria-label="Next video"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className="video-slide-wrapper">
                            <div
                                {...bind}
                                key={currentPost.id}
                                className={`video-slide ${direction ? `slide-${direction}` : ""} ${isAnimating ? "animating" : ""}`}
                            >
                                <TikTokFeed
                                    post={currentPost}
                                    liked={currentPost.isLiked}
                                    bookmarked={currentPost.isSaved}
                                    reposted={currentPost.isReposted}
                                    repostsCount={currentPost.reposts_count}
                                    onLike={() => toggleLike(currentPost.id)}
                                    onBookmark={() => toggleSave(currentPost.id)}
                                    onRepost={() => toggleRepost(currentPost.id)}
                                    onProfileClick={() => goToProfile(currentPost.author.id)}
                                    onComment={() => openComments(currentPost.id)}
                                    conversations={conversations}
                                    onShareToChat={handleShareToChat}
                                    sharing={sharingPostId === currentPost.id}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showStoryViewer && activeGroup && activeStory && (
                    <div className="story-viewer-overlay" onClick={closeStoryViewer}>
                        <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
                            <div className="story-progress-wrap">
                                {activeGroup.items.map((_, i) => {
                                    const filled =
                                        i < activeStoryIndex ? 100 : i === activeStoryIndex ? storyProgress : 0
                                    return (
                                        <div className="story-progress-bar" key={i}>
                                            <div className="story-progress-fill" style={{ width: `${filled}%` }} />
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="story-viewer-header">
                                <div className="story-viewer-user">
                                    <div className="story-ring small">
                                        <img
                                            className="story-avatar"
                                            src={
                                                activeGroup.author.avatar ||
                                                `https://i.pravatar.cc/150?img=${(((activeGroup.author.id || 1) % 10) + 1)}`
                                            }
                                            alt={activeGroup.author.username}
                                        />
                                    </div>
                                    <div className="story-viewer-name">
                                        {activeGroup.author.username || "User"}
                                    </div>
                                </div>

                                <button className="story-close" onClick={closeStoryViewer} aria-label="close">
                                    ✕
                                </button>
                            </div>

                            <button className="story-tap left" onClick={goPrevStory} aria-label="prev" />
                            <button className="story-tap right" onClick={goNextStory} aria-label="next" />

                            <div className="story-media">
                                {activeStory.video ? (
                                    <video
                                        src={activeStory.video}
                                        autoPlay
                                        playsInline
                                        muted={false}
                                        controls={false}
                                        onEnded={goNextStory}
                                        className="story-video"
                                    />
                                ) : (
                                    <img src={activeStory.image} alt="story" className="story-image" />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showComments && (
                    <div className="comment-modal-overlay" onClick={() => setShowComments(false)}>
                        <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="comment-header">
                                <span>Comments</span>
                                <button onClick={() => setShowComments(false)}>✕</button>
                            </div>

                            <div className="comment-list">
                                {comments.map((c) => {
                                    const avatarUrl = c.user.avatar
                                        ? `${API}${c.user.avatar}`
                                        : `https://i.pravatar.cc/150?img=${(c.user.id % 10) + 1}`

                                    const formattedDate = c.created_at ? new Date(c.created_at).toISOString().split("T")[0] : "Just now"

                                    return (
                                        <div key={c.id} style={{ marginBottom: "20px" }}>
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <img
                                                    src={avatarUrl || "/placeholder.svg"}
                                                    alt={c.user.username || "User"}
                                                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                                                />

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>
                                                        {c.user.username}
                                                    </div>
                                                    <div style={{ color: "#ddd", fontSize: "15px", marginBottom: "8px" }}>
                                                        {c.text}
                                                    </div>

                                                    <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "13px" }}>
                                                        <span style={{ color: "#888" }}>{formattedDate}</span>

                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(replyingTo === c.id ? null : c.id)
                                                                setReplyText("")
                                                            }}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                color: "#888",
                                                                fontWeight: "600",
                                                                padding: 0,
                                                            }}
                                                        >
                                                            Reply
                                                        </button>

                                                        {c.reply_comments && c.reply_comments.length > 0 && (
                                                            <button
                                                                onClick={() => toggleReplies(c.id)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    color: "#888",
                                                                    fontWeight: "600",
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                {expandedComments.has(c.id) ? "Hide" : `View (${c.reply_comments.length})`}
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => toggleCommentLike(c.id)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                color: c.liked_by_me ? "#ff0050" : "#fff",
                                                                padding: 0,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill={c.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                            </svg>
                                                            {c.likes_count}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {replyingTo === c.id && (
                                                <div style={{ marginTop: "12px", marginLeft: "48px", display: "flex", gap: "8px" }}>
                                                    <input
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder={replyingToReplyId ? `Reply to a reply...` : `Reply to ${c.user.username}...`}
                                                        style={{
                                                            flex: 1,
                                                            height: "36px",
                                                            background: "#2a2a2a",
                                                            border: "1px solid #444",
                                                            borderRadius: "8px",
                                                            padding: "8px 12px",
                                                            color: "#fff",
                                                            fontSize: "13px",
                                                            outline: "none",
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const mentionedUser = replyingToReplyId
                                                                ? c.reply_comments?.find((r) => r.id === replyingToReplyId)?.user?.username
                                                                : null
                                                            sendReply(c.id, mentionedUser)
                                                        }}
                                                        style={{
                                                            height: "36px",
                                                            background: "#ff0050",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            padding: "8px 16px",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        Send
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(null)
                                                            setReplyText("")
                                                            setReplyingToReplyId(null)
                                                        }}
                                                        style={{
                                                            height: "36px",
                                                            background: "#333",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            padding: "8px 16px",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}

                                            {expandedComments.has(c.id) && c.reply_comments && c.reply_comments.length > 0 && (
                                                <div style={{ marginLeft: "48px", marginTop: "12px" }}>
                                                    {c.reply_comments.map((reply) => {
                                                        const replyAvatarUrl = reply.user.avatar
                                                            ? `${API}${reply.user.avatar}`
                                                            : `https://i.pravatar.cc/150?img=${(reply.user.id % 10) + 1}`

                                                        const replyFormattedDate = reply.created_at ? new Date(reply.created_at).toISOString().split("T")[0] : "Just now"

                                                        return (
                                                            <div key={reply.id} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                                                                <img
                                                                    src={replyAvatarUrl || "/placeholder.svg"}
                                                                    alt={reply.user.username || "User"}
                                                                    style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                                                />

                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px", marginBottom: "2px" }}>
                                                                        {reply.user.username}
                                                                    </div>
                                                                    <div style={{ color: "#ddd", fontSize: "14px", marginBottom: "4px" }}>
                                                                        {reply.text}
                                                                    </div>

                                                                    <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "12px" }}>
                                                                        <span style={{ color: "#888" }}>{replyFormattedDate}</span>

                                                                        <button
                                                                            onClick={() => toggleReplyLike(c.id, reply.id)}
                                                                            style={{
                                                                                background: "none",
                                                                                border: "none",
                                                                                cursor: "pointer",
                                                                                color: reply.liked_by_me ? "#ff0050" : "#fff",
                                                                                padding: 0,
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "4px",
                                                                                fontWeight: "600",
                                                                            }}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill={reply.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                                            </svg>
                                                                            {reply.likes_count}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                setReplyingTo(c.id)
                                                                                setReplyingToReplyId(reply.id)
                                                                            }}
                                                                            style={{
                                                                                background: "none",
                                                                                border: "none",
                                                                                cursor: "pointer",
                                                                                color: "#888",
                                                                                fontWeight: "600",
                                                                                padding: 0,
                                                                                fontSize: "12px",
                                                                            }}
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="comment-input-section">
                                <input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    style={{
                                        width: "80%",
                                        height: "40px",
                                        background: "#2a2a2a",
                                        border: "1px solid #444",
                                        borderRadius: "8px",
                                        padding: "10px 14px",
                                        color: "#fff",
                                        fontSize: "14px",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    onClick={sendComment}
                                    style={{
                                        height: "40px",
                                        background: "#ff0050",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "10px 20px",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        marginLeft: "8px",
                                    }}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}