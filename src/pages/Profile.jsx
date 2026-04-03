'use client';

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "../styles/profile.css";
import Profile_Pic from "../assets/64278D6C-146D-4A9D-A8D9-E272869E538E.webp";
import ProfileFeed from '../components/ProfileFeed';

export default function Profile() {
    const [activeTab, setActiveTab] = useState("Videos");
    const [profile, setProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedLoaded, setSavedLoaded] = useState(false);
    const [likedPosts, setLikedPosts] = useState([]);
    const [likeLoaded, setLikedLoaded] = useState(false);
    const [repostsPosts, setRepostsPosts] = useState([]);
    const [repostsLoaded, setRepostsLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSettings, setIsSettings] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
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
        if (!token) return;

        fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/profile/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setIsPrivate(data.is_private || false);
                setFollowers(data.followers ?? 0)
                setIsFollowing(data.is_following || false)

                localStorage.setItem("my_user_id", data.id);

                if (data.posts) {
                    setUserPosts(data.posts);
                }
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
    }, []);

    const avatarSrc = formData.avatar
        ? URL.createObjectURL(formData.avatar)
        : profile?.avatar
            ? profile.avatar.startsWith("http")
                ? profile.avatar
                : `https://fiscal-convert-tension-electronics.trycloudflare.com${profile.avatar}`
            : Profile_Pic;

    useEffect(() => {
        if (activeTab !== "Saved") return;
        if (savedLoaded) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/posts/posts/?saved=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("Saved response:", data);

                let postsArray = [];

                if (Array.isArray(data)) {
                    postsArray = data;
                } else if (Array.isArray(data.results)) {
                    postsArray = data.results;
                }

                setSavedPosts(postsArray);
                setSavedLoaded(true);
            })
            .catch(err => console.error("Saved fetch error:", err));

    }, [activeTab]);


    const handlePrivacyToggle = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const newValue = !isPrivate;

        const res = await fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/profile/", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                is_private: newValue,
            }),
        });

        if (res.ok) {
            setIsPrivate(newValue);
            setProfile(prev => ({
                ...prev,
                is_private: newValue
            }));
        } else {
            alert("Failed to update privacy");
        }
    };


    useEffect(() => {
        if (activeTab !== "Liked") return;
        if (likeLoaded) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/posts/posts/?liked=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("Liked response:", data);

                let postsArray = [];

                if (Array.isArray(data)) {
                    postsArray = data;
                } else if (Array.isArray(data.results)) {
                    postsArray = data.results;
                }

                setLikedPosts(postsArray);
                setLikedLoaded(true);
            })
            .catch(err => console.error("Saved fetch error:", err));

    }, [activeTab]);


    useEffect(() => {
        if (activeTab !== "Reposts") return;
        if (repostsLoaded) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/posts/posts/?reposts=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("Reposts response:", data);

                const postsArray = Array.isArray(data)
                    ? data
                    : data.results || [];

                setRepostsPosts(postsArray);
                setRepostsLoaded(true);
            })
            .catch(err => console.error("Reposts fetch error:", err));

    }, [activeTab]);


    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({
            ...prev,
            avatar: file,
        }));
    };

    const handleSave = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const fd = new FormData();

        if (formData.username) fd.append("username", formData.username);
        if (formData.first_name) fd.append("first_name", formData.first_name);
        if (formData.last_name) fd.append("last_name", formData.last_name);
        if (formData.bio) fd.append("bio", formData.bio);
        if (formData.avatar) fd.append("avatar", formData.avatar);

        const res = await fetch("https://fiscal-convert-tension-electronics.trycloudflare.com/users/profile/", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: fd,
        });

        if (res.ok) {
            const updated = await res.json();
            setProfile(updated);
            setIsEditing(false);
        } else {
            const err = await res.json();
            console.error("Update failed:", err);
            alert("Profile update failed: " + JSON.stringify(err));
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
                                    src={`https://fiscal-convert-tension-electronics.trycloudflare.com${post.video}`}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : post.image ? (
                                <img
                                    src={`https://fiscal-convert-tension-electronics.trycloudflare.com${post.image}`}
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

    const SavedPostsGrid = ({ posts }) => {
        const safePosts = Array.isArray(posts) ? posts : [];

        if (safePosts.length === 0) {
            return (
                <div className="no-videos">
                    <div className="no-videos-icon">📹</div>
                    <p>No videos yet</p>
                </div>
            );
        }

        return (
            <div className="videos-grid">
                {safePosts.map((post) => (
                    <div
                        key={post.id}
                        className="video-card"
                        onClick={() => setSelectedPost(post)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="video-thumbnail">
                            {post.video ? (
                                <video
                                    src={`${post.video}`}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : post.image ? (
                                <img
                                    src={`${post.image}`}
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

    const LikedPostsGrid = ({ posts }) => {
        const likedPosts = Array.isArray(posts) ? posts : [];

        if (likedPosts.length === 0) {
            return (
                <div className="no-videos">
                    <div className="no-videos-icon">📹</div>
                    <p>No videos yet</p>
                </div>
            );
        }

        return (
            <div className="videos-grid">
                {likedPosts.map((post) => (
                    <div
                        key={post.id}
                        className="video-card"
                        onClick={() => setSelectedPost(post)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="video-thumbnail">
                            {post.video ? (
                                <video
                                    src={`${post.video}`}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : post.image ? (
                                <img
                                    src={`${post.image}`}
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


    const RepostsPostsGrid = ({ posts }) => {
        const repostsPosts = Array.isArray(posts) ? posts : [];

        if (repostsPosts.length === 0) {
            return (
                <div className="no-videos">
                    <div className="no-videos-icon">📹</div>
                    <p>No videos yet</p>
                </div>
            );
        }

        return (
            <div className="videos-grid">
                {repostsPosts.map((post) => (
                    <div
                        key={post.id}
                        className="video-card"
                        onClick={() => setSelectedPost(post)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="video-thumbnail">
                            {post.video ? (
                                <video
                                    src={`${post.video}`}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : post.image ? (
                                <img
                                    src={`${post.image}`}
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
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                    Edit profile
                                </button>
                                <button className="settings-btn" onClick={() => setIsSettings(true)}>
                                    <i className="fa-solid fa-gear"></i>
                                </button>
                                <button className="share-btn">
                                    <i className="fa-solid fa-share"></i>
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
                        {["Videos", "Reposts", "Liked", "Saved"].map((tab) => (
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
                                {activeTab === "Videos" && <VideoGrid posts={userPosts} />}
                                {activeTab === "Reposts" && (
                                    <RepostsPostsGrid posts={repostsPosts} />
                                )}
                                {activeTab === "Liked" && (
                                    <LikedPostsGrid posts={likedPosts} />
                                )}
                                {activeTab === "Saved" && (
                                    <SavedPostsGrid posts={savedPosts} />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="edit-overlay">
                        <div className="edit-sheet">
                            <div className="edit-header">
                                <button onClick={() => setIsEditing(false)}>Cancel</button>
                                <h3>Edit profile</h3>
                                <button className="save" onClick={handleSave}>Save</button>
                            </div>

                            <div className="edit-body">
                                <label>
                                    Username
                                    <input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                    />
                                </label>

                                <label>
                                    First name
                                    <input
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    Last name
                                    <input
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    Bio
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        maxLength={80}
                                    />
                                    <span className="counter">{formData.bio.length}/80</span>
                                </label>

                                <label className="avatar-upload">
                                    Change avatar
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {isSettings && (
                    <div className="settings-overlay">
                        <div className="settings-sheet">
                            <div className="settings-header">
                                <h3>Settings</h3>
                                <button onClick={() => setIsSettings(false)}>✕</button>
                            </div>

                            <div className="settings-body">
                                <div className="settings-item">
                                    <div>
                                        <p>Private account</p>
                                        <span>
                                            {isPrivate
                                                ? "Only approved followers can see your content"
                                                : "Everyone can see your content"}
                                        </span>
                                    </div>

                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={isPrivate}
                                            onChange={handlePrivacyToggle}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


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
