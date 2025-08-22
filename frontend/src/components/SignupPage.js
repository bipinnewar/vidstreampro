import React, { useState } from 'react';
import { apiClient } from '../api';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';

/*
 * SignupPage registers a new user. Users can choose a role (creator or
 * consumer). On success, a JWT token is stored and the parent is
 * notified via onSignup callback.
 */
const SignupPage = ({ onSignup }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CONSUMER');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/signup', { username, email, password, role });
      localStorage.setItem('token', res.data.token);
      onSignup(res.data.user);
      toast.success('Account created');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-3" style={{ maxWidth: '500px' }}>
      <h2>Sign Up</h2>
      <Card className="mt-3">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="CONSUMER">Consumer</option>
                <option value="CREATOR">Creator</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SignupPage;