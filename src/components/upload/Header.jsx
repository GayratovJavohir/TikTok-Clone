import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import "../../styles/upload/header.css";
import Tiktok_logo from "../../assets/download.png"
import Profile_Pic from "../../assets/64278D6C-146D-4A9D-A8D9-E272869E538E.webp";
import { useState, useEffect } from "react";

export default function Header() {
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

    fetch("http://localhost:8000/users/profile/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);

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

  const avatarSrc =
    profile?.avatar && profile.avatar.trim() !== ""
      ? profile.avatar.startsWith("http")
        ? profile.avatar
        : `http://localhost:8000${profile.avatar}`
      : Profile_Pic;


  return (
    <header className="tiktok-header">
      <div className="header-left">
        <img src={Tiktok_logo} alt="TikTok" className="header-logo" />
        <span className="header-title">TikTok Studio</span>
      </div>

      <div className="header-right">
        <img
          src={avatarSrc}
          alt="Profile"
          className="profile-avatar"
        />
        <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
      </div>
    </header>
  );
}
