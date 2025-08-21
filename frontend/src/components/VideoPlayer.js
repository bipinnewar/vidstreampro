import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api";
import { Container, Form, Button, ListGroup, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

/*
 * VideoPlayer fetches a single video and its comments. It displays
 * metadata, plays the video via HTML5 <video>, and allows signed-in
 * users to post comments and rate the video. Comments include a
 * sentiment score computed by the backend.
 */
const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVideo = async () => {
    try {
      const res = await apiClient.get(`/api/videos/${id}`);
      setVideo(res.data.video);
      setComments(res.data.comments || []);
    } catch (err) {
      toast.error("Failed to load video");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await apiClient.post(`/api/videos/${id}/comments`, {
        text: commentText,
      });
      setComments([res.data, ...comments]);
      setCommentText("");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Login required!");
      } else {
        toast.error("Failed to submit");
      }
    }
  };

  const submitRating = async () => {
    try {
      const res = await apiClient.post(`/api/videos/${id}/rate`, {
        score: rating,
      });
      setVideo({
        ...video,
        ratingAvg: res.data.ratingAvg,
        ratingCount: res.data.ratingCount,
      });
      toast.success("Thanks for rating!");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Login required!");
      } else {
        toast.error("Failed to submit");
      }
    }
  };

  if (!video) return <Container className="mt-3">Loading...</Container>;

  return (
    <Container className="mt-3">
      <h2>{video.title}</h2>
      <p className="text-muted">
        {video.genre} {video.ageRating ? `| ${video.ageRating}` : ""}
      </p>
      <Row>
        <Col md={8}>
          {/* <video controls width="100%" src={video.videoUrl} /> */}
          <video controls width="100%" src={video?.streamUrl || video?.videoUrl} />
          <p className="mt-2">{video.description}</p>
          <p>
            <strong>Rating:</strong> {video.ratingAvg?.toFixed(2) || "N/A"} (
            {video.ratingCount || 0} ratings)
          </p>
          <div className="d-flex align-items-center mb-3">
            <Form.Select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ width: "100px" }}
              className="me-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
            <Button onClick={submitRating}>Rate</Button>
          </div>
          <h4>Comments</h4>
          <Form onSubmit={submitComment} className="mb-3">
            <Form.Control
              as="textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="mb-2"
            />
            <Button type="submit">Post Comment</Button>
          </Form>
          <ListGroup>
            {comments.map((c) => (
              <ListGroup.Item key={c.id}>
                <strong>{c.username}</strong> (
                {new Date(c.timestamp).toLocaleString()}):
                <br />
                {c.text}
                {typeof c.sentimentScore === "number" && (
                  <small className="text-muted ms-2">
                    Sentiment: {c.sentimentScore.toFixed(2)}
                  </small>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={4}>
          {/* Additional info or related videos could go here */}
        </Col>
      </Row>
    </Container>
  );
};

export default VideoPlayer;
