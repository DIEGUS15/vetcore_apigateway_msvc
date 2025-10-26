# VetCore - API Gateway

API Gateway para el sistema VetCore. Actúa como punto de entrada único para todas las peticiones del cliente, enrutándolas a los microservicios correspondientes. Proporciona funcionalidades de rate limiting, CORS, logging y manejo centralizado de errores.

## Características

- Punto de entrada único para todos los microservicios
- Proxy reverso con Axios
- Rate limiting diferenciado por rutas
- CORS configurable
- Headers de seguridad con Helmet
- Logging de peticiones
- Manejo centralizado de errores (503, 504, 500)
- Health check endpoint
- Timeout de 30 segundos en peticiones a microservicios

## Tecnologías

- Node.js + Express
- Axios (para proxy)
- express-rate-limit
- Helmet (seguridad)
- CORS
- dotenv

## Estructura del Proyecto

```
vetcore_apigateway_msvc/
├── src/
│   ├── config/
│   │   └── services.js          # Configuración de URLs de microservicios
│   ├── middlewares/
│   │   ├── proxyMiddleware.js   # Lógica de proxy reverso
│   │   └── rateLimiter.js       # Rate limiting
│   └── routes/
│       └── index.js             # Definición de rutas
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables
├── index.js                     # Punto de entrada
├── Dockerfile                   # Para construcción de imagen
├── docker-compose.yml           # Para ejecución individual
└── package.json
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Server
PORT=8000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Microservices URLs
AUTH_SERVICE_URL=http://localhost:3000
PATIENTS_SERVICE_URL=http://localhost:3001
# APPOINTMENTS_SERVICE_URL=http://localhost:3002  # Futuro
```

**Nota:**
- En Docker, las URLs usan nombres de contenedores: `http://auth-service:3000`
- En desarrollo local, usan `localhost`

## Instalación y Ejecución

### Opción 1: Ejecución Local sin Docker (Desarrollo rápido)

**Requisitos previos:**
- Node.js 18+ instalado
- Microservicios (Auth, Patients) corriendo en localhost

**Pasos:**

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con las URLs de tus microservicios
   ```

3. **Ejecutar en modo producción:**
   ```bash
   npm start
   ```

El API Gateway estará disponible en `http://localhost:8000`

---

### Opción 2: Ejecución con Docker Compose

**Requisitos previos:**
- Docker Desktop instalado y corriendo

**Pasos:**

1. **Levantar el servicio:**
   ```bash
   docker-compose up
   ```

   Esto levantará:
   - API Gateway en el puerto `8000`

   **Nota:** Este docker-compose es para desarrollo individual. Los microservicios deben estar corriendo por separado o usa el docker-compose de `vetcore-infrastructure` para levantar todo el sistema.

2. **Levantar en segundo plano:**
   ```bash
   docker-compose up -d
   ```

3. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Detener el servicio:**
   ```bash
   docker-compose down
   ```

---

### Opción 3: Construcción y Publicación de Imagen Docker

**Para construir la imagen localmente:**

```bash
# Construir con nombre local
docker build -t vetcore-apigateway:latest .

# O construir con tu usuario de Docker Hub
docker build -t tuusuario/vetcore-apigateway:latest .
```

**Para publicar en Docker Hub (opcional):**

1. **Login en Docker Hub:**
   ```bash
   docker login
   ```

2. **Construir con tu usuario:**
   ```bash
   docker build -t tuusuario/vetcore-apigateway:latest .
   ```

3. **Publicar imagen:**
   ```bash
   docker push tuusuario/vetcore-apigateway:latest
   ```

4. **Otros pueden descargar tu imagen:**
   ```bash
   docker pull tuusuario/vetcore-apigateway:latest
   ```

---

## Rutas y Enrutamiento

El API Gateway redirige las peticiones a los microservicios correspondientes:

### Health Check

#### `GET /health`
Verifica que el API Gateway esté funcionando.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Autenticación (Auth Service)

Todas las rutas que comienzan con `/api/auth` se redirigen al Auth Service:

- `POST /api/auth/register` → Auth Service
- `POST /api/auth/login` → Auth Service
- `GET /api/auth/...` → Auth Service

