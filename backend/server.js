const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { CosmosClient } = require('@azure/cosmos');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob');
const {
  TextAnalyticsClient,
  AzureKeyCredential,
} = require('@azure/ai-text-analytics');
require('dotenv').config();

/* ---------- Read SAS helper for playback ---------- */
function getReadSasUrl(blobName, minutes = 120) {
  const cred = new StorageSharedKeyCredential(
    process.env.STORAGE_ACCOUNT_NAME,
    process.env.STORAGE_ACCOUNT_KEY
  );
  const startsOn = new Date(Date.now() - 5 * 60 * 1000); // 5 min clock skew
  const expiresOn = new Date(Date.now() + minutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: process.env.STORAGE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // READ
      startsOn,
      expiresOn,
      protocol: 'https',
    },
    cred
  ).toString();

  return `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.STORAGE_CONTAINER_NAME}/${blobName}?${sas}`;
}

/*
 * REST API for scalable video sharing app (Cosmos DB + Blob Storage + Text Analytics).
 */

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Load configuration from environment variables
const {
  PORT = 4000,
  JWT_SECRET,
  COSMOS_DB_ENDPOINT,
  COSMOS_DB_KEY,
  COSMOS_DB_DATABASE,
  COSMOS_DB_USERS_CONTAINER,
  COSMOS_DB_VIDEOS_CONTAINER,
  COSMOS_DB_COMMENTS_CONTAINER,
  COSMOS_DB_RATINGS_CONTAINER,
  STORAGE_ACCOUNT_NAME,
  STORAGE_ACCOUNT_KEY,
  STORAGE_CONTAINER_NAME,
  AZURE_TEXT_ANALYTICS_ENDPOINT,
  AZURE_TEXT_ANALYTICS_KEY,
} = process.env;

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment');
  process.exit(1);
}

// Initialise Azure clients
const cosmos = new CosmosClient({ endpoint: COSMOS_DB_ENDPOINT, key: COSMOS_DB_KEY });
const db = cosmos.database(COSMOS_DB_DATABASE);
const usersContainer = db.container(COSMOS_DB_USERS_CONTAINER);
const videosContainer = db.container(COSMOS_DB_VIDEOS_CONTAINER);
const commentsContainer = db.container(COSMOS_DB_COMMENTS_CONTAINER);
const ratingsContainer = db.container(COSMOS_DB_RATINGS_CONTAINER);

const storageCredential = new StorageSharedKeyCredential(
  STORAGE_ACCOUNT_NAME,
  STORAGE_ACCOUNT_KEY
);
const blobServiceClient = new BlobServiceClient(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  storageCredential
);
const videoBlobContainer = blobServiceClient.getContainerClient(STORAGE_CONTAINER_NAME);

// Text Analytics client for sentiment analysis
const textAnalyticsClient = new TextAnalyticsClient(
  AZURE_TEXT_ANALYTICS_ENDPOINT,
  new AzureKeyCredential(AZURE_TEXT_ANALYTICS_KEY)
);

// Middleware: authenticate JWT and attach user to request
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Friendlier message as requested
    return res.status(401).json({ error: 'Login required!' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Login required!' });
  }
};

// Middleware: restrict to creators
const requireCreator = (req, res, next) => {
  if (req.user.role !== 'CREATOR') {
    return res.status(403).json({ error: 'Creator role required' });
  }
  next();
};

// Helper: generate SAS URL for uploading a blob
const generateUploadSas = (blobName, contentType) => {
  const expiresOn = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hour
  const sasOptions = {
    containerName: STORAGE_CONTAINER_NAME,
    blobName,
    // include READ so immediate verification/read is allowed
    permissions: BlobSASPermissions.parse('rcw'),
    startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000),
    expiresOn,
    contentType,
  };
  const sasToken = generateBlobSASQueryParameters(sasOptions, storageCredential).toString();
  return `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${STORAGE_CONTAINER_NAME}/${encodeURIComponent(
    blobName
  )}?${sasToken}`;
};

// Helper: run sentiment analysis on comment text
async function analyzeSentiment(text) {
  try {
    const [result] = await textAnalyticsClient.analyzeSentiment([text]);
    const { positive, neutral, negative } = result.confidenceScores;
    return positive - negative;
  } catch (err) {
    console.error('Sentiment analysis error', err);
    return 0;
  }
}

// User signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const normalizedEmail = email.toLowerCase();
  const query = `SELECT * FROM c WHERE c.email = @email`;
  const { resources: existing } = await usersContainer.items
    .query({ query, parameters: [{ name: '@email', value: normalizedEmail }] })
    .fetchAll();
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const userDoc = {
    id: userId,
    username,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: role === 'CREATOR' ? 'CREATOR' : 'CONSUMER',
    createdAt: new Date().toISOString(),
  };
  await usersContainer.items.create(userDoc);
  const token = jwt.sign({ userId, role: userDoc.role, username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  res.status(201).json({ token, user: { userId, username, email: normalizedEmail, role: userDoc.role } });
});

// User login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const normalizedEmail = email.toLowerCase();
  const query = `SELECT * FROM c WHERE c.email = @email`;
  const { resources: users } = await usersContainer.items
    .query({ query, parameters: [{ name: '@email', value: normalizedEmail }] })
    .fetchAll();
  if (users.length === 0) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const user = users[0];
  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id, role: user.role, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token, user: { userId: user.id, username: user.username, email: user.email, role: user.role } });
});

// Get current user profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { resource: user } = await usersContainer.item(userId, userId).read();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { userId: user.id, username: user.username, email: user.email, role: user.role } });
});

