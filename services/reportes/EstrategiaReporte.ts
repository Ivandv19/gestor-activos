export interface EstrategiaReporte {
	buildQuery(filtros: Record<string, unknown>): {
		query: string;
		params: unknown[];
	};
	procesar(results: Record<string, unknown>[]): {
		resumen: Record<string, unknown>;
		detalles: Record<string, unknown>[];
	};
}
