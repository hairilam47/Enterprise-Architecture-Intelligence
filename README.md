# Enterprise Architecture Intelligence

Local-first enterprise architecture workbench with layered architecture, domain entities, graph intelligence, traceability, composition canvas, and workspace persistence.

## Frontend

```bash
npm install
npm run dev
npm run build
```

## Backend

The Sprint 11 backend is a minimal Node.js + Express + TypeScript API with file-based JSON storage.

```bash
cd server
npm install
npm run dev
npm run build
npm start
```

Default backend URL:

```text
http://127.0.0.1:8787/api
```

Frontend API repository mode uses `VITE_WORKSPACE_API_BASE_URL` when set, otherwise it defaults to `http://127.0.0.1:8787/api`.

Implemented backend endpoints:

```text
GET    /api/health
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id
POST   /api/workspaces/import
GET    /api/workspaces/:id/export
```

Workspace documents are stored locally under `server/data/workspaces/` as JSON files. This folder is intentionally treated as runtime data.
