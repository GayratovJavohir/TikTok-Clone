import Sidebar from "./Sidebar"
import "../styles/layout.css"

export default function Layout({ children }) {
    return (
        <div className="tiktok-container">
            <div className="tiktok-main">
                <Sidebar />
                {children}
            </div>
        </div>
    )
}