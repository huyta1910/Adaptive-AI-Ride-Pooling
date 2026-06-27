Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Push-Location frontend
npm run lint
npm run typecheck
Pop-Location

Push-Location backend
ruff check .
black --check .
isort --check-only .
mypy app
Pop-Location
