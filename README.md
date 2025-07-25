# HEIC to JPEG Converter

A Docker-containerized web application for converting HEIC/HEIF images to JPEG format with built-in analytics.

## Features

- **File Conversion**: Convert HEIC/HEIF images to JPEG format
- **REST API**: HTTP endpoints for programmatic access
- **Analytics Dashboard**: Real-time conversion statistics
- **Docker Support**: Fully containerized application
- **File Management**: Automatic cleanup of temporary files
- **Health Monitoring**: Built-in health check endpoints

## API Endpoints

### POST `/api/convert`
Convert a HEIC file to JPEG format.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `heicFile` (file upload)

**Response:**
```json
{
  "success": true,
  "message": "File converted successfully",
  "filename": "converted.jpg",
  "downloadPath": "/api/download/abc123-converted.jpg",
  "fileSize": 1234567
}
```

### GET `/api/download/:filename`
Download a converted JPEG file.

### GET `/api/analytics`
Get conversion analytics and statistics.

**Response:**
```json
{
  "totalConversions": 100,
  "successfulConversions": 95,
  "failedConversions": 5,
  "filesProcessed": 100,
  "currentDate": "2025-01-27T..."
}
```

### GET `/api/health`
Health check endpoint.

## Docker Setup

### Using Docker Compose (Recommended)

1. Build and run the container:
```bash
docker-compose up --build
```

2. Access the application:
- Web Interface: http://localhost:4545
- API Base URL: http://localhost:4545/api

### Using Docker directly

1. Build the image:
```bash
docker build -t heic-converter .
```

2. Run the container:
```bash
docker run -p 4545:4545 -v $(pwd)/uploads:/app/uploads -v $(pwd)/output:/app/output heic-converter
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. In another terminal, start the backend:
```bash
cd server && npm install && npm start
```

## File Limits

- Maximum file size: 50MB
- Supported formats: HEIC, HEIF
- Output format: JPEG (90% quality)

## Analytics

The application tracks:
- Total conversion attempts
- Successful conversions
- Failed conversions
- Files processed
- Success rate percentage

## Health Monitoring

Health check available at `/api/health` with:
- Server status
- Uptime information
- Current timestamp
- Port information