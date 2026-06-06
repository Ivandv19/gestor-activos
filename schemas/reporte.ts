import { z } from "zod";

// Schema para generar un reporte de activos por tipo
export const generarReporteSchema = z.object({
	tipo_id: z.coerce
		.number({ error: "Debe ser un número válido" })
		.int({ error: "El tipo de reporte debe ser un número" })
		.positive({ error: "El tipo de reporte es obligatorio" }),
	filtros: z.any().optional(),
});
