import { z } from "zod";

// Schema para registrar una acción en el historial del activo
export const registrarAccionSchema = z.object({
	accion: z
		.string({ error: "Debe ser un texto válido" })
		.min(1, { error: "El campo 'accion' es obligatorio" }),
	detalles: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha: z.string({ error: "Debe ser un texto válido" }).optional(),
	usuario_asignado: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El usuario asignado debe ser un número válido" })
		.positive({ error: "El usuario asignado debe ser un número positivo" })
		.optional(),
	ubicacion_nueva: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "La ubicación nueva debe ser un número válido" })
		.positive({ error: "La ubicación nueva debe ser un número positivo" })
		.optional(),
});
