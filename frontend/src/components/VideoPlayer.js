import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api";
import { toast } from "react-toastify";

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => { loadVideo(); }, [id]);

  const loadVideo = async () => {
    try {
      const res = await apiClient.get(`/api/videos/${id}`);
      setVideo(res.data.video);
      setComments(res.data.comments || []);
    } catch {
      toast.error("Failed to load video");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await apiClient.post(`/api/videos/${id}/comments`, { text: comment });
      setComment("");
      loadVideo();
    } catch {
      toast.error("Couldn't post comment");
    }
  };

  if (!video) return <div className="mx-auto max-w-5xl px-4 py-6">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          <video controls className="aspect-video w-full bg-black" src={video.playbackUrl || video.url} />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{video.title}</h1>
        <p className="mt-1 text-slate-300">{video.description}</p>
        <div className="mt-2 flex items-center gap-2">
          {video.genre && <span className="badge">{video.genre}</span>}
          {video.ageRating && <span className="badge">{video.ageRating}</span>}
        </div>
      </div>
      <aside className="card p-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <form onSubmit={submitComment} className="mt-3">
          <textarea className="input" rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..." />
          <button className="btn-primary mt-2">Post</button>
        </form>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">No comments yet</p>
          ) : comments.map((c, idx) => (
            <div key={idx} className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-white/10">
              <div className="text-sm font-medium">{c.author || "User"}</div>
              <div className="text-sm text-slate-300">{c.text}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default VideoPlayer;
