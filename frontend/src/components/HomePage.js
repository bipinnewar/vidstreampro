import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

/*
 * HomePage displays a searchable list of videos. Users can filter by
 * keyword or genre. Each video card links to the player page. Data
 * is fetched from the backend via the /api/videos endpoint.
 */
const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async (query = {}, showToast = false) => {
    try {
      const res = await apiClient.get('/api/videos', { params: query });
      setVideos(res.data);
      if (showToast) toast.success(`${res.data.length} videos found`);
    } catch (err) {
      toast.error('Failed to load videos');
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
      <h2 className="mt-3">Latest Videos</h2>
      <div className="d-flex mb-3">
        <Form.Control
          type="text"
          placeholder="Search by title..."
          className="me-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Control
          type="text"
          placeholder="Filter by genre..."
          className="me-2"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <Row>
        {videos.map((video) => (
          <Col key={video.id} md={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{video.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {video.genre} {video.ageRating ? `| ${video.ageRating}` : ''}
                </Card.Subtitle>
                <Card.Text>{video.description?.substring(0, 80)}...</Card.Text>
                <Card.Text>
                  Rating: {video.ratingAvg?.toFixed(1) || 'N/A'} ({video.ratingCount || 0})
                </Card.Text>
                <Link className="btn btn-primary" to={`/videos/${video.id}`}>
                  Watch
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default HomePage;