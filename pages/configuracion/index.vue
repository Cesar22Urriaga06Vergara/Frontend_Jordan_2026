<template>
  <div class="p-6 space-y-6 max-w-4xl mx-auto">
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
          <button class="btn-primary text-xs py-1.5" @click="modalCreateUser = true">+ Nuevo usuario</button>
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
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingUsuarios">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">Cargando…</td>
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
            <input v-model="newUserForm.rol" class="form-input" placeholder="ADMIN" />
          </FormField>

          <div class="flex justify-end gap-2 pt-1">
            <button class="btn-secondary" @click="modalCreateUser = false">Cancelar</button>
            <button class="btn-primary" :disabled="savingCreateUser" @click="crearUsuario">
              {{ savingCreateUser ? 'Guardando…' : 'Crear usuario' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const authStore = useAuthStore()
const apiResponse = useApiResponse()

const TABS = [
  { id: 'perfil', label: 'Mi perfil' },
  { id: 'usuarios', label: 'Usuarios del sistema' },
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
const modalCreateUser = ref(false)
const usuarios = ref<any[]>([])
const total = ref(0)
const pagina = ref(1)
const LIMITE = 20
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
const newUserForm = reactive({ nombre: '', email: '', password: '', rol: 'ADMIN' })

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

watch(tabActivo, t => { if (t === 'usuarios') fetchUsuarios() })
</script>
