const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

const STOPWORDS_CONSULTA = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "el",
  "en",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "necesito",
  "para",
  "por",
  "que",
  "quiero",
  "se",
  "su",
  "sus",
  "un",
  "una",
  "uno",
  "unos",
  "unas",
  "y"
]);

const normalizarTexto = (texto = "") =>
  texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const singularizarToken = (token = "") => {
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
};

const tokenizar = (texto = "") =>
  normalizarTexto(texto)
    .split(" ")
    .map(singularizarToken)
    .filter(Boolean);

const tokenizarSinStopwords = (texto = "") =>
  tokenizar(texto).filter((token) => !STOPWORDS_CONSULTA.has(token));

const crearVariantesDeItem = (item = "") => {
  const limpio = normalizarTexto(item);
  const tokens = tokenizarSinStopwords(item);
  const variantes = new Set();

  if (limpio) variantes.add(limpio);
  if (tokens.length) {
    variantes.add(tokens.join(" "));
    tokens.forEach((token) => variantes.add(token));
  }

  return Array.from(variantes);
};

const partirConsultaEnItems = (consulta = "") => {
  const consultaNormalizada = normalizarTexto(consulta)
    .replace(/\bademas\b/g, ",")
    .replace(/\btambien\b/g, ",")
    .replace(/\be\b/g, ",")
    .replace(/\by\b/g, ",");

  const partes = consultaNormalizada
    .split(",")
    .map((parte) => tokenizarSinStopwords(parte).join(" ").trim())
    .filter(Boolean);

  if (partes.length) {
    return Array.from(new Set(partes)).slice(0, 8);
  }

  const fallback = tokenizarSinStopwords(consultaNormalizada);
  if (!fallback.length) return [];

  return Array.from(new Set(fallback)).slice(0, 8);
};

const calcularSimilitudTokens = (tokensA = [], tokensB = []) => {
  if (!tokensA.length || !tokensB.length) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let coincidencias = 0;

  for (const token of setA) {
    if (setB.has(token)) coincidencias += 1;
  }

  const precision = coincidencias / setA.size;
  const cobertura = coincidencias / setB.size;
  return (precision + cobertura) / 2;
};

const calcularScoreProducto = (item, producto) => {
  const itemNormalizado = normalizarTexto(item);
  const itemTokens = tokenizarSinStopwords(item);
  const nombreNormalizado = normalizarTexto(producto.nombre_producto);
  const nombreTokens = tokenizar(producto.nombre_producto);
  const descripcionNormalizada = normalizarTexto(producto.descripcion);
  const categoriaNormalizada = normalizarTexto(producto.categoria);
  const blob = normalizarTexto(
    `${producto.nombre_producto} ${producto.descripcion || ""} ${producto.categoria || ""} ${producto.nombre_negocio || ""}`
  );

  let score = 0;

  if (nombreNormalizado === itemNormalizado) score += 120;
  if (nombreNormalizado.includes(itemNormalizado) && itemNormalizado) score += 95;
  if (itemNormalizado.includes(nombreNormalizado) && nombreNormalizado) score += 60;

  const similitudNombre = calcularSimilitudTokens(itemTokens, nombreTokens);
  score += similitudNombre * 80;

  const todasLasPalabrasEnNombre =
    itemTokens.length > 0 && itemTokens.every((token) => nombreTokens.includes(token));
  if (todasLasPalabrasEnNombre) score += 35;

  const todasLasPalabrasEnDescripcion =
    itemTokens.length > 0 && itemTokens.every((token) => descripcionNormalizada.includes(token));
  if (todasLasPalabrasEnDescripcion) score += 20;

  const todasLasPalabrasEnCategoria =
    itemTokens.length > 0 && itemTokens.every((token) => categoriaNormalizada.includes(token));
  if (todasLasPalabrasEnCategoria) score += 10;

  if (blob.includes(itemNormalizado) && itemNormalizado) score += 15;

  return Number(score.toFixed(2));
};

const resumirProducto = (producto, score, termino) => ({
  producto_id: producto.id,
  termino,
  nombre_producto: producto.nombre_producto,
  descripcion: producto.descripcion,
  precio: Number(producto.precio),
  unidad_medida: producto.unidad_medida,
  foto: producto.foto,
  negocio_id: producto.negocio_id,
  nombre_negocio: producto.nombre_negocio,
  score
});

const unirListaNatural = (items = []) => {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
};

