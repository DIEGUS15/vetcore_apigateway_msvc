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

// Rutas del servicio de autenticación
router.use(
  SERVICES.PATIENTS.prefix,
  generalRateLimiter,
  proxyRequest(SERVICES.PATIENTS.url)
);

// Aquí puedes agregar más rutas para otros microservicios
// router.use(
//   SERVICES.APPOINTMENTS.prefix,
//   generalRateLimiter,
//   proxyRequest(SERVICES.APPOINTMENTS.url)
// );

export default router;
