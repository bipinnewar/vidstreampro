import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api";
import { toast } from "react-toastify";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiClient.post("/api/auth/login", { email, password });
      onLogin(res.data.user);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="card w-full p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-300">to continue to VidStreamPro</p>
        <label className="mt-5 block text-sm">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label className="mt-4 block text-sm">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn-primary mt-6 w-full" disabled={loading}>{loading? "Signing in..." : "Sign in"}</button>
        <p className="mt-4 text-center text-sm text-slate-300">
          New here? <Link to="/signup" className="text-brand-500 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