const construirDistribucionPorItem = (itemsSolicitados = [], sugerenciasPorItem = []) =>
  itemsSolicitados.map((termino) => {
    const grupo = sugerenciasPorItem.find((item) => item.termino === termino);
    const mejorSugerencia = grupo?.sugerencias?.[0] || null;

    return {
      termino,
      encontrado: Boolean(mejorSugerencia),
      negocio_id: mejorSugerencia?.negocio_id || null,
      nombre_negocio: mejorSugerencia?.nombre_negocio || null,
      producto_id: mejorSugerencia?.producto_id || null,
      nombre_producto: mejorSugerencia?.nombre_producto || null,
      precio: mejorSugerencia?.precio ?? null,
      unidad_medida: mejorSugerencia?.unidad_medida || null
    };
  });

const construirResumenConsulta = (distribucionPorItem = []) => {
  const encontrados = distribucionPorItem.filter((item) => item.encontrado);
  const faltantes = distribucionPorItem.filter((item) => !item.encontrado).map((item) => item.termino);

  if (!encontrados.length) {
    return "No encontramos coincidencias claras para los productos solicitados.";
  }

  const grupos = new Map();

  for (const item of encontrados) {
    if (!grupos.has(item.negocio_id)) {
      grupos.set(item.negocio_id, {
        nombre_negocio: item.nombre_negocio,
        items: []
      });
    }

    grupos.get(item.negocio_id).items.push(item.termino);
  }

  const partes = Array.from(grupos.values()).map(
    (grupo) =>
      `En ${grupo.nombre_negocio} encontramos ${unirListaNatural(grupo.items)}`
  );

  if (faltantes.length) {
    partes.push(`No encontramos ${unirListaNatural(faltantes)}`);
  }

  return `${partes.join(". ")}.`;
};

const construirExplicacionNegocio = (negocio) => {
  if (!negocio) return null;

  const encontrados = negocio.productos?.map((producto) => producto.termino) || [];
  const faltantes = negocio.faltantes || [];

  if (encontrados.length && !faltantes.length) {
    return `${negocio.nombre_negocio} cubre toda la consulta con ${unirListaNatural(encontrados)}.`;
  }

  if (encontrados.length && faltantes.length) {
    return `${negocio.nombre_negocio} tiene ${unirListaNatural(encontrados)}, pero no encontramos ${unirListaNatural(faltantes)} en ese negocio.`;
  }

  return `${negocio.nombre_negocio} aparece como candidato, pero no cubre suficientes productos de la consulta.`;
};

const construirMensajeSugerencia = (item) => {
  const sugerencias = item?.sugerencias || [];

  if (!sugerencias.length) {
    return `No encontramos una coincidencia clara para ${item.termino}.`;
  }

  const mejor = sugerencias[0];
  return `La mejor coincidencia para ${item.termino} es ${mejor.nombre_producto} en ${mejor.nombre_negocio}.`;
};

const mensajePareceInconsistente = (mensaje = "", item = null, negociosValidos = []) => {
  if (!mensaje) return true;

  const texto = normalizarTexto(mensaje);
  const termino = normalizarTexto(item?.termino || "");
  const contieneNegocioValido = negociosValidos.some((negocio) =>
    texto.includes(normalizarTexto(negocio))
  );

  if (!contieneNegocioValido && termino && texto.includes(`negocio ${termino}`)) {
    return true;
  }

  return false;
};

const extraerTextoRespuestaOpenAI = (respuesta = {}) => {
  if (typeof respuesta.output_text === "string" && respuesta.output_text.trim()) {
    return respuesta.output_text;
  }

  if (!Array.isArray(respuesta.output)) return "";

  const textos = [];

  for (const bloque of respuesta.output) {
    if (!Array.isArray(bloque.content)) continue;

    for (const contenido of bloque.content) {
      if (contenido.type === "output_text" && contenido.text) {
        textos.push(contenido.text);
      }
    }
  }

  return textos.join("\n").trim();
};

