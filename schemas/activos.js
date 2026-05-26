const { z } = require("zod");

const estadosValidos = [
	"Disponible",
	"Asignado",
	"En mantenimiento",
	"Dado de baja",
];
const condicionesValidas = ["Nuevo", "Usado", "Dañado"];

exports.createActivoSchema = z.object({
	nombre: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El nombre es obligatorio" }),
	tipo_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El tipo de activo debe ser un número" })
		.positive({ error: "El tipo de activo es obligatorio" }),
	fecha_adquisicion: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "La fecha de adquisición es obligatoria" }),
	valor_compra: z.coerce
		.number({ error: "Debe ser un número válido" })
		.positive({ error: "El valor de compra debe ser un número positivo" }),
	estado: z.enum(estadosValidos, { error: "Estado no válido" }),
	proveedor_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El proveedor debe ser un número" })
		.positive({ error: "El proveedor es obligatorio" }),
	ubicacion_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "La ubicación debe ser un número válido" })
		.positive({ error: "La ubicación debe ser un número positivo" })
		.optional(),
	modelo: z.string({ error: "Debe ser un texto válido" }).optional(),
	version_software: z.string({ error: "Debe ser un texto válido" }).optional(),
	tipo_licencia: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_vencimiento_licencia: z.string({ error: "Debe ser un texto válido" }).optional(),
	costo_mensual: z.coerce
		.number({ error: "Debe ser un número válido" })
		.min(0, { error: "El costo mensual no puede ser negativo" })
		.optional(),
	recursos_asignados: z.string({ error: "Debe ser un texto válido" }).optional(),
	dueno_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El dueño debe ser un número válido" })
		.positive({ error: "El dueño debe ser un número positivo" })
		.optional(),
	etiqueta_serial: z.string({ error: "Debe ser un texto válido" }).optional(),
	condicion_fisica: z
		.enum(condicionesValidas, { error: "Condición física no válida" })
		.optional(),
	descripcion: z
		.string()
		.max(500, { error: "La descripción no puede exceder 500 caracteres" })
		.optional(),
	nombre_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
	proveedor_garantia_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El proveedor de garantía debe ser un número válido" })
		.positive({ error: "El proveedor de garantía debe ser un número positivo" })
		.optional(),
	fecha_inicio: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_fin: z.string({ error: "Debe ser un texto válido" }).optional(),
	costo: z.coerce
		.number({ error: "Debe ser un número válido" })
		.min(0, { error: "El costo no puede ser negativo" })
		.optional(),
	condiciones: z
		.string()
		.max(500, { error: "Las condiciones no pueden exceder 500 caracteres" })
		.optional(),
	estado_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
	descripcion_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
});

exports.updateActivoSchema = z.object({
	nombre: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "El nombre debe ser un texto válido" }).optional(),
	tipo_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El tipo de activo debe ser un número" })
		.positive({ error: "El tipo de activo debe ser un número positivo" })
		.optional(),
	fecha_adquisicion: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_registro: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_salida: z.string({ error: "Debe ser un texto válido" }).optional(),
	valor_compra: z.coerce
		.number({ error: "Debe ser un número válido" })
		.positive({ error: "El valor de compra debe ser un número positivo" })
		.optional(),
	etiqueta_serial: z.string({ error: "Debe ser un texto válido" }).optional(),
	descripcion: z
		.string()
		.max(500, { error: "La descripción no puede exceder 500 caracteres" })
		.optional(),
	estado: z.enum(estadosValidos, { error: "Estado no válido" }).optional(),
	proveedor_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El proveedor debe ser un número" })
		.positive({ error: "El proveedor debe ser un número positivo" })
		.optional(),
	ubicacion_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "La ubicación debe ser un número válido" })
		.positive({ error: "La ubicación debe ser un número positivo" })
		.optional(),
	foto_url: z.string({ error: "Debe ser un texto válido" }).optional(),
	modelo: z.string({ error: "Debe ser un texto válido" }).optional(),
	version_software: z.string({ error: "Debe ser un texto válido" }).optional(),
	tipo_licencia: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_vencimiento_licencia: z.string({ error: "Debe ser un texto válido" }).optional(),
	costo_mensual: z.coerce
		.number({ error: "Debe ser un número válido" })
		.min(0, { error: "El costo mensual no puede ser negativo" })
		.optional(),
	recursos_asignados: z.string({ error: "Debe ser un texto válido" }).optional(),
	dueno_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El dueño debe ser un número válido" })
		.positive({ error: "El dueño debe ser un número positivo" })
		.optional(),
	nombre_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
	proveedor_garantia_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El proveedor de garantía debe ser un número válido" })
		.positive({ error: "El proveedor de garantía debe ser un número positivo" })
		.optional(),
	fecha_inicio: z.string({ error: "Debe ser un texto válido" }).optional(),
	fecha_fin: z.string({ error: "Debe ser un texto válido" }).optional(),
	costo: z.coerce
		.number({ error: "Debe ser un número válido" })
		.min(0, { error: "El costo no puede ser negativo" })
		.optional(),
	condiciones: z
		.string()
		.max(500, { error: "Las condiciones no pueden exceder 500 caracteres" })
		.optional(),
	estado_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
	descripcion_garantia: z.string({ error: "Debe ser un texto válido" }).optional(),
});

exports.validarEtiquetaSchema = z.object({
	etiqueta_serial: z.string({ error: "Debe ser un texto válido" }).min(1, { error: "La etiqueta serial es obligatoria" }),
});
