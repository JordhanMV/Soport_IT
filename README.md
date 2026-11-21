# Inventario de soporte técnico

Aplicación de escritorio para Windows con React, Electron y SQLite local. Los datos se guardan en la carpeta de usuario que devuelve `app.getPath('userData')`, bajo `database/inventario.sqlite`; nunca se envían a un servicio remoto.

## Requisitos

- Node.js 22.12 o posterior y npm.
- Windows para ejecutar y empaquetar el instalador de escritorio.

## Desarrollo y comprobaciones

```powershell
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

Para generar un instalador Windows en `release/`:

```powershell
npm run package
```

## Publicar una actualización

La app consulta GitHub Releases al abrirse y cada seis horas. Si encuentra una versión nueva, ofrece descargarla; cuando termina, solicita confirmación para reiniciar e instalar. También se puede iniciar la búsqueda con el botón **Buscar actualizaciones**. El actualizador solo funciona en la aplicación instalada, no en `npm run dev`.

El publicador está configurado para el repositorio público `JordhanMV/Soport_IT`. Para publicar una versión, actualiza `version` en `package.json`, crea y sube un tag con prefijo `v` que coincida (por ejemplo, `v1.1.0`). El workflow `.github/workflows/release.yml` construirá el instalador Windows y lo publicará como GitHub Release. Cada Release debe incluir el instalador y el archivo `latest.yml`, que electron-updater usa para detectar versiones.

El repositorio de GitHub debe contener primero este código. La base SQLite sigue guardándose localmente; el actualizador solo descarga el instalador de la aplicación.

## Arquitectura local

- React solo consume la interfaz tipada `src/api/index.ts`.
- El preload expone operaciones CRUD acotadas mediante `contextBridge`; no expone Node ni SQL al renderer.
- Los handlers IPC en `electron/main/inventory-ipc.ts` delegan al repositorio `database/repository/sqlite-inventory-repository.ts`.
- SQLite (sql.js/WASM) serializa el archivo local al guardar; la UI no tiene acceso directo al archivo.
- `database/migrations/runner.ts` aplica las migraciones SQLite ordenadas desde `database/migrations/` al iniciar; solo contienen esquema y no cargan datos de ejemplo.
- Personas, áreas, equipos y componentes empiezan vacíos; no se insertan datos de ejemplo.
- La capa `src/api/index.ts` permite reemplazar el transporte en el futuro sin alterar las pantallas.

## Funciones

- Panel con resumen de personas, equipos, componentes y equipos disponibles.
- Búsqueda, altas, edición y bajas de personas y equipos.
- Registro, asignación, búsqueda y edición de componentes.
- Administración de áreas; al eliminar un área, sus personas quedan sin área.
- Restricciones de unicidad para el identificador de equipo y una sola computadora asignada por persona.
