# Composables — Patrones Reutilizables

Biblioteca de composables (hooks) reutilizables para Vue 3 Composition API. Cada composable encapsula lógica común para evitar duplicación de código.

## 📚 Índice de Composables

### Gestión de Datos

- **useCRUD** — Operaciones CRUD completas (Create, Read, Update, Delete)
- **useFetchData** — Fetching de datos con manejo de error y retry
- **useSearch** — Búsqueda y filtrado avanzado con operadores
- **useCache** — Caching inteligente con TTL y stale-while-revalidate
- **useLazyLoad** — Lazy loading y virtual scroll para tablas grandes

### Gestión de Estado

- **usePagination** — Paginación de datos
- **useTableFilters** — Filtros de tabla reutilizables
- **useEstado** — Máquina de estados con transiciones validadas
- **useLocalState** — Persistencia en localStorage con sincronización
- **useQueryState** — Sincronización de estado con query parameters (URL)

### UI & Interacción

- **useModal** — Estado de modales (open/close)
- **useForm** — Gestión de formularios con validación
- **useDialog** — Ciclo de vida de diálogos (confirm → loading → success/error)

### Utilidades

- **useErrorHandler** — Manejo centralizado de errores con retry
- **useExport** — Exportación de datos (CSV, JSON)
- **useApi** — Cliente HTTP (existente)
- **useNotification** — System notificaciones toast (existente)
- **useApiResponse** — Transformación de respuestas API (existente)

---

## 🎯 Composables Detallados

### useCRUD

**Propósito:** Eliminar boilerplate de CRUD (fetch, create, update, delete).

**Props:**
```typescript
interface CRUDOptions<T> {
  endpoint: string              // ej: '/api/clientes'
  api: ReturnType<typeof useApi>
  notify: ReturnType<typeof useNotification>
  onSuccess?: (message: string, data?: T) => void
  onError?: (error: any) => void
}
```

**Exports:**
- `items` — Array de datos (ref)
- `loading` — Estado de carga general (ref)
- `saving` — Estado de guardado (ref)
- `currentItem` — Item actualmente seleccionado (ref)

**Methods:**
```typescript
fetchItems()                    // GET /endpoint
createItem(data)                // POST /endpoint
updateItem(id, data)            // PUT /endpoint/:id
deleteItem(id)                  // DELETE /endpoint/:id
setCurrentItem(item | null)
```

**Ejemplo:**
```typescript
import { useCRUD } from '~/composables'

export default defineComponent({
  setup() {
    const api = useApi()
    const notify = useNotification()
    
    const { items, loading, createItem, updateItem } = useCRUD({
      endpoint: '/api/clientes',
      api,
      notify,
      onSuccess: (msg, data) => console.log(msg, data)
    })
    
    onMounted(() => fetchItems())
    
    return { items, loading, createItem, updateItem }
  }
})
```

---

### useSearch

**Propósito:** Búsqueda en memoria con operadores avanzados.

**Generic:** `<T extends object>`

**Props:**
- `items: Ref<T[]>` — Array reactivo a filtrar

**Operators:**
- `equals` — Igualdad exacta (default)
- `contains` — Contiene substring
- `startsWith` — Comienza con
- `gt` — Mayor que (números)
- `lt` — Menor que (números)

**Exports:**
- `searchQuery` — Query de búsqueda (ref)
- `filters` — Array de filtros activos (ref)
- `filteredItems` — Resultados filtrados (computed)
- `resultCount` — Cantidad de resultados (computed)
- `hasActiveSearch` — ¿Hay búsqueda/filtro activo? (computed)

**Methods:**
```typescript
setSearchFields('nombre', 'email', 'ciudad')  // Campos a buscar
setSearchQuery('juan')                        // Query text
addFilter('estado', 'ACTIVO', 'equals')       // Agregar filtro
removeFilter(0)                               // Remover filtro por índice
clearSearch()                                 // Limpiar todo
getRemovedCount()                             // items totales - filtrados
```

**Ejemplo:**
```typescript
const { items } = useCRUD({ endpoint: '/api/clientes', api, notify })
const { filteredItems, searchQuery, setSearchFields, addFilter } = useSearch(items)

setSearchFields('nombre', 'email')

// Template
<input v-model="searchQuery" placeholder="Buscar..." />
<button @click="addFilter('estado', 'ACTIVO')">Solo activos</button>
<table>
  <tr v-for="item in filteredItems" :key="item.id">
    <!-- ... -->
  </tr>
</table>
```

