import React, { useState } from "react";
import { apiClient } from "../api";
import { toast } from "react-toastify";
import { GENRE_OPTIONS } from "../constants";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Choose a video file");
    try {
      setLoading(true);
      const form = new FormData();
      form.append("video", file);
      form.append("title", title);
      form.append("description", description);
      form.append("genre", genre);
      await api.post('/videos/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Uploaded!");
      setFile(null); setTitle(""); setDescription(""); setGenre("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <form onSubmit={submit} className="card p-6">
        <h1 className="text-xl font-semibold">Upload a video</h1>
        <label className="mt-5 block text-sm">Title</label>
        <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
        <label className="mt-4 block text-sm">Description</label>
        <textarea className="input" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
        <label className="mt-4 block text-sm">Genre</label>
        <select className="input" value={genre} onChange={e=>setGenre(e.target.value)}>
          <option value="">Select genre</option>
          {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="mt-4 block text-sm">Video file</label>
        <input className="input file:mr-4 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white hover:file:bg-brand-500" type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0])} />
        <button className="btn-primary mt-6" disabled={loading}>{loading? "Uploading..." : "Upload"}</button>
      </form>
    </div>
  );
};

export default UploadPage;
