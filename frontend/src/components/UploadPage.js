import React, { useState } from "react";
import { apiClient } from "../api";
import { Container, Form, Button, Card } from "react-bootstrap";
import { toast } from "react-toastify";
import { GENRE_OPTIONS, AGE_RATING_OPTIONS } from "../constants";

/*
 * UploadPage allows creators to upload new videos. It collects
 * metadata, requests a SAS URL from the backend, uploads the file
 * directly to Azure Blob Storage, and then finalizes the upload.
 */
const UploadPage = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    publisher: "",
    producer: "",
    genre: "",
    ageRating: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose a video file");
    try {
      setUploading(true);
      // Request SAS URL and ID
      const meta = { ...form, contentType: file.type || "video/mp4" };
      const initRes = await apiClient.post("/api/videos", meta);
      const { id, uploadUrl } = initRes.data;
      // Upload file directly to blob storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Blob upload failed");
      // Finalize metadata
      await apiClient.post(`/api/videos/${id}/finalize`);
      setUploading(false);
      toast.success("Video uploaded successfully");
      // Reset form
      setForm({
        title: "",
        description: "",
        publisher: "",
        producer: "",
        genre: "",
        ageRating: "",
      });
      setFile(null);
      document.getElementById("fileInput").value = "";
    } catch (err) {
      setUploading(false);
      toast.error(err.response?.data?.error || err.message || "Upload failed");
    }
  };

  return (
    <Container className="mt-3">
      <h2>Upload a Video</h2>
      <Card className="mt-3">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Publisher</Form.Label>
              <Form.Control
                type="text"
                name="publisher"
                value={form.publisher}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Producer</Form.Label>
              <Form.Control
                type="text"
                name="producer"
                value={form.producer}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Genre</Form.Label>
              <Form.Select
                className="mb-2"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              >
                <option value="">Select genre…</option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Age Rating</Form.Label>
              <Form.Select
                className="mb-2"
                value={form.ageRating}
                onChange={(e) => setForm({ ...form, ageRating: e.target.value })}
              >
                <option value="">Select age rating…</option>
                {AGE_RATING_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Video File (MP4)</Form.Label>
              <Form.Control
                type="file"
                id="fileInput"
                accept="video/mp4"
                onChange={handleFileChange}
              />
            </Form.Group>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadPage;
