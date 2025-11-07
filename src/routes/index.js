import express from "express";
import { SERVICES } from "../config/services.js";
import { proxyRequest } from "../middlewares/proxyMiddleware.js";
import {
  authRateLimiter,
  generalRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Ruta de salud del API Gateway
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
  });
});

// Rutas del servicio de autenticación
router.use(
  SERVICES.AUTH.prefix,
  authRateLimiter,
  proxyRequest(SERVICES.AUTH.url)
);

// Rutas del servicio de usuarios (mismo servicio que auth)
router.use(
  SERVICES.USERS.prefix,
  authRateLimiter,
  proxyRequest(SERVICES.USERS.url)
);

// Rutas del servicio de pacientes
router.use(
  SERVICES.PATIENTS.prefix,
  generalRateLimiter,
  proxyRequest(SERVICES.PATIENTS.url)
);

// Rutas del servicio de citas
router.use(
  SERVICES.APPOINTMENTS.prefix,
  generalRateLimiter,
  proxyRequest(SERVICES.APPOINTMENTS.url)
);

// Rutas del servicio de horarios
router.use(
  SERVICES.SCHEDULE.prefix,
  generalRateLimiter,
  proxyRequest(SERVICES.SCHEDULE.url, "/schedule")
);

// Alias público: admitir también /schedule para compatibilidad con llamadas directas
router.use(
  "/schedule",
  generalRateLimiter,
  proxyRequest(SERVICES.SCHEDULE.url, "/schedule")
);

export default router;