/* ---------- VIDEOS ---------- */

// Get all videos with optional search and genre filter (include streamUrl)
app.get('/api/videos', async (req, res) => {
  const { search, genre } = req.query;
  let query = 'SELECT * FROM c';
  const parameters = [];
  const where = [];
  if (search) {
    where.push('CONTAINS(c.title, @search, true)');
    parameters.push({ name: '@search', value: search });
  }
  if (genre) {
    where.push('c.genre = @genre');
    parameters.push({ name: '@genre', value: genre });
  }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY c.createdAt DESC';

  const { resources: videos } = await videosContainer.items
    .query({ query, parameters })
    .fetchAll();

  // Normalize each item and attach a temporary read SAS for playback
  const items = (videos || []).map((v) => {
    // v.videoUrl is stored as either blobName (e.g. "<id>.mp4") or a full URL
    const blob =
      v.blobName ||
      (v.videoUrl ? v.videoUrl.split('/').pop().split('?')[0] : null);

    const streamUrl = blob ? getReadSasUrl(blob, 120) : null;
    return { ...v, streamUrl };
  });

  res.json(items);
});

// Get a single video with comments (include streamUrl)
app.get('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { resource: video } = await videosContainer.item(id, id).read();
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const { resources: comments } = await commentsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.videoId = @id ORDER BY c.timestamp DESC',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    const blob =
      video.blobName ||
      (video.videoUrl ? video.videoUrl.split('/').pop().split('?')[0] : null);

    const streamUrl = blob ? getReadSasUrl(blob, 120) : null;

    res.json({ video: { ...video, streamUrl }, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading video' });
  }
});

// Create a new video (creator only). Returns SAS URL to upload file
app.post('/api/videos', authenticate, requireCreator, async (req, res) => {
  const { title, description, publisher, producer, genre, ageRating, contentType } = req.body;
  const id = uuidv4();
  const blobName = `${id}.mp4`;
  const sasUrl = generateUploadSas(blobName, contentType || 'video/mp4');

  const videoDoc = {
    id,
    title: title || 'Untitled',
    description: description || '',
    publisher: publisher || '',
    producer: producer || '',
    genre: genre || '',
    ageRating: ageRating || '',
    uploadedBy: req.user.userId,
    // store blobName; we’ll compose URLs as needed
    videoUrl: `${blobName}`,
    thumbnailUrl: '',
    status: 'uploading',
    ratingTotal: 0,
    ratingCount: 0,
    ratingAvg: 0,
    createdAt: new Date().toISOString(),
  };
  await videosContainer.items.create(videoDoc);
  res.status(201).json({ id, uploadUrl: sasUrl });
});

// Finalize upload after client finishes uploading
app.post('/api/videos/:id/finalize', authenticate, requireCreator, async (req, res) => {
  const { id } = req.params;
  const { resource: video } = await videosContainer.item(id, id).read();
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (video.uploadedBy !== req.user.userId) return res.status(403).json({ error: 'Not your video' });

  // mark ready; keep `videoUrl` as blobName (safer), playback uses SAS anyway
  video.status = 'ready';
  await videosContainer.items.upsert(video);
  res.json({ ok: true });
});

// Edit video metadata
app.put('/api/videos/:id', authenticate, requireCreator, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { resource: video } = await videosContainer.item(id, id).read();
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (video.uploadedBy !== req.user.userId) return res.status(403).json({ error: 'Not your video' });
  Object.assign(video, updates);
  await videosContainer.items.upsert(video);
  res.json(video);
});

// Delete video
app.delete('/api/videos/:id', authenticate, requireCreator, async (req, res) => {
  const { id } = req.params;
  const { resource: video } = await videosContainer.item(id, id).read();
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (video.uploadedBy !== req.user.userId) return res.status(403).json({ error: 'Not your video' });
  await videosContainer.item(id, id).delete();
  // Not deleting blob in this sample
  res.json({ ok: true });
});

// Post a comment
app.post('/api/videos/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
  const commentId = uuidv4();
  const sentimentScore = await analyzeSentiment(text);
  const comment = {
    id: commentId,
    videoId: id,
    userId: req.user.userId,
    username: req.user.username,
    text,
    sentimentScore,
    timestamp: new Date().toISOString(),
  };
  await commentsContainer.items.create(comment);
  res.status(201).json(comment);
});

// Rate video
app.post('/api/videos/:id/rate', authenticate, async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  const rating = Math.min(5, Math.max(1, Number(score)));
  const { resource: video } = await videosContainer.item(id, id).read();
  if (!video) return res.status(404).json({ error: 'Video not found' });

  // Only allow one rating per user; update if exists
  const ratingQuery = `SELECT * FROM c WHERE c.videoId = @id AND c.userId = @uid`;
  const { resources: existing } = await ratingsContainer.items
    .query({ query: ratingQuery, parameters: [{ name: '@id', value: id }, { name: '@uid', value: req.user.userId }] })
    .fetchAll();

  if (existing.length > 0) {
    const existingRating = existing[0];
    video.ratingTotal = video.ratingTotal - existingRating.score + rating;
    existingRating.score = rating;
    await ratingsContainer.items.upsert(existingRating);
  } else {
    const ratingDoc = { id: uuidv4(), videoId: id, userId: req.user.userId, score: rating };
    video.ratingTotal += rating;
    video.ratingCount += 1;
    await ratingsContainer.items.create(ratingDoc);
  }
  video.ratingAvg = Number((video.ratingTotal / video.ratingCount).toFixed(2));
  await videosContainer.items.upsert(video);
  res.json({ ratingAvg: video.ratingAvg, ratingCount: video.ratingCount });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
