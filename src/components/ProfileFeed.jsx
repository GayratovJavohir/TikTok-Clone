'use client';

import React, { useState, useEffect } from 'react';
import axios from "axios";
import '../styles/profile-feed.css';
import { useNavigate } from "react-router-dom";

const API_BASE = "https://tiktok-clone-backend-hb85.onrender.com";

const getMediaUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
    }
    return `${API_BASE}${filePath}`;
};

export default function ProfileFeed({ post, onClose }) {
    const navigate = useNavigate();
    const myId = Number(localStorage.getItem("my_user_id"));
    const myUsername = localStorage.getItem("my_username") || "You";

    const [currentPost, setCurrentPost] = useState(post);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [expandedComments, setExpandedComments] = useState(new Set());

    useEffect(() => {
        if (post) {
            setCurrentPost(post);
            fetchComments(post.id);
        }
    }, [post]);

    if (!post) {
        return <div className="profile-feed"></div>;
    }

    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const fetchComments = async (postId) => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.get(
                `${API_BASE}/posts/comments/?post=${postId}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            let formattedComments = (res.data.results || []).map(c => ({
                ...c,
                liked_by_me: c.liked_by_me ?? false,
                likes_count: c.likes_count ?? 0,
                reply_comments: (c.reply_comments || []).map(r => ({
                    ...r,
                    liked_by_me: r.liked_by_me ?? false,
                    likes_count: r.likes_count ?? 0
                })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            }));

            formattedComments = formattedComments.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );

            setComments(formattedComments);
        } catch (err) {
            console.error("COMMENTS FETCH ERROR", err);
            setComments([]);
        }
    };

    const toggleLike = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const wasLiked = currentPost.is_liked;
        const newLikesCount = wasLiked
            ? currentPost.likes_count - 1
            : currentPost.likes_count + 1;

        setCurrentPost(prev => ({
            ...prev,
            is_liked: !wasLiked,
            likes_count: newLikesCount
        }));

        try {
            const res = await axios.post(
                `${API_BASE}/posts/posts/${currentPost.id}/like_toggle/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCurrentPost(prev => ({
                ...prev,
                is_liked: res.data.liked,
                likes_count: res.data.likes_count
            }));
        } catch (err) {
            console.error("LIKE ERROR:", err);
            setCurrentPost(prev => ({
                ...prev,
                is_liked: wasLiked,
                likes_count: wasLiked ? prev.likes_count + 1 : prev.likes_count - 1
            }));
        }
    };

    const toggleSave = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const wasSaved = currentPost.is_saved;
        const newBookmarksCount = wasSaved
            ? currentPost.bookmarks_count - 1
            : currentPost.bookmarks_count + 1;

        setCurrentPost(prev => ({
            ...prev,
            is_saved: !wasSaved,
            bookmarks_count: newBookmarksCount
        }));

        try {
            const res = await axios.post(
                `${API_BASE}/posts/posts/${currentPost.id}/save_toggle/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCurrentPost(prev => ({
                ...prev,
                is_saved: res.data.bookmarked,
                bookmarks_count: res.data.bookmarks_count
            }));
        } catch (err) {
            console.error("SAVE ERROR:", err);
            setCurrentPost(prev => ({
                ...prev,
                is_saved: wasSaved,
                bookmarks_count: wasSaved ? prev.bookmarks_count + 1 : prev.bookmarks_count - 1
            }));
        }
    };

    const sendComment = async () => {
        if (!commentText.trim()) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        const fake = {
            id: Date.now(),
            text: commentText,
            user: { id: myId, username: myUsername },
            liked_by_me: false,
            likes_count: 0,
            reply_comments: [],
            created_at: new Date().toISOString(),
            optimistic: true
        };

        setComments(prev => [fake, ...prev]);
        setCommentText("");

        setCurrentPost(prev => ({
            ...prev,
            comments_count: prev.comments_count + 1
        }));

        try {
            const res = await axios.post(
                `${API_BASE}/posts/comments/`,
                {
                    post_id: currentPost.id,
                    text: fake.text
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments(prev =>
                prev.map(c =>
                    c.id === fake.id
                        ? {
                            ...res.data,
                            liked_by_me: res.data.liked_by_me ?? false,
                            likes_count: res.data.likes_count ?? 0,
                            reply_comments: res.data.reply_comments || []
                        }
                        : c
                )
            );
        } catch (err) {
            console.error("SEND COMMENT ERROR", err);
            setComments(prev => prev.filter(c => c.id !== fake.id));
            setCurrentPost(prev => ({
                ...prev,
                comments_count: prev.comments_count - 1
            }));
        }
    };

    const sendReply = async (commentId, mentionedUsername = null) => {
        if (!replyText.trim()) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        const textWithMention = mentionedUsername
            ? `@${mentionedUsername} ${replyText}`
            : replyText;

        const fakeReply = {
            id: Date.now(),
            text: textWithMention,
            user: { id: myId, username: myUsername },
            liked_by_me: false,
            likes_count: 0,
            created_at: new Date().toISOString(),
            optimistic: true
        };

        setComments(prev =>
            prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        reply_comments: [fakeReply, ...(comment.reply_comments || [])]
                    };
                }
                return comment;
            })
        );

        setReplyText("");
        setReplyingTo(null);

        try {
            const res = await axios.post(
                `${API_BASE}/posts/reply_comments/`,
                {
                    parent_comment: commentId,
                    text: textWithMention
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments(prev =>
                prev.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            reply_comments: comment.reply_comments.map(reply =>
                                reply.id === fakeReply.id
                                    ? {
                                        ...res.data,
                                        liked_by_me: res.data.liked_by_me ?? false,
                                        likes_count: res.data.likes_count ?? 0
                                    }
                                    : reply
                            )
                        };
                    }
                    return comment;
                })
            );
        } catch (err) {
            console.error("SEND REPLY ERROR", err);
            setComments(prev =>
                prev.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            reply_comments: comment.reply_comments.filter(r => r.id !== fakeReply.id)
                        };
                    }
                    return comment;
                })
            );
        }
    };

    const toggleReplyLike = async (commentId, replyId) => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        setComments(prev =>
            prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        reply_comments: comment.reply_comments.map(reply => {
                            if (reply.id === replyId) {
                                return {
                                    ...reply,
                                    liked_by_me: !reply.liked_by_me,
                                    likes_count: reply.liked_by_me
                                        ? reply.likes_count - 1
                                        : reply.likes_count + 1
                                };
                            }
                            return reply;
                        })
                    };
                }
                return comment;
            })
        );

        try {
            const res = await axios.post(
                `${API_BASE}/posts/reply_comments/${replyId}/like_toggle/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments(prev =>
                prev.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            reply_comments: comment.reply_comments.map(reply =>
                                reply.id === replyId
                                    ? {
                                        ...reply,
                                        liked_by_me: res.data.liked_by_me ?? reply.liked_by_me,
                                        likes_count: res.data.likes_count ?? reply.likes_count
                                    }
                                    : reply
                            )
                        };
                    }
                    return comment;
                })
            );
        } catch (err) {
            console.error("REPLY LIKE ERROR:", err);
        }
    };

    const toggleCommentLike = async (commentId) => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        setComments(prev =>
            prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        liked_by_me: !comment.liked_by_me,
                        likes_count: comment.liked_by_me
                            ? comment.likes_count - 1
                            : comment.likes_count + 1
                    };
                }
                return comment;
            })
        );

        try {
            const res = await axios.post(
                `${API_BASE}/posts/comments/${commentId}/like_toggle/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments(prev =>
                prev.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            liked_by_me: res.data.liked_by_me ?? comment.liked_by_me,
                            likes_count: res.data.likes_count ?? comment.likes_count
                        }
                        : comment
                )
            );
        } catch (err) {
            console.error("COMMENT LIKE ERROR:", err);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const mediaVideoUrl = getMediaUrl(currentPost.video);
    const mediaImageUrl = getMediaUrl(currentPost.image);

    return (
        <div className="modal-overlay" onClick={onClose}>
            {loading && <p style={{ textAlign: "center", color: "#fff" }}>Loading...</p>}
            {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}

            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="modal-video-section">
                    <div className="video-player">
                        {mediaVideoUrl ? (
                            <video
                                src={mediaVideoUrl}
                                controls
                                autoPlay
                                playsInline
                                loop
                            />
                        ) : mediaImageUrl ? (
                            <img
                                src={mediaImageUrl}
                                alt={currentPost.title || "post"}
                            />
                        ) : (
                            <div className="no-media">📹</div>
                        )}
                    </div>

                    <button className="view-analytics">
                        <i className="fa-solid fa-chart-line"></i> View Analytics
                    </button>
                </div>

                <div className="modal-details-section">
                    <div className="search-section">
                        <div className="search-bar">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input type="text" placeholder="Find related content" />
                        </div>
                        <button className="menu-btn">
                            <i className="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>

                    <div className="user-section">
                        <div className="user-header">
                            <div className="user-info">
                                <h3 className="username">
                                    @{currentPost.author?.username || currentPost.username || "user"}
                                </h3>
                                <p className="timestamp">
                                    {formatTimestamp(currentPost.created_at || new Date())}
                                </p>
                            </div>
                            <button className="menu-icon">
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                        </div>
                    </div>

                    <div className="post-caption">
                        <h2>{currentPost.title || currentPost.caption}</h2>
                    </div>

                    <div className="audio-info">
                        <i className="fa-solid fa-music"></i>
                        <span>
                            original sound - {currentPost.author?.username || currentPost.username || "user"}
                        </span>
                    </div>

                    <div className="interaction-buttons">
                        <button
                            className={`btn-icon ${currentPost.is_liked ? 'active' : ''}`}
                            onClick={toggleLike}
                        >
                            <i className={`fa-${currentPost.is_liked ? 'solid' : 'regular'} fa-heart`}></i>
                            <span>{currentPost.likes_count || 0}</span>
                        </button>

                        <button className="btn-icon">
                            <i className="fa-regular fa-comment"></i>
                            <span>{currentPost.comments_count || comments.length}</span>
                        </button>

                        <button
                            className={`btn-icon ${currentPost.is_saved ? 'active' : ''}`}
                            onClick={toggleSave}
                        >
                            <i className={`fa-${currentPost.is_saved ? 'solid' : 'regular'} fa-bookmark`}></i>
                            <span>{currentPost.bookmarks_count || 0}</span>
                        </button>

                        <button className="btn-icon">
                            <i className="fa-brands fa-x-twitter"></i>
                        </button>

                        <button className="btn-icon">
                            <i className="fa-solid fa-share"></i>
                        </button>
                    </div>

                    <div className="link-section">
                        <input
                            type="text"
                            value={`https://www.tiktok.com/@${currentPost.author?.username || currentPost.username || 'user'}/video/${currentPost.id}`}
                            readOnly
                        />
                        <button
                            className="copy-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    `https://www.tiktok.com/@${currentPost.author?.username || currentPost.username || 'user'}/video/${currentPost.id}`
                                );
                            }}
                        >
                            Copy link
                        </button>
                    </div>

                    <div className="comments-header">
                        <span className="active">Comments ({comments.length})</span>
                        <span>Creator videos</span>
                    </div>

                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">Be the first to comment!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <div className="comment-user">
                                            <strong>{comment.user?.username}</strong>
                                            <span className="comment-time">
                                                {formatTimestamp(comment.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="comment-text">{comment.text}</p>

                                    <div className="comment-actions">
                                        <button
                                            className={`comment-like-btn ${comment.liked_by_me ? 'active' : ''}`}
                                            onClick={() => toggleCommentLike(comment.id)}
                                        >
                                            <i className={`fa-${comment.liked_by_me ? 'solid' : 'regular'} fa-heart`}></i>
                                            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                                        </button>

                                        <button
                                            className="reply-btn"
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        >
                                            Reply
                                        </button>
                                    </div>

                                    {comment.reply_comments && comment.reply_comments.length > 0 && (
                                        <button
                                            className="view-replies-btn"
                                            onClick={() => toggleReplies(comment.id)}
                                        >
                                            <i className={`fa-solid fa-chevron-${expandedComments.has(comment.id) ? 'up' : 'down'}`}></i>
                                            {expandedComments.has(comment.id) ? 'Hide' : 'View'}{" "}
                                            {comment.reply_comments.length}{" "}
                                            {comment.reply_comments.length === 1 ? 'reply' : 'replies'}
                                        </button>
                                    )}

                                    {expandedComments.has(comment.id) &&
                                        comment.reply_comments?.map(reply => (
                                            <div key={reply.id} className="reply-item">
                                                <div className="reply-header">
                                                    <strong>{reply.user?.username}</strong>
                                                    <span className="reply-time">
                                                        {formatTimestamp(reply.created_at)}
                                                    </span>
                                                </div>

                                                <p className="reply-text">{reply.text}</p>

                                                <div className="reply-actions">
                                                    <button
                                                        className={`reply-like-btn ${reply.liked_by_me ? 'active' : ''}`}
                                                        onClick={() => toggleReplyLike(comment.id, reply.id)}
                                                    >
                                                        <i className={`fa-${reply.liked_by_me ? 'solid' : 'regular'} fa-heart`}></i>
                                                        {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
                                                    </button>

                                                    <button
                                                        className="reply-to-reply-btn"
                                                        onClick={() => setReplyingTo(comment.id)}
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                    {replyingTo === comment.id && (
                                        <div className="reply-input-wrapper">
                                            <input
                                                className="reply-input"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={`Reply to @${comment.user?.username}...`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && replyText.trim()) {
                                                        sendReply(comment.id, comment.user?.username);
                                                    }
                                                }}
                                            />
                                            <button
                                                className="send-reply-btn"
                                                onClick={() => sendReply(comment.id, comment.user?.username)}
                                                disabled={!replyText.trim()}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="comment-input-section">
                        <button className="btn-icon-small">
                            <i className="fa-solid fa-image"></i>
                        </button>

                        <input
                            type="text"
                            placeholder="Add comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && commentText.trim()) {
                                    sendComment();
                                }
                            }}
                        />

                        <button className="emoji-btn">
                            <i className="fa-solid fa-face-smile"></i>
                        </button>

                        <button
                            className="post-btn"
                            onClick={sendComment}
                            disabled={!commentText.trim()}
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}