---

### useEstado

**Propósito:** Validar transiciones de estado (máquina de estados).

**Props:**
```typescript
interface UseEstadoOptions {
  endpoint: string
  api: ReturnType<typeof useApi>
  notify: ReturnType<typeof useNotification>
  transiciones: Record<string, string[]>     // ej: { BORRADOR: ['EMITIDA', 'ANULADA'] }
  onSuccess?: (nuevoEstado: string) => void
}
```

**Exports:**
- `estadoActual` — Estado actual (ref)
- `changingState` — ¿Cambiando estado? (ref)
- `estadosDisponibles` — Estados válidos desde actual (computed)

**Methods:**
```typescript
setEstado(nuevoEstado)                       // Set local (sin API)
puedeTransicionarA(nuevoEstado) → boolean
cambiarEstado(nuevoEstado, motivo?)          // PUT con validación
```

**Ejemplo:**
```typescript
const TRANSICIONES = {
  BORRADOR: ['EDITAB LE', 'EMITIDA', 'ANULADA'],
  EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
  EMITIDA: ['PAGADA', 'ANULADA'],
  PAGADA: [],
  ANULADA: []
}

const { estadoActual, estadosDisponibles, cambiarEstado } = useEstado({
  endpoint: `/api/facturas/${id}`,
  transiciones: TRANSICIONES,
  api, notify
})

// Template
<button v-for="estado in estadosDisponibles"
        @click="cambiarEstado(estado)">
  Cambiar a {{ estado }}
</button>
```

---

### useErrorHandler

**Propósito:** Retry automático y manejo consistente de errores.

**Props:**
```typescript
interface ErrorConfig {
  autoRetry?: boolean       // default: true
  maxRetries?: number       // default: 3
  retryDelay?: number       // default: 1000ms
}
```

**Exports:**
- `errors` — Historial de errores (ref)
- `isError` — ¿Hay error? (ref)
- `errorMessage` — Mensaje de error (ref)
- `retryCount` — Intentos realizados (ref)

**Methods:**
```typescript
clearError()
handleError(error, context = 'Operación')    // → { message, canRetry }
retryOperation(operation, context)           // → { success, data, error }
logError(context, error)
```

**Ejemplo:**
```typescript
const { retryOperation } = useErrorHandler({ maxRetries: 3 })

async function loadCriticalData() {
  const result = await retryOperation(
    () => api.get('/datos-criticos'),
    'Carga de Datos Críticos'
  )
  
  if (result.success) {
    console.log('Datos:', result.data)
  } else {
    console.error('Error:', result.error)
  }
}
```

---

### useForm

**Propósito:** Validación y gestión de estado de formularios.

**Props:**
```typescript
interface FormOptions<T> {
  initialState: T
  validators?: Record<keyof T, (value: any) => string | null>
}
```

**Exports:**
- `form` — Objeto formulario reactivo (ref)
- `errors` — Errores por campo (ref)
- `touched` — Campos modificados por usuario (ref)

**Methods:**
```typescript
validate() → boolean                         // Validar todo
validateField(key)                           // Validar un campo
resetForm()
setFieldValue(key, value)
markFieldTouched(key)
```

**Ejemplo:**
```typescript
const { form, errors, validate, setFieldValue } = useForm(
  { nombre: '', email: '', edad: 0 },
  {
    nombre: (v) => !v ? 'Requerido' : v.length < 3 ? 'Min 3 caracteres' : null,
    email: (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email inválido' : null,
    edad: (v) => v < 18 ? 'Debe ser mayor de 18' : null
  }
)

async function submit() {
  if (!validate()) return
  await api.post('/usuarios', form.value)
}
```

---

### usePagination

**Propósito:** Gestión centralizada de paginación.

**Props:**
- `initialPage` — Página inicial (default: 1)
- `initialLimit` — Items por página (default: 15)

**Exports:**
- `pagina` — Página actual (ref)
- `total` — Total de items (ref)
- `LIMITE` — Items por página (constant)
- `totalPaginas` — Total de páginas (computed)
- `isFirstPage` — ¿Primera página? (computed)
- `isLastPage` — ¿Última página? (computed)

