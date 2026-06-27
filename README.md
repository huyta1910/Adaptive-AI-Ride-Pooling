# Adaptive AI Ride Pooling

Boilerplate monorepo for a 15-hour hackathon build. This repository provides the reusable foundation for frontend, backend, database, Docker, CI, and documentation.

The codebase intentionally contains no ride pooling, weather detection, AI, or booking business logic.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, shadcn-style UI primitives, React Router, TanStack Query, React Hook Form, Axios, Lucide Icons, Framer Motion
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic
- Tooling: Docker Compose, ESLint, Prettier, Ruff, Black, isort, mypy

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

## Repository Layout

```text
frontend/    React application
backend/     FastAPI application
database/    SQL seed scripts
docker/      Dockerfiles
docs/        Project documentation
scripts/     Utility scripts
.github/     CI and contribution templates
```

## Team Rules

Feature work should branch from `develop`. Developers add feature modules under `frontend/src/features` or backend feature packages without modifying shared layouts, shared components, theme, routing, or config.
