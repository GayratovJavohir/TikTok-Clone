import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/upload/studioUpload.css";

const API_BASE = "https://exemption-housewives-channels-stopped.trycloudflare.com";

export default function StudioUpload() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [mediaFile, setMediaFile] = useState(null);
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [uploadType, setUploadType] = useState("post");
    const [musicId, setMusicId] = useState("");
    const [hashtagId, setHashtagId] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Iltimos, avval tizimga kiring!");
            navigate("/login");
            return;
        }
        setIsAuthenticated(true);

        return () => {
            if (mediaPreview?.startsWith?.("blob:")) {
                URL.revokeObjectURL(mediaPreview);
            }
        };
    }, [navigate, mediaPreview]);

    const handleMediaChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaPreview?.startsWith?.("blob:")) URL.revokeObjectURL(mediaPreview);

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
        if (mediaPreview?.startsWith?.("blob:")) URL.revokeObjectURL(mediaPreview);
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
        if (mediaFile?.type?.startsWith("image/")) fd.append("image", mediaFile);
        else if (mediaFile?.type?.startsWith("video/")) fd.append("video", mediaFile);

        if (uploadType === "post") {
            fd.append("title", title.trim());
            fd.append("caption", caption.trim());
            if (musicId?.toString().trim()) fd.append("music", musicId);
            if (hashtagId?.toString().trim()) fd.append("hashtag", hashtagId);
        }
        return fd;
    };

    const getEndpoint = () =>
        uploadType === "story"
            ? `${API_BASE}/posts/stories/`
            : `${API_BASE}/posts/posts/`;

    const validateBeforeUpload = () => {
        if (!isAuthenticated) { alert("Iltimos, avval tizimga kiring!"); navigate("/login"); return false; }
        if (!mediaFile) { alert("Iltimos, rasm yoki video tanlang!"); return false; }
        if (uploadType === "post" && !title.trim()) { alert("Iltimos, post uchun sarlavha kiriting!"); return false; }
        return true;
    };

    const handleUpload = async () => {
        if (!validateBeforeUpload()) return;
        const token = localStorage.getItem("access_token");
        if (!token) { alert("Token topilmadi, qayta login qiling."); navigate("/login"); return; }

        try {
            setUploading(true);
            const formData = buildFormData();
            const url = getEndpoint();
            const response = await axios.post(url, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Success:", response.data);
            alert(`✅ ${uploadType === "story" ? "Story" : "Post"} muvaffaqiyatli yuklandi!`);
            handleDiscard();
        } catch (error) {
            console.error("❌ Error:", error);
            if (error.response) {
                let msg = "Yuklashda xatolik:\n";
                if (typeof error.response.data === "object" && error.response.data !== null) {
                    for (const [k, v] of Object.entries(error.response.data)) {
                        msg += `${k}: ${Array.isArray(v) ? v.join(", ") : v}\n`;
                    }
                } else {
                    msg += error.response.data || `Status: ${error.response.status}`;
                }
                alert(msg);
                if ([401, 403].includes(error.response.status)) {
                    alert("Sessiya tugadi. Qayta login qiling.");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                }
            } else if (error.request) {
                alert("Serverga ulana olmadik.\n1) Backend ishlayaptimi?\n2) CORS to'g'rimi?\n3) Network bormi?");
            } else {
                alert("Noma'lum xatolik: " + error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="auth-loading">
                <div className="auth-spinner" />
                Authentication tekshirilmoqda...
            </div>
        );
    }

    const isPost = uploadType === "post";
    const hasFile = !!mediaFile;
    const token = localStorage.getItem("access_token");
    const canUpload = !uploading && hasFile && (isPost ? !!title.trim() : true);

    return (
        <div className="studio-upload">

            {/* ── Header ── */}
            <div className="upload-header">
                <h2 className="upload-title">
                    <span className="logo-dot" />
                    {isPost ? "Post Yaratish" : "Story Yaratish"}
                </h2>

                <div className="type-toggle">
                    <button
                        onClick={() => setUploadType("post")}
                        className={isPost ? "active-post" : ""}
                    >
                        📌 Post
                    </button>
                    <button
                        onClick={() => setUploadType("story")}
                        className={!isPost ? "active-story" : ""}
                    >
                        ⏳ Story
                    </button>
                </div>
            </div>

            {/* ── Card ── */}
            <div className="upload-card">

                {/* LEFT — Dropzone */}
                <div className="upload-dropzone-col">
                    <div
                        className={`upload-dropzone ${hasFile ? "has-file" : ""}`}
                        onClick={() => !hasFile && fileInputRef.current?.click()}
                    >
                        {!hasFile ? (
                            <div className="upload-area">
                                <div className="upload-icon-wrap">
                                    <span className="upload-icon">🎬</span>
                                </div>
                                <p className="upload-main-text">Fayl tanlang yoki tashlang</p>
                                <p className="upload-sub-text">
                                    MP4, WebM, MOV, JPG, PNG
                                    <span className="upload-hint">Maksimal hajm: 500 MB</span>
                                </p>
                                <button className="select-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                    Fayl tanlash
                                </button>
                            </div>
                        ) : mediaPreview === "video" ? (
                            <div className="video-badge">
                                <span>🎞️</span>
                                <span>Video yuklangan</span>
                            </div>
                        ) : (
                            <img className="img-preview" src={mediaPreview} alt="preview" />
                        )}
                    </div>

                    {/* File info */}
                    {hasFile && (
                        <div className="file-info-badge">
                            <span>📁</span>
                            <span className="file-name">{mediaFile.name}</span>
                            <span style={{ color: "#555", flexShrink: 0 }}>
                                {(mediaFile.size / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    )}

                    {hasFile && (
                        <button
                            className="select-btn"
                            style={{ marginTop: 14, background: "#1e1e1e", boxShadow: "none", border: "1px solid #2a2a2a", color: "#888", width: "100%" }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Faylni almashtirish
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        style={{ display: "none" }}
                    />
                </div>

                {/* RIGHT — Settings */}
                <div className="upload-settings-col">

                    {isPost && (
                        <>
                            <div className="form-group">
                                <label>Sarlavha *</label>
                                <input
                                    type="text"
                                    placeholder="Post uchun sarlavha..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={150}
                                />
                                <span className="char-count">{title.length} / 150</span>
                            </div>

                            <div className="form-group">
                                <label>Izoh</label>
                                <textarea
                                    placeholder="Bu post haqida qisqacha..."
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    maxLength={500}
                                />
                                <span className="char-count">{caption.length} / 500</span>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Music ID</label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        value={musicId}
                                        onChange={(e) => setMusicId(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hashtag ID</label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        value={hashtagId}
                                        onChange={(e) => setHashtagId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Debug */}
                    <div className="debug-panel">
                        <strong>Debug</strong>
                        <div className="debug-item">
                            <div className={`debug-dot ${token ? "ok" : "no"}`} />
                            <span>Token: {token ? "Mavjud" : "Yo'q"}</span>
                        </div>
                        <div className="debug-item">
                            <div className={`debug-dot ${hasFile ? "ok" : "no"}`} />
                            <span>Fayl: {hasFile ? mediaFile.name : "tanlanmagan"}</span>
                        </div>
                        {isPost && (
                            <div className="debug-item">
                                <div className={`debug-dot ${title ? "ok" : "no"}`} />
                                <span>Sarlavha: {title || "kiritilmagan"}</span>
                            </div>
                        )}
                        <div className="debug-item">
                            <div className="debug-dot ok" style={{ background: "#555" }} />
                            <span>Endpoint: {isPost ? "/posts/posts/" : "/posts/stories/"}</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="upload-note">
                        <strong>Eslatma:</strong><br />
                        Story uchun faqat <strong style={{ color: "#25f4ee" }}>fayl</strong> yetarli — 24 soatdan keyin avtomatik o'chadi.<br />
                        Post uchun <strong style={{ color: "#fe2c55" }}>fayl + sarlavha</strong> majburiy.
                    </div>

                    {/* Actions */}
                    <div className="upload-actions">
                        <button
                            className="btn-outline"
                            onClick={handleDiscard}
                            disabled={uploading}
                        >
                            Bekor qilish
                        </button>
                        <button
                            className={`btn-primary${!isPost ? " story-btn" : ""}${uploading ? " uploading" : ""}`}
                            onClick={handleUpload}
                            disabled={!canUpload}
                        >
                            {uploading
                                ? "⏳ Yuklanmoqda..."
                                : isPost
                                    ? "🚀 Postni Joylash"
                                    : "🚀 Story Joylash"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}