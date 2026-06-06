const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");
const { asegurarColumna } = require("../utils/schema");

const asegurarProductoDestacadoSchema = () =>
  asegurarColumna("productos", "destacado", "TINYINT(1) NOT NULL DEFAULT 0");

const STOPWORDS_CONSULTA = new Set([
  "a",
  "al",
  "algo",
  "ayuda",
  "ayudar",
  "bot",
  "buenas",
  "busca",
  "buscar",
  "busco",
  "chat",
  "como",
  "comercio",
  "comer",
  "con",
  "dame",
  "de",
  "del",
  "estas",
  "esta",
  "dime",
  "donde",
  "eh",
  "ehh",
  "emm",
  "mmm",
  "el",
  "en",
  "encuentra",
  "encuentran",
  "encuentro",
  "ere",
  "eres",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "necesito",
  "negocio",
  "negocios",
  "oye",
  "para",
  "porfa",
  "favor",
  "porfavor",
  "por",
  "poco",
  "poquito",
  "poquita",
  "poquitos",
  "poquitas",
  "pues",
  "pue",
  "puede",
  "puedes",
  "que",
  "quiero",
  "recomendacion",
  "recomendaciones",
  "recomiendame",
  "recomendame",
  "saber",
  "se",
  "solo",
  "sugerencia",
  "sugerencias",
  "su",
  "sus",
  "tal",
  "te",
  "tu",
  "vas",
  "va",
  "un",
  "una",
  "uno",
  "unos",
  "unas",
  "vende",
  "venden",
  "vender",
  "venta",
  "ia",
  "hola",
  "hablar",
  "contigo",
  "conmigo",
  "conversar",
  "charlar",
  "amigo",
  "amiga",
  "bro",
  "broo",
  "broh",
  "y"
]);

const SALUDOS_CONSULTA = ["hola", "buenas", "hey", "ey", "saludos"];
const FRASES_CHARLA = [
  "hola como estas",
  "hola como vas",
  "como estas",
  "como vas",
  "que tal",
  "todo bien",
  "como te va",
  "como andas",
  "como andas hoy",
  "quiero hablar contigo",
  "solo quiero hablar contigo",
  "solo hablar contigo",
  "quiero conversar contigo",
  "solo quiero conversar",
  "quiero charlar contigo",
  "amigo",
  "eres mi amigo"
];
const CORTESIAS_CONSULTA = [
  "gracias",
  "muchas gracias",
  "ok",
  "oki",
  "okey",
  "perfecto",
  "listo",
  "dale",
  "genial",
  "super",
  "excelente",
  "entiendo",
  "entendido",
  "esta bien",
  "ta bien"
];
const SINONIMOS_PRODUCTOS = {
  palta: ["aguacate"],
  aguacate: ["palta"],
  guineo: ["banano", "banana"],
  banano: ["guineo", "banana"],
  banana: ["guineo", "banano"],
  choclo: ["maiz"],
  maiz: ["choclo"],
  chancho: ["cerdo", "puerco"],
  cerdo: ["chancho", "puerco"],
  puerco: ["chancho", "cerdo"],
  gaseosa: ["soda", "cola", "refresco"],
  soda: ["gaseosa", "cola", "refresco"],
  cola: ["gaseosa", "soda", "refresco"],
  refresco: ["gaseosa", "soda", "cola"],
  dulce: ["golosina"],
  golosina: ["dulce"],
  embutido: ["salchicha", "chorizo", "mortadela", "jamon"],
  salchicha: ["embutido"],
  chorizo: ["embutido"],
  mortadela: ["embutido"],
  jamon: ["embutido"],
  especia: ["condimento"],
  condimento: ["especia"],
  salsa: ["aderezo"],
  aderezo: ["salsa"]
};
const FRASES_INDECISION = [
  "no se que pedir",
  "no se que mismo pedir",
  "no se que comprar",
  "que me recomiendas",
  "recomendame",
  "recomiendame",
  "dame una idea",
  "algo rico",
  "algo para comer",
  "que podria pedir",
  "que puedo pedir",
  "que compro"
];
const FRASES_SEGUIMIENTO = [
  "y donde mas",
  "donde mas",
  "otra opcion",
  "otras opciones",
  "otra alternativa",
  "otras alternativas",
  "algo parecido",
  "algo similar",
  "y que mas",
  "que mas",
  "y si no hay"
];
const FRASES_CONFIRMACION_SEGUIMIENTO = [
  "si",
  "sii",
  "sip",
  "claro",
  "dale",
  "ok",
  "oki",
  "okey",
  "bueno",
  "perfecto",
  "listo",
  "muestrame",
  "ver",
  "verlas",
  "verlos",
  "quiero ver",
  "ensename"
];

const normalizarTexto = (texto = "") =>
  texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const esConsultaFueraDeComercio = (texto = "") => {
  const original = texto.toString().toLowerCase();
  const normalizado = normalizarTexto(texto);
  const terminosDeComercio = [
    "producto",
    "negocio",
    "comercio",
    "local",
    "tienda",
    "catalogo",
    "comprar",
    "pedido",
    "orden",
    "carrito",
    "precio",
    "costo",
    "pago",
    "pagos",
    "metodo",
    "metodos",
    "payphone",
    "efectivo",
    "tarjeta",
    "delivery",
    "envio",
    "domicilio",
    "retiro",
    "stock",
    "inventario",
    "categoria",
    "cliente",
    "vendedor",
    "qr",
    "correo",
    "telefono",
    "ubicacion",
    "horario",
    "app",
    "plataforma",
    "cuenta",
    "login",
    "registro",
    "contrasena",
    "solicitud",
    "solicitudes",
    "administrador",
    "admin",
    "configuracion",
    "configurar",
    "reporte",
    "reportes",
    "venta",
    "ventas",
    "escaner",
    "cobrar",
    "aprobar",
    "rechazar",
    "unidad",
    "unidades",
    "activar",
    "desactivar",
    "logo",
    "portada",
    "redes",
    "whatsapp",
    "telegram",
    "store",
    "storeid",
    "identificador",
    "jipijapa"
  ];

  const tieneTerminoComercial = terminosDeComercio.some((termino) =>
    normalizado.includes(termino)
  );

  const patronesFueraDeTema = [
    /\b(cu[aá]nto|cuanto|calcula|resolver|resultado)\b.*\d+\s*[\+\-\*x/]\s*\d+/i,
    /\d+\s*[\+\-\*x/]\s*\d+/,
    /\b(capital de|clima|deporte|programa|codigo|historia de|chiste|poema|traduce|noticia)\b/i
  ];

  return !tieneTerminoComercial && patronesFueraDeTema.some((patron) => patron.test(original));
};

