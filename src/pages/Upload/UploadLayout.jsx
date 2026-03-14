import Sidebar from "../../components/upload/Sidebar";
import Header from "../../components/upload/Header";
import { Outlet } from "react-router-dom";
import "../../styles/upload/upload.css";

export default function UploadLayout() {
    return (
        <>
            <Header />
            <Sidebar />
            <main className="upload-content">
                <Outlet />
            </main>
        </>
    );
}