const consultarOpenAIParaRanking = async ({ consulta, items, candidatos, sugerencias }) => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const schema = {
    type: "object",
    properties: {
      resumen: { type: "string" },
      items_detectados: {
        type: "array",
        items: { type: "string" }
      },
      orden_negocios: {
        type: "array",
        items: { type: "integer" }
      },
      motivos_por_negocio: {
        type: "array",
        items: {
          type: "object",
          properties: {
            negocio_id: { type: "integer" },
            motivo: { type: "string" }
          },
          required: ["negocio_id", "motivo"]
        }
      },
      mensajes_sugerencia: {
        type: "array",
        items: {
          type: "object",
          properties: {
            termino: { type: "string" },
            mensaje: { type: "string" }
          },
          required: ["termino", "mensaje"]
        }
      }
    },
    required: [
      "resumen",
      "items_detectados",
      "orden_negocios",
      "motivos_por_negocio",
      "mensajes_sugerencia"
    ]
  };

  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Eres un asistente de compras para un marketplace local. Debes recomendar en qué negocio conviene comprar todos los productos pedidos en una sola orden cuando sea posible. Usa únicamente los candidatos y sugerencias entregados. No inventes negocios, productos ni disponibilidad. Prioriza: 1) cubrir más productos en un solo negocio, 2) menos faltantes, 3) mejor coherencia con la consulta, 4) menor costo estimado si el resto es parecido."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  consulta,
                  items_detectados: items,
                  candidatos,
                  sugerencias
                },
                null,
                2
              )
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ranking_compras",
          strict: true,
          schema
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );

  const texto = extraerTextoRespuestaOpenAI(response.data);
  if (!texto) {
    throw new Error("La IA no devolvio contenido util");
  }

  return JSON.parse(texto);
};

const extraerTextoGemini = (response = {}) => {
  const candidatos = response?.candidates || [];
  const primerCandidato = candidatos[0];
  const partes = primerCandidato?.content?.parts || [];
  const textos = partes
    .map((parte) => parte.text)
    .filter((texto) => typeof texto === "string" && texto.trim());

  return textos.join("\n").trim();
};

const consultarGeminiParaRanking = async ({ consulta, items, candidatos, sugerencias }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!geminiApiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno");
  }

  const schema = {
    type: "object",
    properties: {
      resumen: { type: "string" },
      items_detectados: {
        type: "array",
        items: { type: "string" }
      },
      orden_negocios: {
        type: "array",
        items: { type: "integer" }
      },
      motivos_por_negocio: {
        type: "array",
        items: {
          type: "object",
          properties: {
            negocio_id: { type: "integer" },
            motivo: { type: "string" }
          },
          required: ["negocio_id", "motivo"]
        }
      },
      mensajes_sugerencia: {
        type: "array",
        items: {
          type: "object",
          properties: {
            termino: { type: "string" },
            mensaje: { type: "string" }
          },
          required: ["termino", "mensaje"]
        }
      }
    },
    required: [
      "resumen",
      "items_detectados",
      "orden_negocios",
      "motivos_por_negocio",
      "mensajes_sugerencia"
    ]
  };

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
    {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Eres un asistente de compras de un marketplace local.",
                "Usa solo los candidatos dados.",
                "No inventes datos.",
                "Prioriza cubrir mas productos en un solo negocio, luego menos faltantes y luego menor costo estimado.",
                "Responde solo JSON valido que cumpla el schema.",
                "",
                JSON.stringify(
                  {
                    tarea: "Ordena los negocios candidatos y explica la mejor opcion.",
                    consulta,
                    items_detectados: items,
                    candidatos,
                    sugerencias
                  },
                  null,
                  2
                )
              ].join("\n")
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: schema
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      timeout: 30000
    }
  );

  const texto = extraerTextoGemini(response.data);
  if (!texto) {
    throw new Error("Gemini no devolvio contenido util");
  }

  return JSON.parse(texto);
};

// ======================
// HELPER: BORRAR IMAGEN DE CLOUDINARY
// ======================
const borrarDeCloudinary = async (urlFoto) => {
  if (!urlFoto) return;
  try {
    const partes = urlFoto.split('/');
    const archivoConExtension = partes[partes.length - 1];
    const nombreArchivo = archivoConExtension.split('.')[0];
    // Asume que la carpeta en Cloudinary se llama "productos" según tu config de multer
    const publicId = `productos/${nombreArchivo}`; 
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error borrando imagen antigua de Cloudinary:", error);
  }
};

