-- Clean Schema Extraction from base-de-datos.sql

-- Disable foreign key checks to avoid issues during table creation
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Table `usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `rol` enum('Administrador','Usuario') DEFAULT 'Usuario',
  `foto_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `tipos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tipos`;
CREATE TABLE `tipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `proveedores`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `ubicaciones`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ubicaciones`;
CREATE TABLE `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `activos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `activos`;
CREATE TABLE `activos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo_id` int NOT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` date DEFAULT NULL,
  `valor_compra` decimal(10,2) DEFAULT NULL,
  `etiqueta_serial` varchar(100) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estado` enum('Disponible','Asignado','En mantenimiento','Dado de baja') DEFAULT 'Disponible',
  `proveedor_id` int NOT NULL,
  `ubicacion_id` int DEFAULT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `version_software` varchar(50) DEFAULT NULL,
  `tipo_licencia` varchar(50) DEFAULT NULL,
  `fecha_vencimiento_licencia` date DEFAULT NULL,
  `costo_mensual` decimal(10,2) DEFAULT NULL,
  `recursos_asignados` varchar(500) DEFAULT NULL,
  `dueno_id` int DEFAULT NULL,
  `condicion_fisica` enum('Nuevo','Usado','Dañado') DEFAULT 'Nuevo',
  PRIMARY KEY (`id`),
  KEY `tipo_id` (`tipo_id`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `ubicacion_id` (`ubicacion_id`),
  KEY `dueno_id` (`dueno_id`),
  CONSTRAINT `activos_ibfk_1` FOREIGN KEY (`tipo_id`) REFERENCES `tipos` (`id`),
  CONSTRAINT `activos_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `activos_ibfk_3` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `activos_ibfk_4` FOREIGN KEY (`dueno_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `asignaciones`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `asignaciones`;
CREATE TABLE `asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activo_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `ubicacion_id` int NOT NULL,
  `fecha_asignacion` date NOT NULL,
  `fecha_devolucion` date DEFAULT NULL,
  `comentarios` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activo_id` (`activo_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`activo_id`) REFERENCES `activos` (`id`),
  CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `asignaciones_ibfk_3` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `proveedoresgarantia`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `proveedoresgarantia`;
CREATE TABLE `proveedoresgarantia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `notas` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `garantias`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `garantias`;
CREATE TABLE `garantias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activo_id` int NOT NULL,
  `proveedor_garantia_id` int NOT NULL,
  `nombre_garantia` varchar(255) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `condiciones` varchar(255) DEFAULT NULL,
  `estado` enum('Vigente','Por vencer','Vencida') DEFAULT 'Vigente',
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activo_id` (`activo_id`),
  KEY `proveedor_garantia_id` (`proveedor_garantia_id`),
  CONSTRAINT `garantias_ibfk_1` FOREIGN KEY (`activo_id`) REFERENCES `activos` (`id`),
  CONSTRAINT `garantias_ibfk_2` FOREIGN KEY (`proveedor_garantia_id`) REFERENCES `proveedoresgarantia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `historial`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `historial`;
CREATE TABLE `historial` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activo_id` int NOT NULL,
  `accion` varchar(255) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `usuario_responsable` int NOT NULL,
  `usuario_asignado` int DEFAULT NULL,
  `ubicacion_nueva` int DEFAULT NULL,
  `detalles` text,
  PRIMARY KEY (`id`),
  KEY `activo_id` (`activo_id`),
  KEY `usuario_responsable` (`usuario_responsable`),
  KEY `fk_usuario_asignado` (`usuario_asignado`),
  KEY `fk_ubicacion_nueva` (`ubicacion_nueva`),
  CONSTRAINT `fk_ubicacion_nueva` FOREIGN KEY (`ubicacion_nueva`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usuario_asignado` FOREIGN KEY (`usuario_asignado`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`activo_id`) REFERENCES `activos` (`id`),
  CONSTRAINT `historial_ibfk_2` FOREIGN KEY (`usuario_responsable`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `tiposreporte`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tiposreporte`;
CREATE TABLE `tiposreporte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
