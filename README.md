Run the backend with:

```bash
cd backend
uv run main.py
```

Run the frontend with:

```bash
cd frontend
bun run dev
```

Run migrations with:

```bash
uv run alembic revision --autogenerate -m <migration_name>
uv run alembic upgrade head # to apply the migration
```

Docker

```bash
docker-compose up -d # to start the database
docker-compose down # to stop the database
```