### Usuarios (Auth Service)

Todas las rutas que comienzan con `/api/users` se redirigen al Auth Service:

- `GET /api/users` → Auth Service
- `GET /api/users/:id` → Auth Service
- `PUT /api/users/:id` → Auth Service
- `DELETE /api/users/:id` → Auth Service

### Pacientes (Patients Service)

Todas las rutas que comienzan con `/api/patients` se redirigen al Patients Service:

- `GET /api/patients` → Patients Service
- `GET /api/patients/:id` → Patients Service
- `POST /api/patients` → Patients Service
- `PUT /api/patients/:id` → Patients Service
- `DELETE /api/patients/:id` → Patients Service

---

## Rate Limiting

El API Gateway implementa rate limiting para prevenir abuso:

### Rutas de Autenticación
- **Límite:** 5 peticiones por 15 minutos
- **Rutas afectadas:** `/api/auth/login`, `/api/auth/register`
- **Mensaje de error:** "Too many authentication attempts, please try again later"

### Rutas Generales
- **Límite:** 100 peticiones por 15 minutos
- **Rutas afectadas:** Todas las demás rutas
- **Mensaje de error:** "Too many requests, please try again later"

---

## Manejo de Errores

El API Gateway maneja los siguientes errores:

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| 503 | Service Unavailable | Microservicio no responde (ECONNREFUSED) |
| 504 | Gateway Timeout | Microservicio tarda más de 30 segundos |
| 500 | Internal Server Error | Otros errores del proxy |

**Formato de error:**
```json
{
  "error": "Service Unavailable",
  "message": "The auth service is currently unavailable"
}
```

---

## Configuración de Microservicios

Para agregar un nuevo microservicio, edita [`src/config/services.js`](src/config/services.js):

```javascript
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
  patients: process.env.PATIENTS_SERVICE_URL || 'http://localhost:3001',
  appointments: process.env.APPOINTMENTS_SERVICE_URL || 'http://localhost:3002', // Nuevo
};
```

Y agrega las rutas en [`src/routes/index.js`](src/routes/index.js):

```javascript
router.use('/api/appointments', proxyMiddleware('appointments'));
```

---

## Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm test
```

### Probar el API Gateway manualmente:

```bash
# Health check
curl http://localhost:8000/health

# Login (requiere Auth Service corriendo)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password123"}'

# Obtener pacientes (requiere token y Patients Service corriendo)
curl http://localhost:8000/api/patients \
  -H "Authorization: Bearer <tu-token>"
```

---

## Troubleshooting

### Error 503: "Service Unavailable"

- Verifica que los microservicios estén corriendo
- Verifica las URLs en `.env` o variables de entorno
- Comprueba la conectividad de red entre contenedores

### Error 504: "Gateway Timeout"

- El microservicio está tardando más de 30 segundos
- Verifica el rendimiento del microservicio
- Revisa los logs del microservicio para encontrar cuellos de botella

### Error: "Port 8000 is already in use"

- Cambia el puerto en `.env`:
  ```env
  PORT=8001
  ```

### CORS Errors

- Verifica la configuración de `CORS_ORIGIN` en `.env`
- Para desarrollo, usa `CORS_ORIGIN=*`
- Para producción, especifica los dominios permitidos: `CORS_ORIGIN=https://tudominio.com`

---

## Parte del Sistema VetCore

Este servicio es parte de **VetCore**, un sistema de microservicios para la gestión integral de veterinarias. VetCore está compuesto por:

- **Auth Service** - Autenticación y autorización
- **Patients Service** - Gestión de pacientes/mascotas
- **API Gateway** (este servicio) - Punto de entrada único y enrutamiento
- **Frontend** - Interfaz de usuario en React
- **Appointments Service** (próximamente) - Gestión de citas

Para ejecutar el sistema completo, consulta el repositorio `vetcore-infrastructure`.

---

## Licencia

Este proyecto es parte de VetCore y está bajo [indicar licencia].

## Contribuciones

[Indicar cómo contribuir al proyecto]

## Contacto

[Indicar información de contacto o enlaces al proyecto principal]