# Deployment Guide

## Quick Deploy

### Option 1: Using the deployment script (Recommended)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual deployment
```bash
# Build React app
npm run build

# Deploy with Docker Compose
docker-compose up --build -d
```

### Option 3: Production deployment
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up --build -d
```

## Verification

After deployment, verify the application is running:

1. **Health Check**: http://localhost:4545/api/health
2. **Web Interface**: http://localhost:4545
3. **Analytics**: http://localhost:4545/api/analytics

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
```

## Production Considerations

### Security
- The application includes Helmet.js for security headers
- CORS is configured for localhost by default
- File upload validation prevents malicious files

### Performance
- Files are automatically cleaned up after download
- Maximum file size limit of 50MB
- Optimized Docker image with multi-stage build

### Monitoring
- Health check endpoint at `/api/health`
- Analytics tracking for conversions
- Request logging with Morgan

## Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Remove all data (CAUTION: This deletes uploaded files)
docker-compose down -v
```

## Scaling

For production with multiple instances:

```bash
# Scale the service
docker-compose up --scale heic-converter=3 -d
```

## Troubleshooting

### Common Issues

1. **Port 4545 already in use**
   - Check what's using the port: `lsof -i :4545`
   - Kill the process or change the port in docker-compose.yml

2. **Docker build fails**
   - Clear Docker cache: `docker system prune -f`
   - Rebuild without cache: `docker-compose build --no-cache`

3. **File conversion fails**
   - Check Docker logs: `docker-compose logs heic-converter`
   - Verify file format is HEIC/HEIF
   - Check file size is under 50MB

### Logs Location

- Application logs: `docker-compose logs heic-converter`
- Health check logs: `docker-compose logs --tail=50 heic-converter`

## Backup

Important directories to backup:
- `./uploads/` - Temporary upload files
- `./output/` - Converted files (auto-cleanup enabled)

Note: Files are automatically cleaned up after download for security.