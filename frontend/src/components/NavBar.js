import React from "react";
import { Link, NavLink } from "react-router-dom";
import { clsx } from "clsx";

const NavBar = ({ user, onLogout }) => {
  const linkCls = ({ isActive }) =>
    clsx(
      "px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition",
      isActive ? "text-white bg-white/10" : "text-slate-300"
    );

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 grid place-items-center font-bold">V</div>
          <span className="text-lg font-semibold tracking-wide">VidStreamPro</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkCls} end>Home</NavLink>
          {user && <NavLink to="/upload" className={linkCls}>Upload</NavLink>}
          {user && <NavLink to="/my-videos" className={linkCls}>My Videos</NavLink>}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-slate-300">Hi, {user.name || user.email}</span>
              <button onClick={onLogout} className="btn-primary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary">Login</Link>
              <Link to="/signup" className="px-4 py-2 rounded-xl ring-1 ring-white/15 hover:bg-white/5">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
