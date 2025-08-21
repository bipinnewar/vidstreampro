import React, { useEffect, useState } from 'react';
import { apiClient } from '../api';
import { Container, Table, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import jwtDecode from 'jwt-decode';

/*
 * MyVideosPage lists all videos uploaded by the currently signed-in
 * creator and allows deletion. Videos are fetched from the /api/videos
 * endpoint and filtered client-side by uploadedBy. Deleting a video
 * simply removes its metadata (the blob remains in storage).
 */
const MyVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const user = getUser();

  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return { userId: decoded.userId, username: decoded.username, role: decoded.role };
    } catch {
      return null;
    }
  }

  const loadVideos = async () => {
    try {
      const res = await apiClient.get('/api/videos');
      setVideos(res.data.filter((v) => v.uploadedBy === user.userId));
    } catch (err) {
      toast.error('Failed to load videos');
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await apiClient.delete(`/api/videos/${id}`);
      setVideos(videos.filter((v) => v.id !== id));
      toast.success('Video deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <Container className="mt-3">
      <h2>My Uploaded Videos</h2>
      {videos.length === 0 ? (
        <p>No videos uploaded yet.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Genre</th>
              <th>Uploaded</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td>{video.title}</td>
                <td>{video.genre}</td>
                <td>{new Date(video.createdAt).toLocaleString()}</td>
                <td>
                  {video.ratingAvg?.toFixed(2) || 'N/A'} ({video.ratingCount || 0})
                </td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => deleteVideo(video.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default MyVideosPage;