// ======================
// LISTAR PRODUCTOS (PÚBLICO)
// ======================
exports.listarTodos = async (req, res) => {
  try {
    // Parámetros de la URL: ?page=1&limit=10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [productos] = await pool.query(`
      SELECT p.id, p.nombre_producto, p.descripcion, p.precio, p.stock, p.foto, p.tipo_venta, p.unidad_medida, n.nombre_negocio
      FROM productos p
      JOIN negocios n ON p.negocio_id = n.id
      WHERE p.estado = 1
      LIMIT ? OFFSET ?
    `, [limit, offset]); 

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM productos WHERE estado = 1");

    return res.json({ 
      ok: true, 
      data: productos, 
      paginacion: { total, page, limit, paginas: Math.ceil(total / limit) } 
    });
  } catch (error) {
    console.error("ERROR LISTAR TODOS:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener productos" });
  }
};

exports.buscarInteligente = async (req, res) => {
  try {
    const consulta = (req.body?.consulta || req.query?.consulta || "").trim();
    const categoriaFiltro = (req.body?.categoria || req.query?.categoria || "").trim();

    if (!consulta) {
      return res.status(400).json({ ok: false, message: "Debes enviar una consulta" });
    }

    const itemsSolicitados = partirConsultaEnItems(consulta);

    if (!itemsSolicitados.length) {
      return res.status(400).json({
        ok: false,
        message: "No pudimos identificar productos en la consulta"
      });
    }

    const [productos] = await pool.query(
      `SELECT
        p.id,
        p.negocio_id,
        p.nombre_producto,
        p.descripcion,
        p.precio,
        p.stock,
        p.foto,
        p.tipo_venta,
        p.unidad_medida,
        n.nombre_negocio,
        n.ubicacion,
        n.logo,
        GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categoria
      FROM productos p
      JOIN negocios n ON n.id = p.negocio_id
      LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
      LEFT JOIN categorias c ON c.id_categoria = nc.categoria_id
      WHERE p.estado = 1
        AND n.estado = 1
        AND p.stock > 0
      GROUP BY
        p.id,
        p.negocio_id,
        p.nombre_producto,
        p.descripcion,
        p.precio,
        p.stock,
        p.foto,
        p.tipo_venta,
        p.unidad_medida,
        n.nombre_negocio,
        n.ubicacion,
        n.logo`
    );

    const categoriaNormalizada = normalizarTexto(categoriaFiltro);
    const productosFiltrados = categoriaNormalizada
      ? productos.filter((producto) =>
          normalizarTexto(producto.categoria).includes(categoriaNormalizada)
        )
      : productos;

    const negocios = new Map();

    for (const producto of productosFiltrados) {
      if (!negocios.has(producto.negocio_id)) {
        negocios.set(producto.negocio_id, {
          negocio_id: producto.negocio_id,
          nombre_negocio: producto.nombre_negocio,
          ubicacion: producto.ubicacion,
          logo: producto.logo,
          categoria: producto.categoria || "",
          productos: []
        });
      }

      negocios.get(producto.negocio_id).productos.push(producto);
    }

    const resultadosPorNegocio = [];
    const sugerenciasPorItem = [];

    for (const item of itemsSolicitados) {
      const variantes = crearVariantesDeItem(item);
      const matches = productosFiltrados
        .map((producto) => {
          const score = Math.max(
            ...variantes.map((variante) => calcularScoreProducto(variante, producto))
          );

          return { producto, score };
        })
        .filter((match) => match.score >= 40)
        .sort((a, b) => b.score - a.score || a.producto.precio - b.producto.precio);

      for (const match of matches) {
        const negocio = negocios.get(match.producto.negocio_id);
        if (!negocio) continue;

        if (!negocio.mejoresProductos) negocio.mejoresProductos = {};
        const anterior = negocio.mejoresProductos[item];
        if (!anterior || match.score > anterior.score) {
          negocio.mejoresProductos[item] = resumirProducto(match.producto, match.score, item);
        }
      }

      sugerenciasPorItem.push({
        termino: item,
        sugerencias: matches.slice(0, 5).map((match) =>
          resumirProducto(match.producto, match.score, item)
        )
      });
    }

    for (const negocio of negocios.values()) {
      const productosEncontrados = itemsSolicitados
        .map((item) => negocio.mejoresProductos?.[item])
        .filter(Boolean);

      const faltantes = itemsSolicitados.filter((item) => !negocio.mejoresProductos?.[item]);

      if (!productosEncontrados.length) continue;

      const totalEstimado = productosEncontrados.reduce(
        (acumulado, producto) => acumulado + Number(producto.precio || 0),
        0
      );

      const cobertura = Math.round((productosEncontrados.length / itemsSolicitados.length) * 100);
      const scoreNegocio =
        productosEncontrados.length * 1000 +
        productosEncontrados.reduce((acumulado, producto) => acumulado + producto.score, 0) -
        faltantes.length * 250 -
        totalEstimado;

      resultadosPorNegocio.push({
        negocio_id: negocio.negocio_id,
        nombre_negocio: negocio.nombre_negocio,
        ubicacion: negocio.ubicacion,
        logo: negocio.logo,
        categoria: negocio.categoria,
        cobertura,
        productos: productosEncontrados.sort((a, b) => b.score - a.score),
        faltantes,
        total_estimado: Number(totalEstimado.toFixed(2)),
        score: Number(scoreNegocio.toFixed(2))
      });
    }

    resultadosPorNegocio.sort((a, b) => {
      if (b.productos.length !== a.productos.length) {
        return b.productos.length - a.productos.length;
      }
      if (b.cobertura !== a.cobertura) {
        return b.cobertura - a.cobertura;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.total_estimado - b.total_estimado;
    });

    const candidatosParaIA = resultadosPorNegocio.slice(0, 5).map((negocio) => ({
      negocio_id: negocio.negocio_id,
      nombre_negocio: negocio.nombre_negocio,
      categoria: negocio.categoria,
      ubicacion: negocio.ubicacion,
      cobertura: negocio.cobertura,
      total_estimado: negocio.total_estimado,
      productos: negocio.productos.map((producto) => ({
        termino: producto.termino,
        producto_id: producto.producto_id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        unidad_medida: producto.unidad_medida,
        score: producto.score
      })),
      faltantes: negocio.faltantes
    }));

    const sugerenciasCompactas = sugerenciasPorItem.map((item) => ({
      termino: item.termino,
      sugerencias: item.sugerencias.slice(0, 3).map((producto) => ({
        producto_id: producto.producto_id,
        nombre_producto: producto.nombre_producto,
        nombre_negocio: producto.nombre_negocio,
        negocio_id: producto.negocio_id,
        precio: producto.precio,
        unidad_medida: producto.unidad_medida,
        score: producto.score
      }))
    }));

    let rankingIA = null;
    let modoRespuesta = "algoritmo_local";
    let avisoIA = null;

    if (candidatosParaIA.length > 0) {
      try {
        rankingIA = await consultarGeminiParaRanking({
          consulta,
          items: itemsSolicitados,
          candidatos: candidatosParaIA,
          sugerencias: sugerenciasCompactas
        });
        modoRespuesta = "gemini";
      } catch (error) {
        console.error("ERROR RANKING GEMINI:", error.response?.data || error.message);
        avisoIA =
          "La recomendacion se genero con el motor local porque Gemini no estuvo disponible.";
      }
    }

    if (rankingIA?.orden_negocios?.length) {
      const orden = new Map(rankingIA.orden_negocios.map((id, index) => [id, index]));
      const motivos = new Map(
        (rankingIA.motivos_por_negocio || []).map((item) => [item.negocio_id, item.motivo])
      );

      resultadosPorNegocio.sort((a, b) => {
        const ordenA = orden.has(a.negocio_id) ? orden.get(a.negocio_id) : Number.MAX_SAFE_INTEGER;
        const ordenB = orden.has(b.negocio_id) ? orden.get(b.negocio_id) : Number.MAX_SAFE_INTEGER;
        return ordenA - ordenB;
      });

      resultadosPorNegocio.forEach((negocio) => {
        negocio.explicacion_ia = motivos.get(negocio.negocio_id) || null;
      });
    }

    resultadosPorNegocio.forEach((negocio) => {
      negocio.explicacion_ia = construirExplicacionNegocio(negocio);
    });

    const sugerenciasFinales = sugerenciasPorItem.map((item) => ({
      ...item,
      mensaje_ia: construirMensajeSugerencia(item)
    }));

    const distribucionPorItem = construirDistribucionPorItem(
      itemsSolicitados,
      sugerenciasPorItem
    );
    const resumenConsulta = construirResumenConsulta(distribucionPorItem);

    return res.json({
      ok: true,
      modo: modoRespuesta,
      aviso: avisoIA,
      consulta,
      categoria_aplicada: categoriaFiltro || null,
      items_detectados: rankingIA?.items_detectados?.length
        ? rankingIA.items_detectados
        : itemsSolicitados,
      resumen_consulta: resumenConsulta,
      resumen_ia: rankingIA?.resumen || null,
      distribucion_por_item: distribucionPorItem,
      recomendacion_principal: resultadosPorNegocio[0] || null,
      alternativas: resultadosPorNegocio.slice(1, 5),
      sugerencias: sugerenciasFinales
    });
  } catch (error) {
    console.error("ERROR BUSQUEDA INTELIGENTE:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al procesar la busqueda inteligente"
    });
  }
};

exports.listarPorNegocio = async (req, res) => {
  try {
    const { id_negocio } = req.params;

    const [rows] = await pool.query(
      `SELECT
        id,
        nombre_producto,
        descripcion,
        precio,
        stock,
        foto,
        tipo_venta,
        unidad_medida
       FROM productos
       WHERE negocio_id = ? AND estado = 1`,
      [id_negocio]
    );

    return res.json({ ok: true, data: rows });

  } catch (error) {
    console.error("ERROR LISTAR POR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al listar productos" });
  }
};

exports.listarMisProductos = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const [rows] = await pool.query(
      `SELECT 
          p.id,
          p.nombre_producto,
          p.descripcion,
          p.tipo_venta,
          p.precio,
          p.unidad_medida,
          p.stock,
          p.foto,
          p.estado
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ?`,
      [id_usuario]
    );

    return res.json({ ok: true, data: rows });

  } catch (error) {
    console.error("ERROR LISTAR MIS PRODUCTOS:", error);
    return res.status(500).json({ ok: false, message: "Error SQL" });
  }
};

// ======================
// CREAR PRODUCTO
// ======================
exports.crear = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const {
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock
    } = req.body;

    const foto = req.file?.path || null;

    const [negocioRows] = await pool.query(
      "SELECT id FROM negocios WHERE usuario_id = ? AND estado = 1",
      [id_usuario]
    );

    if (negocioRows.length === 0) {
      return res.status(403).json({
        ok: false,
        message: "No tiene negocio registrado"
      });
    }

    const negocio_id = negocioRows[0].id;

    const [result] = await pool.query(
      `INSERT INTO productos
        (negocio_id, nombre_producto, descripcion, tipo_venta, precio, unidad_medida, stock, foto, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        negocio_id,
        nombre_producto,
        descripcion,
        tipo_venta,
        precio,
        unidad_medida,
        stock || 0,
        foto
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Producto creado correctamente",
      id_producto: result.insertId
    });

  } catch (error) {
    console.error("ERROR CREAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear producto"
    });
  }
};

