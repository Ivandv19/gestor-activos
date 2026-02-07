// swagger/swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Configuración de Swagger
const swaggerOptions = {
	definition: {
		openapi: "3.0.0", // Versión de OpenAPI
		info: {
			title: "API de Gestión de Activos", // Título de tu API
			version: "1.0.0", // Versión de tu API
			description: "API para gestionar activos en la aplicación", // Descripción de tu API
		},
		servers: [
			{
				url: "http://localhost:3000", // URL del servidor
				description: "Servidor local",
			},
		],
	},
	apis: ["./routes/*.js"], // Archivos donde están las rutas con comentarios JSDoc
};

// Generar la documentación
const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerDocs, swaggerUi };
