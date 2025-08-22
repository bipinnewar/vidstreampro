import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api";
import { toast } from "react-toastify";
import { GENRE_OPTIONS } from "../constants";

const CardSkeleton = () => (
  <div className="card animate-pulse p-3">
    <div className="aspect-video rounded-lg bg-slate-800" />
    <div className="mt-3 h-4 w-3/4 rounded bg-slate-800" />
    <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
  </div>
);

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/videos", {
        params: { search, genre }
      });
      setVideos(res.data || []);
    } catch (err) {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <form onSubmit={onSubmit} className="mb-6 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search videos..."
          className="input sm:col-span-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-3">
          <select
            className="input"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All genres</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button className="btn-primary" type="submit">Filter</button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : videos.map((v) => (
              <Link
                key={v.id || v._id}
                to={`/video/${v.id || v._id}`}
                className="card overflow-hidden hover:ring-brand-600/40 transition"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={v.thumbnailUrl || v.thumbnail || '/static/placeholder_light_gray_block.png'}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 text-base font-semibold">{v.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-300">{v.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {v.genre && <span className="badge">{v.genre}</span>}
                    <span className="text-xs text-slate-400">{v.publisher || v.producer}</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
};

export default HomePage;
