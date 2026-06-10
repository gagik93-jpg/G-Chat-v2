const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Jimp = require('jimp');

const router = express.Router();
const { prisma } = require('../index');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { chatId } = req.body;

    if (chatId) {
      const membership = await prisma.chatMember.findFirst({
        where: {
          chatId,
          userId: req.user.id
        }
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
    }

    let thumbnailUrl = null;
    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailName = `thumb-${req.file.filename}`;
      try {
        const image = await Jimp.read(req.file.path);
        await image.resize(300, Jimp.AUTO).quality(80).writeAsync(`./uploads/${thumbnailName}`);
        thumbnailUrl = `/uploads/${thumbnailName}`;
      } catch (e) {
        console.error('Thumbnail error:', e);
      }
    }

    const fileData = {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      thumbnailUrl
    };

    res.json(fileData);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);

    if (!filePath.startsWith(path.join(__dirname, '../../uploads'))) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router;
