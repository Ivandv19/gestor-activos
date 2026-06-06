import { sql } from "drizzle-orm";
import {
	date,
	datetime,
	decimal,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	tinyint,
	varchar,
} from "drizzle-orm/mysql-core";

// ─── usuarios ────────────────────────────────────────────────────────────────

export const usuarios = mysqlTable("usuarios", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	contrasena: varchar("contrasena", { length: 255 }).notNull(),
	departamento: varchar("departamento", { length: 100 }),
	fecha_ingreso: date("fecha_ingreso"),
	rol: mysqlEnum("rol", ["Administrador", "Usuario"]).default("Usuario"),
	foto_url: varchar("foto_url", { length: 255 }),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── tipos ───────────────────────────────────────────────────────────────────

export const tipos = mysqlTable("tipos", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 100 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── proveedores ─────────────────────────────────────────────────────────────

export const proveedores = mysqlTable("proveedores", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	contacto: varchar("contacto", { length: 255 }),
	direccion: varchar("direccion", { length: 255 }),
	descripcion: varchar("descripcion", { length: 255 }),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── ubicaciones ─────────────────────────────────────────────────────────────

export const ubicaciones = mysqlTable("ubicaciones", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── activos ─────────────────────────────────────────────────────────────────

export const activos = mysqlTable(
	"activos",
	{
		id: int("id").autoincrement().notNull().primaryKey(),
		nombre: varchar("nombre", { length: 255 }).notNull(),
		tipo_id: int("tipo_id").notNull(),
		fecha_adquisicion: date("fecha_adquisicion"),
		fecha_registro: datetime("fecha_registro").default(sql`CURRENT_TIMESTAMP`),
		fecha_salida: date("fecha_salida"),
		valor_compra: decimal("valor_compra", { precision: 10, scale: 2 }),
		etiqueta_serial: varchar("etiqueta_serial", { length: 100 }),
		descripcion: varchar("descripcion", { length: 500 }),
		estado: mysqlEnum("estado", [
			"Disponible",
			"Asignado",
			"En mantenimiento",
			"Dado de baja",
		]).default("Disponible"),
		proveedor_id: int("proveedor_id").notNull(),
		ubicacion_id: int("ubicacion_id"),
		foto_url: varchar("foto_url", { length: 500 }),
		modelo: varchar("modelo", { length: 100 }),
		version_software: varchar("version_software", { length: 50 }),
		tipo_licencia: varchar("tipo_licencia", { length: 50 }),
		fecha_vencimiento_licencia: date("fecha_vencimiento_licencia"),
		costo_mensual: decimal("costo_mensual", { precision: 10, scale: 2 }),
		recursos_asignados: varchar("recursos_asignados", { length: 500 }),
		dueno_id: int("dueno_id"),
		condicion_fisica: mysqlEnum("condicion_fisica", [
			"Nuevo",
			"Usado",
			"Dañado",
		]).default("Nuevo"),
		activo: tinyint("activo").default(1),
	},
	(table) => ({
		tipoIdIdx: index("tipo_id").on(table.tipo_id),
		proveedorIdIdx: index("proveedor_id").on(table.proveedor_id),
		ubicacionIdIdx: index("ubicacion_id").on(table.ubicacion_id),
		duenoIdIdx: index("dueno_id").on(table.dueno_id),
		estadoIdx: index("idx_estado").on(table.estado),
		nombreIdx: index("idx_nombre").on(table.nombre),
		activoIdx: index("idx_activo").on(table.activo),
	}),
);

// ─── asignaciones ────────────────────────────────────────────────────────────

export const asignaciones = mysqlTable(
	"asignaciones",
	{
		id: int("id").autoincrement().notNull().primaryKey(),
		activo_id: int("activo_id").notNull(),
		usuario_id: int("usuario_id").notNull(),
		ubicacion_id: int("ubicacion_id").notNull(),
		fecha_asignacion: date("fecha_asignacion").notNull(),
		fecha_devolucion: date("fecha_devolucion"),
		comentarios: varchar("comentarios", { length: 255 }),
		activo: tinyint("activo").default(1),
	},
	(table) => ({
		activoIdIdx: index("activo_id").on(table.activo_id),
		usuarioIdIdx: index("usuario_id").on(table.usuario_id),
		ubicacionIdIdx: index("ubicacion_id").on(table.ubicacion_id),
		fechaDevolucionIdx: index("idx_fecha_devolucion").on(
			table.fecha_devolucion,
		),
		activoIdx: index("idx_activo").on(table.activo),
	}),
);

// ─── proveedoresgarantia ─────────────────────────────────────────────────────

export const proveedoresgarantia = mysqlTable("proveedoresgarantia", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	contacto: varchar("contacto", { length: 255 }),
	telefono: varchar("telefono", { length: 20 }),
	email: varchar("email", { length: 255 }),
	direccion: varchar("direccion", { length: 255 }),
	notas: varchar("notas", { length: 255 }),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── garantias ───────────────────────────────────────────────────────────────

export const garantias = mysqlTable(
	"garantias",
	{
		id: int("id").autoincrement().notNull().primaryKey(),
		activo_id: int("activo_id").notNull(),
		proveedor_garantia_id: int("proveedor_garantia_id").notNull(),
		nombre_garantia: varchar("nombre_garantia", { length: 255 }).notNull(),
		fecha_inicio: date("fecha_inicio").notNull(),
		fecha_fin: date("fecha_fin").notNull(),
		costo: decimal("costo", { precision: 10, scale: 2 }),
		condiciones: varchar("condiciones", { length: 255 }),
		estado: mysqlEnum("estado", ["Vigente", "Por vencer", "Vencida"]).default(
			"Vigente",
		),
		descripcion: varchar("descripcion", { length: 255 }),
		activo: tinyint("activo").default(1),
	},
	(table) => ({
		activoIdIdx: index("activo_id").on(table.activo_id),
		proveedorGarantiaIdIdx: index("proveedor_garantia_id").on(
			table.proveedor_garantia_id,
		),
		fechaFinIdx: index("idx_fecha_fin").on(table.fecha_fin),
		activoIdx: index("idx_activo").on(table.activo),
	}),
);

// ─── historial ───────────────────────────────────────────────────────────────

export const historial = mysqlTable(
	"historial",
	{
		id: int("id").autoincrement().notNull().primaryKey(),
		activo_id: int("activo_id"),
		accion: varchar("accion", { length: 255 }).notNull(),
		fecha: datetime("fecha").default(sql`CURRENT_TIMESTAMP`),
		usuario_responsable: int("usuario_responsable").notNull(),
		usuario_asignado: int("usuario_asignado"),
		ubicacion_nueva: int("ubicacion_nueva"),
		detalles: text("detalles"),
	},
	(table) => ({
		activoIdIdx: index("activo_id").on(table.activo_id),
		usuarioResponsableIdx: index("usuario_responsable").on(
			table.usuario_responsable,
		),
		usuarioAsignadoIdx: index("fk_usuario_asignado").on(table.usuario_asignado),
		ubicacionNuevaIdx: index("fk_ubicacion_nueva").on(table.ubicacion_nueva),
		accionIdx: index("idx_accion").on(table.accion),
		activoIdFechaIdx: index("idx_activo_id_fecha").on(
			table.activo_id,
			table.fecha,
		),
	}),
);

// ─── tiposreporte ────────────────────────────────────────────────────────────

export const tiposreporte = mysqlTable("tiposreporte", {
	id: int("id").autoincrement().notNull().primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }),
	activo: tinyint("activo").default(1),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── configuracion ───────────────────────────────────────────────────────────

export const configuracion = mysqlTable("configuracion", {
	id: int("id").default(1).notNull().primaryKey(),
	idioma: varchar("idioma", { length: 10 }).default("es"),
	zona_horaria: varchar("zona_horaria", { length: 20 }).default("UTC-5"),
	formato_fecha: varchar("formato_fecha", { length: 20 }).default("DD/MM/YYYY"),
	formato_moneda: varchar("formato_moneda", { length: 20 }).default("USD"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});
