# Backend - Clon de WhatsApp

Backend desarrollado con Node.js, Express y MongoDB.

## Estructura

```
app/
├── controllers/     # Lógica de negocio y manejo de peticiones
├── routers/         # Definición de rutas
├── models/          # Modelos de MongoDB/Mongoose
├── index.js         # Punto de entrada del servidor
├── package.json     # Dependencias del proyecto
└── .env            # Variables de entorno
```

## Instalación

1. Instalar las dependencias:
```bash
npm install
```

## Configuración

El archivo `.env` contiene la configuración de conexión a MongoDB:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-clone
```

## Ejecutar el servidor

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## Endpoints disponibles

### GET /api/test
Prueba de conexión con el backend.

### GET /api/users
Obtiene todos los usuarios registrados.

### GET /api/users/:id
Obtiene un usuario específico por ID.

### POST /api/users
Crea un nuevo usuario.
Body:
```json
{
  "name": "Nombre del usuario",
  "email": "email@ejemplo.com"
}
```

### PUT /api/users/:id
Actualiza un usuario existente.

### DELETE /api/users/:id
Elimina un usuario.

### GET /api/health
Verifica el estado del servidor y la conexión a la base de datos.

## Requisitos

- Node.js (versión 14 o superior)
- MongoDB ejecutándose en `localhost:27017`
