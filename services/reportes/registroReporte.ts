import type { EstrategiaReporte } from "./EstrategiaReporte.js";
import { ReporteCostos } from "./tipos/ReporteCostos.js";
import { ReporteGarantias } from "./tipos/ReporteGarantias.js";
import { ReporteHistorial } from "./tipos/ReporteHistorial.js";
import { ReportePorEstado } from "./tipos/ReportePorEstado.js";
import { ReportePorTipo } from "./tipos/ReportePorTipo.js";
import { ReportePorUbicacion } from "./tipos/ReportePorUbicacion.js";
import { ReportePorUsuario } from "./tipos/ReportePorUsuario.js";

const registry = new Map<number, EstrategiaReporte>([
	[1, new ReportePorEstado()],
	[2, new ReportePorUsuario()],
	[3, new ReporteGarantias()],
	[4, new ReporteCostos()],
	[5, new ReporteHistorial()],
	[6, new ReportePorTipo()],
	[7, new ReportePorUbicacion()],
]);

export function obtenerEstrategia(tipoId: number): EstrategiaReporte {
	const strategy = registry.get(tipoId);
	if (!strategy) {
		throw new Error(`Tipo de reporte no válido: ${tipoId}`);
	}
	return strategy;
}
