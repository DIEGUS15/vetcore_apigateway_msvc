import axios from "axios";

export const proxyRequest = (serviceUrl, targetPrefix) => {
  return async (req, res) => {
    try {
      const { method, body, query, params, headers } = req;

      // Construir la URL completa del microservicio
      // Si se proporciona targetPrefix, usarlo como la ruta base hacia el servicio
      // de lo contrario usar req.baseUrl (la ruta montada en el API Gateway)
      const base = typeof targetPrefix === 'string' ? targetPrefix : req.baseUrl;
  // req.path contiene el resto de la ruta (ej: /register o /123)
  const targetUrl = `${serviceUrl}${base}${req.path}`;

  // Debug: mostrar mapeo de ruta
  console.log(`[proxy] ${method} ${req.baseUrl}${req.path} -> ${targetUrl}`);

      // Preparar headers (excluir host)
      const forwardHeaders = { ...headers };
      delete forwardHeaders.host;
      delete forwardHeaders["content-length"];

      // Configuración de la petición
      const config = {
        method: method,
        url: targetUrl,
        headers: forwardHeaders,
        params: query,
        timeout: 30000, // 30 segundos
      };

      // Agregar body solo si no es GET o HEAD
      if (method !== "GET" && method !== "HEAD") {
        config.data = body;
      }

  // Realizar la petición al microservicio
  const response = await axios(config);

      // Devolver la respuesta del microservicio
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error(`Error proxying request to ${serviceUrl}:`, error.message);

      if (error.response) {
        // El microservicio respondió con un error
        return res.status(error.response.status).json(error.response.data);
      } else if (error.code === "ECONNREFUSED") {
        // El microservicio no está disponible
        return res.status(503).json({
          success: false,
          message: "Service temporarily unavailable",
          service: serviceUrl,
        });
      } else if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        // Timeout
        return res.status(504).json({
          success: false,
          message: "Service timeout",
          service: serviceUrl,
        });
      } else {
        // Otro error
        return res.status(500).json({
          success: false,
          message: "Internal gateway error",
          error: error.message,
        });
      }
    }
  };
};