**Methods:**
```typescript
resetPage()
nextPage()
prevPage()
goToPage(page)
```

---

### useModal

**Propósito:** Estado simple de modales.

**Exports:**
- `isOpen` — Modal abierto (ref)
- `data` — Data opcional (ref)

**Methods:**
```typescript
open(payload?)
close()
toggle(payload?)
```

---

### useDialog

**Propósito:** Diálogos con ciclo de vida completo.

**Props:**
```typescript
interface UseDialogOptions {
  title?: string
  confirmText?: string
  successMessage?: string
  errorMessage?: string
}
```

**Steps:** `confirm` → `loading` → `success` | `error`

**Methods:**
```typescript
open(customData?)
close()
setLoading()
setSuccess()
setError(message)
executeAndClose(operation, onSuccess?)
```

---

### useLocalState

**Propósito:** Persistencia de estado en localStorage con sincronización entre pestañas.

**Props:**
```typescript
interface UseLocalStateOptions<T> {
  key: string
  initialValue: T
  serialize?: (value: T) => string     // default: JSON.stringify
  deserialize?: (value: string) => T   // default: JSON.parse
}
```

**Methods:**
```typescript
save()   // Guardar a localStorage
clear()  // Limpiar y resetear
reset()  // Resetear a initialValue
```

**Ejemplo:**
```typescript
const { state: userPrefs, save } = useLocalState({
  key: 'user-preferences',
  initialValue: { theme: 'light', sidebarCollapsed: false }
})

watch(() => userPrefs.value.theme, () => save())
```

---

### useExport

**Propósito:** Exportar datos a CSV/JSON.

**Methods:**
```typescript
exportToCSV<T>(data: T[], options?)
exportToJSON<T>(data: T[], options?)
exportToExcel<T>(data: T[], options?)  // CSV compatible
```

**Options:**
```typescript
interface ExportOptions {
  filename?: string        // default: 'export'
  format?: 'csv' | 'json'
  includeHeaders?: boolean // default: true
}
```

---

### useFetchData

**Propósito:** Fetching de datos con manejo de error y retry.

**Props:**
```typescript
interface FetchOptions {
  immediate?: boolean                  // default: false
  onError?: (error: any) => void
}
```

**Exports:**
- `data` — Datos de respuesta (ref)
- `loading` — ¿Cargando? (ref)
- `error` — Error (ref)
- `retryCount` — Intentos (ref)

**Methods:**
```typescript
fetch()     // Ejecutar fetch
refetch()   // Re-ejecutar
retry()     // Retry con delay
```

---

### useCache

**Propósito:** Caching inteligente con TTL y estrategia stale-while-revalidate.

**Exports:**
- `get<T>(key)` → Valor cacheado o null
- `set<T>(key, data, customTtl?)` → Guardar en cache
- `has(key)` → ¿Hay cache válido?
- `clear()` → Limpiar todo cache
- `remove(key)` → Remover un item
- `getStats()` → { size, entries }

**Ejemplo:**
```typescript
const cache = useCache({ ttl: 10 * 60 * 1000 })

// Cachear resultado
const result = await api.get('/clientes')
cache.set('clientes-list', result.data)

// Recuperar
const cached = cache.get('clientes-list')
if (cached) {
  // Usar dato cacheado
}
```

**Bonus: useFetchDataWithCache**
Versión mejorada de `useFetchData` que integra caching automático:

```typescript
const { data, isCached, clearCache } 
  = useFetchDataWithCache(
    () => api.get('/datos'),
    'datos-key',
    { cache: { ttl: 5 * 60 * 1000 } }
  )
```

---

### useLazyLoad

**Propósito:** Lazy loading automático y virtual scroll para tablas grandes.

**Props:**
- `items: Ref<T[]>` — Array de items
- `fetchMoreFn` — Función para cargar más items
- `pageSize` — Items por carga (default: 15)
- `threshold` — Elementos desde fin para triggerear (default: 5)

**Exports:**
- `visibleItems` — Items mostrados actualmente
- `loadingMore` — ¿Cargando más?
- `hasMore` — ¿Hay más items?
- `containerRef` — Ref para el contenedor (attach a div)
- `loadMore()` — Cargar siguiente página manualmente
- `reset()` — Reset a estado inicial

