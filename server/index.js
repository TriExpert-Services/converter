const express = require('express');
const multer = require('multer');
const convert = require('heic-convert');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 4545;

// Analytics storage
let analytics = {
  totalConversions: 0,
  successfulConversions: 0,
  failedConversions: 0,
  filesProcessed: 0,
  dailyStats: {},
  lastResetDate: new Date().toDateString()
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('dist'));

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
const outputDir = path.join(process.cwd(), 'output');

const ensureDirectories = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/heic', 'image/heif'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || fileExt === '.heic' || fileExt === '.heif') {
      cb(null, true);
    } else {
      cb(new Error('Only HEIC/HEIF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Update daily stats
const updateDailyStats = () => {
  const today = new Date().toDateString();
  if (analytics.lastResetDate !== today) {
    analytics.dailyStats[analytics.lastResetDate] = {
      conversions: analytics.totalConversions,
      successful: analytics.successfulConversions,
      failed: analytics.failedConversions,
      files: analytics.filesProcessed
    };
    analytics.lastResetDate = today;
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

app.get('/api/analytics', (req, res) => {
  updateDailyStats();
  res.json({
    ...analytics,
    currentDate: new Date().toISOString()
  });
});

app.post('/api/convert', upload.single('heicFile'), async (req, res) => {
  if (!req.file) {
    analytics.failedConversions++;
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log(`Converting file: ${req.file.originalname}`);
  analytics.totalConversions++;
  analytics.filesProcessed++;

  try {
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}.jpg`;
    const outputPath = path.join(outputDir, `${uuidv4()}-${outputFilename}`);

    // Read HEIC file
    const inputBuffer = await fs.readFile(inputPath);
    
    // Convert to JPEG
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });

    // Save converted file
    await fs.writeFile(outputPath, outputBuffer);
    
    // Clean up input file
    await fs.unlink(inputPath);

    analytics.successfulConversions++;

    console.log(`Conversion successful: ${outputFilename}`);

    res.json({
      success: true,
      message: 'File converted successfully',
      filename: outputFilename,
      downloadPath: `/api/download/${path.basename(outputPath)}`,
      fileSize: outputBuffer.length
    });

  } catch (error) {
    console.error('Conversion error:', error);
    analytics.failedConversions++;
    
    // Clean up input file on error
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).json({ error: 'File not found' });
      } else {
        // Clean up file after download
        setTimeout(async () => {
          try {
            await fs.unlink(filePath);
            console.log(`Cleaned up file: ${filename}`);
          } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError);
          }
        }, 5000); // Delete after 5 seconds
      }
    });
  } catch (error) {
    console.error('File access error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  analytics.failedConversions++;
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
const startServer = async () => {
  await ensureDirectories();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HEIC to JPEG Converter running on port ${PORT}`);
    console.log(`📊 Analytics endpoint: http://localhost:${PORT}/api/analytics`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(console.error);