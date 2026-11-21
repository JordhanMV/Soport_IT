# Integration hand-off

## Backend / Electron
- Project root: workspace root.
- Run: `npm run dev` (Electron desktop app; no HTTP backend or fixed port).
- Build: `npm run build`; type check: `npm run typecheck`.
- Health probe: invoke IPC `dashboard:summary`; no HTTP health endpoint.
- IPC handlers: `electron/main/index.ts`; preload contract: `electron/preload/index.ts`.
- Persistence boundary: `database/repository/sqlite-inventory-repository.ts`.

## Frontend
- Project folder: `src/`.
- Run: `npm run dev` (Electron + Vite renderer); build: `npm run build`.
- Live-data seam: `src/api/index.ts` → `window.inventory` preload bridge.
- Mock client/data files: none; renderer calls the IPC bridge directly.
- Shared types: `src/shared/types.ts`, renderer alias `@/shared/types`.

## Complete route / IPC inventory
- UI `/` → `dashboard:summary` → summary of active people, equipment, components and unassigned equipment.
- UI `/personas` → `people:list(search)`, `people:save(input,id?)`, `people:delete(id)`.
- UI `/equipos` → `equipment:list(search)`, `equipment:save(input,id?)`, `equipment:delete(id)`.
- UI `/componentes` → `components:list(search)`, `components:save(input,id?)`, `components:delete(id)`.
- UI `/areas` → `areas:list`, `areas:save(name,id?)`, `areas:delete(id)`.
- IPC operations return typed records; validation / missing-record failures reject the invoke call. There are no HTTP methods, paths, or HTTP status codes.

## Database
- Type: local SQLite file powered by sql.js/WASM.
- File: Electron `app.getPath('userData')/database/inventario.sqlite` (Windows AppData).
- Current schema initialization: repository on startup; formal migration target: `database/migrations/`.
- Migration tool: none yet; create an ordered migration runner/files during integration and move the current schema into it.
- Connection environment variables: none.
- **Do not add seed data.** New database must start empty.

## Services
- Essential: local SQLite persistence (no Azure service).
- Enhancement: none.

## Integration checklist
- Verify schema migration and CRUD/search/delete IPC flows for areas, people, equipment and components.
- Confirm foreign-key behavior (deleting an area clears people.area; deleting a person unassigns its equipment; deleting equipment leaves its components unassigned).
- Run `npm run typecheck`, `npm test`, `npm run build`; no seed data.
