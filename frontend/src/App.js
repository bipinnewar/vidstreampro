import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import UploadPage from "./components/UploadPage";
import MyVideosPage from "./components/MyVideosPage";
import VideoPlayer from "./components/VideoPlayer";
import NavBar from "./components/NavBar";
import { apiClient } from "./api";
import { ToastContainer } from "react-toastify";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Attempt fetch current user
    (async () => {
      try {
        const res = await apiClient.get("/api/auth/me");
        setUser(res.data || null);
      } catch {}
    })();
  }, []);

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {}
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen">
        <NavBar user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/login" />} />
          <Route path="/my-videos" element={user ? <MyVideosPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage onSignup={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}

export default App;
