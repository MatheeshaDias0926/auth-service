# Auth Service — Smart Campus Services

Authentication microservice for the Smart Campus Services platform (CTSE Cloud Computing Assignment).

## Features

- **User Registration** with email and student ID
- **JWT Authentication** (access + refresh tokens)
- **Profile Management** (view, update)
- **Token Validation** endpoint for inter-service communication
- **Security**: Helmet, CORS, rate limiting, input validation
- **API Documentation**: Swagger/OpenAPI auto-generated

## Tech Stack

- Node.js 18 + Express
- MongoDB (Mongoose ODM)
- JWT (jsonwebtoken)
- Docker (multi-stage build)
- GitHub Actions CI/CD
- SonarCloud + Snyk (DevSecOps)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start with nodemon
npm run dev
```

### Docker

```bash
# Start with Docker Compose (includes MongoDB)
docker-compose up --build

# Or build image only
docker build -t auth-service .
docker run -p 3001:3001 --env-file .env auth-service
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new student |
| POST | `/auth/login` | No | Login & get tokens |
| GET | `/auth/profile` | JWT | Get user profile |
| PUT | `/auth/profile` | JWT | Update profile |
| POST | `/auth/refresh` | No | Refresh access token |
| GET | `/auth/validate` | JWT | Validate token (inter-service) |
| GET | `/health` | No | Health check |

### API Documentation

Once running, visit: `http://localhost:3001/api-docs`

## Testing

```bash
npm test
```

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push/PR to `main`:

1. **Lint & Test** — ESLint + Jest with coverage
2. **Security Scan** — SonarCloud (SAST) + Snyk (dependency vulnerabilities)
3. **Build & Push** — Docker build → push to AWS ECR
4. **Deploy** — Update ECS service with new image

## Environment Variables

See [`.env.example`](.env.example) for all configurable options.

## Inter-Service Communication

Other microservices (Course, Timetable, Notification) use the `GET /auth/validate` endpoint to verify JWT tokens. Send the token in the `Authorization: Bearer <token>` header.

## License

MIT
