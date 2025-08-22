// at the top of the file:
import { useState } from "react";
// adjust this import to match your axios instance path:
import api from "../lib/apiClient"; // e.g., ../utils/apiClient or ../services/api

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [producer, setProducer] = useState("");
  const [genre, setGenre] = useState("");
  const [ageRating, setAgeRating] = useState("PG");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please choose a video file.");
      return;
    }
    setIsLoading(true);
    setStatus("");

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title);
      formData.append("publisher", publisher);
      formData.append("producer", producer);
      formData.append("genre", genre);
      formData.append("ageRating", ageRating);

      const { data } = await api.post("/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus(`Uploaded: ${data?.title ?? "Success"}`);
      setFile(null);
      setTitle("");
      setPublisher("");
      setProducer("");
      setGenre("");
      setAgeRating("PG");
    } catch (err) {
      console.error(err);
      setStatus(err?.response?.data?.message || "Upload failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Upload a video</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-white"
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="Publisher"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="Producer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Genre"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <select
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option>PG</option>
            <option>12</option>
            <option>15</option>
            <option>18</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isLoading ? "Uploading…" : "Upload"}
        </button>

        {status && (
          <p className="text-sm text-gray-700">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}
