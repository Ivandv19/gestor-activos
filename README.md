# Gestor de Activos - Backend

API REST para la gestión de activos fijos, asignaciones y seguimiento de historial.

---

## **Documentación**
Para detalles sobre la arquitectura técnica y la estrategia de calidad, consulta:
- [Diseño y Arquitectura (Testing)](docs/diseno-y-arquitectura.md)

## **Ejecución de Tests**
```bash
npm test
```

## **Arquitectura**
El servidor está construido con **Express** siguiendo una estructura de controladores y rutas, con una separación clara entre `app.js` y `server.js` para facilitar el desarrollo y las pruebas.
