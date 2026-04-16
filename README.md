# Smart AI Code Reviewer

Smart AI Code Reviewer ab `React + Tailwind` frontend, `FastAPI` backend, `LangChain + OpenAI` LLM integration, aur `Docker + Jenkins` delivery format me aligned hai.

## Stack

- Frontend: React 18 + Tailwind CSS
- Backend: FastAPI + SQLAlchemy
- AI layer: LangChain + OpenAI
- Infra: Docker Compose + Jenkins

## Project Structure

```text
ai_agents/              LangChain-backed review orchestration
backend/app/            FastAPI app, routes, schemas, services, db
docker/                 Frontend and backend Dockerfiles
frontend/               React + Tailwind browser app
tests/                  API and orchestration tests
docker-compose.yml      Local multi-container setup
Jenkinsfile             CI pipeline for tests and Docker build
```

## Run With Docker

```powershell
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## Run Locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend static app ko directly `frontend/index.html` se ya kisi static server se open kar sakte ho.

## Environment Variables

- `DATABASE_URL`
- `REVIEW_PROVIDER=heuristic|llm`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `CORS_ORIGINS`

## API

- `GET /health`
- `POST /api/v1/reviews`
- `GET /api/v1/reviews`
- `GET /api/v1/reviews/{review_id}`

## Jenkins Pipeline

`Jenkinsfile` do stages define karta hai:

- Python dependencies install plus unit tests
- Docker image build through `docker compose build`

## Tests

```powershell
python -m unittest discover -s tests -q
```
