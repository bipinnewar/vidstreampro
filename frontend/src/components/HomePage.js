import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { GENRE_OPTIONS } from "../constants";

/*
 * HomePage displays a searchable list of videos. Users can filter by
 * keyword or genre. Each video card links to the player page. Data
 * is fetched from the backend via the /api/videos endpoint.
 */
const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.videos)) return data.videos;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const loadVideos = async (query = {}, showToast = false) => {
    try {
      const res = await apiClient.get("/api/videos", { params: query });
      const list = normalizeList(res.data);
      setVideos(list);
      if (showToast) toast.success(`${list.length} videos found`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load videos");
      setVideos([]); // ensure array to avoid map crash
    }
  };

  const handleSearch = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (genre.trim()) params.genre = genre.trim();
    loadVideos(params, true);
  };

  return (
    <Container>
      {/* Hero section introduces the app with a welcoming message */}
      <div className="hero-section">
        <h1>Welcome to VidStreamPro</h1>
        <p>Discover and share your favorite videos with the world.</p>
      </div>

      <h2 className="mb-3">Latest Videos</h2>
      {/* Search and filter bar wrapped for responsive layout */}
      <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-end mb-4">
        <div className="flex-grow-1 me-md-2 mb-2 mb-md-0">
          <Form.Control
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="me-md-2 mb-2 mb-md-0" style={{ minWidth: '150px' }}>
          <Form.Select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All genres</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Form.Select>
        </div>
        <div>
          <Button onClick={handleSearch} className="w-100">
            Search
          </Button>
        </div>
      </div>

      <Row>
        {Array.isArray(videos) &&
          videos.map((video) => {
            const id = video.id || video.videoId || video._id;
            return (
              <Col key={id} md={6} lg={4} className="mb-4">
                <Card className="h-100">
                  <Card.Body className="d-flex flex-column">
                    <div className="mb-2">
                      <Card.Title>{video.title || 'Untitled'}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {[video.genre, video.ageRating]
                          .filter(Boolean)
                          .join(' | ')}
                      </Card.Subtitle>
                    </div>
                    <Card.Text className="flex-grow-1">
                      {(video.description || '').substring(0, 100)}...
                    </Card.Text>
                    <div className="mb-2">
                      <Card.Text className="mb-0">
                        <strong>Rating:</strong>{' '}
                        {typeof video.ratingAvg === 'number'
                          ? video.ratingAvg.toFixed(1)
                          : 'N/A'}{' '}
                        ({video.ratingCount || 0})
                      </Card.Text>
                    </div>
                    <div className="mt-auto d-grid">
                      <Link className="btn btn-primary" to={`/videos/${id}`}>
                        Watch
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
      </Row>
    </Container>
  );
};

export default HomePage;
