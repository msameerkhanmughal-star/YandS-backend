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
console.log("B2_BUCKET_ID:", process.env.B2_BUCKET_ID);
console.log("B2_BUCKET_NAME:", process.env.B2_BUCKET_NAME);
let uploadUrlData;

// ✅ Authorize B2
async function authorize() {
  console.log("Authorizing B2...");
  await b2.authorize();

  uploadUrlData = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  console.log("✅ B2 Authorized");
}

authorize();


// ✅ Upload Endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!uploadUrlData) {
      await authorize();
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    await b2.uploadFile({
      uploadUrl: uploadUrlData.data.uploadUrl,
      uploadAuthToken: uploadUrlData.data.authorizationToken,
      fileName: fileName,
      data: file.buffer,
    });

    // ⚠️ BUCKET NAME use karo (ID nahi)
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});