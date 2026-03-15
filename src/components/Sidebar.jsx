import { Link, useLocation, useNavigate } from "react-router-dom"
import "../styles/sidebar.css"
import axios from "axios"
import { useEffect, useState } from "react"
import Profile_pic from "../assets/download.png"
import avatar_pic from "../assets/64278D6C-146D-4A9D-A8D9-E272869E538E.webp";

export default function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const [search, setSearch] = useState("")
    const [users, setUsers] = useState([])

    const isCollapsed = location.pathname.startsWith("/messages")

    // vaqtincha current user id
    // keyin buni localStorage token yoki user contextdan olasan
    const myId = Number(localStorage.getItem("user_id"))

    const navItems = [
        { icon: "🏠", label: "For You", path: "/" },
        { icon: "🔍", label: "Explore", path: "/explore" },
        { icon: "👥", label: "Following", path: "/following" },
        { icon: "👫", label: "Friends", path: "/friends" },
        { icon: "🎬", label: "LIVE", path: "/live" },
        { icon: "✉️", label: "Messages", path: "/messages" },
        { icon: "🔔", label: "Activity", path: "/activity" },
        { icon: "📤", label: "Upload", path: "/tiktokstudio" },
        { icon: "👤", label: "Profile", path: "/profile" },
        { icon: "⋯", label: "More", path: "/more" },
    ]

    const fetchUsers = async () => {
        try {
            if (search.trim() === "") {
                setUsers([])
                return
            }

            const res = await axios.get(
                `https://tiktok-clone-backend-hb85.onrender.com/users/users/?search=${search}`
            )

            setUsers(res.data.results || res.data || [])
        } catch (error) {
            console.error("Error fetching users:", error)
            setUsers([])
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [search])

    const goToProfile = (authorId) => {
        const isMe = Number(authorId) === Number(myId)

        setSearch("")
        setUsers([])

        if (isMe) {
            navigate("/profile")
        } else {
            navigate(`/profile/${authorId}`)
        }
    }
    return (
        <aside className={`tiktok-sidebar-left ${isCollapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <img src={Profile_pic} alt="TikTok" className="tiktok-icon" />
                {!isCollapsed && <span className="tiktok-logo">TikTok</span>}
            </div>

            {!isCollapsed && (
                <div className="search-box-wrapper">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {search.trim() !== "" && (
                        <div className="search-results-popup">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="search-result-item"
                                        onClick={() => goToProfile(user.id)}
                                    >
                                        <div className="search-result-avatar">
                                            <img
                                                src={user.avatar || avatar_pic}
                                                alt={user.username}
                                            />
                                        </div>

                                        <div className="search-result-info">
                                            <div className="search-result-username">
                                                {user.username}
                                            </div>
                                            <div className="search-result-name">
                                                {user.first_name || ""} {user.last_name || ""}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="search-empty">No users found</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <nav className="nav-menu">
                {navItems.map((item) => (
                    <Link key={item.path} to={item.path} className="nav-link">
                        <div className={`nav-item ${location.pathname === item.path ? "active" : ""}`}>
                            <span className="nav-icon">{item.icon}</span>
                            {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        </div>
                    </Link>
                ))}
            </nav>

            {!isCollapsed && (
                <>
                    <div className="following-section">
                        <h4>Following accounts</h4>
                        <p>Accounts you follow will appear here</p>
                    </div>

                    <div className="footer-section">
                        <p>Company</p>
                        <p>Programme</p>
                        <p>Terms & Policies</p>
                        <p>© 2025 TikTok</p>
                    </div>
                </>
            )}
        </aside>
    )
}