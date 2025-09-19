-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 08-09-2025 a las 03:18:19
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tienda`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Pastel'),
(3, 'Cupcakes'),
(4, 'Galletas'),
(6, 'Donas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `imagenes_productos`
--

CREATE TABLE `imagenes_productos` (
  `id` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `producto_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `imagenes_productos`
--

INSERT INTO `imagenes_productos` (`id`, `url`, `producto_id`) VALUES
(3, '/imagenes/productos/1755899977373.jpg', 56),
(5, '/imagenes/productos/1755899445014.jpg', 58),
(6, '/imagenes/productos/1755899539279.jpg', 59),
(7, '/imagenes/productos/1755900119929.jpg', 60),
(8, 'https://ejemplo.com/images/pastel_de_pistacho.jpg', 61),
(16, 'https://ejemplo.com/images/cupcake_red_velvet.jpg', 69),
(17, 'https://ejemplo.com/images/cupcake_de_zanahoria.jpg', 70),
(18, 'https://ejemplo.com/images/cupcake_de_limon.jpg', 71),
(19, 'https://ejemplo.com/images/cupcake_de_frambuesa.jpg', 72),
(20, 'https://ejemplo.com/images/cupcake_de_galleta_oreo.jpg', 73),
(21, 'https://ejemplo.com/images/cupcake_con_buttercream_de_fresa.jpg', 74),
(22, 'https://ejemplo.com/images/cupcake_de_dulce_de_leche.jpg', 75),
(23, '/imagenes/productos/1755903478135.jpg', 76),
(24, 'https://ejemplo.com/images/galletas_de_nuez.jpg', 77),
(25, 'https://ejemplo.com/images/galletas_de_canela.jpg', 78),
(26, 'https://ejemplo.com/images/galletas_de_limon.jpg', 79),
(27, 'https://ejemplo.com/images/galletas_de_avena_y_pasas.jpg', 80),
(28, 'https://ejemplo.com/images/galletas_de_coco.jpg', 81),
(29, 'https://ejemplo.com/images/galletas_de_chocolate_blanco.jpg', 82),
(37, 'https://ejemplo.com/images/dona_de_vainilla.jpg', 90),
(38, 'https://ejemplo.com/images/dona_glaseada.jpg', 91),
(39, 'https://ejemplo.com/images/dona_de_maple.jpg', 92),
(40, 'https://ejemplo.com/images/dona_rellena_de_crema.jpg', 93),
(41, 'https://ejemplo.com/images/dona_de_caramelo.jpg', 94),
(42, 'https://ejemplo.com/images/dona_de_fresa.jpg', 95),
(43, 'https://ejemplo.com/images/dona_de_avellana.jpg', 96),
(72, '/imagenes/1755872096777.jpg', 73),
(73, '/imagenes/1755879325380.jpg', 72),
(77, '/imagenes/1755890703284.jpg', NULL),
(78, '/imagenes/productos/1755897746961.jpg', NULL),
(79, '/imagenes/productos/1755897768075.jpg', NULL),
(80, '/imagenes/1755897790383.jpg', NULL),
(81, '/imagenes/1755897798659.jpg', NULL),
(82, '/imagenes/1755897918680.jpg', NULL),
(83, '/imagenes/1755897987608.jpg', NULL),
(84, '/imagenes/productos/1755898165708.jpg', NULL),
(85, '/imagenes/productos/1755898397789.jpg', NULL),
(86, '/imagenes/productos/1755898413680.jpg', NULL),
(87, '/imagenes/productos/1755898944661.jpg', 54),
(88, '/imagenes/productos/1755899361536.jpg', 55),
(89, '/imagenes/productos/1755900144068.jpg', 60),
(93, '/imagenes/productos/1755904858169.jpg', 57);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `precio`, `categoria_id`) VALUES
(54, 'Pastel Red Velvet', 28.00, 1),
(55, 'Pastel Tres Leches', 26.00, 1),
(56, 'Pastel de Café', 27.00, 1),
(57, 'Pastel Arcoíris', 30.00, 1),
(58, 'Pastel de Zanahoria', 25.00, 1),
(59, 'Pastel de Vainilla con Fresas', 26.50, 1),
(60, 'Pastel de Mango', 27.50, 1),
(61, 'Pastel de Pistacho', 31.00, 1),
(69, 'Cupcake Red Velvet', 4.00, 3),
(70, 'Cupcake de Zanahoria', 4.20, 3),
(71, 'Cupcake de Limón', 3.80, 3),
(72, 'Cupcake de Frambuesa', 4.50, 3),
(73, 'Cupcake de Galleta Oreo', 4.70, 3),
(74, 'Cupcake con Buttercream de Fresa', 4.30, 3),
(75, 'Cupcake de Dulce de Leche', 4.60, 3),
(76, 'Galletas de Almendra', 2.00, 4),
(77, 'Galletas de Nuez', 2.20, 4),
(78, 'Galletas de Canela', 1.80, 4),
(79, 'Galletas de Limón', 1.90, 4),
(80, 'Galletas de Avena y Pasas', 2.00, 4),
(81, 'Galletas de Coco', 2.10, 4),
(82, 'Galletas de Chocolate Blanco', 2.30, 4),
(90, 'Dona de Vainilla', 1.70, 6),
(91, 'Dona Glaseada', 1.80, 6),
(92, 'Dona de Maple', 2.00, 6),
(93, 'Dona Rellena de Crema', 2.20, 6),
(94, 'Dona de Caramelo', 2.10, 6),
(95, 'Dona de Fresa', 1.90, 6),
(96, 'Dona de Avellana', 2.40, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` char(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `usuario`, `password`) VALUES
(6, 'luis', '$2b$10$8s7kmb4x.U4UrN.9QWNwhO4b1'),
(7, 'jhamy', '$2b$10$SRRCtpzmBrTEGUQm20TzoeSMI');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `imagenes_productos`
--
ALTER TABLE `imagenes_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `imagenes_productos`
--
ALTER TABLE `imagenes_productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `imagenes_productos`
--
ALTER TABLE `imagenes_productos`
  ADD CONSTRAINT `imagenes_productos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
