declare global {
	namespace Express {
		interface Request {
			validated?: unknown;
			user?: {
				id: number;
				nombre: string;
				email: string;
				rol: string;
			};
		}
	}
}

export {};
