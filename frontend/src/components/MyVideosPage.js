import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api";
import { toast } from "react-toastify";

const MyVideosPage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/api/me/videos");
        setVideos(res.data || []);
      } catch (err) {
        toast.error("Failed to load your videos");
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">My videos</h1>
      {videos.length === 0 ? (
        <p className="text-slate-300">You haven't uploaded any videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Link key={v.id || v._id} to={`/video/${v.id || v._id}`} className="card overflow-hidden">
              <div className="aspect-video">
                <img src={v.thumbnailUrl || v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="line-clamp-1 font-medium">{v.title}</div>
                <div className="mt-1 text-sm text-slate-400">{new Date(v.createdAt).toLocaleString()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVideosPage;
