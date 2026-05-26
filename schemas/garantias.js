const { z } = require("zod");

const estadosGarantia = ["Vigente", "Por vencer", "Vencida"];

exports.createGarantiaSchema = z
	.object({
		activo_id: z.coerce
			.number({ error: "Debe ser un número válido" })
			.int({ error: "El activo debe ser un número válido" })
			.positive({ error: "El ID del activo es obligatorio" }),
		proveedor_garantia_id: z.coerce
			.number({ error: "Debe ser un número válido" })
			.int({ error: "El proveedor debe ser un número válido" })
			.positive({ error: "El proveedor de garantía es obligatorio" }),
		nombre_garantia: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El nombre de la garantía es obligatorio" }),
		fecha_inicio: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "La fecha de inicio es obligatoria" }),
		fecha_fin: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "La fecha de fin es obligatoria" }),
		estado: z.enum(estadosGarantia, { error: "Estado de garantía no válido" }),
		costo: z.coerce
			.number({ error: "Debe ser un número válido" })
			.min(0, { error: "El costo no puede ser negativo" })
			.optional(),
		condiciones: z.string({ error: "Debe ser un texto válido" }).optional(),
		descripcion: z.string({ error: "Debe ser un texto válido" }).optional(),
	})
	.refine(
		(data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio),
		{ error: "La fecha de fin debe ser posterior a la fecha de inicio." },
	);

exports.updateGarantiaSchema = z.object({
	nombre_garantia: z
		.string()
		.min(1, { error: "El nombre de garantía debe ser un texto válido" })
		.optional(),
	estado: z.enum(estadosGarantia, { error: "Estado de garantía no válido" }).optional(),
	fecha_fin: z.string({ error: "Debe ser un texto válido" }).optional(),
	descripcion: z.string({ error: "Debe ser un texto válido" }).optional(),
	proveedor_garantia_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El proveedor debe ser un número válido" })
		.positive({ error: "El proveedor de garantía debe ser un número positivo" })
		.optional(),
	costo: z.coerce
		.number({ error: "Debe ser un número válido" })
		.min(0, { error: "El costo no puede ser negativo" })
		.optional(),
	condiciones: z.string({ error: "Debe ser un texto válido" }).optional(),
});
