import axios from "axios";

export const proxyRequest = (serviceUrl) => {
  return async (req, res) => {
    try {
      const { method, body, query, params, headers } = req;

      // Construir la URL completa del microservicio
      // req.baseUrl contiene el prefijo (ej: /api/auth)
      // req.path contiene el resto de la ruta (ej: /register)
      const targetUrl = `${serviceUrl}${req.baseUrl}${req.path}`;

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
        responseType: 'arraybuffer', // Recibir respuesta como buffer para soportar archivos binarios
      };

      // Agregar body solo si no es GET o HEAD
      if (method !== "GET" && method !== "HEAD") {
        config.data = body;
      }

      // Realizar la petición al microservicio
      const response = await axios(config);

      // Copiar headers del microservicio
      const contentType = response.headers['content-type'];
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      // Copiar Content-Disposition si existe (para descargas)
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }

      // Devolver la respuesta del microservicio
      // Si es JSON, parsearlo; si es binario (PDF, imágenes), enviarlo directamente
      if (contentType && contentType.includes('application/json')) {
        const jsonData = JSON.parse(response.data.toString('utf8'));
        res.status(response.status).json(jsonData);
      } else {
        // Enviar datos binarios directamente
        res.status(response.status).send(response.data);
      }
    } catch (error) {
      console.error(`Error proxying request to ${serviceUrl}:`, error.message);

      if (error.response) {
        // El microservicio respondió con un error
        const contentType = error.response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
          const errorData = JSON.parse(error.response.data.toString('utf8'));
          return res.status(error.response.status).json(errorData);
        } else {
          return res.status(error.response.status).send(error.response.data);
        }
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
