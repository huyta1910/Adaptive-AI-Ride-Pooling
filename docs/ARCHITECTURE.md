# Architecture

The repository is split into isolated frontend, backend, database, deployment, and documentation areas.

## Frontend

The React app uses route-level layouts, shared UI primitives, typed API access, and provider composition. Feature work belongs under `frontend/src/features`.

Protected, public, and dashboard layouts are available as stable shells. Shared routing, theme, providers, and layout files are owned by the base architecture.

## Backend

The FastAPI app uses versioned routers, dependency injection, settings management, centralized error handling, SQLAlchemy models, repositories, and service base classes.

Business APIs should be added as new routers under `backend/app/api/v1`.

## Team Boundaries

Developers must not modify shared layouts, shared components, theme, routing, or config during feature work. Feature branches should add isolated modules and tests.
