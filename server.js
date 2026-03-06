// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { uploadToB2 } = require('./b2Service');

const app = express();

// ✅ CORS allow all for testing (replace '*' with your frontend domain in production)
app.use(cors({ origin: '*' }));

// Multer config: store file in memory before uploading to B2
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Health check route
app.get('/', (req, res) => res.send('B2 server running'));

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Call B2 service to upload file
    const url = await uploadToB2(req.file.buffer, req.file.originalname);

    res.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`B2 server running on port ${PORT}`));
