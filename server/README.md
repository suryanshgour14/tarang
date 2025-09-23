# Ocean Hazard Monitoring Backend

A production-ready backend for a crowdsourced ocean hazard monitoring platform built with Node.js, Express, TypeScript, and Supabase.

## Features

- 🔐 **Authentication & Authorization** - Supabase Auth with role-based access control
- 📊 **Hazard Reporting** - Citizens can submit reports with geolocation and media
- 🗺️ **Heatmap Visualization** - GeoJSON data for frontend mapping
- 🤖 **NLP Analysis** - Hazard classification and sentiment analysis
- 📱 **Offline Sync** - Bulk report synchronization for mobile apps
- 🛡️ **Security** - Rate limiting, input validation, and sanitization
- 📚 **API Documentation** - Swagger/OpenAPI documentation
- 🧪 **Testing** - Comprehensive unit tests with Jest
- 🐳 **Docker Support** - Production-ready containerization

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your `.env` file with Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Run database migrations:
```bash
# Execute the SQL files in the migrations/ directory in your Supabase dashboard
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, visit `http://localhost:3000/docs` for interactive API documentation.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('citizen', 'official', 'analyst')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    description TEXT NOT NULL,
    media_urls TEXT[],
    location GEOGRAPHY(POINT, 4326),
    status TEXT CHECK (status IN ('new', 'verified', 'rejected')),
    sentiment FLOAT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user by ID (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Reports
- `POST /reports` - Create a new report
- `GET /reports` - Get reports with filters
- `GET /reports/:id` - Get report by ID
- `PATCH /reports/:id/verify` - Verify/reject report (officials only)
- `DELETE /reports/:id` - Delete report
- `GET /reports/heatmap` - Get heatmap data
- `GET /reports/geohash` - Get reports by geohash
- `GET /reports/stats` - Get report statistics
- `POST /reports/sync` - Sync offline reports

### Media
- `POST /media/upload-url` - Generate signed URL for upload
- `GET /media` - List user's media files
- `GET /media/:path` - Get media file info
- `DELETE /media/:path` - Delete media file

### NLP
- `POST /nlp/analyze` - Analyze text for hazards
- `POST /nlp/batch-analyze` - Batch analyze texts
- `GET /nlp/regional-keywords/:region` - Get regional keywords
- `POST /nlp/social-ingest` - Ingest social media posts
- `GET /nlp/status` - Get NLP service status

### Sync
- `POST /sync` - Sync offline reports
- `GET /sync/status` - Get sync status

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Docker Deployment

### Build and run with Docker:
```bash
docker build -t ocean-hazard-api .
docker run -p 3000:3000 --env-file .env ocean-hazard-api
```

### Using Docker Compose:
```bash
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `MAX_FILE_SIZE` | Max file size for uploads | 10485760 |
| `ALLOWED_FILE_TYPES` | Allowed file types | image/jpeg,image/png,image/gif,video/mp4,video/quicktime |
| `NLP_SERVICE_URL` | External NLP service URL | http://localhost:8000 |
| `LOG_LEVEL` | Logging level | info |

## Security Features

- **Rate Limiting**: Configurable rate limits for different endpoints
- **Input Validation**: Zod schema validation for all inputs
- **Input Sanitization**: XSS protection for user inputs
- **Authentication**: JWT-based authentication with Supabase
- **Authorization**: Role-based access control
- **CORS**: Configurable CORS policies
- **Helmet**: Security headers

## Monitoring and Logging

- **Winston Logger**: Structured logging with multiple transports
- **Health Checks**: Built-in health check endpoint
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request Logging**: HTTP request/response logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
