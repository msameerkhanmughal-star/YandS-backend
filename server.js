require("dotenv").config();
const express = require("express");
const multer = require("multer");
const B2 = require("backblaze-b2");
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY,
});

// Upload Endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    // STEP 1 authorize every upload
    await b2.authorize();

    // STEP 2 get fresh upload URL
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

    const uploadUrl = uploadUrlResponse.data.uploadUrl;
    const uploadAuthToken = uploadUrlResponse.data.authorizationToken;

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    // STEP 3 upload file
    await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: uploadAuthToken,
      fileName: fileName,
      data: file.buffer,
    });

    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;

    res.json({ url: fileUrl });

  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

app.get("/", (req, res) => {
  res.send("B2 Server Running ✅");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});