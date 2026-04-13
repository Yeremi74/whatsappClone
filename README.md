# Clon de WhatsApp

Aplicación clon de WhatsApp con React (Frontend) y Node.js + Express + MongoDB (Backend).

## Estructura del Proyecto

```
clonWhatsapp/
├── dashboard/          # Frontend (React + Vite)
└── app/                # Backend (Node.js + Express + MongoDB)
    ├── controllers/    # Controladores de la lógica de negocio
    ├── routers/        # Rutas de la API
    ├── models/         # Modelos de MongoDB/Mongoose
    └── index.js        # Punto de entrada del servidor
```

## Requisitos Previos

- Node.js (versión 14 o superior)
- MongoDB ejecutándose en `localhost:27017`
- npm o yarn

## Instalación y Ejecución

### 1. Instalar dependencias del Backend

```bash
cd app
npm install
```

### 2. Instalar dependencias del Frontend

```bash
cd dashboard
npm install
```

### 3. Ejecutar MongoDB

Asegúrate de que MongoDB esté ejecutándose en `localhost:27017`.

### 4. Ejecutar el Backend

En una terminal:
```bash
cd app
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### 5. Ejecutar el Frontend

En otra terminal:
```bash
cd dashboard
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (o el puerto que Vite asigne)

## Endpoints del Backend

- `GET /api/test` - Prueba de conexión
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener un usuario por ID
- `POST /api/users` - Crear un nuevo usuario
- `PUT /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Eliminar un usuario
- `GET /api/health` - Estado del servidor y base de datos

## Ejemplo de Uso

El frontend incluye un ejemplo básico que:
1. Verifica la conexión con el backend
2. Muestra la lista de usuarios
3. Permite agregar nuevos usuarios

## Configuración

### Backend

El archivo `app/.env` contiene:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-clone
```

### Frontend

El archivo `dashboard/vite.config.js` está configurado con un proxy que redirige las peticiones `/api` al backend en `http://localhost:3000`.
