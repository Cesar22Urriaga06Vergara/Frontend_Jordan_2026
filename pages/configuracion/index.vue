<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-800">Configuración</h1>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <button
        v-for="tab in TABS" :key="tab.id"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition"
        :class="tabActivo === tab.id
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tabActivo = tab.id"
      >{{ tab.label }}</button>
    </div>

    <!-- Mi perfil -->
    <div v-if="tabActivo === 'perfil'" class="card space-y-4 max-w-lg">
      <h2 class="font-semibold text-gray-700">Mi perfil</h2>

      <FormField label="Nombre">
        <input v-model="profileForm.nombre" class="form-input" />
      </FormField>
      <FormField label="Email">
        <input v-model="profileForm.email" class="form-input" type="email" />
      </FormField>

      <button class="btn-primary" :disabled="savingProfile" @click="actualizarPerfil">
        {{ savingProfile ? 'Guardando…' : 'Actualizar perfil' }}
      </button>

      <hr class="my-4" />

      <h2 class="font-semibold text-gray-700">Cambiar contraseña</h2>

      <FormField label="Contraseña actual *">
        <input v-model="pwForm.currentPassword" class="form-input" type="password" autocomplete="current-password" />
      </FormField>
      <FormField label="Nueva contraseña *">
        <input v-model="pwForm.newPassword" class="form-input" type="password" autocomplete="new-password" />
      </FormField>
      <FormField label="Confirmar nueva contraseña *">
        <input v-model="confirmPassword" class="form-input" type="password" autocomplete="new-password" />
      </FormField>

      <div v-if="confirmPassword && pwForm.newPassword !== confirmPassword" class="text-xs text-red-500">
        Las contraseñas no coinciden.
      </div>

      <button
        class="btn-primary"
        :disabled="savingPw || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== confirmPassword"
        @click="cambiarPassword"
      >{{ savingPw ? 'Cambiando…' : 'Cambiar contraseña' }}</button>
    </div>

    <!-- Usuarios del sistema -->
    <div v-if="tabActivo === 'usuarios'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ total }} usuarios registrados</p>
        <div class="flex items-center gap-3">
          <button class="text-xs text-blue-600 hover:underline" @click="fetchUsuarios">Actualizar</button>
          <button class="btn-primary text-xs py-1.5 flex items-center gap-2" @click="modalCreateUser = true">
            <Plus class="h-4 w-4" />
            Nuevo usuario
          </button>
        </div>
      </div>

      <div class="card overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b text-xs uppercase">
              <th class="px-4 py-3 font-medium">ID</th>
              <th class="px-4 py-3 font-medium">Nombre</th>
              <th class="px-4 py-3 font-medium">Email / Usuario</th>
              <th class="px-4 py-3 font-medium">Rol</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingUsuarios">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
            </tr>
            <tr
              v-for="u in usuarios"
              :key="u.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ u.id }}</td>
              <td class="px-4 py-3 font-medium text-gray-800">{{ u.nombre ?? u.name ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-500">{{ u.email ?? u.username ?? '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                  {{ u.rol ?? u.role ?? '—' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="userActivo(u) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                >{{ userActivo(u) ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                    title="Editar usuario"
                    @click="abrirEditarUsuario(u)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    v-if="userActivo(u)"
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Desactivar usuario"
                    :disabled="esUsuarioActual(u)"
                    @click="abrirDesactivarUsuario(u)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                  <button
                    v-else
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                    title="Activar usuario"
                    @click="activarUsuario(u)"
                  >
                    <RotateCcw class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación simple -->
      <div class="flex justify-end gap-2 text-sm text-gray-500" v-if="total > LIMITE">
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina === 1" @click="pagina--; fetchUsuarios()">Ant.</button>
        <span class="px-2 py-1">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-secondary px-3 py-1 text-xs" :disabled="pagina >= totalPaginas" @click="pagina++; fetchUsuarios()">Sig.</button>
      </div>

      <div v-if="modalCreateUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="modalCreateUser = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-lg font-bold text-gray-800">Nuevo usuario</h2>

          <FormField label="Nombre *">
            <input v-model="newUserForm.nombre" class="form-input" />
          </FormField>
          <FormField label="Email *">
            <input v-model="newUserForm.email" class="form-input" type="email" />
          </FormField>
          <FormField label="Contraseña *">
            <input v-model="newUserForm.password" class="form-input" type="password" autocomplete="new-password" />
          </FormField>
          <FormField label="Rol">
            <select v-model="newUserForm.rol" class="form-input">
              <option v-for="rol in ROLES" :key="rol.value" :value="rol.value">{{ rol.label }}</option>
            </select>
          </FormField>

          <div class="flex justify-end gap-2 pt-1">
            <button class="btn-secondary" @click="modalCreateUser = false">Cancelar</button>
            <button class="btn-primary" :disabled="savingCreateUser" @click="crearUsuario">
              {{ savingCreateUser ? 'Guardando…' : 'Crear usuario' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="modalEditUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="cerrarEditarUsuario">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-gray-800">Editar usuario</h2>
            <p class="mt-1 text-xs text-gray-500">La contrasena es opcional. Dejela vacia si no desea cambiarla.</p>
          </div>

          <FormField label="Nombre *">
            <input v-model="editUserForm.nombre" class="form-input" />
          </FormField>
          <FormField label="Email *">
            <input v-model="editUserForm.email" class="form-input" type="email" />
          </FormField>
          <FormField label="Nueva contrasena">
            <input v-model="editUserForm.password" class="form-input" type="password" autocomplete="new-password" />
          </FormField>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Rol">
              <select v-model="editUserForm.rol" class="form-input" :disabled="esEditandoUsuarioActual">
                <option v-for="rol in ROLES" :key="rol.value" :value="rol.value">{{ rol.label }}</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select v-model="editUserForm.estado" class="form-input" :disabled="esEditandoUsuarioActual">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </FormField>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button class="btn-secondary" @click="cerrarEditarUsuario">Cancelar</button>
            <button class="btn-primary" :disabled="savingEditUser" @click="guardarUsuario">
              {{ savingEditUser ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>

      <ModalConfirmacion
        ref="modalDeactivateUser"
        titulo="Desactivar usuario"
        descripcion="El usuario no se borrara del historial, pero quedara inactivo para el sistema."
        textoConfirm="Desactivar"
        textoCancel="Cancelar"
        :detalles="{ Usuario: userToDeactivate?.nombre, Email: userToDeactivate?.email, Rol: userToDeactivate?.rol }"
        advertencia="No se puede desactivar tu propio usuario ni dejar el sistema sin administrador activo."
        @confirm="desactivarUsuario"
        @cancel="cerrarDesactivarUsuario"
      />
    </div>

    <!-- Datos de la empresa -->
    <div v-if="tabActivo === 'empresa'" class="card space-y-4 max-w-lg">
      <h2 class="font-semibold text-gray-700">Datos de la empresa</h2>

      <div v-if="loadingEmpresa" class="text-sm text-gray-400">Cargando…</div>

      <template v-else>
        <FormField label="Nombre de la empresa *">
          <input v-model="empresaForm.nombre" class="form-input" placeholder="Ej: Aguas Jordan" />
        </FormField>
        <FormField label="NIT">
          <input v-model="empresaForm.nit" class="form-input" placeholder="Ej: 900.123.456-7" />
        </FormField>
        <FormField label="Dirección">
          <input v-model="empresaForm.direccion" class="form-input" />
        </FormField>
        <FormField label="Ciudad">
          <input v-model="empresaForm.ciudad" class="form-input" />
        </FormField>
        <FormField label="Teléfono">
          <input v-model="empresaForm.telefono" class="form-input" type="tel" />
        </FormField>
        <FormField label="Email">
          <input v-model="empresaForm.email" class="form-input" type="email" />
        </FormField>
        <FormField label="Eslogan">
          <input v-model="empresaForm.slogan" class="form-input" placeholder="Ej: Agua pura para tu hogar" />
        </FormField>

        <button class="btn-primary" :disabled="savingEmpresa" @click="guardarEmpresa">
          {{ savingEmpresa ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const authStore = useAuthStore()
const apiResponse = useApiResponse()

const TABS = [
  { id: 'perfil', label: 'Mi perfil' },
  { id: 'usuarios', label: 'Usuarios del sistema' },
  { id: 'empresa', label: 'Datos de la empresa' },
]
const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'CONTADOR', label: 'Contador' },
]
const tabActivo = ref('perfil')

// Perfil
const savingProfile = ref(false)
const profileForm = reactive({
  nombre: authStore.user?.nombre ?? '',
  email: authStore.user?.email ?? '',
})

// Contraseña
const savingPw = ref(false)
const pwForm = reactive({ currentPassword: '', newPassword: '' })
const confirmPassword = ref('')

// Usuarios
const loadingUsuarios = ref(false)
const savingCreateUser = ref(false)
const savingEditUser = ref(false)
const modalCreateUser = ref(false)
const modalEditUser = ref(false)
const modalDeactivateUser = ref()
const userToDeactivate = ref<any>(null)
const editingUserId = ref<number | null>(null)
const usuarios = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 20
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const newUserForm = reactive({ nombre: '', email: '', password: '', rol: 'ADMIN' })
const editUserForm = reactive({
  nombre: '',
  email: '',
  password: '',
  rol: 'ADMIN',
  estado: 'ACTIVO',
})
const esEditandoUsuarioActual = computed(() =>
  editingUserId.value === Number(authStore.user?.id ?? 0),
)

async function actualizarPerfil() {
  savingProfile.value = true
  try {
    await api.patch('/users/profile', profileForm)
    notify.success('Perfil actualizado')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingProfile.value = false
  }
}

async function cambiarPassword() {
  savingPw.value = true
  try {
    await api.patch('/users/change-password', {
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    })
    notify.success('Contraseña cambiada')
    pwForm.currentPassword = ''
    pwForm.newPassword = ''
    confirmPassword.value = ''
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingPw.value = false
  }
}

async function fetchUsuarios() {
  loadingUsuarios.value = true
  try {
    const res = await api.get('/users', { params: { page: pagina.value, limit: LIMITE } })
    const d = apiResponse.unwrap(res) as any
    const p = apiResponse.page(res)
    usuarios.value = apiResponse.list(res)
    total.value = Number(p.total ?? d?.total ?? usuarios.value.length)
  } catch {
    notify.error('Error al cargar usuarios')
  } finally {
    loadingUsuarios.value = false
  }
}

function userActivo(u: any) {
  if (typeof u?.estado === 'string') {
    return u.estado === 'ACTIVO'
  }
  return Boolean(u?.activo ?? u?.isActive ?? true)
}

function esUsuarioActual(u: any) {
  return Number(u?.id) === Number(authStore.user?.id ?? 0)
}

async function crearUsuario() {
  if (!newUserForm.nombre.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
    notify.error('Nombre, email y contraseña son requeridos')
    return
  }

  savingCreateUser.value = true
  try {
    await api.post('/users', {
      nombre: newUserForm.nombre,
      email: newUserForm.email,
      password: newUserForm.password,
      rol: newUserForm.rol || 'ADMIN',
    })
    notify.success('Usuario creado')
    modalCreateUser.value = false
    newUserForm.nombre = ''
    newUserForm.email = ''
    newUserForm.password = ''
    newUserForm.rol = 'ADMIN'
    pagina.value = 1
    await fetchUsuarios()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingCreateUser.value = false
  }
}

function abrirEditarUsuario(u: any) {
  editingUserId.value = Number(u.id)
  editUserForm.nombre = u.nombre ?? ''
  editUserForm.email = u.email ?? ''
  editUserForm.password = ''
  editUserForm.rol = u.rol ?? 'ADMIN'
  editUserForm.estado = u.estado ?? 'ACTIVO'
  modalEditUser.value = true
}

function cerrarEditarUsuario() {
  modalEditUser.value = false
  editingUserId.value = null
  editUserForm.password = ''
}

async function guardarUsuario() {
  if (!editingUserId.value) return
  if (!editUserForm.nombre.trim() || !editUserForm.email.trim()) {
    notify.error('Nombre y email son requeridos')
    return
  }
  if (editUserForm.password && editUserForm.password.length < 8) {
    notify.error('La nueva contrasena debe tener al menos 8 caracteres')
    return
  }

  savingEditUser.value = true
  try {
    const payload: Record<string, any> = {
      nombre: editUserForm.nombre,
      email: editUserForm.email,
      rol: editUserForm.rol,
      estado: editUserForm.estado,
    }
    if (editUserForm.password) payload.password = editUserForm.password

    await api.patch(`/users/${editingUserId.value}`, payload)
    notify.success('Usuario actualizado')
    cerrarEditarUsuario()
    await fetchUsuarios()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingEditUser.value = false
  }
}

function abrirDesactivarUsuario(u: any) {
  userToDeactivate.value = u
  modalDeactivateUser.value?.open()
}

function cerrarDesactivarUsuario() {
  userToDeactivate.value = null
  modalDeactivateUser.value?.close()
}

async function desactivarUsuario() {
  if (!userToDeactivate.value) return
  try {
    await api.delete(`/users/${userToDeactivate.value.id}`)
    notify.success('Usuario desactivado')
    cerrarDesactivarUsuario()
    await fetchUsuarios()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
    cerrarDesactivarUsuario()
  }
}

async function activarUsuario(u: any) {
  try {
    await api.patch(`/users/${u.id}`, { estado: 'ACTIVO' })
    notify.success('Usuario activado')
    await fetchUsuarios()
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  }
}

// Empresa
const loadingEmpresa = ref(false)
const savingEmpresa = ref(false)
const empresaForm = reactive({
  nombre: '',
  nit: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  slogan: '',
})

async function fetchEmpresa() {
  loadingEmpresa.value = true
  try {
    const res = await api.get('/configuracion/empresa')
    const d = apiResponse.unwrap(res) as any ?? res?.data ?? res
    Object.assign(empresaForm, {
      nombre: d.nombre ?? '',
      nit: d.nit ?? '',
      direccion: d.direccion ?? '',
      ciudad: d.ciudad ?? '',
      telefono: d.telefono ?? '',
      email: d.email ?? '',
      slogan: d.slogan ?? '',
    })
  } catch {
    notify.error('Error al cargar datos de la empresa')
  } finally {
    loadingEmpresa.value = false
  }
}

async function guardarEmpresa() {
  savingEmpresa.value = true
  try {
    await api.patch('/configuracion/empresa', { ...empresaForm })
    notify.success('Datos de la empresa guardados')
  } catch (e: any) {
    notify.error(apiResponse.errorMessage(e))
  } finally {
    savingEmpresa.value = false
  }
}

watch(tabActivo, t => {
  if (t === 'usuarios') fetchUsuarios()
  if (t === 'empresa') fetchEmpresa()
})
</script>
