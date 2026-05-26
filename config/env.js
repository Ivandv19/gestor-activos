const z = require("zod");

const envSchema = z.object({
	SERVER_PORT: z.coerce.number().default(3030),
	FRONTEND_URL: z
		.string()
		.url({ error: "FRONTEND_URL debe ser una URL válida" })
		.default("http://localhost:4200"),
	DB_HOST: z.string().min(1, { error: "DB_HOST es requerido" }),
	DB_PORT: z.coerce.number().default(3306),
	DB_USER: z.string().min(1, { error: "DB_USER es requerido" }),
	DB_PASSWORD: z.string().min(1, { error: "DB_PASSWORD es requerido" }),
	DB_NAME: z.string().min(1, { error: "DB_NAME es requerido" }),
	JWT_SECRET: z.string().min(32, {
		error: "JWT_SECRET debe tener al menos 32 caracteres",
	}),
	JWT_EXPIRES_IN: z.string().default("1h"),
	HASH_SERVICE_URL: z
		.string()
		.url({ error: "HASH_SERVICE_URL debe ser una URL válida" })
		.default("http://localhost:3010"),
	HASH_SERVICE_KEY: z
		.string()
		.min(1, { error: "HASH_SERVICE_KEY es requerido" }),
	R2_ACCOUNT_ID: z.string().min(1, { error: "R2_ACCOUNT_ID es requerido" }),
	R2_ACCESS_KEY_ID: z
		.string()
		.min(1, { error: "R2_ACCESS_KEY_ID es requerido" }),
	R2_SECRET_ACCESS_KEY: z
		.string()
		.min(1, { error: "R2_SECRET_ACCESS_KEY es requerido" }),
	R2_BUCKET_NAME: z.string().min(1, { error: "R2_BUCKET_NAME es requerido" }),
	R2_PUBLIC_URL: z
		.string()
		.url({ error: "R2_PUBLIC_URL debe ser una URL válida" })
		.default("https://gestor-assets.mgdc.site"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Error en variables de entorno:");
	for (const issue of parsed.error.issues) {
		console.error(`   ${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

module.exports = parsed.data;
