import { Link, useLocation } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "../../styles/upload/sidebar.css"
import {
    faHouse,
    faFileAlt,
    faChartLine,
    faCommentDots,
    faLightbulb,
    faGraduationCap,
    faMusic,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
    const location = useLocation()

    const manageItems = [
        { icon: <FontAwesomeIcon icon={faHouse} />, label: "Home", path: "/tiktokstudio" },
        { icon: <FontAwesomeIcon icon={faFileAlt} />, label: "Posts", path: "/tiktokstudio/posts" },
        { icon: <FontAwesomeIcon icon={faChartLine} />, label: "View Analytics", path: "/tiktokstudio/analytics" },
        { icon: <FontAwesomeIcon icon={faCommentDots} />, label: "Comments", path: "/tiktokstudio/comment" }
    ];

    const toolItems = [
        { icon: <FontAwesomeIcon icon={faLightbulb} />, label: "Inspiration", path: "/tiktokstudio/inspiration" },
        { icon: <FontAwesomeIcon icon={faGraduationCap} />, label: "Creator Academy", path: "/tiktokstudio/creator-academy" },
        { icon: <FontAwesomeIcon icon={faMusic} />, label: "Unlimited sounds", path: "/tiktokstudio/sound-library" }
    ];

    const otherItems = [
        { icon: <FontAwesomeIcon icon={faPaperPlane} />, label: "Share feedback", path: "/tiktokstudio/help/contact-us" }
    ]

    return (
        <aside className="studio-sidebar-left">

            <div className="studio-sidebar-header">
                <img src="" alt="TikTok" className="studio-tiktok-icon" />
                <span className="studio-tiktok-logo">TikTok</span>
            </div>

            <button className="upload-btn">
                <Link to="/tiktokstudio/upload">
                    <i className="fa-solid fa-plus"></i>
                    Upload
                </Link>
            </button>

            <nav className="studio-nav-menu">
                <p>MANAGE</p>
                {
                    manageItems.map((item) => (
                        <Link key={item.path} to={item.path} className="studio-nav-link">
                            <div className={`studio-nav-item ${location.pathname === item.path ? "active" : ""}`}>
                                <span className="studio-nav-icon">{item.icon}</span>
                                <span className="studio-nav-label">{item.label}</span>
                            </div>
                        </Link>
                    ))
                }
            </nav>

            <nav className="studio-nav-menu">
                <p>TOOLS</p>
                {
                    toolItems.map((item) => (
                        <Link key={item.path} to={item.path} className="studio-nav-link">
                            <div className={`studio-nav-item ${location.pathname === item.path ? "active" : ""}`}>
                                <span className="studio-nav-icon">{item.icon}</span>
                                <span className="studio-nav-label">{item.label}</span>
                            </div>
                        </Link>
                    ))
                }
            </nav>

            <nav className="studio-nav-menu">
                <p>OTHERS</p>

                {
                    otherItems.map((item) => (
                        <Link key={item.path} to={item.path} className="studio-nav-link">
                            <div className={`studio-nav-item ${location.pathname === item.path ? "active" : ""}`}>
                                <span className="studio-nav-icon">{item.icon}</span>
                                <span className="studio-nav-label">{item.label}</span>
                            </div>
                        </Link>
                    ))
                }
            </nav>

            <Link to={"/"}>Back to Tiktok</Link>
        </aside>

    )
}



