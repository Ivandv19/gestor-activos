// Zod

// Express
import type {
	NextFunction,
	Request,
	Response,
} from "express-serve-static-core";
import { z } from "zod";

// Middleware: valida el cuerpo de la request contra un esquema Zod
export function validar(schema: z.ZodSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		// 1. Evalúa req.body contra el esquema
		const result = schema.safeParse(req.body);

		// 2. Si falla, devuelve errores detallados por campo
		if (!result.success) {
			const flat = z.flattenError(result.error);
			const errores: Record<string, string[]> = {};
			if (flat.fieldErrors) {
				for (const [campo, msgs] of Object.entries(flat.fieldErrors)) {
					if (msgs && (msgs as string[]).length > 0)
						errores[campo] = msgs as string[];
				}
			}
			res.status(400).json({
				error: result.error.issues[0].message,
				errores,
			});
			return;
		}

		// 3. Asigna los datos validados y continúa
		(req as unknown as Record<string, unknown>).validated = result.data;
		next();
	};
}
