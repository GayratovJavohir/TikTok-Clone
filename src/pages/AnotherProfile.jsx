'use client';

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/profile.css";
import Profile_Pic from "../assets/64278D6C-146D-4A9D-A8D9-E272869E538E.webp";
import ProfileFeed from '../components/ProfileFeed';
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
    const { profileId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("Videos");
    const [profile, setProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [followers, setFollowers] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        first_name: "",
        last_name: "",
        bio: "",
        avatar: null,
    });

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token || !profileId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setSelectedPost(null);

        fetch(`https://exemption-housewives-channels-stopped.trycloudflare.com/users/another-profile/${profileId}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setFollowers(data.followers ?? 0);
                setIsFollowing(data.is_following || false);
                setUserPosts(data.posts || []);

                setFormData({
                    username: data.username || "",
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    bio: data.bio || "",
                    avatar: null,
                });

                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [profileId]);

    const avatarSrc = formData.avatar
        ? URL.createObjectURL(formData.avatar)
        : profile?.avatar
            ? profile.avatar.startsWith("http")
                ? profile.avatar
                : `https://exemption-housewives-channels-stopped.trycloudflare.com${profile.avatar}`
            : Profile_Pic;

    const handleFollow = async () => {
        const token = localStorage.getItem("access_token");
        if (!token || !profileId) return;

        const method = isFollowing ? "DELETE" : "POST";

        const res = await fetch(
            `https://exemption-housewives-channels-stopped.trycloudflare.com/users/follow/${profileId}/`,
            {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            }
        );

        if (res.ok) {
            setIsFollowing(prev => !prev);
            setFollowers(prev => {
                if (isFollowing) {
                    return prev > 0 ? prev - 1 : 0;
                } else {
                    return prev + 1;
                }
            });
        }
    };

    const VideoGrid = ({ posts }) => {
        if (posts.length === 0) {
            return (
                <div className="no-videos">
                    <div className="no-videos-icon">📹</div>
                    <p>No videos yet</p>
                </div>
            );
        }

        return (
            <div className="videos-grid">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="video-card"
                        onClick={() => setSelectedPost(post)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="video-thumbnail">
                            {post.video ? (
                                <video
                                    src={`https://exemption-housewives-channels-stopped.trycloudflare.com${post.video}`}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : post.image ? (
                                <img
                                    src={`https://exemption-housewives-channels-stopped.trycloudflare.com${post.image}`}
                                    alt={post.title}
                                />
                            ) : (
                                <div className="no-media-placeholder">📹</div>
                            )}
                            <div className="video-overlay">
                                <div className="video-stats">
                                    <span>
                                        <i className="fa-solid fa-heart"></i>
                                        {post.likes_count || 0}
                                    </span>
                                    <span>
                                        <i className="fa-solid fa-comment"></i>
                                        {post.comments_count || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="video-caption">{post.title || post.caption}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <main className="profile-content">
                <div className="profile-header">
                    <div className="profile-info">
                        <img
                            src={avatarSrc}
                            className="profile-pic"
                            alt="Profile"
                        />

                        <div className="profile-details">
                            <div className="profile-names">
                                <h1>{profile?.first_name} {profile?.last_name}</h1>
                                <h2>@{profile?.username}</h2>
                            </div>

                            <div className="profile-btns">
                                <button
                                    className={`edit-btn ${isFollowing ? "following" : ""}`}
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </button>

                                <button className="message-btn" onClick={() => navigate(`/messages/${profileId}`)}>
                                    Message
                                </button>

                                <button className="suggest-btn">
                                    <i className="fa-solid fa-user-plus"></i>
                                </button>
                                <button className="share-btn">
                                    <i className="fa-solid fa-share"></i>
                                </button>
                                <button className="more-btn">
                                    <i className="fa-solid fa-ellipsis"></i>
                                </button>
                            </div>

                            <div className="profile-stats">
                                <div className="stat">
                                    <span className="stat-count">{userPosts.length}</span>
                                    <span className="stat-label">Posts</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-count">{followers}</span>
                                    <span className="stat-label">Followers</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-count">0</span>
                                    <span className="stat-label">Likes</span>
                                </div>
                            </div>

                            <div className="profile-bio">
                                <p>{profile?.bio || "No bio yet."}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-videos">
                    <ProfileFeed />
                    <div className="profile-tabs">
                        {["Videos", "Reposts", "Liked"].map((tab) => (
                            <span
                                key={tab}
                                className={`profile-tab ${activeTab === tab ? "active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </span>
                        ))}
                    </div>

                    <div className="tab-content">
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <>
                                {profile?.is_private && !isFollowing ? (
                                    <div className="private-wrapper">
                                        <div className="private-card">
                                            <div className="lock-circle">
                                                <i className="fa-solid fa-lock"></i>
                                            </div>

                                            <h3>This account is private</h3>

                                            <p>
                                                Follow <strong>@{profile?.username}</strong> to see their
                                                videos and content.
                                            </p>

                                            <button
                                                className="private-follow-btn"
                                                onClick={handleFollow}
                                            >
                                                Follow
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === "Videos" && (
                                            <VideoGrid posts={userPosts} />
                                        )}

                                        {activeTab === "Reposts" && (
                                            <div className="no-videos">
                                                <div className="no-videos-icon">🔄</div>
                                                <p>No reposts yet</p>
                                            </div>
                                        )}

                                        {activeTab === "Liked" && (
                                            <div className="no-videos">
                                                <div className="no-videos-icon">❤️</div>
                                                <p>No liked videos yet</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {selectedPost && (
                    <ProfileFeed
                        post={{ ...selectedPost, username: profile?.username }}
                        onClose={() => setSelectedPost(null)}
                    />
                )}
            </main>
        </Layout>
    );
}