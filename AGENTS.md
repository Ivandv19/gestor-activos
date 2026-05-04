# Gestor de Activos - Backend Rules

Eres un experto en Node.js/Express. Cuando trabajes en este proyecto, sigue estas reglas.

## Core Principles

1. **CommonJS**: Usa `require`/`module.exports`, no ES modules
2. **Async/Await**: Siempre async/await, nunca `.then()/.catch()`
3. **SQL Raw**: No ORM. Usa `mysql2/promise` connection pool con `db.query()`
4. **Controller-Centric**: Toda la lógica de negocio va en controllers/
5. **Linter/Formatter**: Biome con tabs y double quotes (`bun run lint`, `bun run format`)
6. **Runtime**: Bun (usar `bun` en vez de `npm` para todo: install, run, test)

## Code Validation

- `bun run dev` - Iniciar servidor con nodemon
- `bun test` - Ejecutar tests (Jest + Supertest)
- `bun run lint` - Biome lint
- `bun run format` - Biome format
- `bun run check` - Biome check + write

## Project Structure

```
gestor-activos/
├── config/           # DB connection pool, globalConfig
├── controllers/      # Lógica de negocio (try/catch siempre)
├── db/               # Schema SQL
├── middleware/        # authenticate, checkRole, imageUpload, limitarIntentos
├── routes/           # Definiciones de rutas HTTP
├── services/         # Solo hashService (cliente Go microservice)
├── swagger/          # Swagger UI setup
└── tests/            # Jest tests con mocking de DB
```

## API Endpoints

| Módulo       | Prefijo                    |
|--------------|----------------------------|
| Auth         | `/api/auth`                |
| Dashboard    | `/api/dashboard`           |
| Activos      | `/api/gestion-activos`     |
| Asignaciones | `/api/asignaciones`        |
| Garantías    | `/api/garantias`           |
| Historial    | `/api/historial`           |
| Reportes     | `/api/reportes`            |
| Configuración| `/api/configuracion`       |

## Database

- **9 tablas**: usuarios, tipos, proveedores, ubicaciones, activos, asignaciones, proveedoresgarantia, garantias, historial, tiposreporte
- **Naming**: Español (snake_case) para tablas y columnas
- **ENUMs**: `activos.estado` (Disponible/Asignado/En mantenimiento/Dado de baja), `activos.condicion_fisica` (Nuevo/Usado/Dañado), `usuarios.rol` (Administrador/Usuario), `garantias.estado` (Vigente/Por vencer/Vencida)
- **Queries dinámicas**: WHERE y SET clauses construidas con arrays y condicionales
- **Paginación universal**: `page` (default 1), `limit` (default 10), `offset`, dos queries (datos + COUNT)

## Coding Conventions

### Controller Pattern
```javascript
try {
  // validación inline
  if (!campo) return res.status(400).json({ error: "Mensaje" });
  // lógica
  res.status(200).json({ data });
} catch (error) {
  console.error("[ERROR X]:", error.message);
  if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Mensaje" });
  res.status(500).json({ error: "Error interno" });
}
```

### Middleware Pipeline
`authenticate` -> `checkRole("Administrador")` -> controller

### Response Shape
- Listas: `{ data, pagination: { page, limit, total, totalPages } }`
- Ítem: `{ message, ...itemFields }`
- Error: `{ error: "descripción" }` o `{ mensaje: "descripción" }`

## Testing

- **Framework**: Jest + Supertest
- **Estrategia**: Mock completo de DB (no test DB real)
- **Mock obligatorio** al inicio de cada test:
  ```javascript
  jest.mock("../config/db", () => ({ query: jest.fn(), execute: jest.fn(), end: jest.fn() }));
  jest.mock("../middleware/authenticate", () => (req, res, next) => { req.user = { id: 1, rol: "Administrador" }; next(); });
  jest.mock("../middleware/checkRole", () => (role) => (req, res, next) => next());
  ```
- Usar `db.query.mockResolvedValueOnce(...)` para cada llamada secuencial
- `beforeEach(() => jest.clearAllMocks())`

## Known Conventions

- Middleware de auth: `authenticate.js` -> `checkRole.js` -> `imageUpload.js` -> `limitarIntentos.js`
- Hash de contraseñas: microservicio Go externo via `services/hashService.js`
- Errores de SQL chequeados: `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_PARSE_ERROR`, `ER_BAD_FIELD_ERROR`
- Logging con `console.log("[PREFIX] ...")` y `console.time()/console.timeEnd()`
- Casi todo CRUD escribe en tabla `historial` (auditoría)
