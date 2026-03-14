import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/upload/studioUpload.css";

const API_BASE = "http://localhost:8000";

// JWT token decode
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
};

export default function StudioUpload() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [mediaFile, setMediaFile] = useState(null);
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(null);

    const [uploadType, setUploadType] = useState("post"); // post | story

    const [musicId, setMusicId] = useState("");
    const [hashtagId, setHashtagId] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Iltimos, avval tizimga kiring!");
            navigate("/login");
            return;
        }

        const decoded = parseJwt(token);
        if (decoded) {
            const uid =
                decoded.user_id || decoded.userId || decoded.id || decoded.sub || null;
            setUserId(uid);
        }
        setIsAuthenticated(true);
    }, [navigate]);

    // -------- Handlers ----------
    const handleMediaChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // old blob preview cleanup
        if (mediaPreview && typeof mediaPreview === "string" && mediaPreview.startsWith("blob:")) {
            URL.revokeObjectURL(mediaPreview);
        }

        setMediaFile(file);

        if (file.type.startsWith("image/")) {
            setMediaPreview(URL.createObjectURL(file));
        } else if (file.type.startsWith("video/")) {
            setMediaPreview("video");
        } else {
            setMediaPreview(null);
        }
    };

    const handleDiscard = () => {
        if (mediaPreview && typeof mediaPreview === "string" && mediaPreview.startsWith("blob:")) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaFile(null);
        setTitle("");
        setCaption("");
        setMusicId("");
        setHashtagId("");
        setMediaPreview(null);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const buildFormData = () => {
        const fd = new FormData();

        // media
        if (mediaFile?.type?.startsWith("image/")) fd.append("image", mediaFile);
        else if (mediaFile?.type?.startsWith("video/")) fd.append("video", mediaFile);

        // POST bo'lsa title/caption kerak bo'lishi mumkin
        if (uploadType === "post") {
            fd.append("title", title);
            fd.append("caption", caption);

            if (musicId?.toString().trim()) fd.append("music", musicId);
            if (hashtagId?.toString().trim()) fd.append("hashtag", hashtagId);

            // author_id kerak emas (token orqali backend save qiladi)
            // fd.append("author_id", Number(userId));
        }

        // STORY bo'lsa backendda faqat image/video + expires_at backend set qiladi (perform_create)
        // title/caption story modelda yo'q bo'lishi mumkin, shuning uchun storyga append qilmaymiz.
        return fd;
    };

    const getEndpoint = () => {
        if (uploadType === "story") return `${API_BASE}/posts/stories/`;
        return `${API_BASE}/posts/posts/`;
    };

    const validateBeforeUpload = () => {
        if (!isAuthenticated) {
            alert("Iltimos, avval tizimga kiring!");
            navigate("/login");
            return false;
        }
        if (!mediaFile) {
            alert("Iltimos, rasm yoki video tanlang!");
            return false;
        }

        // Post uchun title majburiy
        if (uploadType === "post" && !title.trim()) {
            alert("Iltimos, post uchun sarlavha kiriting!");
            return false;
        }

        return true;
    };

    const handleUpload = async () => {
        if (!validateBeforeUpload()) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token topilmadi, qayta login qiling.");
            navigate("/login");
            return;
        }

        try {
            setUploading(true);

            const formData = buildFormData();
            const url = getEndpoint();

            console.log("🚀 Upload:", uploadType, url);
            console.log("📊 FormData:");
            for (let [k, v] of formData.entries()) {
                console.log(k, v instanceof File ? `${v.name} (${v.type})` : v);
            }

            const response = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("✅ Success:", response.data);
            alert(`✅ ${uploadType === "story" ? "Story" : "Post"} muvaffaqiyatli yuklandi!`);
            handleDiscard();
        } catch (error) {
            console.error("❌ Error:", error);

            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);

                let msg = "Yuklashda xatolik:\n";

                if (typeof error.response.data === "object" && error.response.data !== null) {
                    for (const [k, v] of Object.entries(error.response.data)) {
                        msg += `${k}: ${Array.isArray(v) ? v.join(", ") : v}\n`;
                    }
                } else {
                    msg += error.response.data || `Status: ${error.response.status}`;
                }

                alert(msg);

                if (error.response.status === 401 || error.response.status === 403) {
                    alert("Sessiya tugadi. Qayta login qiling.");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                }
            } else if (error.request) {
                alert(
                    "Serverga ulana olmadik.\n" +
                    "1) Backend server ishlayaptimi?\n" +
                    "2) CORS to'g'rimi?\n" +
                    "3) Network bormi?"
                );
            } else {
                alert("Noma'lum xatolik: " + error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 18 }}>
                🔐 Authentication tekshirilmoqda...
            </div>
        );
    }

    const isPost = uploadType === "post";

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
            <h2 style={{ textAlign: "center", marginBottom: 30 }}>
                {isPost ? "🎬 Post Yaratish" : "⏳ Story Yaratish"}
            </h2>

            {/* Switch */}
            <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
                <button
                    onClick={() => setUploadType("post")}
                    style={{
                        padding: "8px 16px",
                        background: isPost ? "#007bff" : "#eee",
                        color: isPost ? "#fff" : "#000",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                >
                    📌 Post
                </button>

                <button
                    onClick={() => setUploadType("story")}
                    style={{
                        padding: "8px 16px",
                        background: !isPost ? "#ff0050" : "#eee",
                        color: !isPost ? "#fff" : "#000",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                >
                    ⏳ Story
                </button>
            </div>

            {/* Card */}
            <div style={{ backgroundColor: "white", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                {/* File */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                        Fayl tanlash *
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        style={{
                            width: "100%",
                            padding: 10,
                            border: `2px dashed ${isPost ? "#007bff" : "#ff0050"}`,
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                    />

                    {mediaFile && (
                        <p style={{ marginTop: 10, color: "#666" }}>
                            ✅ Tanlangan: {mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)} KB)
                        </p>
                    )}

                    {/* Preview */}
                    {mediaPreview && (
                        <div style={{ marginTop: 12 }}>
                            {mediaPreview === "video" ? (
                                <p style={{ color: "#666" }}>🎞️ Video tanlandi (preview yo‘q)</p>
                            ) : (
                                <img
                                    src={mediaPreview}
                                    alt="preview"
                                    style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 10 }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Post fields */}
                {isPost && (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                                Sarlavha *
                            </label>
                            <input
                                type="text"
                                placeholder="Post sarlavhasi..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    border: "1px solid #ddd",
                                    borderRadius: 6,
                                    fontSize: 16,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                                Izoh
                            </label>
                            <textarea
                                placeholder="Izoh..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    border: "1px solid #ddd",
                                    borderRadius: 6,
                                    minHeight: 100,
                                    fontSize: 16,
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: "block", marginBottom: 8 }}>Music ID</label>
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={musicId}
                                    onChange={(e) => setMusicId(e.target.value)}
                                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: 8 }}>Hashtag ID</label>
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={hashtagId}
                                    onChange={(e) => setHashtagId(e.target.value)}
                                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Debug */}
                <div style={{ backgroundColor: "#f8f9fa", padding: 15, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
                    <p><strong>Debug:</strong></p>
                    <p>🔑 Token: {localStorage.getItem("access_token") ? "✅" : "❌"}</p>
                    <p>👤 User ID: {userId || "❌ Topilmadi"}</p>
                    <p>📁 File: {mediaFile ? "✅" : "❌"}</p>
                    {isPost && <p>🏷️ Title: {title ? "✅" : "❌"}</p>}
                    <p>🔗 Endpoint: {isPost ? "/posts/posts/" : "/posts/stories/"}</p>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                        onClick={handleDiscard}
                        disabled={uploading}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "transparent",
                            border: "2px solid #ff4444",
                            color: "#ff4444",
                            borderRadius: 6,
                            cursor: uploading ? "not-allowed" : "pointer",
                            opacity: uploading ? 0.5 : 1,
                        }}
                    >
                        Bekor qilish
                    </button>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !mediaFile || (isPost && !title.trim())}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: uploading ? "#ccc" : (!mediaFile || (isPost && !title.trim()) ? "#95c7ff" : (isPost ? "#007bff" : "#ff0050")),
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: (!mediaFile || (isPost && !title.trim())) ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        {uploading ? "⏳ Yuklanmoqda..." : (isPost ? "🚀 Postni Joylash" : "🚀 Story Joylash")}
                    </button>
                </div>

                {/* Note */}
                <div style={{ marginTop: 20, padding: 10, backgroundColor: "#e6f3ff", borderRadius: 6, fontSize: 14 }}>
                    <p><strong>Eslatma:</strong></p>
                    <p>• Story uchun faqat <strong>fayl</strong> yetadi (24 soatga avtomatik)</p>
                    <p>• Post uchun <strong>Fayl + Sarlavha</strong> majburiy</p>
                </div>
            </div>
        </div>
    );
}