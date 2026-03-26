# quality_defect_backend

FastAPI backend for the Quality Defect Management System.

## Run (local)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment variables

See `.env.example`. The frontend expects:
- `REACT_APP_BACKEND_URL` / `REACT_APP_API_BASE` for REST
- `REACT_APP_WS_URL` for WebSocket (backend exposes `/ws`)

## Endpoints (high level)

- Auth: `POST /auth/login`, `GET /auth/me`, `GET /auth/roles`, `GET /auth/users`
- Defects: `GET/POST /defects`, `GET/PATCH /defects/{id}`, `POST /defects/{id}/images`
- RCA: `GET/PUT /defects/{id}/rca`
- Corrective Actions: `GET/POST /defects/{id}/corrective-actions`, `PATCH /corrective-actions/{action_id}`
- Metrics/Reports: `GET /metrics/dashboard`, `GET /reports/defects/summary`, `GET /reports/defects/{id}.pdf`
- WebSocket: `GET /ws` (token via query param supported: `?token=...`)
- Static uploads: `GET /uploads/{path}` (served from local storage in this implementation)
