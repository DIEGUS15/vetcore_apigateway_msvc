import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import routes from "./src/routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares de seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Middlewares de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use("/", routes);

// Manejo de rutas no encontradas (debe ser una función de middleware, no una ruta)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`Proxying requests to microservices...`);
});
