# StockLedger — Inventory & Order Management System

A full-stack inventory, customer, and order management system.

- **Backend:** Python + FastAPI + SQLAlchemy
- **Frontend:** React (Create React App)
- **Database:** PostgreSQL 16
- **Orchestration:** Docker Compose

## 1. Project structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entrypoint
│   │   ├── database.py      # DB engine/session
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/         # products, customers, orders, dashboard
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/                 # React app (pages, components, api client)
│   ├── package.json
│   ├── Dockerfile           # multi-stage build -> served by nginx
│   ├── nginx.conf
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── README.md
```

## 2. Run locally with Docker Compose

```bash
cd inventory-system
cp .env.example .env      # edit POSTGRES_PASSWORD etc. as you like
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Interactive API docs (Swagger): http://localhost:8000/docs
- PostgreSQL: localhost:5432

Data persists in the named volume `inventory_pgdata` between restarts.
To stop: `docker compose down`. To wipe data: `docker compose down -v`.

## 3. API summary

| Resource  | Endpoints |
|-----------|-----------|
| Products  | `POST /products`, `GET /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Customers | `POST /customers`, `GET /customers`, `GET /customers/{id}`, `DELETE /customers/{id}` |
| Orders    | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `DELETE /orders/{id}` |
| Dashboard | `GET /dashboard/summary` |

Business rules enforced by the backend:
- Product SKU and customer email are unique (400 error on conflict).
- Product price/quantity can never be negative (validated + DB check constraints).
- Orders are rejected with `400` if requested quantity exceeds available stock.
- Creating an order atomically decrements stock; deleting/cancelling an order restores it.
- `total_amount` is always calculated server-side from current product prices — never trust a client-supplied total.
- All input is validated with Pydantic; errors return `422` with details, not-found returns `404`, business-rule violations return `400`.

## 4. Environment variables

See `.env.example`. Key variables:

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | db, backend | Database credentials (no defaults committed — set your own) |
| `DATABASE_URL` | backend | Full SQLAlchemy connection string |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins |
| `REACT_APP_API_URL` | frontend (build-time) | Base URL the React app calls for the API |

**No credentials are hardcoded** anywhere in the codebase — everything is read from environment variables with safe local-dev fallbacks only.

## 5. Deploying online for free

Below is one straightforward path using entirely free tiers. Any equivalent host works the same way since everything is a standard Docker image.

### Database — Neon or Supabase (free Postgres)
1. Create a free project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Copy the connection string they give you — this becomes `DATABASE_URL` for the backend (e.g. `postgresql://user:pass@host/dbname?sslmode=require`).

### Backend — Render (free web service)
1. Push this repo to GitHub.
2. On [render.com](https://render.com), create a **New Web Service**, point it at the repo, set the **root directory** to `backend`, and let Render build from the `Dockerfile`.
3. Add environment variables: `DATABASE_URL` (from Neon/Supabase) and `CORS_ORIGINS` (your frontend's URL, added after step below).
4. Deploy — Render gives you a public URL like `https://your-api.onrender.com`.

*(Railway or Fly.io's free/hobby tiers work the same way — connect the repo, point at `backend/Dockerfile`, set the same env vars.)*

### Frontend — Vercel or Netlify (free static hosting)
1. On [vercel.com](https://vercel.com) (or Netlify), import the same repo, set the **root directory** to `frontend`.
2. Build command: `npm run build`, output directory: `build`.
3. Add build-time env var `REACT_APP_API_URL` = your Render backend URL from above.
4. Deploy — you get a public URL like `https://your-app.vercel.app`.
5. Go back to Render and set the backend's `CORS_ORIGINS` to that Vercel URL, then redeploy the backend.

### All-in-one alternative
If you'd rather deploy the whole `docker-compose.yml` as-is, **Railway** and **Fly.io** both support Compose-style multi-service deploys on their free/hobby tiers, and **Koyeb** offers a free service tier per container — push each service (db/backend/frontend) as its own app using the Dockerfiles already in this repo.

## 6. Local development without Docker (optional)

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```
