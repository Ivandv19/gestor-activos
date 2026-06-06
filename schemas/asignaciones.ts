import { z } from "zod";

// Schema de creación de asignación de activo a usuario
export const createAsignacionSchema = z.object({
	activo_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El activo debe ser un número válido" })
		.positive({ error: "El ID del activo es obligatorio" }),
	usuario_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El usuario debe ser un número válido" })
		.positive({ error: "El ID del usuario es obligatorio" }),
	ubicacion_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "La ubicación debe ser un número válido" })
		.positive({ error: "La ubicación es obligatoria" }),
	fecha_asignacion: z
		.string({ error: "Debe ser un texto válido" })
		.min(1, { error: "La fecha de asignación es obligatoria" }),
	fecha_devolucion: z.string({ error: "Debe ser un texto válido" }).optional(),
});

// Schema de actualización de asignación (devolución o cambio de usuario/ubicación)
export const updateAsignacionSchema = z.object({
	fecha_devolucion: z.string({ error: "Debe ser un texto válido" }).optional(),
	usuario_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El usuario debe ser un número válido" })
		.positive({ error: "El usuario debe ser un número positivo" })
		.optional(),
	ubicacion_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "La ubicación debe ser un número válido" })
		.positive({ error: "La ubicación debe ser un número positivo" })
		.optional(),
});
