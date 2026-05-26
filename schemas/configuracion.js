const { z } = require("zod");

exports.updateConfigSchema = z.object({
	idioma: z.enum(["es", "en", "fr"], { error: "Idioma no válido." }),
	zona_horaria: z.enum(["UTC-5", "UTC+1", "UTC+2"], { error: "Zona horaria no válida." }),
	formato_fecha: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El formato de fecha es obligatorio" }),
	formato_moneda: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El formato de moneda es obligatorio" }),
});

exports.updatePerfilSchema = z
	.object({
		contrasena_actual: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "La contraseña actual es obligatoria" }),
		nombre: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El nombre debe ser un texto válido" }).optional(),
		email: z.string({ error: "Debe ser un texto válido" }).email({ error: "El correo electrónico no es válido." }).optional(),
		departamento: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El departamento debe ser un texto válido" }).optional(),
		nueva_contrasena: z
			.string()
			.min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
			.optional(),
		confirmar_nueva_contrasena: z.string({ error: "Debe ser un texto válido" }).optional(),
		foto_url: z.string({ error: "Debe ser un texto válido" }).optional(),
	})
	.refine(
		(data) => {
			if (!data.nueva_contrasena && !data.confirmar_nueva_contrasena) return true;
			if (!data.nueva_contrasena || !data.confirmar_nueva_contrasena) return false;
			return data.nueva_contrasena === data.confirmar_nueva_contrasena;
		},
		{ error: "La nueva contraseña y su confirmación no coinciden." },
	);
