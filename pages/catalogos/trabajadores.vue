<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-gray-800">Catálogo de Trabajadores</h1>
      <button class="btn-primary" @click="abrirModal()">+ Nuevo trabajador</button>
    </div>

    <!-- Filtros -->
    <div class="card flex flex-wrap gap-3">
      <input
        v-model="search"
        placeholder="Buscar por nombre, código, cédula…"
        class="form-input max-w-xs"
        @input="pagina = 1; fetchTrabajadores()"
      />
      <select v-model="filtroTipo" class="form-input w-44" @change="pagina = 1; fetchTrabajadores()">
        <option value="">Todos los tipos</option>
        <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filtroActivo" class="form-input w-36" @change="pagina = 1; fetchTrabajadores()">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Código</th>
            <th class="px-4 py-3 font-medium">Nombre</th>
            <th class="px-4 py-3 font-medium">Cédula</th>
            <th class="px-4 py-3 font-medium">Tipo</th>
            <th class="px-4 py-3 font-medium">Teléfono</th>
            <th class="px-4 py-3 font-medium text-right">Tarifa base ($)</th>
            <th class="px-4 py-3 font-medium text-right">Saldo operativo ($)</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
          </tr>
          <tr v-else-if="!trabajadores.length">
            <td colspan="9" class="px-4 py-8 text-center text-gray-400">Sin resultados.</td>
          </tr>
          <tr
            v-for="t in trabajadores"
            :key="t.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 font-mono text-gray-600 text-xs">{{ t.codigo }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ t.nombre }}</td>
            <td class="px-4 py-3 text-gray-500">{{ t.cedula }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 font-medium">{{ t.tipoTrabajador }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ t.telefono ?? '—' }}</td>
            <td class="px-4 py-3 text-right text-gray-700 font-medium">
              {{ formatCurrency(t.tarifaBase ?? 0) }}
            </td>
            <td class="px-4 py-3 text-right" :class="(t.saldoTotal ?? 0) > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'">
              {{ formatCurrency(t.saldoTotal ?? 0) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >{{ t.activo ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button class="text-xs text-gray-600 hover:underline" @click="abrirModal(t)">Editar</button>
                <button
                  class="text-xs hover:underline"
                  :class="t.activo ? 'text-orange-600' : 'text-green-600'"
                  @click="toggleActivo(t)"
                >{{ t.activo ? 'Desactivar' : 'Activar' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ total }} trabajadores</span>
      <div class="flex gap-2">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchTrabajadores()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchTrabajadores()">Sig.</button>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="modalForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="modalForm = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-800">{{ editando ? 'Editar trabajador' : 'Nuevo trabajador' }}</h2>

        <div v-if="loadingModal" class="p-4 bg-blue-50 rounded text-blue-700 text-sm">
          Cargando datos del trabajador...
        </div>

        <div class="grid grid-cols-2 gap-4" :class="{ 'opacity-50 pointer-events-none': loadingModal }">
          <FormField label="Código *">
            <input v-model="form.codigo" class="form-input" :disabled="!!editando" />
          </FormField>
          <FormField label="Tipo *">
            <select v-model="form.tipoTrabajador" class="form-input">
              <option v-for="tp in TIPOS" :key="tp" :value="tp">{{ tp }}</option>
            </select>
          </FormField>
          <FormField label="Nombre completo *" class="col-span-2">
            <input v-model="form.nombre" class="form-input" />
          </FormField>
          <FormField label="Cédula *">
            <input v-model="form.cedula" class="form-input" />
          </FormField>
          <FormField label="Teléfono">
            <input v-model="form.telefono" class="form-input" />
          </FormField>
          <FormField label="Dirección" class="col-span-2">
            <input v-model="form.direccion" class="form-input" />
          </FormField>
          <FormField label="Modalidad pago *">
            <select v-model="form.modalidadPago" class="form-input">
              <option value="POR_JORNADA">Por jornada</option>
              <option value="POR_HORA">Por hora</option>
            </select>
          </FormField>
          <FormField :label="form.modalidadPago === 'POR_HORA' ? 'Tarifa base por hora *' : 'Tarifa base por jornada *'">
            <input
              v-model.number="form.valorPago"
              class="form-input"
              type="number"
              min="0"
              step="1"
              placeholder="Ej: 42000"
            />
            <p class="mt-1 text-xs text-gray-500">
              Este valor se usa como tarifa base de la labor del dia. El saldo se actualiza al registrar la labor.
            </p>
          </FormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button class="btn-secondary" @click="modalForm = false" :disabled="saving || loadingModal">Cancelar</button>
          <button class="btn-primary" :disabled="saving || loadingModal" @click="guardar">
            {{ saving ? 'Guardando…' : loadingModal ? 'Cargando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formats'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()

const TIPOS = ['PERMANENTE', 'TEMPORAL', 'PREVENTISTA', 'DOMICILIARIO', 'MIXTO']

const loading = ref(true)
const saving = ref(false)
const trabajadores = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 15
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const search = ref('')
const filtroTipo = ref('')
const filtroActivo = ref('')

const modalForm = ref(false)
const editando = ref<any>(null)
const loadingModal = ref(false)
const form = reactive({
  codigo: '', nombre: '', cedula: '', telefono: '',
  direccion: '', tipoTrabajador: 'PERMANENTE',
  modalidadPago: 'POR_JORNADA', valorPago: undefined as number | undefined,
})

async function fetchTrabajadores() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagina.value, limit: LIMITE }
    if (search.value) params.search = search.value
    if (filtroTipo.value) params.tipo = filtroTipo.value
    if (filtroActivo.value !== '') params.activo = filtroActivo.value
    const res = await api.get('/catalogos/trabajadores', { params })
    const d = apiResponse.unwrap(res) as any
    trabajadores.value = d.items ?? d
    total.value = d.total ?? trabajadores.value.length
  } catch {
    notify.error('Error al cargar trabajadores')
  } finally {
    loading.value = false
  }
}

async function abrirModal(t?: any) {
  editando.value = t ?? null
  loadingModal.value = false
  
  if (t) {
    const base: any = {
      codigo: t.codigo ?? '',
      nombre: t.nombre ?? '',
      cedula: t.cedula ?? '',
      telefono: t.telefono ?? '',
      direccion: t.direccion ?? '',
      tipoTrabajador: t.tipoTrabajador ?? 'PERMANENTE',
      modalidadPago: 'POR_JORNADA', // Default si no encuentra tarifa
      valorPago: undefined,
    }

    // Abrir modal primero con datos básicos
    modalForm.value = true
    loadingModal.value = true

    try {
      const res = await api.get(`/catalogos/trabajadores/${t.id}`)
      const d = apiResponse.unwrap(res) as any
      const tarifaBase = (d.laboresDisponibles ?? []).find(
        (lt: any) => ['POR_JORNADA', 'POR_HORA'].includes(lt?.laborTipo?.tipo) && lt?.activo !== false,
      )
      if (tarifaBase?.laborTipo?.tipo) base.modalidadPago = tarifaBase.laborTipo.tipo
      if (tarifaBase?.tarifa !== undefined && tarifaBase?.tarifa !== null) {
        base.valorPago = Number(tarifaBase.tarifa)
      }
    } catch (e) {
      notify.error('Error al cargar los datos del trabajador: ' + (e as any)?.message)
    } finally {
      loadingModal.value = false
    }

    Object.assign(form, base)
  } else {
    Object.assign(form, {
      codigo: '',
      nombre: '',
      cedula: '',
      telefono: '',
      direccion: '',
      tipoTrabajador: 'PERMANENTE',
      modalidadPago: 'POR_JORNADA',
      valorPago: undefined,
    })
    modalForm.value = true
  }
}

async function guardar() {
  if (!form.codigo.trim() || !form.nombre.trim() || !form.cedula.trim()) {
    notify.error('Código, nombre y cédula son requeridos')
    return
  }
  
  // Validar precio: requerido si es nuevo, opcional si edita (pero si lo proporciona, debe ser válido)
  if (!editando.value && (!form.valorPago || form.valorPago <= 0)) {
    notify.error('Valor de pago es requerido para nuevos trabajadores')
    return
  }
  if (form.valorPago && form.valorPago <= 0) {
    notify.error('El valor de pago debe ser mayor a 0')
    return
  }
  
  saving.value = true
  try {
    const payload: Record<string, any> = {
      codigo: form.codigo,
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      direccion: form.direccion,
      tipoTrabajador: form.tipoTrabajador,
      modalidadPago: form.modalidadPago,
    }
    if (form.valorPago && form.valorPago > 0) {
      payload.valorPago = Number(form.valorPago)
    }

    if (editando.value) {
      await api.put(`/catalogos/trabajadores/${editando.value.id}`, payload)
      notify.success('Trabajador actualizado')
    } else {
      await api.post('/catalogos/trabajadores', payload)
      notify.success('Trabajador creado')
    }
    modalForm.value = false
    await fetchTrabajadores()
  } catch (e: any) {
    const errorMsg = e?.response?.data?.message ?? 'Error al guardar'
    notify.error(errorMsg)
    console.error('Error al guardar trabajador:', e)
  } finally {
    saving.value = false
  }
}

async function toggleActivo(t: any) {
  try {
    await api.patch(`/catalogos/trabajadores/${t.id}/toggle-activo`)
    notify.success(`Trabajador ${t.activo ? 'desactivado' : 'activado'}`)
    await fetchTrabajadores()
  } catch {
    notify.error('Error al cambiar estado')
  }
}

onMounted(fetchTrabajadores)
</script>