const singularizarToken = (token = "") => {
  if (token === "dulces") return "dulce";
  if (token.length > 4 && token.endsWith("es")) {
    const letraAntesDeEs = token[token.length - 3];
    return "aeiou".includes(letraAntesDeEs) ? token.slice(0, -1) : token.slice(0, -2);
  }
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

const obtenerSinonimosProducto = (token = "") => SINONIMOS_PRODUCTOS[token] || [];

const crearVariantesDeItem = (item = "") => {
  const limpio = normalizarTexto(item);
  const tokens = tokenizarSinStopwords(item);
  const variantes = new Set();

  if (limpio) variantes.add(limpio);
  if (tokens.length) {
    variantes.add(tokens.join(" "));
    tokens.forEach((token) => {
      variantes.add(token);
      obtenerSinonimosProducto(token).forEach((sinonimo) => variantes.add(sinonimo));
    });

    if (tokens.length <= 3) {
      const variantesPorToken = tokens.map((token) => [token, ...obtenerSinonimosProducto(token)]);
      const combinaciones = variantesPorToken.reduce(
        (acumuladas, opciones) =>
          acumuladas.flatMap((acumulada) => opciones.map((opcion) => [...acumulada, opcion])),
        [[]]
      );

      combinaciones.forEach((combinacion) => {
        const variante = combinacion.join(" ").trim();
        if (variante) variantes.add(variante);
      });
    }
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

const contieneTodosLosTokens = (tokensBuscados = [], texto = "") => {
  if (!tokensBuscados.length) return false;
  const tokensTexto = tokenizar(texto);
  return tokensBuscados.every((token) => tokensTexto.includes(token));
};

const calcularScoreProducto = (item, producto) => {
  const itemNormalizado = normalizarTexto(item);
  const itemTokens = tokenizarSinStopwords(item);
  const nombreNormalizado = normalizarTexto(producto.nombre_producto);
  const nombreTokens = tokenizar(producto.nombre_producto);
  const descripcionNormalizada = normalizarTexto(producto.descripcion);
  const categoriaNormalizada = normalizarTexto(producto.categoria);
  const busquedaCorta = itemNormalizado.length <= 3 || itemTokens.some((token) => token.length <= 3);
  const blob = normalizarTexto(
    `${producto.nombre_producto} ${producto.descripcion || ""} ${producto.categoria || ""} ${producto.nombre_negocio || ""}`
  );

  let score = 0;

  if (nombreNormalizado === itemNormalizado) score += 120;
  if (!busquedaCorta && nombreNormalizado.includes(itemNormalizado) && itemNormalizado) score += 95;
  if (!busquedaCorta && itemNormalizado.includes(nombreNormalizado) && nombreNormalizado) score += 60;

  const similitudNombre = calcularSimilitudTokens(itemTokens, nombreTokens);
  score += similitudNombre * 80;

  const todasLasPalabrasEnNombre =
    itemTokens.length > 0 && itemTokens.every((token) => nombreTokens.includes(token));
  if (todasLasPalabrasEnNombre) score += 35;

  const todasLasPalabrasEnDescripcion = busquedaCorta
    ? contieneTodosLosTokens(itemTokens, descripcionNormalizada)
    : itemTokens.length > 0 && itemTokens.every((token) => descripcionNormalizada.includes(token));
  if (todasLasPalabrasEnDescripcion) score += 20;

  const todasLasPalabrasEnCategoria = busquedaCorta
    ? contieneTodosLosTokens(itemTokens, categoriaNormalizada)
    : itemTokens.length > 0 && itemTokens.every((token) => categoriaNormalizada.includes(token));
  if (todasLasPalabrasEnCategoria) score += 10;

  if (!busquedaCorta && blob.includes(itemNormalizado) && itemNormalizado) score += 15;

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
  destacado: Number(producto.destacado || 0),
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

const limpiarItemsDetectados = (items = []) =>
  Array.isArray(items)
    ? Array.from(
        new Set(
          items
            .map((item) => tokenizarSinStopwords(item).join(" ").trim())
            .filter(Boolean)
        )
      ).slice(0, 8)
    : [];

const limpiarHistorialConversacion = (history = []) =>
  Array.isArray(history)
    ? history
        .slice(-8)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          text: (item?.text || "").toString().trim(),
          items_detectados: Array.isArray(item?.items_detectados)
            ? item.items_detectados
                .map((value) => normalizarTexto(value))
                .filter(Boolean)
                .slice(0, 8)
            : []
        }))
        .filter((item) => item.text)
    : [];

const formatearHistorialParaPrompt = (history = []) =>
  history
    .slice(-6)
    .map((item) => `${item.role === "assistant" ? "Asistente" : "Usuario"}: ${item.text}`)
    .join("\n");

const contieneAlgunaFrase = (texto = "", frases = []) =>
  frases.some((frase) => texto === frase || texto.includes(frase));

const obtenerUltimosItemsDelHistorial = (history = []) => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const items = history[index]?.items_detectados || [];
    if (items.length) {
      return Array.from(new Set(items));
    }
  }

  return [];
};

const obtenerSugerenciaConfirmadaDelHistorial = (history = []) => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const mensaje = history[index];
    if (mensaje?.role !== "assistant") continue;

    const texto = normalizarTexto(mensaje.text || "");
    const patrones = [
      /opciones de ([a-z0-9\s]+?)(?:\?|\.|$)/,
      /alternativas de ([a-z0-9\s]+?)(?:\?|\.|$)/,
      /ver ([a-z0-9\s]+?)(?:\?|\.|$)/,
      /buscar ([a-z0-9\s]+?)(?:\?|\.|$)/
    ];

    for (const patron of patrones) {
      const match = texto.match(patron);
      const termino = tokenizarSinStopwords(match?.[1] || "").join(" ").trim();
      if (termino) return [termino];
    }
  }

  return [];
};

const esConsultaDeCortesia = (consultaNormalizada = "") => {
  if (!consultaNormalizada) return false;
  return (
    contieneAlgunaFrase(consultaNormalizada, CORTESIAS_CONSULTA) &&
    tokenizar(consultaNormalizada).length <= 8
  );
};

const esConsultaDeIndecision = (consultaNormalizada = "") =>
  contieneAlgunaFrase(consultaNormalizada, FRASES_INDECISION);

const esSeguimientoConversacional = (consultaNormalizada = "") =>
  contieneAlgunaFrase(consultaNormalizada, FRASES_SEGUIMIENTO);

const esConfirmacionDeSeguimiento = (consultaNormalizada = "") => {
  if (!consultaNormalizada) return false;
  return (
    contieneAlgunaFrase(consultaNormalizada, FRASES_CONFIRMACION_SEGUIMIENTO) &&
    tokenizar(consultaNormalizada).length <= 4
  );
};

const esConsultaDeCharla = (consultaNormalizada = "") =>
  contieneAlgunaFrase(consultaNormalizada, FRASES_CHARLA);

const esBusquedaExplicita = (consultaNormalizada = "", itemsTentativos = []) => {
  if (!consultaNormalizada) return false;

  const frasesConversacionales = [
    "hablar contigo",
    "conversar contigo",
    "charlar contigo",
    "como estas",
    "como vas",
    "que tal",
    "todo bien"
  ];

  if (frasesConversacionales.some((frase) => consultaNormalizada.includes(frase))) {
    return false;
  }

  const pistasBusqueda = [
    "donde venden",
    "donde encuentro",
    "busco",
    "necesito",
    "quiero comprar",
    "quiero pedir",
    "quiero conseguir",
    "tienen",
    "venden",
    "hay "
  ];

  if (pistasBusqueda.some((frase) => consultaNormalizada.includes(frase))) {
    return itemsTentativos.length > 0;
  }

  if (consultaNormalizada.startsWith("quiero ") && itemsTentativos.length > 0) {
    return true;
  }

  return false;
};

const esConsultaCortaDeProducto = (consultaNormalizada = "", itemsTentativos = []) => {
  if (!itemsTentativos.length) return false;
  if (esConsultaDeCharla(consultaNormalizada)) return false;
  if (esConsultaDeCortesia(consultaNormalizada)) return false;
  if (esConsultaDeIndecision(consultaNormalizada)) return false;

  const tokens = tokenizar(consultaNormalizada);
  return tokens.length > 0 && tokens.length <= 3;
};

const limpiarContextoUsuario = (contexto = {}) => {
  const rol = ["cliente", "negocio", "admin"].includes(contexto?.rol)
    ? contexto.rol
    : "visitante";

  return {
    rol,
    autenticado: Boolean(contexto?.autenticado),
    estado_negocio:
      contexto?.estado_negocio === 0 || contexto?.estado_negocio === "0"
        ? 0
        : contexto?.estado_negocio || null,
    ruta: (contexto?.ruta || "").toString().slice(0, 120)
  };
};

