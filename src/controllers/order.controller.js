const db = require("../config/db");

// ============================
// CREAR ORDEN (CLIENTE)
// ============================
const crearOrden = async (req, res) => {
  const usuario_id = req.user.id_usuario;

  const {
    negocio_id,
    tipo_entrega,
    ciudad_destino,
    direccion_envio,
    metodo_pago,
    items
  } = req.body;

  if (!negocio_id || !tipo_entrega || !metodo_pago || !items || !items.length) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔥 MODIFICADO: Traemos también el costo de delivery y el ID del dueño
    const [negocioRows] = await connection.query(
      "SELECT id, costo_delivery, usuario_id FROM negocios WHERE id = ? AND estado = 1",
      [negocio_id]
    );

    if (negocioRows.length === 0) throw new Error("Negocio no existe");

    let total = 0;

    for (const item of items) {
      if (!item.producto_id) throw new Error("Producto inválido");

      const [productoRows] = await connection.query(
        `SELECT precio, stock, tipo_venta FROM productos WHERE id = ? AND negocio_id = ? AND estado = 1`,
        [item.producto_id, negocio_id]
      );

      if (productoRows.length === 0) throw new Error("Producto no disponible");

      const producto = productoRows[0];
      let subtotal = 0;

      if (producto.tipo_venta === "unidad") {
        if (!item.cantidad || item.cantidad <= 0) throw new Error("Cantidad inválida");
        if (producto.stock < item.cantidad) throw new Error(`Stock insuficiente. Quedan ${producto.stock}`);
        subtotal = producto.precio * item.cantidad;
      } else if (producto.tipo_venta === "peso") {
        if (!item.peso || item.peso <= 0) throw new Error("Peso inválido");
        if (producto.stock < item.peso) throw new Error(`Stock insuficiente. Quedan ${producto.stock}`);
        subtotal = producto.precio * item.peso;
      }

      total += subtotal;
    }

    // 🔥 MODIFICADO: Sumamos el delivery si es envío
    if (tipo_entrega === "envio") {
      const costoDelivery = Number(negocioRows[0].costo_delivery || 0);
      total += costoDelivery;
    }

    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes
      (usuario_id, negocio_id, total, tipo_entrega, ciudad_destino,
       direccion_envio, estado, metodo_pago)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [usuario_id, negocio_id, total, tipo_entrega, ciudad_destino || null, direccion_envio || null, metodo_pago]
    );

    const orden_id = ordenResult.insertId;

    for (const item of items) {
      const [[producto]] = await connection.query("SELECT precio, tipo_venta FROM productos WHERE id = ?", [item.producto_id]);
      let subtotal = producto.tipo_venta === "unidad" ? producto.precio * item.cantidad : producto.precio * item.peso;
      let cantidadRestar = producto.tipo_venta === "unidad" ? item.cantidad : item.peso;

      await connection.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [cantidadRestar, item.producto_id]);

      await connection.query(
        `INSERT INTO detalle_orden (orden_id, producto_id, ${producto.tipo_venta === "unidad" ? 'cantidad' : 'peso'}, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orden_id, item.producto_id, cantidadRestar, producto.precio, subtotal]
      );
    }

    await connection.commit();

    // 🔔 NOTIFICACIÓN SOCKET.IO: Le avisamos al dueño del negocio
    const io = req.app.get("io");
    const idDueno = negocioRows[0].usuario_id;
    io.to(idDueno.toString()).emit("nueva_orden", {
      message: "🔔 ¡Tienes un nuevo pedido!",
      orden_id: orden_id,
      total: total
    });

    res.json({ ok: true, message: "Orden creada correctamente", orden_id });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    connection.release();
  }
};

// ============================
// ÓRDENES DEL CLIENTE (MIS COMPRAS)
// ============================
const ordenesCliente = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;
    const [rows] = await db.query(
      `SELECT id, total, estado, fecha_creacion
       FROM ordenes
       WHERE usuario_id = ?
       ORDER BY fecha_creacion DESC`,
      [usuario_id]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al listar órdenes" });
  }
};

// ============================
// CAMBIAR ESTADO (DUEÑO NEGOCIO)
// ============================
const cambiarEstado = async (req, res) => {
  const connection = await db.getConnection(); // 🔥 Usamos transacción para seguridad
  try {
    const { id_orden } = req.params;
    const { estado } = req.body;
    const usuario_id = req.user.id_usuario;

    // 🔥 Añadimos "confirmado" a los estados
    const estadosValidos = ["pendiente", "confirmado", "preparando", "pagado", "cancelado"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado inválido" });
    }

    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      "SELECT o.usuario_id, o.estado AS estado_actual, n.nombre_negocio FROM ordenes o JOIN negocios n ON n.id = o.negocio_id WHERE o.id = ? AND n.usuario_id = ?", 
      [id_orden, usuario_id]
    );

    if (ordenRows.length === 0) {
      throw new Error("No autorizado o la orden no existe");
    }

    const estadoActual = ordenRows[0].estado_actual;

    // 🔥 SI SE CANCELA, DEVOLVEMOS EL STOCK
    if (estado === "cancelado" && estadoActual !== "cancelado") {
      const [items] = await connection.query(
        "SELECT producto_id, cantidad, peso FROM detalle_orden WHERE orden_id = ?",
        [id_orden]
      );

      for (const item of items) {
        // Vemos si se vendió por unidad (cantidad) o por peso (peso)
        const cantidadRestaurar = item.cantidad ? item.cantidad : item.peso;
        await connection.query(
          "UPDATE productos SET stock = stock + ? WHERE id = ?", 
          [cantidadRestaurar, item.producto_id]
        );
      }
    }

    // Actualizamos el estado de la orden
    await connection.query(`UPDATE ordenes SET estado = ? WHERE id = ?`, [estado, id_orden]);
    await connection.commit();

    // 🔔 NOTIFICACIÓN SOCKET.IO: Le avisamos al cliente
    const io = req.app.get("io");
    const idCliente = ordenRows[0].usuario_id;
    const nombreNegocio = ordenRows[0].nombre_negocio;

    io.to(idCliente.toString()).emit("estado_orden", {
      message: `Tu pedido en ${nombreNegocio} ahora está: ${estado.toUpperCase()}`,
      orden_id: id_orden,
      estado: estado
    });

    return res.json({ ok: true, message: `Orden marcada como ${estado}` });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ ok: false, message: error.message || "Error al actualizar estado" });
  } finally {
    connection.release();
  }
};

// ============================
// ÓRDENES DEL NEGOCIO (MIS VENTAS)
// ============================
const ordenesNegocio = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;
    // 🔥 Filtramos para que por defecto solo vea lo del mes actual
    const [rows] = await db.query(
      `SELECT o.*, u.nombre AS cliente
       FROM ordenes o
       JOIN negocios n ON n.id = o.negocio_id
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE n.usuario_id = ? 
       AND MONTH(o.fecha_creacion) = MONTH(CURRENT_DATE())
       AND YEAR(o.fecha_creacion) = YEAR(CURRENT_DATE())
       ORDER BY o.fecha_creacion DESC`,
      [usuario_id]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al obtener órdenes" });
  }
};

// ============================
// DETALLE ORDEN (MODIFICADO Y SEGURO)
// ============================
const detalleOrden = async (req, res) => {
  try {
    const { id_orden } = req.params;
    const user = req.user; 

    // 1. Buscamos la orden con los datos del dueño del negocio
    const [ordenRows] = await db.query(
      `SELECT o.*, 
              u.nombre AS cliente_nombre,
              n.nombre_negocio AS negocio_nombre,
              n.usuario_id AS negocio_dueno
       FROM ordenes o
       JOIN usuarios u ON u.id = o.usuario_id
       JOIN negocios n ON n.id = o.negocio_id
       WHERE o.id = ?`,
      [id_orden]
    );

    if (!ordenRows.length) {
      return res.status(404).json({ ok: false, message: "Orden no encontrada" });
    }

    const orden = ordenRows[0];

    // 🔐 VALIDACIÓN DE SEGURIDAD ULTRA ESTRICTA
    // Sacamos el ID del usuario del token (revisa si en tu verifyToken usas .id o .id_usuario)
    const userIdPeticion = Number(user.id_usuario || user.id); 
    const idDuenoNegocio = Number(orden.negocio_dueno);
    const idComprador = Number(orden.usuario_id);

    const esDuenoVendedor = idDuenoNegocio === userIdPeticion;
    const esComprador = idComprador === userIdPeticion;
    const esAdmin = user.rol === "admin";

    // En order.controller.js, dentro de detalleOrden:
console.log("--- DEBUG SEGURIDAD ---");
console.log("ID Usuario Token:", user?.id_usuario || user?.id);
console.log("ID Dueño Negocio:", orden.negocio_dueno);
console.log("Rol:", user?.rol);

    // Si NO es el que vende, ni el que compra, ni admin -> BLOQUEO TOTAL
    if (!esDuenoVendedor && !esComprador && !esAdmin) {
      console.log(`⚠️ Intento de acceso no autorizado a Orden #${id_orden} por Usuario ${userIdPeticion}`);
      return res.status(403).json({ 
        ok: false, 
        message: "Acceso denegado: Esta orden no pertenece a tu negocio." 
      });
    }

    // Si pasó el muro, buscamos los productos
    const [detalle] = await db.query(
      `SELECT d.*, p.nombre_producto, p.foto
       FROM detalle_orden d
       JOIN productos p ON p.id = d.producto_id
       WHERE d.orden_id = ?`,
      [id_orden]
    );

    return res.json({
      ok: true,
      orden,
      productos: detalle
    });

  } catch (error) {
    console.error("ERROR DETALLE ORDEN:", error);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
};

// ============================
// HISTORIAL DE ÓRDENES (POR MES Y AÑO)
// ============================
const obtenerHistorialMes = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const usuario_id = req.user.id_usuario;

    const [rows] = await db.query(
      `SELECT o.id, o.total, o.estado, o.fecha_creacion, u.nombre AS cliente
       FROM ordenes o
       JOIN negocios n ON n.id = o.negocio_id
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE n.usuario_id = ? 
       AND MONTH(o.fecha_creacion) = ? 
       AND YEAR(o.fecha_creacion) = ?
       ORDER BY o.fecha_creacion DESC`,
      [usuario_id, mes, anio]
    );

    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("Error en historial:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener historial" });
  }
};

// No olvides exportarla al final de tu archivo:
module.exports = {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden,
  obtenerHistorialMes // 🔥 NUEVA FUNCIÓN AGREGADA
};