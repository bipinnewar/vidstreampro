import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api";
import { toast } from "react-toastify";

const SignupPage = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/api/auth/signup", { name, email, password });
      onSignup(res.data.user);
      toast.success("Account created!");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="card w-full p-6">
        <h1 className="text-xl font-semibold">Create account</h1>
        <label className="mt-5 block text-sm">Name</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        <label className="mt-4 block text-sm">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label className="mt-4 block text-sm">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn-primary mt-6 w-full">Sign up</button>
        <p className="mt-4 text-center text-sm text-slate-300">
          Already have an account? <Link to="/login" className="text-brand-500 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
