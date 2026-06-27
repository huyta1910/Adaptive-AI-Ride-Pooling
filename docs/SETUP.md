# Setup

## Prerequisites

- Docker and Docker Compose
- Node.js 22
- Python 3.12

## Local Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

## Local Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```
