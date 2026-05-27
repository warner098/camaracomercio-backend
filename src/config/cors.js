const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const FALLBACK_PRODUCTION_ORIGINS = [
  "https://c-comercio.netlify.app",
  "https://transcendent-axolotl-727785.netlify.app",
];

const normalizeOrigin = (value) => {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
};

const parseOrigins = (value) => (
  value
    ? value.split(",").map(normalizeOrigin).filter(Boolean)
    : []
);

const getFrontendUrl = () => (
  normalizeOrigin(process.env.FRONTEND_URL) || "http://localhost:5173"
);

const getAllowedOrigins = () => {
  const origins = [
    getFrontendUrl(),
    ...parseOrigins(process.env.CORS_ORIGINS),
    ...FALLBACK_PRODUCTION_ORIGINS,
    ...LOCAL_ORIGINS,
  ].map(normalizeOrigin).filter(Boolean);

  return [...new Set(origins)];
};

const corsOrigin = (origin, callback) => {
  if (!origin || getAllowedOrigins().includes(normalizeOrigin(origin))) {
    return callback(null, true);
  }

  return callback(new Error(`Origen no permitido por CORS: ${origin}`));
};

module.exports = {
  corsOrigin,
  getAllowedOrigins,
  getFrontendUrl,
};
