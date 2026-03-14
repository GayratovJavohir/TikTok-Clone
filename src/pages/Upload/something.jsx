import React, { useState } from 'react'
import "../../styles/upload/posts.css"

export default function Posts() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      thumbnail: "https://via.placeholder.com/80x80?text=Video",
      duration: "00:45",
      title: "ronaldo's best prime",
      date: "21 Jan, 7:32 pm",
      privacy: "Private",
      views: 0,
      likes: 0,
      comments: 0
    }
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  return (
    <div className="posts-container">
      <div className="posts-header">
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

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for post description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {posts.map((post) => (
            <div key={post.id} className="table-row">
              <div className="col col-content">
                <div className="post-content">
                  <div className="thumbnail">
                    <img src={post.thumbnail} alt={post.title} />
                    <span className="duration">{post.duration}</span>
                  </div>
                  <div className="post-info">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-date">{post.date}</p>
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
                <span className="stat-number">{post.views}</span>
              </div>

              <div className="col col-likes">
                <span className="stat-number">{post.likes}</span>
              </div>

              <div className="col col-comments">
                <span className="stat-number">{post.comments}</span>
              </div>

              <div className="col col-actions">
                <div className="action-buttons">
                  <button className="action-btn edit-btn" title="Edit">
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
    </div>
  )
}
