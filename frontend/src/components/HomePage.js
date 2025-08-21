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
      <h2 className="mt-3">Latest Videos</h2>
      <div className="d-flex mb-3">
        <Form.Control
          type="text"
          placeholder="Search by title..."
          className="me-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Select
          className="me-2"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All genres</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Form.Select>

        <Button onClick={handleSearch}>Search</Button>
      </div>

      <Row>
        {Array.isArray(videos) &&
          videos.map((video) => {
            const id = video.id || video.videoId || video._id;
            return (
              <Col key={id} md={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{video.title || "Untitled"}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {[video.genre, video.ageRating]
                        .filter(Boolean)
                        .join(" | ")}
                    </Card.Subtitle>
                    <Card.Text>
                      {(video.description || "").substring(0, 80)}...
                    </Card.Text>
                    <Card.Text>
                      Rating:{" "}
                      {typeof video.ratingAvg === "number"
                        ? video.ratingAvg.toFixed(1)
                        : "N/A"}{" "}
                      ({video.ratingCount || 0})
                    </Card.Text>
                    <Link className="btn btn-primary" to={`/videos/${id}`}>
                      Watch
                    </Link>
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
