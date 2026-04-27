# Testing Composables — Patrones y Best Practices

## Configuración

- **Vitest** para unit tests (rápido, compatible con ESM)
- **@testing-library/vue** para componentes
- **jsdom** para environment simulado

## Ejecutar Tests

```bash
# Todos los tests
npm run test

# En modo watch
npm run test -- --watch

# UI interactiva
npm run test:ui

# Coverage
npm run test:coverage
```

## Estructura

```
composables/
├── useForm.ts
├── usePagination.ts
├── useCRUD.ts
├── ...
└── __tests__/
    ├── useForm.spec.ts
    ├── usePagination.spec.ts
    ├── useCache.spec.ts
    ├── useSearch.spec.ts
    └── ...
```

## Patrones de Testing

### 1. Composables Simples (usePagination)

```typescript
describe('usePagination', () => {
  let pagination: ReturnType<typeof usePagination>

  beforeEach(() => {
    pagination = usePagination(1, 15)
  })

  it('should initialize with correct defaults', () => {
    expect(pagination.pagina.value).toBe(1)
    expect(pagination.LIMITE).toBe(15)
  })

  it('should navigate pages correctly', () => {
    pagination.nextPage()
    expect(pagination.pagina.value).toBe(2)
  })
})
```

**Checklist:**
- ✅ Setup en beforeEach
- ✅ Test initialization
- ✅ Test state changes
- ✅ Test computed properties
- ✅ Test edge cases (first/last page)

### 2. Composables con State Reactivo (useSearch)

```typescript
describe('useSearch', () => {
  let items: Ref<TestItem[]>
  let search: ReturnType<typeof useSearch<TestItem>>

  beforeEach(() => {
    items = ref([...testData])
    search = useSearch(items)
  })

  it('should search in configured fields', () => {
    search.setSearchFields('nombre', 'email')
    search.setSearchQuery('juan')
    
    expect(search.filteredItems.value).toHaveLength(1)
  })

  it('should apply multiple filters with AND logic', () => {
    search.addFilter('estado', 'ACTIVO')
    search.addFilter('nombre', 'juan', 'contains')
    
    expect(search.filteredItems.value).toHaveLength(1)
  })
})
```

**Checklist:**
- ✅ Usar ref() para reactive items
- ✅ Test cada operador (equals, contains, gt, lt)
- ✅ Test combinación search + filters
- ✅ Test resultCount computed
- ✅ Test clearSearch() limpia todo

### 3. Composables con Time (useCache)

```typescript
import { vi } from 'vitest'

describe('useCache', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  it('should expire cached items after TTL', () => {
    cache.set('key', 'value', 1000)
    
    expect(cache.has('key')).toBe(true)
    vi.advanceTimersByTime(1100)
    expect(cache.has('key')).toBe(false)
  })
})
```

**Checklist:**
- ✅ vi.advanceTimersByTime() para simular paso de tiempo
- ✅ Test TTL por item
- ✅ Test stale checking
- ✅ Test auto-cleanup

### 4. Composables con Validación (useForm)

```typescript
describe('useForm', () => {
  const validators = {
    email: (v: string) => 
      !/^[^\s@]+@[^\s@]+$/.test(v) ? 'Email inválido' : null,
    age: (v: number) => 
      v < 18 ? 'Debe ser mayor de 18' : null
  }

  it('should validate individual fields', () => {
    form.setFieldValue('email', 'invalid')
    form.validateField('email')
    
    expect(form.errors.value.email).toBe('Email inválido')
  })

  it('should validate entire form', () => {
    form.setFieldValue('email', 'invalid')
    form.setFieldValue('age', 16)
    
    const isValid = form.validate()
    
    expect(isValid).toBe(false)
    expect(form.errors.value.email).not.toBeNull()
    expect(form.errors.value.age).not.toBeNull()
  })
})
```

**Checklist:**
- ✅ Test cada validador
- ✅ Test whole form validation
- ✅ Test error clearing
- ✅ Test touched field tracking
- ✅ Test resetForm()

## Common Test Utilities

### Setup con Data Real

```typescript
interface User { id: number; name: string }

const testUsers: User[] = [
  { id: 1, name: 'Juan' },
  { id: 2, name: 'María' },
  { id: 3, name: 'Pedro' },
]

beforeEach(() => {
  items = ref([...testUsers])
})
```

### Fixtures Reutilizables

```typescript
// composables/__tests__/fixtures.ts
export const testUsers = [
  { id: 1, name: 'Juan García', email: 'juan@example.com' },
  // ...
]

export const testForm = {
  name: '',
  email: '',
  age: 0
}

// En tests
import { testUsers, testForm } from './fixtures'
```

### Async Operations

```typescript
it('should handle async fetch', async () => {
  const { data, loading, fetch } = useFetchData(
    async () => ({ items: [] })
  )

  await fetch()
  
  expect(data.value).toEqual({ items: [] })
})
```

## Coverage Goals

```
composables/
├── Coverage: 80%+ target
├── Functions: 90%+ target
└── Branches: 75%+ target
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

```bash
# Solo un test específico
npm run test composables/__tests__/useForm.spec.ts

# Un describe específico
npm run test -- --reporter=verbose

# Modo debug
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

## Anti-Patterns

❌ **No mockear composables en otros tests**
```typescript
// ❌ MAL
vi.mock('~/composables/useForm')
```

❌ **No depender de state global**
```typescript
// ❌ MAL
state.value = ... // Modifica state global
```

✅ **Bien: Tests independientes con setup/teardown**
```typescript
beforeEach(() => {
  form = useForm(initialState) // Fresh instance
})
```

❌ **No usar timers reales**
```typescript
// ❌ MAL
await new Promise(r => setTimeout(r, 1000))

// ✅ BIEN
vi.advanceTimersByTime(1000)
```

## Cobertura Mínima por Composable

| Composable | Líneas | Funciones | Branches |
|-----------|--------|-----------|----------|
| usePagination | 90% | 95% | 85% |
| useSearch | 85% | 90% | 80% |
| useForm | 88% | 92% | 80% |
| useCache | 85% | 90% | 85% |
| useModal | 95% | 100% | 90% |
| useCRUD | 75% | 80% | 70% |

## Next Steps

- [ ] Agregar tests para useLazyLoad
- [ ] Agregar tests para useQueryState
- [ ] Agregar tests para useDialog
- [ ] Configurar codecov
- [ ] Integrar tests en CI/CD
- [ ] Documentar testing patterns en wiki
