import dotenv from "dotenv";

dotenv.config();

export const SERVICES = {
  AUTH: {
    url: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
    prefix: "/api/auth",
  },
  // Aquí puedes agregar más microservicios en el futuro
  // APPOINTMENTS: {
  //   url: process.env.APPOINTMENTS_SERVICE_URL || "http://localhost:3001",
  //   prefix: "/api/appointments",
  // },
};
