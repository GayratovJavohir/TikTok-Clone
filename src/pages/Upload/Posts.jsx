import "../../styles/upload/posts.css";
import { useState, useEffect } from "react";

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

  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("https://exemption-housewives-channels-stopped.trycloudflare.com/users/profile/", {
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


  if (loading) {
    return <div className="studio-loading">Loading...</div>;
  }

  return (
    <main className="posts-container">

      <div className="studio-posts-header">
        <div className="filter-buttons">
          <button className={`filter-btn ${activeFilter === "views" ? "active" : ""}`} onClick={() => setActiveFilter("views")}>
            <span className="filter-icon">👁️</span> Views
          </button>
          <button className={`filter-btn ${activeFilter === "likes" ? "active" : ""}`} onClick={() => setActiveFilter("likes")}>
            <span className="filter-icon">👍</span> Likes
          </button>
          <button className={`filter-btn ${activeFilter === "comments" ? "active" : ""}`} onClick={() => setActiveFilter("comments")}>
            <span className="filter-icon">💬</span> Comments
          </button>
          <button className={`filter-btn ${activeFilter === "privacy" ? "active" : ""}`} onClick={() => setActiveFilter("privacy")}>
            <span className="filter-icon">🔒</span> Privacy
          </button>
        </div>

        <div className="studio-search-bar">
          <input
            type="text"
            placeholder="Search for post description"
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="posts-table">


        <div className="table-header">
          <div className="col col-content">Content (Created on)</div>
          <div className="col col-privacy">Privacy</div>
          <div className="col col-views">Views</div>
          <div className="col col-likes">Likes</div>
          <div className="col col-comments">Comments</div>
          <div className="col col-actions">Actions</div>
        </div>


        <div className="table-body">
          {userPosts.map((post) => (
            <div key={post.id} className="table-row">
              <div className="col col-content">
                <div className="post-content">
                  <div className="thumbnail">
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
                        alt=""
                      />
                    ) : null}
                  </div>
                  <div className="post-info">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-date">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="col col-privacy">
                <div className="privacy-dropdown">
                  <span className="privacy-icon">🔒</span>
                  <select className="privacy-select">
                    <option>Private</option>
                    <option>Public</option>
                    <option>Friends Only</option>
                  </select>
                </div>
              </div>

              <div className="col col-views">
                <span className="stat-number">0</span>
              </div>

              <div className="col col-likes">
                <span className="stat-number">{post.likes_count}</span>
              </div>

              <div className="col col-comments">
                <span className="stat-number">{post.comments_count}</span>
              </div>

              <div className="col col-actions">
                <div className="action-buttons">
                  <button className="action-btn" title="Edit">
                    ✏️
                  </button>
                  <button className="action-btn image-btn" title="View Image">
                    🖼️
                  </button>
                  <button className="action-btn comment-btn" title="Comments">
                    💬
                  </button>
                  <button className="action-btn more-btn" title="More options">
                    ⋯
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}