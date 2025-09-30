// src/middlewares/upload.js
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const { badRequest } = require('../utils/responses');

const upload = multer({ storage: multer.memoryStorage() });

const uploadMiddleware = upload.single('file');

const handleUpload = (req, res) => {
  try {
    if (!req.file) return badRequest(res, '請附上檔案(file)');

    const folder = 'user_avatars'; // Cloudinary 資料夾，可自訂
    const options = { folder, resource_type: 'image' };

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) {
        console.error('[Cloudinary upload error]', err);
        return res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: '上傳失敗' } });
      }
      // 回傳給前端
      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      });
    });

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    console.error('[POST /api/upload] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

module.exports = {
  uploadMiddleware,
  handleUpload,
};
