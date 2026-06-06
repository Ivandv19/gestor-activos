import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import env from "../config/env.js";
import { usuarios } from "../db/schema.js";
import hashService from "./hashService.js";

// Interfaces de autenticación

interface AuthUser {
	id: number;
	nombre: string;
	email: string;
	rol: string;
	foto_url: string | null;
}

interface RegistroInput {
	nombre: string;
	email: string;
	contrasena: string;
	departamento: string;
	fecha_ingreso: string;
	rol: string;
}

interface LoginInput {
	email: string;
	contrasena: string;
}

interface LoginResult {
	token: string;
	userData: AuthUser;
}

// Registro de un nuevo usuario en el sistema
export async function registrarUsuario(input: RegistroInput): Promise<void> {
	// Verifica si el correo ya está registrado
	const [existingUser] = await db
		.select()
		.from(usuarios)
		.where(eq(usuarios.email, input.email))
		.limit(1);
	if (existingUser) {
		throw new Error("El correo electrónico ya está registrado");
	}

	// Encripta la contraseña antes de guardarla
	const hashedPassword = await hashService.generarHash(input.contrasena);

	await db.insert(usuarios).values({
		nombre: input.nombre,
		email: input.email,
		contrasena: hashedPassword,
		departamento: input.departamento,
		fecha_ingreso: input.fecha_ingreso ? new Date(input.fecha_ingreso) : null,
		rol: input.rol as "Administrador" | "Usuario",
		created_at: new Date(),
		updated_at: new Date(),
	});
}

// Inicio de sesión — valida credenciales y emite un JWT
export async function iniciarSesion(input: LoginInput): Promise<LoginResult> {
	// Busca al usuario por correo electrónico
	const [user] = await db
		.select()
		.from(usuarios)
		.where(eq(usuarios.email, input.email))
		.limit(1);

	if (!user) {
		throw new Error("Usuario no registrado");
	}

	// Verifica que la contraseña coincida con el hash almacenado
	const isMatch = await hashService.verificarHash(
		input.contrasena,
		user.contrasena,
	);
	if (!isMatch) {
		throw new Error("Contraseña incorrecta");
	}

	// Genera el token JWT con datos del usuario y la vigencia configurada
	const token = jwt.sign(
		{
			id: user.id,
			nombre: user.nombre,
			email: user.email,
			rol: user.rol ?? "Usuario",
		},
		env.JWT_SECRET,
		{ expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
	);

	return {
		token,
		userData: {
			id: user.id,
			nombre: user.nombre,
			email: user.email,
			rol: user.rol ?? "Usuario",
			foto_url: user.foto_url ?? null,
		},
	};
}
