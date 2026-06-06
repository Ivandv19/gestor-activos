import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { configuracion, usuarios } from "../db/schema.js";
import hashService from "../services/hashService.js";
import * as r2Service from "../services/r2Service.js";

// Configuración general de la aplicación

export async function getConfiguracionAplicacion() {
	const [rows] = await db
		.select()
		.from(configuracion)
		.where(eq(configuracion.id, 1))
		.limit(1);

	if (!rows) {
		throw new Error("Configuración no encontrada");
	}

	return rows;
}

// Actualiza la configuración global de la aplicación
export async function updateConfiguracionAplicacion(input: {
	idioma: string;
	zona_horaria: string;
	formato_fecha: string;
	formato_moneda: string;
}) {
	const { idioma, zona_horaria, formato_fecha, formato_moneda } = input;

	await db
		.update(configuracion)
		.set({ idioma, zona_horaria, formato_fecha, formato_moneda })
		.where(eq(configuracion.id, 1));
}

// Perfil de usuario

export async function getPerfilUsuario(userId: number) {
	if (!userId) {
		throw new Error("ID de usuario no proporcionado.");
	}

	const [rows] = await db
		.select()
		.from(usuarios)
		.where(eq(usuarios.id, userId))
		.limit(1);

	const usuario = rows;
	if (!usuario) {
		throw new Error("Usuario no encontrado.");
	}

	return usuario;
}

// Actualiza los datos del perfil del usuario (incluye cambio de contraseña)
export async function updatePerfilUsuario(
	userId: number | undefined,
	input: {
		nombre?: string;
		email?: string;
		departamento?: string;
		contrasena_actual: string;
		nueva_contrasena?: string;
		confirmar_nueva_contrasena?: string;
		foto_url?: string;
	},
) {
	if (!userId) throw new Error("ID de usuario no proporcionado.");
	const {
		nombre,
		email,
		departamento,
		contrasena_actual,
		nueva_contrasena,
		confirmar_nueva_contrasena,
		foto_url,
	} = input;

	// Verifica que el usuario exista
	const [rows] = await db
		.select()
		.from(usuarios)
		.where(eq(usuarios.id, userId))
		.limit(1);
	if (!rows) {
		throw new Error("Usuario no encontrado.");
	}

	// Valida la contraseña actual antes de permitir cambios
	const isMatch = await hashService.verificarHash(
		contrasena_actual,
		(rows as { contrasena: string }).contrasena,
	);
	if (!isMatch) {
		throw new Error("La contraseña actual es incorrecta.");
	}

	if (!nombre && !email && !departamento && !nueva_contrasena && !foto_url) {
		throw new Error("Debes proporcionar al menos un campo para actualizar.");
	}

	// Validación cruzada de nueva contraseña y confirmación
	if (nueva_contrasena || confirmar_nueva_contrasena) {
		if (!nueva_contrasena || !confirmar_nueva_contrasena) {
			throw new Error(
				"Debes proporcionar tanto la nueva contraseña como su confirmación.",
			);
		}

		if (nueva_contrasena !== confirmar_nueva_contrasena) {
			throw new Error("La nueva contraseña y su confirmación no coinciden.");
		}
	}

	const updates: Record<string, string | number> = {};

	if (nombre) {
		updates.nombre = nombre;
	}
	if (email) {
		updates.email = email;
	}
	if (departamento) {
		updates.departamento = departamento;
	}
	if (nueva_contrasena) {
		const hashedNewPassword = await hashService.generarHash(nueva_contrasena);
		updates.contrasena = hashedNewPassword;
	}
	if (foto_url) {
		updates.foto_url = foto_url;
	}

	if (Object.keys(updates).length === 0) {
		throw new Error("No se proporcionaron cambios válidos para actualizar.");
	}

	await db.update(usuarios).set(updates).where(eq(usuarios.id, userId));
}

// Sube la foto de perfil a R2 y devuelve su URL
export async function subirImagenPerfil(fileBuffer: Buffer, mimetype: string) {
	const key = r2Service.generarClave("perfil", mimetype);
	const result = await r2Service.subirAR2(fileBuffer, key, mimetype);

	return { url: result.url };
}
