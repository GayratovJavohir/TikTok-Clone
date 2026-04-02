import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./errors/NotFound"
import "./App.css"
import Profile from "./pages/Profile"
import AnotherProfile from "./pages/AnotherProfile"
import Following from "./pages/Following"
import Friends from "./pages/Friends"
import UploadLayout from "./pages/Upload/UploadLayout"
import StudioUpload from "./pages/Upload/StudioUpload"
import Studio from "./pages/Upload/Studio"
import Posts from "./pages/Upload/Posts"
import Analytics from "./pages/Upload/Analytics"
import Comment from "./pages/Upload/Comment"
import Messages from "./pages/Messages"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<NotFound />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tiktokstudio" element={<UploadLayout />}>
          <Route index element={<Studio />} />
          <Route path="upload" element={<StudioUpload />} />
          <Route path="posts" element={<Posts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="comment" element={<Comment />} />
        </Route>
        <Route path="/profile/:profileId" element={<AnotherProfile />} />
        <Route path="/following" element={<Following />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
      </Routes>
    </Router>
  )
}

export default App
