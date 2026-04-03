import "../../styles/upload/comment.css";
import { useState, useEffect } from "react";

export default function Comment() {
    const [comments, setComments] = useState([]);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const token = localStorage.getItem("access_token");

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Yangi fetch — endi /users/profile/ dan olamiz
    const fetchComments = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/profile/", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                console.error("Server error:", res.status);
                setLoading(false);
                return;
            }

            const data = await res.json();

            // Profile serializerdan keladigan comments massivini olamiz
            const userComments = Array.isArray(data.comments) ? data.comments : [];
            setComments(userComments);
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    // Like comment (o'zgarmadi)
    const handleLikeComment = async (commentId) => {
        try {
            await fetch(`https://fiscal-convert-tension-electronics.trycloudflare.com/posts/comments/${commentId}/like_toggle/`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchComments(); // refresh
        } catch (err) {
            console.error(err);
        }
    };

    // Like reply (o'zgarmadi)
    const handleLikeReply = async (replyId) => {
        try {
            await fetch(`https://fiscal-convert-tension-electronics.trycloudflare.com/posts/comments/${replyId}/like_toggle/`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchComments();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    // Search filtrlash (hozircha faqat search ishlaydi)
    const filteredComments = comments.filter(comment =>
        comment.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="loader-wrapper">Loading comments...</div>;
    }

    return (
        <main className="tiktok-main-wrapper">
            <div className="tiktok-top-section">
                <div className="filter-tabs-group">
                    <button
                        className={`tab-filter-item ${activeFilter === "all" ? "tab-active" : ""}`}
                        onClick={() => setActiveFilter("all")}
                    >
                        ≡ All comments
                    </button>
                    <button
                        className={`tab-filter-item ${activeFilter === "posted" ? "tab-active" : ""}`}
                        onClick={() => setActiveFilter("posted")}
                    >
                        ≡ Posted by all
                    </button>
                    <button
                        className={`tab-filter-item ${activeFilter === "followers" ? "tab-active" : ""}`}
                        onClick={() => setActiveFilter("followers")}
                    >
                        ≡ Follower count
                    </button>
                    <button
                        className={`tab-filter-item ${activeFilter === "date" ? "tab-active" : ""}`}
                        onClick={() => setActiveFilter("date")}
                    >
                        ≡ Comment date
                    </button>
                </div>

                <div className="search-wrapper-box">
                    <span className="icon-search">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for comment or username"
                        className="input-search-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="feed-comments-container">
                {filteredComments.length === 0 ? (
                    <div className="empty-state-message">No comments found</div>
                ) : (
                    filteredComments.map(comment => (
                        <div key={comment.id} className="single-comment-wrapper">
                            <div className="comment-left-side">
                                <img
                                    src={comment.user?.avatar ? `https://fiscal-convert-tension-electronics.trycloudflare.com${comment.user.avatar}` : "https://via.placeholder.com/40"}
                                    alt={comment.user?.username}
                                    className="user-profile-pic"
                                />

                                <div className="content-details-block">
                                    <div className="user-info-row">
                                        <span className="display-username">{comment.user?.username}</span>
                                        <span className="timestamp-text">• {formatTime(comment.created_at)}</span>
                                    </div>

                                    <p className="main-comment-text">{comment.text}</p>

                                    <div className="interaction-buttons-row">
                                        <button
                                            className={`btn-interaction ${comment.liked_by_me ? "btn-liked" : ""}`}
                                            onClick={() => handleLikeComment(comment.id)}
                                        >
                                            ❤ {comment.likes_count || 0}
                                        </button>

                                        {comment.reply_comments?.length > 0 && (
                                            <button
                                                className="btn-interaction view-replies-btn"
                                                onClick={() => toggleReplies(comment.id)}
                                            >
                                                View {comment.reply_comments.length} {comment.reply_comments.length === 1 ? "reply" : "replies"}
                                                <span className="toggle-arrow">{expandedComments.has(comment.id) ? "▼" : "▶"}</span>
                                            </button>
                                        )}

                                        <button className="btn-interaction">Reply</button>
                                        <button className="btn-interaction">Delete</button>
                                    </div>

                                    {expandedComments.has(comment.id) && comment.reply_comments?.length > 0 && (
                                        <div className="nested-replies-area">
                                            {comment.reply_comments.map(reply => (
                                                <div key={reply.id} className="single-reply-item">
                                                    <img
                                                        src={reply.user?.avatar ? `https://fiscal-convert-tension-electronics.trycloudflare.com${reply.user.avatar}` : "https://via.placeholder.com/32"}
                                                        alt={reply.user?.username}
                                                        className="reply-user-pic"
                                                    />
                                                    <div className="reply-content-block">
                                                        <div className="reply-user-info">
                                                            <span className="reply-username-text">{reply.user?.username}</span>
                                                            <span className="reply-timestamp">• {formatTime(reply.created_at)}</span>
                                                        </div>
                                                        <p className="reply-message-text">{reply.text}</p>
                                                        <div className="reply-interaction-row">
                                                            <button
                                                                className={`btn-interaction ${reply.liked_by_me ? "btn-liked" : ""}`}
                                                                onClick={() => handleLikeReply(reply.id)}
                                                            >
                                                                ❤ {reply.likes_count || 0}
                                                            </button>
                                                            <button className="btn-interaction">Reply</button>
                                                            <button className="btn-interaction">Delete</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {comment.post && (
                                <div className="post-preview-box">
                                    {comment.post.video ? (
                                        <video
                                            src={`https://fiscal-convert-tension-electronics.trycloudflare.com${comment.post.video}`}
                                            className="post-media-preview"
                                            muted
                                        />
                                    ) : comment.post.image ? (
                                        <img
                                            src={`https://fiscal-convert-tension-electronics.trycloudflare.com${comment.post.image}`}
                                            alt={comment.post.title}
                                            className="post-media-preview"
                                        />
                                    ) : null}
                                    <p className="post-title-text">{comment.post.title || "Untitled Post"}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}