**Ejemplo:**
```typescript
const items = ref([])
const { visibleItems, containerRef, loadingMore } = useLazyLoad(
  items,
  async (page, pageSize) => {
    const res = await api.get(`/clientes?page=${page}&limit=${pageSize}`)
    return res.data
  }
)

// En template
<div ref="containerRef" class="table-container">
  <table>
    <tr v-for="item in visibleItems" :key="item.id">
      <!-- items se cargan automáticamente al scrollear -->
    </tr>
  </table>
  <div v-if="loadingMore" class="loader">Cargando más...</div>
</div>
```

**Bonus: useVirtualScroll**
Virtual scroll extremo para 10000+ items:

```typescript
const { visibleItems, totalHeight } = useVirtualScroll(
  items,
  { itemHeight: 48, bufferSize: 5 }
)

// Template: Renderizar solo items visibles
<div :style="{ height: totalHeight + 'px' }">
  <div v-for="item in visibleItems">{{ item }}</div>
</div>
```

---

### useQueryState

**Propósito:** Sincronizar estado con query parameters de URL.

**Generic:** `<T extends Record<string, any>>`

**Props:**
- `initialState: T` — Estado inicial
- `syncToUrl` — Auto-sincronizar a URL (default: true)
- `debounceMs` — Delay antes de actualizar URL (default: 300)

**Exports:**
- `state` — Objeto reactivo readonly
- `setState(key, value)` — Actualizar campo
- `reset()` — Reset a inicial y limpiar URL
- `getQueryString()` — String para compartir

**Ejemplo:**
```typescript
const { state, setState } = useQueryState(
  {
    search: '',
    estado: 'ACTIVO',
    page: 1,
    sortBy: 'nombre'
  },
  { syncToUrl: true }
)

// URL auto-actualiza: ?search=juan&estado=ACTIVO&page=1&sortBy=nombre

function handleSearch(query: string) {
  setState('search', query)
  setState('page', 1)  // Reset página
}

// Compartir filtros
const link = `${window.location.origin}?${state.getQueryString()}`
```

**Bonus: useQueryFilters**
Para manejar múltiples valores del mismo tipo:

```typescript
const { filters, addFilter, toggleFilter } = useQueryFilters('estados')
// URL: ?estados=ACTIVO&estados=PAGADO

toggleFilter('ACTIVO')  // Agregar o remover
```

---

## 🔧 Patrones de Uso

### Tabla Completa (CRUD + Búsqueda + Paginación + Exportación)

```typescript
const api = useApi()
const notify = useNotification()

const { items, loading, createItem, updateItem, deleteItem, fetchItems } 
  = useCRUD({ endpoint: '/api/clientes', api, notify })

const { filteredItems, searchQuery, setSearchFields, addFilter } 
  = useSearch(items)

const { pagina, totalPaginas } = usePagination(1, 15)

const { exporting, exportToCSV } = useExport()

setSearchFields('nombre', 'email', 'ciudad')

const paginatedItems = computed(() => {
  const start = (pagina.value - 1) * 15
  return filteredItems.value.slice(start, start + 15)
})

onMounted(() => fetchItems())

async function handleExport() {
  await exportToCSV(filteredItems.value, { filename: 'clientes' })
}
```

### Operación Multi-paso

```typescript
const { executeAndClose, isLoading } = useDialog({
  title: 'Crear Cliente',
  successMessage: 'Cliente creado exitosamente'
})

async function crearCliente() {
  await executeAndClose(
    () => api.post('/api/clientes', formData),
    (data) => {
      items.value.push(data)
    }
  )
}
```

---

## ✅ Checklist de Adopción

Para integrar estos composables en una página:

- [ ] Importar composables necesarios
- [ ] Llamar composables en `setup()`
- [ ] Reemplazar refs/methods manuales
- [ ] Actualizar template para usar exports
- [ ] Probar CRUD, búsqueda, paginación
- [ ] Remover código viejo innecesario

---

## 📝 Notas

- Todos los composables son **type-safe** (TypeScript)
- Compatibles con **Pinia** (state management)
- **Zero breaking changes** — opcional adopción
- Auto-sincronización de localStorage entre pestañas
- Error handling integrado con `useNotification`
