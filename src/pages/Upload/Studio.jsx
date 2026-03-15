import "../../styles/upload/studio.css";
import { useState, useEffect } from "react";
import Profile_Pic from "../../assets/64278D6C-146D-4A9D-A8D9-E272869E538E.webp";

export default function Studio() {
    const [profile, setProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [followers, setFollowers] = useState(0);
    const [loading, setLoading] = useState(true);
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

        fetch("https://tiktok-clone-backend-hb85.onrender.com/users/profile/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setFollowers(data.followers ?? 0)

                localStorage.setItem("my_user_id", data.id);

                if (data.posts) {
                    setUserPosts(data.posts);
                    console.log(data.posts)
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

    const avatarSrc =
        profile?.avatar && profile.avatar.trim() !== ""
            ? profile.avatar.startsWith("http")
                ? profile.avatar
                : `https://tiktok-clone-backend-hb85.onrender.com${profile.avatar}`
            : Profile_Pic;


    if (loading) {
        return <div className="studio-loading">Loading...</div>;
    }

    return (
        <main className="studio-page">
            <section className="studio-profile">
                <img
                    src={avatarSrc}
                    alt="Profile"
                    className="studio-avatar"
                />
                <div>
                    <h3>{profile?.username}</h3>
                    <p>
                        Likes 0 · Followers {followers}
                    </p>
                </div>
            </section>

            <section className="studio-card">
                <div className="studio-card-header">
                    <h4>Key metrics</h4>
                    <select>
                        <option>Last 7 days</option>
                        <option>Last 28 days</option>
                    </select>
                </div>

                <div className="metrics-grid">
                    <Metric title="Video views" />
                    <Metric title="Profile views" />
                    <Metric title="Likes" />
                    <Metric title="Comments" />
                    <Metric title="Shares" />
                </div>

                <div className="chart-placeholder">
                    Chart will be here
                </div>
            </section>

            <div className="studio-bottom">
                <section className="studio-card">
                    <h4>Recent posts</h4>

                    {userPosts.length === 0 ? (
                        <div className="empty">No posts yet</div>
                    ) : (
                        <div className="posts-grid">
                            {userPosts.map((post) => (
                                <div className="tiktok-post-wrapper">
                                    <div key={post.id} className="tiktok-post">
                                        {post.video ? (
                                            <video
                                                src={`https://tiktok-clone-backend-hb85.onrender.com${post.video}`}
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : post.image ? (
                                            <img
                                                    src={`https://tiktok-clone-backend-hb85.onrender.com${post.image}`}
                                                alt=""
                                            />
                                        ) : null}


                                    </div>

                                    <div className="tiktok-post-info">
                                        {post.title ? (
                                            <h5>{post.title}</h5>
                                        )
                                            : null}

                                        {post.caption ? (
                                            <p>{new Date(post.created_at).toLocaleDateString()}</p>
                                        ) : null
                                        }
                                    </div>

                                    <div className="tiktok-post-stats">
                                        <span>
                                            <i className="fa-solid fa-heart stats-heart"></i>
                                            {post.likes_count || 0}
                                        </span>
                                        <span>
                                            <i className="fa-solid fa-comment stats-comment"></i>
                                            {post.comments_count || 0}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                </section>

                <section className="studio-card">
                    <h4>Knowledge for you</h4>
                    <div className="knowledge-item">
                        <div>
                            <h5>Finding Creator Rewards Program success</h5>
                            <p>Storytime! Learn how creators grow...</p>
                        </div>
                        <img src="https://picsum.photos/80" alt="" />
                    </div>
                </section>
            </div>
        </main>
    );
}

function Metric({ title }) {
    return (
        <div className="metric-box">
            <span className="metric-title">{title}</span>
            <span className="metric-value">--</span>
            <span className="metric-sub">0 (--)</span>
        </div>
    );
}
