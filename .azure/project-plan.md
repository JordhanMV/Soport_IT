# Project Plan

**Status**: Approved
**Created**: 2026-11-19
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Crear una aplicación de escritorio para Windows que registre áreas, personas, computadoras y componentes, permita administrar los registros y localizar rápidamente el equipo asignado a una persona.

**App Type**: SPA + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite con Electron |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

The Electron main process will provide local IPC operations for data CRUD and search. The renderer will contain the React interface and SQLite access will remain isolated behind the Electron IPC layer, prepared for a later shared database adapter without implementing that integration now.

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| SQLite local | Persistir personas, áreas, equipos, componentes y asignaciones | — | Archivo de base de datos local en AppData | Essential |

No Azure services are required for the current local-only version.

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | `inventario-escritorio` | ✅ | v20.18.0 |
| npm | `inventario-escritorio` | ✅ | 10.8.2 |
| Git | `inventario-escritorio` | ✅ | git version 2.47.0.windows.1 |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Microsoft Edge | `inventario-escritorio` | ✅ | Microsoft Edge instalado en Windows |

The Edge row is for Chromium/Electron developer tooling. An Electron debugger integration extension was not detected, so verify the launch configuration before debugging the packaged app.

---

## 5. Design System & UI

**Component Library**: Fluent UI v9

**Style Direction**: Consola interna moderna y densa, con superficies limpias, elevaciones suaves, esquinas de 6 px y énfasis en tablas y búsquedas fáciles de escanear.

**Typography**: Segoe UI Variable, Segoe UI, system-ui

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#185ABD` | Acciones principales, enlaces y elementos activos del inventario |
| `accent` | `#00A6A6` | Resaltados de componentes disponibles y estados secundarios |
| `surface` | `#F5F7FA` | Fondo general y superficies de trabajo |
| `text` | `#182230` | Texto principal de registros y formularios |
| `muted` | `#697586` | Subtítulos, metadatos y columnas secundarias |
| `border` | `#D0D5DD` | Divisiones, bordes de inputs y tarjetas |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|---------|
| Panel | `/` | Mostrar resumen de equipos, personas y componentes | `header,nav,main,kpi-row,table,actions` |
| Personas | `/personas` | Registrar y buscar personas, editar datos y consultar su equipo | `header,nav,sidebar,main,split(search|form),table,actions` |
| Equipos | `/equipos` | Administrar computadoras y componentes asociados | `header,nav,main,table,actions,modal` |

### Sample Content

```
Panel — registros principales:
| Métrica | Valor | Estado |
| Personas activas | 48 | Completo |
| Equipos registrados | 53 | Completo |
| Componentes asignados | 212 | Completo |
| Equipos sin asignar | 5 | Atención |

Personas — registros:
| Persona | Área | Equipo | Estado |
| Mariana López | Finanzas | FIN-042 | Activo |
| Carlos Herrera | Sistemas | SIS-011 | Activo |
| Sofía Ramírez | Recursos Humanos | RH-018 | Activo |
| Luis Mendoza | Operaciones | OPR-027 | Activo |

Equipos — registros:
| Equipo | Persona | Procesador | Memoria | Estado |
| FIN-042 | Mariana López | Intel Core i5-12400 | 16 GB | Operativo |
| SIS-011 | Carlos Herrera | AMD Ryzen 7 7700 | 32 GB | Operativo |
| RH-018 | Sofía Ramírez | Intel Core i5-12400 | 16 GB | Operativo |
| OPR-027 | Luis Mendoza | Intel Core i5-11400 | 16 GB | Mantenimiento |
```

---

## 6. Project Structure

```
inventario-escritorio/
├── package.json
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes/
│   │       ├── Panel.tsx
│   │       ├── Personas.tsx
│   │       └── Equipos.tsx
│   ├── components/
│   ├── features/
│   │   ├── personas/
│   │   ├── equipos/
│   │   ├── areas/
│   │   └── componentes/
│   ├── services/
│   │   └── ipc-client.ts
│   └── test/
├── database/
│   ├── migrations/
│   └── repository/
└── vite.config.ts
```

---

## 7. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/` | Vista principal del inventario | — | Resumen de personas, equipos y componentes | 200 |
| 2 | GET | `/personas` | Buscar personas y listar sus equipos | Filtros opcionales de nombre o área | Lista de personas y asignaciones | 200 |
| 3 | POST | `ipc://personas/create` | Registrar una persona | Persona y área | Persona creada | 200, 400 |
| 4 | PUT | `ipc://personas/update` | Editar una persona | Identificador y cambios | Persona actualizada | 200, 400, 404 |
| 5 | DELETE | `ipc://personas/delete` | Eliminar una persona | Identificador | Confirmación | 200, 404 |
| 6 | GET | `/equipos` | Listar equipos y componentes | Filtros opcionales | Lista de equipos y componentes | 200 |
| 7 | POST | `ipc://equipos/create` | Registrar una computadora | Computadora, persona y componentes | Equipo creado | 200, 400 |
| 8 | PUT | `ipc://equipos/update` | Editar equipo o componentes | Identificador y cambios | Equipo actualizado | 200, 400, 404 |
| 9 | DELETE | `ipc://equipos/delete` | Eliminar una computadora | Identificador | Confirmación | 200, 404 |

---

## 8. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to local SQLite IPC repositories and smoke-test the CRUD flows
3. Run **azure-debug-plan** → **azure-debug-generate** for the Electron and VS Code debugging configuration
4. Run the **azure-deploy** agent only if a later shared or cloud-backed deployment is selected
