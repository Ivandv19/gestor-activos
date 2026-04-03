# Gestor de Activos IT (Backend)

## Descripción

Este proyecto funciona como la API del Gestor de Activos IT, un sistema diseñado para administrar y rastrear los recursos tecnológicos de una organización. Este backend se encarga de procesar la lógica, validar la información y proveer los datos necesarios a la aplicación web.

## Características

- **Inventario Centralizado**: Mantiene un registro estructurado del hardware, software y dispositivos de la empresa.
- **Alertas Tempranas**: Calcula fechas para advertir sobre garantías próximas a expirar, licencias por vencer y activos en mantenimiento.
- **Seguimiento de Ciclo de Vida**: Guarda el historial de cada equipo, desde su adquisición y asignación, hasta su baja.
- **Búsqueda y Filtros**: Proporciona funciones para realizar búsquedas rápidas y filtrado por estado, tipo o ubicación.

## Secciones

1. **Autenticación**: Rutas para manejar el inicio de sesión de los administradores del sistema.
2. **Dashboard**: Compila resúmenes estadísticos e información general del sistema.
3. **Gestión de Recursos**: Archivos y rutas dedicadas a crear, modificar o eliminar registros de activos.
4. **Asignaciones**: Módulo que conecta un equipo informático directamente con su usuario asignado.

## Uso

- **Integración Base**: Esta API está diseñada para proveer los datos directamente a la aplicación en Angular.
- **Formato Estándar**: Todas las comunicaciones y envío de datos se manejan en formato JSON.
- **Rutas Protegidas**: Las operaciones de creación o edición de inventario requieren credenciales de autorización.

## Tecnologías Utilizadas

- Node.js
- Express
- Jest
- npm

## Instalación

1. **Clonar el Repositorio**: Descarga el código de este proyecto en tu máquina local usando Git.

```bash
git clone https://github.com/Ivandv19/gestor-activos.git
```

2. **Instalar Dependencias**: Abre una terminal dentro de la carpeta del proyecto y ejecuta:

```bash
npm install
```

3. **Variables de Entorno**: Configura tu archivo `.env` en la raíz del proyecto con las credenciales de tu base de datos y llaves de seguridad necesarias.

4. **Iniciar el Servidor**: Inicia la API localmente con el siguiente comando:

```bash
npm run dev
```

## Créditos

Este es el proyecto encargado de la gestión de información para el sistema empresarial.

- Desarrollado por Ivan Cruz.

## Despliegue

Este motor de datos se encuentra desplegado y administrado permanentemente a través de **Dokploy** en un servidor VPS.

Puedes consultar la documentación interactiva de la API (Swagger) aquí: [Documentación API](https://gestor-activos-backend.fluxdv.icu/api/docs/)

## Licencia

Licencia de Uso Personal:

Este software es propiedad de **Ivan Cruz**. Se permite el uso de este software solo para fines personales y no comerciales. No se permite la distribución, modificación ni uso comercial de este software sin el consentimiento expreso de **Ivan Cruz**.

Cualquier uso no autorizado puede resultar en acciones legales.
