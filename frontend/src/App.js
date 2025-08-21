import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import HomePage from './components/HomePage';
import VideoPlayer from './components/VideoPlayer';
import UploadPage from './components/UploadPage';
import MyVideosPage from './components/MyVideosPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { ToastContainer, toast } from 'react-toastify';

/*
 * Root component for the application. It manages authentication state
 * by reading the JWT from localStorage, exposes login and logout
 * helpers, and conditionally renders routes based on the user's role.
 */
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ userId: decoded.userId, username: decoded.username, role: decoded.role });
      } catch (err) {
        console.error('Invalid token', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out');
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            VidStreamPro
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
              {user && user.role === 'CREATOR' && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/upload">
                      Upload
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/my-videos">
                      My Videos
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <ul className="navbar-nav mb-2 mb-lg-0">
              {user ? (
                <>
                  <li className="nav-item">
                    <span className="navbar-text me-2">Hello, {user.username}</span>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item me-2">
                    <Link className="btn btn-outline-light" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-primary" to="/signup">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <div className="container mt-3">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/videos/:id" element={<VideoPlayer />} />
          {user && user.role === 'CREATOR' && (
            <>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/my-videos" element={<MyVideosPage />} />
            </>
          )}
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <SignupPage onSignup={setUser} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;