// ======================
// EDITAR PRODUCTO
// ======================
exports.editar = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const {
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock
    } = req.body;

    const foto = req.file?.path;

    // 🔥 SI HAY UNA FOTO NUEVA, BUSCAMOS LA VIEJA Y LA BORRAMOS DE CLOUDINARY
    if (foto) {
      const [productoRow] = await pool.query("SELECT foto FROM productos WHERE id = ?", [id_producto]);
      if (productoRow.length > 0 && productoRow[0].foto) {
        await borrarDeCloudinary(productoRow[0].foto);
      }
    }

    let query = `
      UPDATE productos p
      JOIN negocios n ON n.id = p.negocio_id
      SET 
        p.nombre_producto = ?,
        p.descripcion = ?,
        p.tipo_venta = ?,
        p.precio = ?,
        p.unidad_medida = ?,
        p.stock = ?
    `;

    const params = [
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock
    ];

    if (foto) {
      query += `, p.foto = ?`;
      params.push(foto);
    }

    query += ` WHERE p.id = ? AND n.usuario_id = ?`;

    params.push(id_producto, id_usuario);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado o el producto no existe"
      });
    }

    return res.json({
      ok: true,
      message: "Producto actualizado"
    });

  } catch (error) {
    console.error("ERROR EDITAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al editar producto"
    });
  }
};

// ======================
// ELIMINAR / DESACTIVAR PRODUCTO (SOFT)
// ======================
exports.eliminar = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET p.estado = 0
       WHERE p.id = ? AND n.usuario_id = ?`,
      [id_producto, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado"
      });
    }

    return res.json({
      ok: true,
      message: "Producto desactivado"
    });

  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al desactivar producto"
    });
  }
};

// ======================
// ACTIVAR PRODUCTO
// ======================
exports.activar = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET p.estado = 1
       WHERE p.id = ? AND n.usuario_id = ?`,
      [id_producto, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado"
      });
    }

    return res.json({
      ok: true,
      message: "Producto activado nuevamente"
    });

  } catch (error) {
    console.error("ERROR ACTIVAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al activar producto"
    });
  }
};