const crearSugerenciasAccion = (rol = "visitante", contexto = "general") => {
  const comunes = [
    { label: "Como puedo pagar?", query: "como puedo pagar?" },
    { label: "Buscar un producto", query: "como busco un producto?" },
    { label: "Como funciona delivery?", query: "como funciona el delivery?" }
  ];

  const porRol = {
    visitante: [
      { label: "Como registrarme?", query: "como me registro?" },
      { label: "Quiero ser negocio", query: "como puedo ser negocio?" }
    ],
    cliente: [
      { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
      { label: "Ver mis pedidos", query: "como reviso mis pedidos?" }
    ],
    negocio: [
      { label: "Configurar pagos", query: "como configuro PayPhone para mi negocio?" },
      { label: "Gestionar productos", query: "como agrego o edito productos?" },
      { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" }
    ],
    admin: [
      { label: "Revisar solicitudes", query: "como reviso solicitudes de negocios?" },
      { label: "Configurar sistema", query: "que puedo configurar como admin?" },
      { label: "Reportes", query: "como reviso reportes de ventas?" }
    ]
  };

  const extrasCatalogo =
    contexto === "catalogo"
      ? [{ label: "Buscar otro producto", query: "como busco otro producto?" }]
      : [];

  return [...(porRol[rol] || porRol.visitante), ...extrasCatalogo, ...comunes].slice(0, 6);
};

const contienePalabraDeGrupo = (texto = "", palabras = []) =>
  palabras.some((palabra) => texto.includes(palabra));

const extraerTerminoNegocio = (consulta = "") => {
  const texto = normalizarTexto(consulta);
  const pistas = [
    "informacion de",
    "datos de",
    "telefono de",
    "ubicacion de",
    "horario de",
    "contacto de",
    "redes de",
    "donde queda",
    "donde esta"
  ];

  if (!pistas.some((pista) => texto.includes(pista))) return "";

  const limpio = pistas
    .reduce((actual, pista) => actual.replace(pista, " "), texto)
    .replace(/\b(negocio|local|tienda|comercio|quiero|saber|sobre|el|la|los|las|un|una|porfavor|porfa)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpio || limpio.length < 3) return "";
  if (["negocio", "local", "tienda"].includes(limpio)) return "";
  return limpio;
};

const buscarNegociosPorNombre = async (termino = "") => {
  if (!termino) return [];

  const [rows] = await pool.query(
    `SELECT
      n.id AS negocio_id,
      n.nombre_negocio,
      n.ubicacion,
      n.telefono,
      n.horarios,
      n.descripcion,
      n.logo,
      GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categoria
    FROM negocios n
    LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
    LEFT JOIN categorias c ON c.id_categoria = nc.categoria_id
    WHERE n.estado = 1
      AND LOWER(n.nombre_negocio) LIKE LOWER(?)
    GROUP BY
      n.id,
      n.nombre_negocio,
      n.ubicacion,
      n.telefono,
      n.horarios,
      n.descripcion,
      n.logo
    LIMIT 5`,
    [`%${termino}%`]
  );

  return rows;
};

const construirRespuestaNegocio = (negocios = [], termino = "") => {
  if (!negocios.length) {
    return `No encontre un negocio activo que coincida con "${termino}". Prueba con parte del nombre o revisa Explorar Negocios.`;
  }

  const principal = negocios[0];
  const datos = [
    principal.ubicacion ? `ubicacion: ${principal.ubicacion}` : null,
    principal.telefono ? `telefono: ${principal.telefono}` : null,
    principal.horarios ? `horario: ${principal.horarios}` : null,
    principal.categoria ? `categorias: ${principal.categoria}` : null
  ].filter(Boolean);

  const extras = negocios.length > 1
    ? ` Tambien encontre ${negocios.slice(1).map((negocio) => negocio.nombre_negocio).join(", ")}.`
    : "";

  return `Encontre ${principal.nombre_negocio}${datos.length ? ` (${datos.join("; ")})` : ""}.${extras} Puedes abrir el negocio para ver sus productos y mas detalles.`;
};

const construirRespuestaAyudaSistema = (consulta = "", userContext = {}) => {
  const texto = normalizarTexto(consulta);
  const rol = userContext.rol || "visitante";
  const estaAutenticado = userContext.autenticado;
  const esNegocioOAdmin = rol === "negocio" || rol === "admin";

  const respuesta = (mensaje, sugerencias = crearSugerenciasAccion(rol)) => ({
    respuesta_chat: mensaje,
    sugerencias_accion: sugerencias
  });

  if (contienePalabraDeGrupo(texto, ["store id", "storeid", "store", "id de payphone", "id payphone", "id de tienda", "identificador de payphone", "consigo el store", "condigo el store", "obtengo el store", "conseguir store", "obtener store"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "El Store ID de PayPhone lo necesita el negocio para activar pagos con tarjeta. Si eres cliente, no tienes que conseguirlo; solo veras PayPhone como opcion cuando el negocio ya lo haya configurado.",
        [
          { label: "Que es PayPhone?", query: "que es PayPhone en la plataforma?" },
          { label: "Como pagar?", query: "como puedo pagar?" },
          { label: "Ser negocio", query: "como puedo ser negocio?" }
        ]
      );
    }

    return respuesta(
      "El Store ID se obtiene en tu cuenta/comercio de PayPhone, no lo genera esta plataforma. Entra a PayPhone con la cuenta del negocio, revisa la seccion de comercio/tienda o integraciones y copia el Store ID. Luego vuelve a la app, abre Configurar Negocio desde la barra lateral izquierda, pega ese Store ID y guarda. Si no lo encuentras, debes pedirlo al soporte o panel de PayPhone.",
      [
        { label: "Que es PayPhone?", query: "que es PayPhone en la plataforma?" },
        { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" },
        { label: "Metodos de pago", query: "como puedo pagar?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["cobrar efectivo", "cobro efectivo", "cobro pedidos en efectivo", "cobrar pedidos en efectivo", "como cobro pedidos", "confirmar efectivo", "escaner", "codigo qr", "qr"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "El cobro en efectivo lo realiza el negocio. Como cliente, cuando tengas un pedido activo puedes mostrar el QR desde Mis Pedidos para que el negocio confirme el pago y la entrega.",
        [
          { label: "Mis pedidos", query: "como reviso mis pedidos?" },
          { label: "Como pagar?", query: "como puedo pagar?" },
          { label: "Como comprar?", query: "como hago una compra?" }
        ]
      );
    }

    return respuesta(
      "Para cobrar un pedido en efectivo, abre Cobrar Efectivo desde la barra lateral izquierda de tu panel. Escanea el QR que muestra el cliente desde Mis Pedidos; si la camara falla, escribe manualmente el codigo de la orden. Revisa el total y confirma el pago/entrega solo cuando hayas recibido el efectivo.",
      [
        { label: "Pedidos recibidos", query: "como reviso pedidos recibidos?" },
        { label: "Configurar PayPhone", query: "como configuro PayPhone para mi negocio?" },
        { label: "Reportes", query: "como reviso reportes de ventas?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["que es payphone", "payphone en la plataforma", "como funciona payphone", "payphone"])) {
    if (esNegocioOAdmin && contienePalabraDeGrupo(texto, ["configuro", "configurar", "mi negocio", "negocio"])) {
      return respuesta(
        "PayPhone es la pasarela que permite a un negocio aceptar pagos con tarjeta desde la plataforma. Para activarlo, entra a Configurar Negocio y registra el Store ID de PayPhone; desde ese momento, si esta bien configurado, al cliente le aparecera la opcion de pagar online en el carrito.",
        [
          { label: "Metodos de pago", query: "como puedo pagar?" },
          { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" },
          { label: "Delivery", query: "como funciona el delivery?" }
        ]
      );
    }

    return respuesta(
      "PayPhone es el servicio de pago online que algunos negocios pueden activar para recibir pagos con tarjeta. Si el negocio lo tiene configurado, veras la opcion de pagar con PayPhone al finalizar el carrito; si no aparece, ese negocio solo tiene los metodos que muestre la app, como efectivo o retiro/entrega segun corresponda.",
      [
        { label: "Como pagar?", query: "como puedo pagar?" },
        { label: "Como comprar?", query: "como hago una compra?" },
        { label: "Delivery", query: "como funciona el delivery?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["buscar producto", "buscar un producto", "busco un producto", "busqueda de producto", "como busco un producto", "como buscar un producto", "encontrar producto", "encontrar un producto", "buscar otro producto"])) {
    return respuesta(
      'Para buscar un producto, escribeme algo concreto como "donde venden arroz" o "quiero comprar pan y leche". Yo reviso los negocios activos y te muestro en cual aparece, con un boton para abrir el negocio.',
      [
        { label: "Ver ejemplo", query: "dame un ejemplo de busqueda de producto" },
        { label: "Buscar negocios", query: "como busco negocios?" },
        { label: "Como comprar?", query: "como hago una compra?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["delivery en mi negocio", "funcionar el delivery en mi negocio", "funcionar delivery en mi negocio", "activar delivery", "habilitar delivery", "configurar delivery", "delivery para mi negocio", "entrega a domicilio en mi negocio"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "El delivery lo puede activar una cuenta con rol negocio. Si quieres vender y ofrecer entregas, primero solicita abrir un negocio desde la barra lateral izquierda.",
        [
          { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
          { label: "Como funciona delivery?", query: "como funciona el delivery?" },
          { label: "Como comprar?", query: "como hago una compra?" }
        ]
      );
    }

    return respuesta(
      "Para hacer funcionar el delivery en tu negocio, entra a Configurar Negocio desde la barra lateral izquierda. Activa la opcion de delivery, define el costo de entrega y guarda los cambios; luego, cuando un cliente compre en tu negocio, podra elegir entrega a domicilio en el carrito.",
      [
        { label: "Configurar pagos", query: "como configuro PayPhone para mi negocio?" },
        { label: "Pedidos recibidos", query: "como reviso pedidos recibidos?" },
        { label: "Agregar productos", query: "como agrego o edito productos?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["agrego o edito productos", "agregar producto", "agrego producto", "editar producto", "edito producto", "agregar productos", "editar productos", "mis productos", "producto nuevo", "nuevo producto", "agregar uno nuevo", "crear producto", "editar uno existente"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "Agregar o editar productos es una opcion para cuentas negocio. Si quieres vender, puedes solicitar abrir un negocio desde la barra lateral izquierda.",
        [
          { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
          { label: "Buscar producto", query: "como busco un producto?" },
          { label: "Como comprar?", query: "como hago una compra?" }
        ]
      );
    }

    if (contienePalabraDeGrupo(texto, ["editar", "edito", "existente"])) {
      return respuesta(
        "Para editar un producto existente, entra a Productos desde la barra lateral izquierda, busca el producto y usa la opcion de editar. Ahi puedes ajustar nombre, precio, stock, foto, categoria o datos de venta y guardar los cambios.",
        [
          { label: "Agregar nuevo", query: "como agrego un producto nuevo?" },
          { label: "Inventario", query: "como manejo el inventario?" },
          { label: "Pedidos", query: "como reviso pedidos recibidos?" }
        ]
      );
    }

    return respuesta(
      "Para agregar un producto nuevo, entra a Productos desde la barra lateral izquierda y usa la opcion de crear/agregar. Completa nombre, precio, stock, unidad o tipo de venta, categoria e imagen si aplica; al guardar, el producto queda disponible en tu negocio si esta activo.",
      [
        { label: "Editar producto", query: "como edito un producto existente?" },
        { label: "Configurar delivery", query: "como hago funcionar el delivery en mi negocio?" },
        { label: "Pedidos", query: "como reviso pedidos recibidos?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["registrarme", "registro", "como me registro", "crear cuenta", "abrir cuenta", "iniciar sesion", "login"])) {
    if (estaAutenticado) {
      return respuesta(
        "Ya tienes una sesion iniciada. Desde la barra lateral izquierda puedes ir a tus opciones disponibles segun tu rol, como Mis Pedidos, Abrir Negocio o el panel si ya eres negocio.",
        crearSugerenciasAccion(rol)
      );
    }

    return respuesta(
      "Para registrarte, usa el boton Ingresar y luego la opcion de registro. Completa tus datos, crea tu cuenta e inicia sesion; despues podras comprar, revisar pedidos y solicitar abrir un negocio desde la barra lateral izquierda.",
      [
        { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
        { label: "Como comprar?", query: "como hago una compra?" },
        { label: "Buscar producto", query: "como busco un producto?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["metodo de pago", "metodos de pago", "como puedo pagar", "como pago", "pagar", "pago", "tarjeta", "efectivo"])) {
    return respuesta(
      "Los metodos dependen de cada negocio. Como cliente, en el carrito veras las opciones disponibles: normalmente efectivo, y tarjeta/PayPhone si ese negocio lo tiene configurado. Primero agregas productos, eliges retiro o delivery si esta disponible, y luego escoges el metodo que aparezca habilitado.",
      [
        { label: "Que es PayPhone?", query: "que es PayPhone en la plataforma?" },
        { label: "Configurar pagos", query: "como configuro PayPhone para mi negocio?" },
        { label: "Como compro?", query: "como hago una compra?" },
        { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["ser negocio", "abrir negocio", "crear negocio", "solicitar negocio", "vender aqui", "hacerme negocio"])) {
    if (rol === "negocio" || rol === "admin") {
      return respuesta(
        "Ya tienes acceso a las opciones de negocio. Desde la barra lateral izquierda puedes entrar al panel, gestionar productos, configurar pagos/delivery y revisar ventas.",
        crearSugerenciasAccion(rol)
      );
    }

    const inicio = estaAutenticado
      ? "En la barra lateral izquierda entra en Abrir Negocio y llena la solicitud con datos, ubicacion y categorias."
      : "Primero debes registrarte o iniciar sesion. Luego veras la opcion Abrir Negocio en la barra lateral izquierda.";

    return respuesta(
      `${inicio} Un administrador revisa la solicitud; si la aprueba, tu cuenta pasa a rol negocio y se habilita tu panel.`,
      [
        { label: "Que datos piden?", query: "que datos necesito para solicitar un negocio?" },
        { label: "Como comprar?", query: "como hago una compra?" },
        { label: "Buscar negocios", query: "como busco negocios?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["que datos piden", "datos necesito", "datos para solicitar", "solicitud de negocio", "datos del negocio"])) {
    return respuesta(
      "Para solicitar un negocio normalmente debes registrar nombre del negocio, descripcion, ubicacion, telefono o contacto, categorias, logo/imagenes si aplica y datos basicos para que el administrador pueda revisar la solicitud. La solicitud se envia desde Abrir Negocio en la barra lateral izquierda.",
      [
        { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
        { label: "Como registrarme?", query: "como me registro?" },
        { label: "Buscar negocios", query: "como busco negocios?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["configurar mi negocio", "configuracion del negocio", "configurar negocio", "payphone para mi negocio", "inventario", "stock"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "Esas opciones son para cuentas con rol negocio. Si quieres vender en la plataforma, puedes enviar una solicitud desde Abrir Negocio.",
        [
          { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
          { label: "Como comprar?", query: "como hago una compra?" }
        ]
      );
    }

    return respuesta(
      "Como negocio, usa la barra lateral izquierda: Mi Negocio para ver pedidos, Productos para crear o editar inventario, Configurar Negocio para PayPhone/delivery/datos de contacto, Historial y Reportes para ventas, y Cobrar Efectivo para escanear el QR del cliente.",
      crearSugerenciasAccion(rol)
    );
  }

  if (contienePalabraDeGrupo(texto, ["admin", "administrador", "solicitudes", "aprobar negocios", "rechazar negocios", "configurar sistema", "categorias", "unidades"])) {
    if (rol !== "admin") {
      return respuesta(
        "Las opciones de administrador solo aparecen para cuentas admin. Un admin puede revisar solicitudes de negocios y ajustar categorias o unidades del sistema.",
        crearSugerenciasAccion(rol)
      );
    }

    return respuesta(
      "Como admin, usa la barra lateral izquierda para revisar solicitudes de negocios, aprobar o rechazar solicitudes, configurar categorias y unidades, y entrar a modulos de supervision como productos, pedidos y reportes.",
      crearSugerenciasAccion("admin")
    );
  }

  if (contienePalabraDeGrupo(texto, ["mis pedidos", "estado de pedido", "pedidos recibidos", "pedido recibido", "ver pedidos", "reviso pedidos", "pedido", "orden", "carrito", "como compro", "como comprar", "hacer una compra", "proceso de compra"])) {
    if (esNegocioOAdmin && contienePalabraDeGrupo(texto, ["pedidos recibidos", "pedido recibido", "ver pedidos", "reviso pedidos"])) {
      return respuesta(
        "Para revisar pedidos recibidos, entra a Mi Negocio o al panel desde la barra lateral izquierda. Ahi ves el estado, cliente, fecha, total y puedes abrir el detalle o actualizar el estado del pedido.",
        [
          { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" },
          { label: "Agregar productos", query: "como agrego o edito productos?" },
          { label: "Reportes", query: "como reviso reportes de ventas?" }
        ]
      );
    }

    return respuesta(
      "Para comprar, entra a un negocio, agrega productos al carrito y luego confirma entrega y pago. Para revisar el estado, usa Mis Compras/Mis Pedidos desde la barra lateral izquierda; ahi tambien puedes ver detalles y el QR si aplica.",
      [
        { label: "Como pagar?", query: "como puedo pagar?" },
        { label: "Delivery", query: "como funciona el delivery?" },
        { label: "Buscar producto", query: "como busco un producto?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["delivery", "envio", "domicilio", "retiro", "entrega"])) {
    return respuesta(
      "Para clientes, el delivery depende de cada negocio. Si el negocio lo tiene activo, en el carrito podras elegir entrega a domicilio y se sumara el costo indicado; si no, la compra queda para retiro o el metodo disponible.",
      [
        { label: "Como pagar?", query: "como puedo pagar?" },
        { label: "Como comprar?", query: "como hago una compra?" },
        { label: "Activar delivery", query: "como hago funcionar el delivery en mi negocio?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["reportes de ventas", "reporte de ventas", "historial de ventas", "ventas del mes", "pdf de ventas"])) {
    if (!esNegocioOAdmin) {
      return respuesta(
        "Los reportes de ventas son para cuentas negocio o admin. Si quieres vender y ver reportes, primero puedes solicitar abrir un negocio desde la barra lateral izquierda.",
        [
          { label: "Quiero ser negocio", query: "como puedo ser negocio?" },
          { label: "Como comprar?", query: "como hago una compra?" }
        ]
      );
    }

    return respuesta(
      "Para revisar reportes de ventas, entra a Historial y Reportes desde la barra lateral izquierda. Ahi puedes filtrar por mes, ver ventas completadas, generar PDF y guardar reportes cuando existan ingresos confirmados.",
      [
        { label: "Pedidos recibidos", query: "como reviso pedidos recibidos?" },
        { label: "Cobrar efectivo", query: "como cobro pedidos en efectivo?" },
        { label: "Productos", query: "como agrego o edito productos?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["contacto a un negocio", "contactar a un negocio", "contactar negocio", "como contacto", "telefono de", "whatsapp de", "redes de"])) {
    return respuesta(
      "Para contactar a un negocio, abre su perfil desde Explorar Negocios. Ahi se muestran los datos que el negocio haya registrado, como telefono, ubicacion, horarios o redes sociales; si falta un dato, depende de que el negocio lo complete en su configuracion.",
      [
        { label: "Info de negocio", query: "quiero informacion de un negocio" },
        { label: "Buscar negocios", query: "como busco negocios?" },
        { label: "Como comprar?", query: "como hago una compra?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["informacion de un negocio", "negocio especifico", "datos de un negocio", "ubicacion de", "horario de"])) {
    return respuesta(
      "Claro. Dime el nombre del negocio o entra a su perfil desde Explorar Negocios; ahi puedes ver ubicacion, telefono, horarios, redes y productos activos.",
      [
        { label: "Buscar producto", query: "como busco un producto?" },
        { label: "Como contacto un negocio?", query: "como contacto a un negocio?" },
        { label: "Como comprar?", query: "como hago una compra?" }
      ]
    );
  }

  if (contienePalabraDeGrupo(texto, ["buscar negocios", "buscar un negocio", "como busco negocios", "como buscar negocios", "explorar negocios"])) {
    return respuesta(
      "Para buscar negocios, usa Explorar Negocios o dime el nombre si quieres informacion de uno especifico. Tambien puedes preguntarme por un producto, por ejemplo: donde venden pan, y te dire que negocios activos lo tienen.",
      [
        { label: "Info de negocio", query: "quiero informacion de un negocio" },
        { label: "Buscar producto", query: "como busco un producto?" },
        { label: "Como comprar?", query: "como hago una compra?" }
      ]
    );
  }

  return null;
};

const construirRespuestaConversacional = ({
  consulta,
  history = [],
  tipo = "general",
  userContext = {}
}) => {
  const consultaNormalizada = normalizarTexto(consulta);
  const contextoItems = obtenerUltimosItemsDelHistorial(history);
  const resumenContexto = contextoItems.length
    ? ` Hace un momento revisamos ${unirListaNatural(contextoItems)}.`
    : "";

  if (tipo === "cortesia") {
    return contextoItems.length
      ? `De nada.${resumenContexto} Si quieres, seguimos revisando esos productos o vemos algo nuevo.`
      : "De nada. Si quieres, puedo ayudarte a encontrar productos, comparar negocios o darte una sugerencia.";
  }

  if (tipo === "indecision") {
    return `Claro, no pasa nada, te ayudo a decidir.${resumenContexto} Si quieres, dime si buscas algo para cocinar, una bebida, algo para comer ahora o productos para la casa, y te voy orientando paso a paso.`;
  }

  if (tipo === "saludo") {
    const sugerenciaRol =
      userContext.rol === "negocio"
        ? " Tambien puedo orientarte con productos, pedidos, pagos o reportes de tu negocio."
        : userContext.rol === "admin"
        ? " Tambien puedo orientarte con solicitudes, configuracion del sistema y reportes."
        : " Puedes preguntarme por productos, pagos, pedidos o como abrir un negocio.";

    return `Hola, aqui estoy para ayudarte.${sugerenciaRol}`;
  }

  if (tipo === "charla") {
    return `Hola, estoy bien y listo para ayudarte.${resumenContexto} Si quieres, dime que producto buscas o que necesitas comprar y lo revisamos juntos.`;
  }

  if (tipo === "seguimiento_sin_contexto") {
    return "Claro. Para seguir, dime el producto o la combinacion que quieres revisar y lo vemos enseguida.";
  }

  if (!consultaNormalizada) {
    return "Estoy aqui para ayudarte. Puedes preguntarme por productos, negocios o pedirme una sugerencia.";
  }

  return "Te ayudo con gusto. Puedes preguntarme por productos, negocios, pagos, pedidos, delivery o por como usar tu panel segun tu rol.";
};

const construirRespuestaChat = ({
  consulta,
  distribucionPorItem = [],
  recomendacionPrincipal = null,
  sugerencias = []
}) => {
  const consultaNormalizada = normalizarTexto(consulta);
  const haySaludo = SALUDOS_CONSULTA.some((saludo) => consultaNormalizada.includes(saludo));
  const encontrados = distribucionPorItem.filter((item) => item.encontrado);
  const faltantes = distribucionPorItem.filter((item) => !item.encontrado);
  const prefijo = haySaludo ? "Hola, con gusto te ayudo. " : "";

  if (!distribucionPorItem.length) {
    return haySaludo
      ? "Hola, con gusto te ayudo. Puedes preguntarme en que negocio venden un producto o si te conviene comprar varias cosas en un solo comercio."
      : "Claro, puedo ayudarte a encontrar productos y comercios. Si quieres, prueba con algo como: donde venden arroz y sal.";
  }

  if (!encontrados.length) {
    return `${prefijo}No encontre coincidencias claras para ${unirListaNatural(
      faltantes.map((item) => item.termino)
    )}. Si quieres, prueba con otro nombre o con un producto parecido y lo revisamos juntos.`;
  }

  if (recomendacionPrincipal && encontrados.length === distribucionPorItem.length) {
    return `${prefijo}Si, en ${recomendacionPrincipal.nombre_negocio} encontramos ${unirListaNatural(
      encontrados.map((item) => item.termino)
    )}. Por ahora, ${recomendacionPrincipal.nombre_negocio} parece ser la mejor opcion para esa consulta. Si quieres, tambien puedo ayudarte a buscar algo mas.`;
  }

  const partes = encontrados.map(
    (item) => `${item.termino} en ${item.nombre_negocio}`
  );

  let respuesta = `${prefijo}Encontre ${unirListaNatural(partes)}.`;

  if (faltantes.length) {
    respuesta += ` No encontre ${unirListaNatural(
      faltantes.map((item) => item.termino)
    )}.`;
  }

  if (sugerencias.some((item) => item.sugerencias?.length > 0)) {
    respuesta += " Si quieres, tambien puedo sugerirte productos parecidos o ayudarte a buscar otra combinacion.";
  } else {
    respuesta += " Si quieres, puedes preguntarme por otro producto y seguimos viendo opciones.";
  }

  return respuesta;
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
      timeout: 8000
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

const consultarGeminiParaIntencion = async ({ consulta, history = [], userContext = {} }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!geminiApiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno");
  }

  const schema = {
    type: "object",
    properties: {
      tipo: { type: "string" },
      items_detectados: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["tipo", "items_detectados"]
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
                "Eres un asistente virtual amigable de un marketplace local.",
                "Tu trabajo es ayudar solo con productos, negocios, pedidos, pagos, delivery, inventario y uso de la app.",
                "Tambien debes reconocer preguntas de ayuda de la plataforma: metodos de pago, como comprar, como ser negocio, configuracion de negocio, solicitudes y opciones de admin.",
                "No actues como chat libre para temas generales. Si el mensaje no pertenece al comercio o la app, marca tipo='conversacion' para responder con una redireccion breve al alcance permitido.",
                "Por defecto, prioriza una conversacion natural dentro del alcance comercial. NO conviertas cualquier frase en una busqueda.",
                "Solo marca tipo='busqueda' cuando el usuario realmente este pidiendo, buscando, comparando o preguntando por un producto o comercio.",
                "Si el usuario saluda o agradece, responde como conversacion y mantente dentro del contexto de la app. Si bromea, pide compañia, pregunta cultura general, matematica o quiere hablar de temas ajenos, responde como conversacion fuera de alcance y NO fuerces una busqueda.",
                "Si el usuario pide un producto o pregunta en que negocio lo venden, marca tipo='busqueda' y extrae solo productos concretos y cortos, sin relleno como 'un poco de', 'por favor' o frases sociales.",
                "No inventes resultados del catalogo en esta etapa. Solo interpreta la intencion.",
                "Usa tipo='conversacion' o tipo='busqueda'.",
                "Ejemplos:",
                "- 'hola como estas?' => tipo='conversacion'",
                "- 'solo quiero hablar contigo' => tipo='conversacion'",
                "- 'amigo?' => tipo='conversacion'",
                "- 'cuentame algo' => tipo='conversacion'",
                "- 'eres una ia?' => tipo='conversacion'",
                "- 'dame una sugerencia' => tipo='conversacion'",
                "- 'como puedo pagar?' => tipo='conversacion'",
                "- 'como son los metodos de pago?' => tipo='conversacion'",
                "- 'como puedo ser negocio?' => tipo='conversacion'",
                "- 'como configuro PayPhone?' => tipo='conversacion'",
                "- 'que me recomiendas?' => tipo='conversacion'",
                "- 'quiero un poco de sal' => tipo='busqueda', items_detectados=['sal']",
                "- 'pues quiero pollo' => tipo='busqueda', items_detectados=['pollo']",
                "- 'donde venden arroz y aceite' => tipo='busqueda', items_detectados=['arroz','aceite']",
                "",
                JSON.stringify(
                  {
                    consulta,
                    user_context: userContext,
                    historial: history.slice(-6)
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
        temperature: 0.4,
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
      timeout: 8000
    }
  );

  const texto = extraerTextoGemini(response.data);
  if (!texto) {
    throw new Error("Gemini no devolvio contenido util");
  }

  return JSON.parse(texto);
};

const consultarGeminiParaConversacion = async ({ consulta, history = [], userContext = {} }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!geminiApiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno");
  }

  const historial = formatearHistorialParaPrompt(history);
  const contextoUsuario = `Rol del usuario: ${userContext.rol || "visitante"}. Autenticado: ${
    userContext.autenticado ? "si" : "no"
  }. Ruta actual: ${userContext.ruta || "no indicada"}.`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
    {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Eres un asistente virtual amable y natural dentro de un marketplace local.",
                "Solo puedes responder sobre productos, negocios, pedidos, pagos, delivery, inventario y uso de la app.",
                "Si el usuario pregunta algo fuera de ese alcance, no respondas el contenido. Di brevemente que solo puedes ayudar con comercio, negocios o la app.",
                "Cuando el usuario no este haciendo una busqueda de productos pero siga dentro del alcance, responde con naturalidad.",
                "No respondas con una frase generica de busqueda cuando el usuario pregunte como usar la plataforma. Primero explica la duda concreta.",
                "Datos funcionales de la app:",
                "- Clientes/visitantes: pueden explorar negocios, ver productos, registrarse, agregar productos al carrito, elegir retiro o delivery si el negocio lo ofrece, pagar en efectivo o con PayPhone/tarjeta si el negocio lo tiene configurado.",
                "- Clientes autenticados: pueden ver Mis Compras/Mis Pedidos y solicitar abrir un negocio desde Abrir Negocio.",
                "- Negocios: usan la barra lateral izquierda para ver pedidos, gestionar productos e inventario, configurar PayPhone/delivery/datos/redes, cobrar efectivo con QR y ver historial/reportes.",
                "- Si el usuario pregunta por activar delivery en su negocio, indica Configurar Negocio en la barra lateral izquierda, activar delivery, definir costo y guardar.",
                "- Si el usuario pregunta por agregar o editar productos, indica Productos en la barra lateral izquierda; para una frase de seguimiento como 'agregar uno nuevo', asumelo como producto si el historial habla de productos.",
                "- Admin: puede revisar solicitudes, aprobar/rechazar negocios, configurar categorias/unidades y usar modulos de supervision.",
                "Responde primero a lo que el usuario dijo, siempre dentro del alcance permitido.",
                "Si el usuario saluda o pregunta por ti, responde corto y orientado a la plataforma.",
                "No cierres cada respuesta con frases repetidas salvo que venga al caso.",
                "Puedes hacer preguntas de seguimiento cortas y naturales cuando ayuden a continuar la conversacion.",
                "Mantente amable, breve y calido. Normalmente responde en 1 a 3 oraciones.",
                "No inventes disponibilidad de productos ni negocios si no te dieron datos reales del catalogo.",
                "Ejemplos de tono:",
                "- Usuario: 'eres una ia?'",
                "  Respuesta: 'Si, soy el asistente de esta plataforma. Te puedo ayudar con productos, negocios, pedidos o pagos.'",
                "- Usuario: 'cuanto es 2*4?'",
                "  Respuesta: 'Puedo ayudarte solo con temas del comercio, negocios, productos, pedidos, pagos, delivery, inventario o uso de la app.'",
                "- Usuario: 'dame una sugerencia'",
                "  Respuesta: 'Claro. Te doy una sugerencia de que tipo: para comer, para comprar o para pasar el rato?'",
                "- Usuario: 'como puedo pagar?'",
                "  Respuesta: 'En el carrito veras los metodos que tenga activo cada negocio: efectivo y, si el negocio configuro PayPhone, tarjeta. Tambien eliges retiro o delivery si esta disponible.'",
                "- Usuario: 'amigo'",
                "  Respuesta: 'Aqui ando contigo. Que cuentas?'",
                "- Usuario: 'hola como estas?'",
                "  Respuesta: 'Hola, todo bien por aqui. Y tu como vas?'",
                contextoUsuario,
                historial ? `Historial reciente:\n${historial}` : "",
                `Mensaje actual del usuario: ${consulta}`
              ]
                .filter(Boolean)
                .join("\n\n")
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95
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
      timeout: 8000
    }
  );

  const texto = extraerTextoGemini(response.data);
  if (!texto) {
    throw new Error("Gemini no devolvio respuesta conversacional");
  }

  return texto.trim();
};

const consultarGeminiParaRespuestaConCatalogo = async ({
  consulta,
  history = [],
  resumenConsulta,
  recomendacionPrincipal,
  alternativas = [],
  sugerencias = []
}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!geminiApiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno");
  }

  const historial = formatearHistorialParaPrompt(history);

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
    {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Eres un asistente virtual de compras amable y natural.",
                "Responde como un chatbot conversacional, no como un motor rigido.",
                "Tu respuesta debe sonar humana, clara y breve.",
                "Usa SOLO los datos reales del catalogo que se te entregan abajo.",
                "No inventes productos, negocios ni disponibilidad.",
                "Si algo no se encontro, dilo con naturalidad.",
                "Si hay una mejor opcion, menciona el negocio de forma amigable.",
                "No digas 'hola de nuevo' ni repitas saludos si el usuario solo esta buscando un producto.",
                "No repitas en texto todos los detalles que ya se muestran en tarjetas; la respuesta debe orientar y dejar que las tarjetas abran el negocio.",
                historial ? `Historial reciente:\n${historial}` : "",
                `Mensaje actual del usuario: ${consulta}`,
                "Datos reales del catalogo:",
                JSON.stringify(
                  {
                    resumen_consulta: resumenConsulta,
                    recomendacion_principal: recomendacionPrincipal
                      ? {
                          nombre_negocio: recomendacionPrincipal.nombre_negocio,
                          cobertura: recomendacionPrincipal.cobertura,
                          productos: (recomendacionPrincipal.productos || []).map((producto) => ({
                            termino: producto.termino,
                            nombre_producto: producto.nombre_producto,
                            precio: producto.precio
                          })),
                          faltantes: recomendacionPrincipal.faltantes || []
                        }
                      : null,
                    alternativas: alternativas.slice(0, 3).map((negocio) => ({
                      nombre_negocio: negocio.nombre_negocio,
                      cobertura: negocio.cobertura,
                      productos: (negocio.productos || []).map((producto) => ({
                        termino: producto.termino,
                        nombre_producto: producto.nombre_producto,
                        precio: producto.precio
                      })),
                      faltantes: negocio.faltantes || []
                    })),
                    sugerencias: sugerencias.slice(0, 5).map((item) => ({
                      termino: item.termino,
                      sugerencias: (item.sugerencias || []).slice(0, 2).map((producto) => ({
                        nombre_producto: producto.nombre_producto,
                        nombre_negocio: producto.nombre_negocio,
                        precio: producto.precio
                      }))
                    }))
                  },
                  null,
                  2
                )
              ]
                .filter(Boolean)
                .join("\n\n")
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95
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
      timeout: 8000
    }
  );

  const texto = extraerTextoGemini(response.data);
  if (!texto) {
    throw new Error("Gemini no devolvio respuesta con catalogo");
  }

  return texto.trim();
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
      respuesta_chat: { type: "string" },
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
      "respuesta_chat",
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
                "Ademas de ordenar negocios, redacta una respuesta_chat breve, amigable y natural para el usuario.",
                "En respuesta_chat solo menciona disponibilidad real entregada en los datos.",
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
      timeout: 8000
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
    await asegurarProductoDestacadoSchema();

    // Parámetros de la URL: ?page=1&limit=10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [productos] = await pool.query(`
      SELECT p.id, p.nombre_producto, p.descripcion, p.precio, p.stock, p.foto, p.tipo_venta, p.unidad_medida, p.destacado, n.nombre_negocio
      FROM productos p
      JOIN negocios n ON p.negocio_id = n.id
      WHERE p.estado = 1 AND n.estado = 1
      ORDER BY p.destacado DESC, p.nombre_producto ASC
      LIMIT ? OFFSET ?
    `, [limit, offset]); 

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total
      FROM productos p
      JOIN negocios n ON p.negocio_id = n.id
      WHERE p.estado = 1 AND n.estado = 1
    `);

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
    await asegurarProductoDestacadoSchema();

    const consulta = (req.body?.consulta || req.query?.consulta || "").trim();
    const categoriaFiltro = (req.body?.categoria || req.query?.categoria || "").trim();
    const history = limpiarHistorialConversacion(req.body?.history || []);
    const userContext = limpiarContextoUsuario(
      req.body?.user_context || req.body?.userContext || {}
    );

    if (!consulta) {
      return res.status(400).json({ ok: false, message: "Debes enviar una consulta" });
    }

    const consultaNormalizada = normalizarTexto(consulta);
    const ultimoContexto = obtenerUltimosItemsDelHistorial(history);
    const sugerenciaConfirmada = obtenerSugerenciaConfirmadaDelHistorial(history);
    const esConfirmacionContextual =
      esConfirmacionDeSeguimiento(consultaNormalizada) &&
      (ultimoContexto.length > 0 || sugerenciaConfirmada.length > 0);

    if (esConsultaFueraDeComercio(consulta) && !esConfirmacionContextual) {
      return res.json({
        ok: true,
        modo: "fuera_de_tema",
        consulta,
        items_detectados: [],
        respuesta_chat:
          "Puedo ayudarte solo con temas del comercio, negocios, productos, pedidos, pagos, delivery, inventario o uso de la app.",
        resumen_consulta: null,
        resumen_ia: null,
        distribucion_por_item: [],
        recomendacion_principal: null,
        alternativas: [],
        sugerencias: [],
        sugerencias_accion: crearSugerenciasAccion(userContext.rol)
      });
    }

    const terminoNegocio = extraerTerminoNegocio(consulta);

    if (terminoNegocio) {
      const negociosEncontrados = await buscarNegociosPorNombre(terminoNegocio);

      if (negociosEncontrados.length) {
        return res.json({
          ok: true,
          modo: "negocio_info",
          consulta,
          items_detectados: [],
          respuesta_chat: construirRespuestaNegocio(negociosEncontrados, terminoNegocio),
          resumen_consulta: null,
          resumen_ia: null,
          distribucion_por_item: [],
          recomendacion_principal: null,
          alternativas: [],
          sugerencias: [],
          negocios_sugeridos: negociosEncontrados,
          sugerencias_accion: [
            { label: "Buscar producto", query: "como busco un producto?" },
            { label: "Como comprar?", query: "como hago una compra?" },
            ...crearSugerenciasAccion(userContext.rol).slice(0, 3)
          ]
        });
      }
    }

    const ayudaSistema = construirRespuestaAyudaSistema(consulta, userContext);

    if (ayudaSistema) {
      return res.json({
        ok: true,
        modo: "ayuda_sistema",
        consulta,
        items_detectados: [],
        respuesta_chat: ayudaSistema.respuesta_chat,
        resumen_consulta: null,
        resumen_ia: null,
        distribucion_por_item: [],
        recomendacion_principal: null,
        alternativas: [],
        sugerencias: [],
        negocios_sugeridos: [],
        sugerencias_accion: ayudaSistema.sugerencias_accion
      });
    }

    const itemsTentativos = partirConsultaEnItems(consulta);
    let interpretacionIA = null;
    let respuestaConversacionalIA = null;
    let itemsSolicitados = [];
    const geminiDisponible = Boolean(process.env.GEMINI_API_KEY);

    if (geminiDisponible) {
      try {
        interpretacionIA = await consultarGeminiParaIntencion({
          consulta,
          history,
          userContext
        });
      } catch (error) {
        console.error("ERROR INTENCION GEMINI:", error.response?.data || error.message);
      }
    }

    if (interpretacionIA?.tipo === "busqueda") {
      itemsSolicitados = limpiarItemsDetectados(interpretacionIA.items_detectados);
    }

    const usarContextoPrevio =
      (esSeguimientoConversacional(consultaNormalizada) || esConfirmacionContextual) &&
      (ultimoContexto.length > 0 || sugerenciaConfirmada.length > 0);
    const esBusquedaPorReglas =
      usarContextoPrevio ||
      esBusquedaExplicita(consultaNormalizada, itemsTentativos) ||
      esConsultaCortaDeProducto(consultaNormalizada, itemsTentativos);

    if (interpretacionIA?.tipo === "busqueda" && !itemsSolicitados.length && usarContextoPrevio) {
      itemsSolicitados = sugerenciaConfirmada.length ? sugerenciaConfirmada : ultimoContexto;
    }

    if ((!interpretacionIA || interpretacionIA.tipo !== "busqueda") && esBusquedaPorReglas) {
      itemsSolicitados = usarContextoPrevio
        ? sugerenciaConfirmada.length
          ? sugerenciaConfirmada
          : ultimoContexto
        : itemsTentativos;
    }

    if (interpretacionIA?.tipo === "conversacion" || !itemsSolicitados.length) {
      try {
        respuestaConversacionalIA = await consultarGeminiParaConversacion({
          consulta,
          history,
          userContext
        });
      } catch (error) {
        console.error("ERROR CHAT GEMINI:", error.response?.data || error.message);
      }

      return res.json({
        ok: true,
        modo: respuestaConversacionalIA ? "gemini" : "asistente",
        consulta,
        items_detectados: [],
        respuesta_chat:
          respuestaConversacionalIA ||
          construirRespuestaConversacional({
            consulta,
            history,
            tipo: esConsultaDeIndecision(consultaNormalizada)
              ? "indecision"
              : esConsultaDeCortesia(consultaNormalizada)
              ? "cortesia"
              : esConsultaDeCharla(consultaNormalizada)
              ? "charla"
              : SALUDOS_CONSULTA.some((saludo) => consultaNormalizada.includes(saludo))
              ? "saludo"
              : "general",
            userContext
          }),
        resumen_consulta: null,
        resumen_ia: null,
        distribucion_por_item: [],
        recomendacion_principal: null,
        alternativas: [],
        sugerencias: [],
        sugerencias_accion: crearSugerenciasAccion(userContext.rol)
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
        p.destacado,
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
        p.destacado,
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
        .sort((a, b) => b.score - a.score || b.producto.destacado - a.producto.destacado || a.producto.precio - b.producto.precio);

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
    const respuestaChatLocal = construirRespuestaChat({
      consulta,
      distribucionPorItem,
      recomendacionPrincipal: resultadosPorNegocio[0] || null,
      sugerencias: sugerenciasFinales
    });
    let respuestaChat = respuestaChatLocal;

    try {
      respuestaChat = await consultarGeminiParaRespuestaConCatalogo({
        consulta,
        history,
        resumenConsulta,
        recomendacionPrincipal: resultadosPorNegocio[0] || null,
        alternativas: resultadosPorNegocio.slice(1, 5),
        sugerencias: sugerenciasFinales
      });
    } catch (error) {
      console.error("ERROR RESPUESTA CATALOGO GEMINI:", error.response?.data || error.message);
      respuestaChat =
        (typeof rankingIA?.respuesta_chat === "string" && rankingIA.respuesta_chat.trim()) ||
        respuestaChatLocal;
    }

    return res.json({
      ok: true,
      modo: modoRespuesta,
      aviso: avisoIA,
      consulta,
      categoria_aplicada: categoriaFiltro || null,
      items_detectados: rankingIA?.items_detectados?.length
        ? rankingIA.items_detectados
        : itemsSolicitados,
      respuesta_chat: respuestaChat,
      resumen_consulta: resumenConsulta,
      resumen_ia: rankingIA?.resumen || null,
      distribucion_por_item: distribucionPorItem,
      recomendacion_principal: resultadosPorNegocio[0] || null,
      alternativas: resultadosPorNegocio.slice(1, 5),
      sugerencias: sugerenciasFinales,
      sugerencias_accion: crearSugerenciasAccion(userContext.rol, "catalogo")
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
    await asegurarProductoDestacadoSchema();

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
        unidad_medida,
        destacado
       FROM productos
       WHERE negocio_id = ? AND estado = 1`,
      [id_negocio]
    );

    rows.sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.nombre_producto.localeCompare(b.nombre_producto));

    return res.json({ ok: true, data: rows });

  } catch (error) {
    console.error("ERROR LISTAR POR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al listar productos" });
  }
};

exports.listarMisProductos = async (req, res) => {
  try {
    await asegurarProductoDestacadoSchema();

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
          p.estado,
          p.destacado
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ?
       ORDER BY p.destacado DESC, p.estado DESC, p.nombre_producto ASC`,
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
    await asegurarProductoDestacadoSchema();

    const id_usuario = req.user.id_usuario;

    const {
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock,
      destacado
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
        (negocio_id, nombre_producto, descripcion, tipo_venta, precio, unidad_medida, stock, foto, destacado, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        negocio_id,
        nombre_producto,
        descripcion,
        tipo_venta,
        precio,
        unidad_medida,
        stock || 0,
        foto,
        destacado === "1" || destacado === "true" || destacado === true ? 1 : 0
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
    await asegurarProductoDestacadoSchema();

    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const {
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock,
      destacado
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
        p.stock = ?,
        p.destacado = ?
    `;

    const params = [
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock,
      destacado === "1" || destacado === "true" || destacado === true ? 1 : 0
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
// DESTACAR / QUITAR DESTACADO
// ======================
exports.toggleDestacado = async (req, res) => {
  try {
    await asegurarProductoDestacadoSchema();

    const { id_producto } = req.params;
    const { destacado } = req.body;
    const id_usuario = req.user.id_usuario;
    const nuevoDestacado = destacado === 1 || destacado === "1" || destacado === true;

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET p.destacado = ?
       WHERE p.id = ? AND n.usuario_id = ?`,
      [nuevoDestacado ? 1 : 0, id_producto, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado o el producto no existe"
      });
    }

    return res.json({
      ok: true,
      message: nuevoDestacado ? "Producto destacado" : "Producto sin destacado"
    });
  } catch (error) {
    console.error("ERROR DESTACAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar destacado"
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
