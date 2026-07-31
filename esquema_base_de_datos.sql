-- =======================================================
-- ESQUEMA DE BASE DE DATOS Y DATOS INICIALES
-- CÁMARA DE COMERCIO DE JIPIJAPA
-- =======================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: categorias
-- -------------------------------------------------------
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE "categorias" (
  "id_categoria" int NOT NULL AUTO_INCREMENT,
  "nombre" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "estado" tinyint DEFAULT '1',
  PRIMARY KEY ("id_categoria")
);

-- DATOS INICIALES DE LA TABLA: categorias
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (1, 'Comida', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (2, 'Bebidas', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (3, 'Ropa', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (4, 'Tecnología', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (5, 'Farmacia', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (6, 'Ferretería', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (7, 'Papelería', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (8, 'Panadería', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (9, 'Restaurante', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (10, 'Supermercado', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (11, 'Belleza', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (12, 'Servicios', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (13, 'Productos agricolas', 1);
INSERT INTO `categorias` (`id_categoria`, `nombre`, `estado`) VALUES (14, 'Servicio', 0);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: detalle_orden
-- -------------------------------------------------------
DROP TABLE IF EXISTS `detalle_orden`;
CREATE TABLE "detalle_orden" (
  "id" int NOT NULL AUTO_INCREMENT,
  "orden_id" int NOT NULL,
  "producto_id" int NOT NULL,
  "cantidad" int DEFAULT NULL,
  "peso" decimal(10,2) DEFAULT NULL,
  "precio_unitario" decimal(10,2) NOT NULL,
  "subtotal" decimal(10,2) NOT NULL,
  PRIMARY KEY ("id"),
  KEY "fk_detalle_producto" ("producto_id"),
  KEY "idx_detalle_orden" ("orden_id"),
  CONSTRAINT "fk_detalle_orden" FOREIGN KEY ("orden_id") REFERENCES "ordenes" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "fk_detalle_producto" FOREIGN KEY ("producto_id") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: negocio_categorias
-- -------------------------------------------------------
DROP TABLE IF EXISTS `negocio_categorias`;
CREATE TABLE "negocio_categorias" (
  "id" int NOT NULL AUTO_INCREMENT,
  "negocio_id" int NOT NULL,
  "categoria_id" int NOT NULL,
  PRIMARY KEY ("id"),
  KEY "negocio_id" ("negocio_id"),
  KEY "categoria_id" ("categoria_id"),
  CONSTRAINT "negocio_categorias_ibfk_1" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "negocio_categorias_ibfk_2" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id_categoria") ON DELETE CASCADE ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: negocios
-- -------------------------------------------------------
DROP TABLE IF EXISTS `negocios`;
CREATE TABLE "negocios" (
  "id" int NOT NULL AUTO_INCREMENT,
  "usuario_id" int NOT NULL,
  "nombre_negocio" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "descripcion" text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  "categoria" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "logo" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "ubicacion" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "dueno" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "telefono" varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "email_contacto" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "horarios" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "facebook" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "instagram" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "fecha_creacion" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "estado" tinyint DEFAULT '1',
  "payphone_id" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "ofrece_delivery" tinyint(1) DEFAULT '0',
  "banner" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "tiktok" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "x_twitter" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "youtube" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "whatsapp" varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "telegram" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "costo_delivery" decimal(10,2) DEFAULT '0.00',
  "destacado" tinyint(1) NOT NULL DEFAULT '0',
  "tipo_negocio" enum('productos','servicios','mixto') NOT NULL DEFAULT 'productos',
  "latitud" decimal(10,8) DEFAULT NULL,
  "longitud" decimal(11,8) DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_negocios_usuario" ("usuario_id"),
  CONSTRAINT "fk_negocio_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: ordenes
-- -------------------------------------------------------
DROP TABLE IF EXISTS `ordenes`;
CREATE TABLE "ordenes" (
  "id" int NOT NULL AUTO_INCREMENT,
  "codigo_orden" varchar(12) DEFAULT NULL,
  "usuario_id" int NOT NULL,
  "negocio_id" int NOT NULL,
  "total" decimal(10,2) NOT NULL,
  "tipo_entrega" enum('retiro','envio') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "ciudad_destino" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "direccion_envio" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "estado" varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pendiente',
  "codigo_retiro" varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "metodo_pago" enum('efectivo','transferencia','tarjeta') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "comprobante_transferencia" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "fecha_creacion" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_pago" timestamp NULL DEFAULT NULL,
  "latitud_destino" decimal(10,8) DEFAULT NULL,
  "longitud_destino" decimal(11,8) DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "codigo_retiro" ("codigo_retiro"),
  UNIQUE KEY "idx_ordenes_codigo_orden" ("codigo_orden"),
  KEY "idx_ordenes_usuario" ("usuario_id"),
  KEY "idx_ordenes_negocio" ("negocio_id"),
  CONSTRAINT "fk_orden_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "fk_orden_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: productos
-- -------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE "productos" (
  "id" int NOT NULL AUTO_INCREMENT,
  "negocio_id" int NOT NULL,
  "nombre_producto" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "descripcion" text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  "tipo_venta" enum('unidad','peso') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'unidad',
  "precio" decimal(10,2) NOT NULL,
  "unidad_medida" varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "stock" decimal(10,2) DEFAULT '0.00',
  "foto" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "fecha_creacion" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "estado" tinyint DEFAULT '1',
  "destacado" tinyint(1) NOT NULL DEFAULT '0',
  "tipo_oferta" enum('producto','servicio') NOT NULL DEFAULT 'producto',
  "modalidad_cobro" enum('unidad','medida','por_hora','contrato','fijo') NOT NULL DEFAULT 'unidad',
  PRIMARY KEY ("id"),
  KEY "idx_productos_negocio" ("negocio_id"),
  CONSTRAINT "fk_producto_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: reportes_guardados
-- -------------------------------------------------------
DROP TABLE IF EXISTS `reportes_guardados`;
CREATE TABLE "reportes_guardados" (
  "id" int NOT NULL AUTO_INCREMENT,
  "negocio_id" int NOT NULL,
  "mes" int NOT NULL,
  "anio" int NOT NULL,
  "total_ventas" decimal(10,2) NOT NULL,
  "fecha_guardado" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "negocio_id" ("negocio_id"),
  CONSTRAINT "reportes_guardados_ibfk_1" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE CASCADE
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: reportes_mensuales
-- -------------------------------------------------------
DROP TABLE IF EXISTS `reportes_mensuales`;
CREATE TABLE "reportes_mensuales" (
  "id" int NOT NULL AUTO_INCREMENT,
  "negocio_id" int DEFAULT NULL,
  "mes" varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "anio" int DEFAULT NULL,
  "total_ventas" decimal(10,2) DEFAULT NULL,
  "pedidos_completados" int DEFAULT NULL,
  "fecha_generado" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "negocio_id" ("negocio_id"),
  CONSTRAINT "reportes_mensuales_ibfk_1" FOREIGN KEY ("negocio_id") REFERENCES "negocios" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: solicitud_categorias
-- -------------------------------------------------------
DROP TABLE IF EXISTS `solicitud_categorias`;
CREATE TABLE "solicitud_categorias" (
  "id" int NOT NULL AUTO_INCREMENT,
  "solicitud_id" int DEFAULT NULL,
  "categoria_id" int DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "solicitud_id" ("solicitud_id"),
  KEY "categoria_id" ("categoria_id"),
  CONSTRAINT "solicitud_categorias_ibfk_1" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_negocio" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "solicitud_categorias_ibfk_2" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id_categoria") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: solicitudes_negocio
-- -------------------------------------------------------
DROP TABLE IF EXISTS `solicitudes_negocio`;
CREATE TABLE "solicitudes_negocio" (
  "id" int NOT NULL AUTO_INCREMENT,
  "usuario_id" int NOT NULL,
  "nombre_negocio" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "descripcion" text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  "categoria" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "ubicacion" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "telefono" varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "estado" enum('pendiente','aprobado','rechazado') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pendiente',
  "fecha_creacion" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "usuario_id" ("usuario_id"),
  CONSTRAINT "solicitudes_negocio_ibfk_1" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: unidades_medida
-- -------------------------------------------------------
DROP TABLE IF EXISTS `unidades_medida`;
CREATE TABLE "unidades_medida" (
  "id_unidad" int NOT NULL AUTO_INCREMENT,
  "nombre" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "estado" tinyint DEFAULT '1',
  PRIMARY KEY ("id_unidad")
);

-- DATOS INICIALES DE LA TABLA: unidades_medida
INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `estado`) VALUES (1, 'Unidad', 1);
INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `estado`) VALUES (2, 'Kilogramo (kg)', 1);
INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `estado`) VALUES (3, 'Libra (lb)', 1);
INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `estado`) VALUES (4, 'Litro (L)', 1);
INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `estado`) VALUES (5, 'Porción', 1);

-- -------------------------------------------------------
-- ESTRUCTURA DE LA TABLA: usuarios
-- -------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE "usuarios" (
  "id" int NOT NULL AUTO_INCREMENT,
  "nombre" varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "cedula" varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "correo" varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "contrasena" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  "rol" enum('cliente','negocio','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'cliente',
  "fecha_creacion" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "verificado" tinyint(1) DEFAULT '0',
  "token_verificacion" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "token_recuperacion" varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  "expiracion_token" datetime DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "correo" ("correo"),
  UNIQUE KEY "cedula" ("cedula")
);

-- -------------------------------------------------------
-- USUARIO ADMINISTRADOR DE LA CÁMARA DE COMERCIO
-- -------------------------------------------------------
INSERT INTO `usuarios` (`nombre`, `cedula`, `correo`, `contrasena`, `rol`, `verificado`)
VALUES ('Cámara de Comercio', '1300000000', 'admin@camarajipijapa.com', '$2b$10$xrZAwiCWShjnrr4ygQ/LAuhtft9cgIWY9mu58PyP4MPk4vA2KiF2.', 'admin', 1);

SET FOREIGN_KEY_CHECKS = 1;
