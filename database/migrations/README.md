# Migraciones SQLite locales

Las migraciones ordenadas se declaran como módulos TypeScript `NNN-descripcion.ts` en esta carpeta y se registran en `runner.ts`. El repositorio las aplica al iniciar la app, en orden, dentro de una transacción SQLite; los IDs aplicados quedan en `schema_migrations`.

`001-initial-schema.ts` define únicamente tablas, restricciones e índices. No agregar datos semilla, fixtures ni filas de demostración. La base queda vacía después de migrar una instalación nueva. La persistencia solo se accede desde el proceso principal de Electron mediante IPC.

`002-equipment-specifications.ts` agrega a los equipos el tipo de computadora, marca de laptop, tarjeta gráfica y capacidad/tipo de disco; los equipos existentes se conservan como computadoras de escritorio.
