# Frontend - Purificadora de Agua JORDAN

Dashboard profesional para Purificadora de Agua JORDAN construido con Nuxt 3, TypeScript y Tailwind CSS.

## Despliegue

La arquitectura oficial usa Cloudflare Pages para este frontend y Render para
el backend. Configura `NUXT_PUBLIC_API_BASE` con la URL publica del backend:

```text
NUXT_PUBLIC_API_BASE=https://TU-BACKEND.onrender.com/api
```

Ver tambien `DEPLOYMENT-ARCHITECTURE.md`.

## 🎨 Características

- **Diseño Responsive** - Funciona en desktop, tablet y mobile
- **Tema Profesional** - Sidebar izquierda, header superior, contenido central
- **Componentes Reutilizables** - Tablas, formularios, modales, tarjetas
- **Autenticación JWT** - Login seguro con token
- **Gestión de Estado** - Pinia para state management
- **TypeScript Strict** - Type-safe en todo el código
- **Tailwind CSS** - Estilos modernos y personalizables

## 🚀 Instalación

1. **Instalar dependencias**
   ```bash
   pnpm install
   # O con npm:
   npm install
   ```

2. **Configurar API**
   
   El archivo `.env.example` contiene valores por defecto. Si el backend está en otro lado, ajusta:
   ```
   NUXT_PUBLIC_API_BASE=http://localhost:3001/api
   ```

## 🏃 Ejecutar en Desarrollo

```bash
pnpm run dev
```

La aplicación estará disponible en `http://localhost:3000` (generalmente Nuxt usa puerto 3000 por defecto, pero puede variar si está ocupado).

## 📝 Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `pnpm run dev` | Ejecutar en modo desarrollo |
| `pnpm run build` | Compilar para producción |
| `pnpm run preview` | Vista previa de la compilación |
| `pnpm run generate` | Generación estática |
| `pnpm run lint` | Ejecutar ESLint |
| `pnpm run lint:fix` | Formatear y reparar |
| `pnpm run type-check` | Verificar tipos |

## 📁 Estructura del Proyecto

```
app/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes generales (Sidebar, Header, etc)
│   ├── table/          # Tablas y paginación
│   ├── forms/          # Formularios
│   ├── modal/          # Modales y diálogos
│   └── estado/         # Badges de estado
├── layouts/
│   ├── default.vue     # Layout con sidebar (protegido)
│   └── blank.vue       # Layout vacío para login
├── pages/
│   ├── login.vue       # Login
│   ├── index.vue       # Dashboard principal
│   ├── pedidos/        # Gestión de pedidos
│   ├── rutas/          # Gestión de rutas
│   ├── produccion/     # Registro de producción
│   ├── inventario/     # Control de inventario
│   ├── clientes/       # Gestión de clientes
│   ├── trabajadores/   # Gestión de trabajadores
│   ├── cartera/        # Cuentas por cobrar
│   ├── caja/           # Movimientos de caja
│   ├── reportes/       # Generación de reportes
│   └── configuracion/  # Configuración del sistema
├── composables/        # Lógica reutilizable (hooks)
│   ├── useAuth.ts      # Autenticación
│   ├── useApi.ts       # Llamadas HTTP
│   ├── usePagination.ts # Paginación
│   └── ...
├── stores/             # Estado global (Pinia)
│   ├── auth.ts         # Auth store
│   ├── user.ts         # Usuario actual
│   └── notifications.ts # Notificaciones
├── utils/              # Utilidades
│   ├── api.ts          # Cliente HTTP
│   ├── format.ts       # Formateo
│   ├── validation.ts   # Validaciones
│   └── constants.ts    # Constantes
├── middleware/         # Middlewares de ruta
│   ├── auth.ts         # Validar autenticación
│   └── guest.ts        # Solo no autenticados
├── assets/
│   ├── styles/         # CSS global y variables
│   ├── icons/          # SVGs
│   └── images/         # Imágenes
└── app.vue             # Componente raíz
```

## 🔐 Autenticación

El sistema usa **JWT**:

1. Usuario hace login con email/contraseña
2. El token se guarda en Pinia (estado global)
3. Las peticiones incluyen automáticamente `Authorization: Bearer <token>`
4. Si el token expira, se muestra alerta para re-login

**Credenciales de prueba:**
- Email: `admin@jordan.local`
- Contraseña: `admin123456`

## 🎯 Estados Visuales

Los estados de negocio tienen colores codificados:

- **Verde** ✅ - Correcto, entregado, pagado
- **Amarillo** ⏳ - Pendiente, en proceso
- **Rojo** ❌ - Error, no entregado, inconsistencia
- **Azul** 🔄 - En proceso, cargado
- **Púrpura** 🔁 - Reprogramado

## 🚀 Flujo Típico de Usuario

1. **Login** → Ingresa credenciales
2. **Dashboard** → Ve resumen del día
3. **Crear Pedido** → Formulario de nueva orden
4. **Crear Ruta** → Agrupa pedidos
5. **Registrar Entrega** → Marca pedidos como entregados
6. **Liquidar Ruta** → Registro de pagos y devoluciones
7. **Cierre Diario** → Validaciones finales

## 🛠️ Desarrollo

### Agregar nueva página

1. Crea un archivo en `pages/` (ej: `/pages/nueva-funcion.vue`)
2. La ruta se crea automáticamente
3. Importa composables y componentes necesarios

### Agregar componente reutilizable

1. Crea en `components/` (ej: `/components/forms/FormPedido.vue`)
2. Se importa automáticamente en cualquier página

### Llamar API desde componente

```vue
<script setup>
const { data, pending, error } = await $fetch('/api/pedidos')
</script>
```

O con composables:

```ts
const { getPedidos } = useApi()
const pedidos = await getPedidos()
```

## 📱 Responsividad

Todos los componentes son responsive. Usa breakpoints de Tailwind:

- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px

## ⚙️ Variables de Entorno

Las variables públicas se definen con `NUXT_PUBLIC_`:

```
NUXT_PUBLIC_API_BASE=http://localhost:3001/api
NUXT_PUBLIC_APP_NAME=JORDAN
```

## 🐛 Troubleshooting

### "Cannot find module 'components/...'"
- Verifica que el componente esté en la carpeta `components/`
- Los nombres deben estar en PascalCase (`FormPedido.vue`)

### API no responde
- Verifica que el backend está corriendo en `http://localhost:3001`
- Revisa la consola del navegador (F12) para más detalles
- Asegúrate de que CORS está habilitado en el backend

### Estilos de Tailwind no se aplican
- Reinicia el servidor `pnpm run dev`
- Verifica que los archivos están en `content` en `tailwind.config.ts`

## 📚 Recursos

- [Documentación Nuxt 3](https://nuxt.com)
- [Documentación Tailwind CSS](https://tailwindcss.com)
- [Documentación Pinia](https://pinia.vuejs.org)
- [Documentación TypeScript](https://www.typescriptlang.org)

---

**Última actualización:** 3 de abril de 2026
