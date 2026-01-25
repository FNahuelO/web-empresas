# TrabajoYa - Portal Empresas Web

Portal web moderno para que las empresas gestionen sus publicaciones, postulantes y más desde empresas.trabajo-ya.com

## Características

- ✅ Dashboard con estadísticas y resumen
- ✅ Gestión completa de publicaciones (crear, editar, eliminar)
- ✅ Visualización de postulantes por empleo
- ✅ Sistema de mensajería
- ✅ Configuración de perfil de empresa
- ✅ Gestión de planes y suscripciones
- ✅ Autenticación segura con refresh tokens
- ✅ Diseño responsive y moderno

## Tecnologías

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Hook Form
- Axios
- Heroicons
- date-fns

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Variables de Entorno

Crea un archivo `.env.local` con:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

O copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

## Estructura del Proyecto

```
web-empresas/
├── app/                    # Páginas y rutas (Next.js App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── publicaciones/     # Gestión de publicaciones
│   ├── postulantes/       # Gestión de postulantes
│   ├── mensajes/          # Sistema de mensajería
│   ├── configuracion/     # Configuración de empresa
│   ├── planes/            # Planes y suscripciones
│   └── login/              # Página de login
├── components/            # Componentes reutilizables
│   ├── Layout.tsx         # Layout principal con sidebar
│   └── Sidebar.tsx        # Barra lateral de navegación
├── services/              # Servicios API
│   ├── jobService.ts      # Servicios de empleos
│   ├── profileService.ts  # Servicios de perfil
│   ├── subscriptionService.ts # Servicios de suscripciones
│   └── messageService.ts  # Servicios de mensajes
├── store/                 # Estado global (Zustand)
│   └── authStore.ts       # Store de autenticación
├── lib/                   # Utilidades
│   ├── api.ts             # Configuración de endpoints
│   └── httpClient.ts      # Cliente HTTP con interceptores
└── types/                 # Tipos TypeScript
    └── index.ts           # Tipos compartidos
```

## Build

```bash
# Compilar para producción
npm run build

# Ejecutar versión de producción
npm start
```

## Despliegue

Esta aplicación está diseñada para desplegarse en el subdominio `empresas.trabajo-ya.com`

### Vercel

El proyecto incluye un archivo `vercel.json` configurado para Next.js. Para desplegar:

1. **Conecta tu repositorio a Vercel**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Importa tu repositorio de GitHub/GitLab/Bitbucket
   - Selecciona el directorio `web-empresas` como raíz del proyecto

2. **Configuración automática**
   - Vercel detectará automáticamente Next.js gracias al `vercel.json`
   - El framework preset será: **Next.js**
   - Build Command: `npm run build` (automático)
   - Output Directory: `.next` (automático)

3. **Variables de entorno**
   - En la configuración del proyecto, ve a **Settings > Environment Variables**
   - Agrega la variable:
     - **Name**: `NEXT_PUBLIC_API_URL`
     - **Value**: `https://api.trabajo-ya.com` (o tu URL de producción)
   - Asegúrate de agregarla para todos los entornos (Production, Preview, Development)

4. **Dominio personalizado (opcional)**
   - En **Settings > Domains**, agrega `empresas.trabajo-ya.com`
   - Configura los registros DNS según las instrucciones de Vercel

5. **Despliega**
   - Haz clic en **Deploy** o realiza un push a la rama principal
   - Vercel desplegará automáticamente en cada push

**Nota**: El archivo `vercel.json` ya está configurado con headers de caché optimizados para assets estáticos.

### Otras plataformas

La aplicación puede desplegarse en cualquier plataforma que soporte Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Funcionalidades Principales

### Dashboard
- Estadísticas de empleos activos, postulantes e entrevistas
- Resumen de plan actual
- Postulaciones recientes
- Empleos activos

### Publicaciones
- Listar todas las publicaciones
- Crear nuevas publicaciones
- Editar publicaciones existentes
- Eliminar publicaciones
- Ver postulantes por publicación
- Estados de moderación

### Postulantes
- Ver todos los postulantes
- Filtrar por empleo
- Ver perfil completo del postulante

### Mensajes
- Listar conversaciones
- Contador de mensajes no leídos
- Historial de conversaciones

### Configuración
- Editar información de la empresa
- Actualizar perfil

### Planes
- Ver planes disponibles
- Información del plan actual
- Gestión de suscripciones

## Notas

- La aplicación usa el mismo backend que la app móvil
- Los tokens de autenticación se almacenan en localStorage
- El refresh token se maneja automáticamente
- Todas las rutas están protegidas excepto `/login`

