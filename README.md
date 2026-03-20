# Auth Service — Smart Campus Services

Authentication microservice for the Smart Campus Services platform (CTSE Cloud Computing Assignment).

## Features

- **User Registration** with email and student ID
- **JWT Authentication** (access + refresh tokens)
- **Profile Management** (view, update)
- **Token Validation** endpoint for inter-service communication
- **Security**: Helmet, CORS, rate limiting, input validation (Joi)
- **API Documentation**: Swagger/OpenAPI auto-generated

## Tech Stack

- Node.js 18 + Express
- MongoDB Atlas (Mongoose ODM)
- JWT (jsonwebtoken) + bcrypt
- Docker (multi-stage build, non-root user)
- GitHub Actions CI/CD
- SonarCloud + Snyk (DevSecOps)

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm run dev     # http://localhost:3001
```

### Docker

```bash
docker build -t auth-service .
docker run -p 3001:3001 --env-file .env auth-service
```

## API Endpoints

| Method | Endpoint         | Auth | Description                    |
| ------ | ---------------- | ---- | ------------------------------ |
| POST   | `/auth/register` | No   | Register new student           |
| POST   | `/auth/login`    | No   | Login & get tokens             |
| GET    | `/auth/profile`  | JWT  | Get user profile               |
| PUT    | `/auth/profile`  | JWT  | Update profile                 |
| POST   | `/auth/refresh`  | No   | Refresh access token           |
| GET    | `/auth/validate` | JWT  | Validate token (inter-service) |
| GET    | `/health`        | No   | Health check                   |

### API Documentation

Once running, visit: http://localhost:3001/api-docs

## Production Deployment

- **Cloud Provider:** Microsoft Azure
- **Service:** Azure Container Apps (managed container orchestration)
- **Registry:** Azure Container Registry (`campusservices.azurecr.io`)
- **Live URL:** https://auth-service.redisland-b57e0bf2.eastus.azurecontainerapps.io

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push/PR to `main`:

1. **Lint & Test** — ESLint + Jest with coverage
2. **Security Scan** — SonarCloud (SAST) + Snyk (dependency vulnerabilities)
3. **Build & Push** — Docker build → push to Azure Container Registry
4. **Deploy** — Update Azure Container App with new image

## Inter-Service Communication

Other microservices (Course, Timetable, Notification) use the `GET /auth/validate` endpoint to verify JWT tokens. Send the token in the `Authorization: Bearer <token>` header.

## Testing

```bash
npm test
```

## Environment Variables

See [`.env.example`](.env.example) for all configurable options.

## License

MIT
