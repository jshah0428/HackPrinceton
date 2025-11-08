# Backend API

FastAPI backend for HackPrinceton project.

## Setup

1. Install dependencies:

```bash
uv sync
```

2. Copy the `.env.example` file to `.env` and configure:

```bash
cp .env.example .env
```

3. Run the development server:

```bash
uv run python main.py
```

Or use uvicorn directly:

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:

- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `ENVIRONMENT` - Environment mode (development/production)
