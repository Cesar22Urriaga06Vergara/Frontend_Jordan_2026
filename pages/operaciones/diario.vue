<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestión de Planta</h1>
        <p class="text-sm text-gray-500">Apertura, producción, cierre e historial operativo.</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 whitespace-nowrap">Fecha:</label>
        <input
          v-model="fechaSeleccionada"
          type="date"
          class="form-input w-auto"
          :max="hoy"
          @change="onFechaChange"
        />
        <button
          v-if="fechaSeleccionada !== hoy"
          class="text-xs text-blue-600 hover:underline whitespace-nowrap"
          @click="fechaSeleccionada = hoy; onFechaChange()"
        >
          Hoy
        </button>
      </div>
    </div>

    <div
      v-if="diaPendiente && fechaSeleccionada === hoy"
      class="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 h-5 w-5 text-red-700" />
          <div>
            <p class="text-sm font-semibold text-red-700">Hay una jornada sin cerrar: {{ diaPendiente }}</p>
            <p class="mt-0.5 text-xs text-red-500">Debes liquidarla antes de abrir el día de hoy.</p>
          </div>
        </div>
        <button class="btn-danger whitespace-nowrap text-sm" @click="irACerrarDiaPendiente">
          Ir a cerrar {{ diaPendiente }}
        </button>
      </div>
    </div>

    <div v-if="loadingEstado" class="card py-8 text-center text-gray-400">Cargando estado...</div>

    <template v-else>
      <section class="rounded-lg border p-5 shadow-sm" :class="jornadaState.wrapperClass">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
              :class="jornadaState.iconClass"
            >
              <component :is="jornadaState.icon" class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="jornadaState.badgeClass">
                  {{ jornadaState.badge }}
                </span>
                <span class="text-sm text-gray-500">{{ formatDate(fechaSeleccionada) }}</span>
              </div>
              <h2 class="mt-2 text-xl font-bold text-gray-900">{{ jornadaState.title }}</h2>
              <p class="mt-1 max-w-2xl text-sm text-gray-600">{{ jornadaState.description }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[620px]">
            <div
              v-for="item in jornadaStats"
              :key="item.label"
              class="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm"
            >
              <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" :class="item.iconClass">
                <component :is="item.icon" class="h-4 w-4" />
              </div>
              <p class="text-[11px] font-bold uppercase text-gray-400">{{ item.label }}</p>
              <p class="mt-1 text-lg font-black text-gray-900">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!estado.apertura || (estado.cierre && reopening)" class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div class="card">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase text-gray-400">Paso 1</p>
              <h2 class="mt-1 font-semibold text-gray-800">
                {{ remanenteOrigen ? 'Reapertura de jornada' : 'Apertura de jornada' }}
              </h2>
            </div>
            <button v-if="!remanenteOrigen" class="btn-secondary inline-flex items-center gap-1 text-xs" @click="agregarInventario">
              <Plus class="h-4 w-4" />
              Añadir producto
            </button>
          </div>

          <div
            v-if="remanenteOrigen"
            class="mb-4 rounded-lg border px-4 py-3 text-sm"
            :class="modoReapertura 
              ? 'border-purple-200 bg-purple-50 text-purple-800'
              : 'border-blue-100 bg-blue-50 text-blue-800'"
          >
            <p class="font-semibold" :class="modoReapertura ? 'text-purple-900' : ''">
              {{ modoReapertura 
                ? '✓ Reapertura del mismo día' 
                : `Remanente cargado del cierre del día ${remanenteOrigen}`
              }}
            </p>
            <p v-if="!modoReapertura" class="mt-1">
              Inventario inicial y saldo de caja ({{ formatCurrency(aperturaSaldoInicial) }}) se tomaron de ese cierre.
            </p>
            <p v-else class="mt-1 text-xs opacity-90">
              Todos los datos operativos se preservan. Los consecutivos continúan desde donde se quedaron.
            </p>
          </div>

          <div v-if="!remanenteOrigen || !modoReapertura" class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-600">Inventario inicial</span>
            <span class="text-xs text-gray-400">{{ aperturaInventario.length }} líneas</span>
          </div>

          <div v-if="!modoReapertura">
            <div v-if="!aperturaInventario.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <PackagePlus class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="font-medium text-gray-700">Sin productos iniciales</p>
              <p class="mt-1 text-sm text-gray-500">Si hay un día anterior cerrado, se precarga el remanente de inventario.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, i) in aperturaInventario"
                :key="i"
                class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_36px]"
              >
                <select v-model="item.productoId" class="form-input">
                  <option :value="undefined">Seleccionar...</option>
                  <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                </select>
                <input v-model.number="item.cantidadInicial" class="form-input" type="number" min="0" placeholder="Cant." />
                <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="aperturaInventario.splice(i, 1)">
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside class="card" :class="modoReapertura ? 'bg-purple-50/60' : 'bg-blue-50/60'">
          <p class="text-xs font-bold uppercase" :class="modoReapertura ? 'text-purple-600' : 'text-blue-500'">
            {{ modoReapertura ? 'Reapertura' : 'Confirmación' }}
          </p>
          <h3 class="mt-1 font-semibold text-gray-800">
            {{ modoReapertura ? 'Reabrir jornada' : 'Abrir planta' }}
          </h3>
          <p class="mt-2 text-sm text-gray-500">
            {{ modoReapertura 
              ? 'Los datos del cierre anterior se restauran. Continuarás con la misma numeración de consecutivos.'
              : 'Al abrir la jornada se habilitan pedidos, rutas, ventas y cierre. Se arrastra inventario y caja del último día cerrado.'
            }}
          </p>

          <div v-if="!modoReapertura" class="mt-5 space-y-3">
            <FormField label="Saldo inicial ($)">
              <input v-model.number="aperturaSaldoInicial" class="form-input" type="number" min="0" />
              <p v-if="remanenteOrigen && aperturaSaldoInicial > 0" class="mt-1 text-xs text-blue-600">
                Sugerido desde cierre del {{ remanenteOrigen }}
              </p>
            </FormField>
          </div>

          <button
            class="btn-primary inline-flex w-full items-center justify-center gap-2 mt-5"
            :disabled="savingApertura || (modoReapertura ? false : !remanenteOrigen && !aperturaInventario.some(i => i.productoId))"
            @click="abrirDia"
          >
            <CalendarDays class="h-4 w-4" />
            {{ savingApertura ? (modoReapertura ? 'Reabriendo...' : 'Abriendo...') : (modoReapertura ? 'Reabrir jornada' : 'Abrir jornada') }}
          </button>
        </aside>
      </section>

      <section v-else class="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div class="space-y-5">
          <div class="card">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Resumen</p>
                <h2 class="mt-1 font-semibold text-gray-800">Jornada del {{ formatDate(fechaSeleccionada) }}</h2>
                <p class="mt-2 text-sm text-gray-500">
                  Saldo inicial: {{ formatCurrency(estado.apertura?.saldoInicial ?? 0) }}
                </p>
                <p v-if="estado.apertura?.createdAt" class="mt-1 text-xs text-gray-400">
                  Apertura: {{ formatDateTime(estado.apertura.createdAt) }}
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="estado.cierre ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'"
              >
                {{ estado.cierre ? 'Cerrada' : 'Abierta' }}
              </span>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Inventario inicial</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ inventarioInicialTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Produccion usable</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ produccionUsableTotal }}</p>
                <p class="mt-1 text-[11px] text-gray-500">Inicial {{ inventarioInicialTotal }} + día {{ produccionDiaTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Filtradas</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ produccionFiltradaTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Reempacadas</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ produccionReempacadaTotal }}</p>
              </div>
              <div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs font-bold uppercase text-gray-400">Merma</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ produccionMermaTotal }}</p>
              </div>
            </div>

            <div v-if="produccionRegistrada.length" class="mt-4 overflow-hidden rounded-lg border border-gray-100">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th class="px-3 py-2 font-medium">Producto</th>
                    <th class="px-3 py-2 text-right font-medium">Usable</th>
                    <th class="px-3 py-2 text-right font-medium">Filtradas</th>
                    <th class="px-3 py-2 text-right font-medium">Reempacadas</th>
                    <th class="px-3 py-2 text-right font-medium">Merma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in produccionRegistrada" :key="item.id" class="border-t border-gray-100">
                    <td class="px-3 py-2 font-medium text-gray-800">
                      <div class="flex items-center gap-2">
                        <span>{{ item.producto?.nombre ?? productoNombre(item.productoId) }}</span>
                        <ProductUnitBadge :categoria="item.producto?.categoria" :unidad="item.producto?.unidad" />
                      </div>
                    </td>
                    <td class="px-3 py-2 text-right">{{ formatQuantity(Number(item.cantidad ?? 0)) }}</td>
                    <td class="px-3 py-2 text-right">{{ formatQuantity(Number(item.cantidadFiltrada ?? 0)) }}</td>
                    <td class="px-3 py-2 text-right">{{ formatQuantity(Number(item.cantidadReempacada ?? 0)) }}</td>
                    <td class="px-3 py-2 text-right text-red-600">{{ formatQuantity(Number(item.cantidadMerma ?? 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Paso 1.5</p>
                <h2 class="mt-1 font-semibold text-gray-800">Registrar pacas filtradas (salida de inventario)</h2>
                <p class="mt-1 text-sm text-gray-500">Registra pacas que se descartaron o limpiaron. Estas pacas se descuentan del inventario; no se consideran producción.</p>
              </div>
              <button
                v-if="!estado.cierre"
                class="btn-secondary inline-flex items-center gap-1 text-xs"
                @click="agregarFiltrada"
              >
                <Plus class="h-4 w-4" />
                Añadir
              </button>
            </div>

            <div v-if="!filtradaItems.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
              <PackagePlus class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="font-medium text-gray-700">Sin pacas filtradas pendientes</p>
              <p class="mt-1 text-sm text-gray-500">Usa Añadir para registrar pacas filtradas que deben salir del inventario.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, i) in filtradaItems"
                :key="i"
                class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_36px]"
              >
                <select v-model="item.productoId" class="form-input">
                  <option :value="undefined">Seleccionar...</option>
                  <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                </select>
                <input v-model.number="item.cantidadFiltrada" class="form-input" type="number" min="1" placeholder="Filtradas" />
                <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="filtradaItems.splice(i, 1)">
                  ×
                </button>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-3">
              <button
                class="btn-primary inline-flex items-center gap-2"
                :disabled="savingFiltrada || !filtradaItemsValidos.length"
                @click="registrarFiltradasUI"
              >
                <Droplets class="h-4 w-4" />
                {{ savingFiltrada ? 'Guardando...' : 'Registrar filtradas' }}
              </button>
              <button class="text-xs text-gray-400" @click="cargarFilttradasPendientes(fechaSeleccionada)">Cargar filtradas pendientes</button>
            </div>
          </div>

          <div class="card">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Paso 2</p>
                <h2 class="mt-1 font-semibold text-gray-800">Registrar producción</h2>
                <p class="mt-1 text-sm text-gray-500">Agrega lo fabricado antes de cerrar la jornada.</p>
              </div>
              <button
                v-if="!estado.cierre"
                class="btn-secondary inline-flex items-center gap-1 text-xs"
                @click="agregarProduccion"
              >
                <Plus class="h-4 w-4" />
                Añadir
              </button>
            </div>

            <div v-if="estado.cierre" class="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              El día ya está cerrado. Producción bloqueada.
            </div>

            <div v-else>
              <div v-if="!produccionItems.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
                <Factory class="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p class="font-medium text-gray-700">Aún no has agregado producción</p>
                <p class="mt-1 text-sm text-gray-500">Usa Añadir para cargar producto y cantidad producida.</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(item, i) in produccionItems"
                  :key="i"
                  class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_36px]"
                >
                  <select v-model="item.productoId" class="form-input">
                    <option :value="undefined">Seleccionar...</option>
                    <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                  </select>
                  <input v-model.number="item.cantidad" class="form-input" type="number" min="1" placeholder="Cant." />
                  <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="produccionItems.splice(i, 1)">
                    ×
                  </button>
                </div>
              </div>

              <div class="mt-4 flex items-center gap-3">
                <button
                  class="btn-primary inline-flex items-center gap-2"
                  :disabled="savingProduccion || !produccionItems.some(i => i.productoId && i.cantidad > 0)"
                  @click="registrarProduccion"
                >
                  <ClipboardList class="h-4 w-4" />
                  {{ savingProduccion ? 'Guardando...' : 'Guardar producción' }}
                </button>
                <span v-if="produccionRegistrada.length" class="text-xs text-gray-400">
                  {{ produccionRegistrada.length }} registros guardados
                </span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-gray-400">Reempaque</p>
                <h2 class="mt-1 font-semibold text-gray-800">Pacas filtradas</h2>
                <p class="mt-1 text-sm text-gray-500">Registra cuantas pacas se revisaron y cuantas volvieron al inventario usable.</p>
              </div>
              <button
                v-if="!estado.cierre"
                class="btn-secondary inline-flex items-center gap-1 text-xs"
                @click="agregarReempaque"
              >
                <Plus class="h-4 w-4" />
                Añadir
              </button>
            </div>

            <div v-if="estado.cierre" class="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              El dia ya esta cerrado. Reempaque bloqueado.
            </div>
            <div v-else>
              <div v-if="!reempaqueItems.length" class="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
                <RefreshCw class="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p class="font-medium text-gray-700">Sin reempaque pendiente</p>
                <p class="mt-1 text-sm text-gray-500">No es necesario registrar producción para reempaque. Carga las "Filtradas pendientes" o añade manualmente.</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(item, i) in reempaqueItems"
                  :key="i"
                  class="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_130px_1fr_36px]"
                >
                  <div>
                    <select v-model="item.productoId" class="form-input">
                      <option :value="undefined">Seleccionar...</option>
                      <option v-for="p in productosConProduccion" :key="p.productoId" :value="p.productoId">
                        {{ p.nombre }} - filt. {{ produccionRegistrada.find((x: any) => x.productoId === p.productoId)?.cantidadFiltrada ?? 0 }}
                      </option>
                    </select>
                  </div>
                  <input v-model.number="item.cantidadReempacada" class="form-input" type="number" min="0" placeholder="Reempacadas" />
                  <input v-model="item.observaciones" class="form-input" type="text" placeholder="Observaciones" />
                  <button class="rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" @click="reempaqueItems.splice(i, 1)">
                    ×
                  </button>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-3">
                <button
                  class="btn-primary inline-flex items-center gap-2"
                  :disabled="savingReempaque || !reempaqueItemsValidos.length"
                  @click="registrarReempaque"
                >
                  <RefreshCw class="h-4 w-4" />
                  {{ savingReempaque ? 'Guardando...' : 'Guardar reempaque' }}
                </button>
                <span v-if="reempaqueItemsValidos.length" class="text-xs text-gray-400">
                  Merma calculada: {{ reempaqueMermaPendiente }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside v-if="!estado.cierre" class="card">
          <div class="mb-4">
            <p class="text-xs font-bold uppercase text-gray-400">Paso 3</p>
            <h2 class="mt-1 font-semibold text-gray-800">Cerrar jornada</h2>
            <p class="mt-1 text-sm text-gray-500">Verifica caja e inventario final antes de bloquear operaciones.</p>
          </div>

          <div class="mb-4 rounded-lg border p-3" :class="cierreBloqueado ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'">
            <div class="flex items-start gap-2">
              <component :is="cierreBloqueado ? AlertTriangle : CheckCircle2" class="mt-0.5 h-4 w-4" :class="cierreBloqueado ? 'text-amber-700' : 'text-green-700'" />
              <div>
                <p class="text-sm font-semibold" :class="cierreBloqueado ? 'text-amber-800' : 'text-green-700'">
                  {{ cierreBloqueado ? 'Faltan validaciones' : 'Listo para cerrar' }}
                </p>
                <p v-if="!cierreBloqueado" class="mt-0.5 text-xs text-green-700">Sin pedidos ni rutas abiertas.</p>
                <ul v-else class="mt-1 space-y-1 text-xs text-amber-700">
                  <li v-for="bloqueo in cierreBloqueos" :key="bloqueo">{{ bloqueo }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <FormField label="Saldo contado en caja ($)">
              <input v-model.number="cierreForm.saldoContado" class="form-input" type="number" min="0" />
            </FormField>
            <FormField label="Observaciones">
              <textarea v-model="cierreForm.observaciones" rows="2" class="form-input resize-none" />
            </FormField>
          </div>

          <div class="mt-5">
            <h3 class="mb-2 text-sm font-semibold text-gray-700">Conteo final de inventario</h3>
            <div v-if="!cierreInventario.length" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-400">
              Sin inventario inicial para contar.
            </div>
            <div v-else class="max-h-72 space-y-3 overflow-y-auto pr-1">
              <div v-for="item in cierreInventario" :key="item.productoId" class="grid grid-cols-[1fr_110px] gap-3 items-end">
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ item.nombre }}</p>
                  <p class="text-xs text-gray-400">Esperado: {{ item.cantidadEsperada }}</p>
                </div>
                <input v-model.number="item.cantidadContada" class="form-input" type="number" min="0" />
              </div>
            </div>
          </div>

          <div class="mt-5">
            <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Droplets class="h-4 w-4 text-blue-600" />
              Tanques de agua
            </h3>
            <div class="space-y-3">
              <div v-for="tanque in tanquesAgua" :key="tanque.nombre" class="grid grid-cols-[1fr_110px] gap-3 items-end">
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ tanque.nombre }}</p>
                  <p class="text-xs text-gray-400">Litros al cierre</p>
                </div>
                <input v-model.number="tanque.litros" class="form-input" type="number" min="0" />
              </div>
            </div>
          </div>

          <button
            class="btn-danger mt-5 w-full"
            :disabled="savingCierre || cierreBloqueado"
            @click="cerrarDia"
          >
            {{ savingCierre ? 'Cerrando...' : 'Cerrar jornada' }}
          </button>
        </aside>

        <aside v-if="!estado.cierre && modoReapertura" class="card bg-purple-50 border border-purple-200">
          <div class="rounded-lg border border-purple-100 bg-white p-4 mb-4">
            <div class="flex items-start gap-3">
              <CheckCircle2 class="h-5 w-5 text-purple-700 mt-0.5" />
              <div>
                <p class="text-sm font-semibold text-purple-700">Reapertura del mismo día</p>
                <p class="mt-1 text-xs text-purple-600">
                  Todos los registros operativos se han preservado: pedidos, rutas, producción, ventas, caja e inventario están intactos.
                </p>
                <p class="mt-2 text-xs text-purple-600">
                  Los consecutivos continúan desde donde se quedaron.
                </p>
              </div>
            </div>
          </div>
          <div class="text-xs font-bold uppercase text-purple-600 mb-2">Estado de continuidad</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded p-2 bg-purple-100">
              <p class="text-purple-700 font-semibold">{{ produccionRegistrada.length }}</p>
              <p class="text-purple-600">Registros producción</p>
            </div>
            <div class="rounded p-2 bg-purple-100">
              <p class="text-purple-700 font-semibold">{{ estado.pedidosPendientes }}</p>
              <p class="text-purple-600">Pedidos pendientes</p>
            </div>
            <div class="rounded p-2 bg-purple-100">
              <p class="text-purple-700 font-semibold">{{ estado.rutasAbiertas }}</p>
              <p class="text-purple-600">Rutas abiertas</p>
            </div>
            <div class="rounded p-2 bg-purple-100">
              <p class="text-purple-700 font-semibold">{{ estado.ventasHoy ?? 0 }}</p>
              <p class="text-purple-600">Ventas del día</p>
            </div>
          </div>
          <p class="mt-4 text-xs text-purple-600">
            Continúa con tu operación. Recuerda: solo se puede abrir una nueva jornada cuando cambie la fecha.
          </p>
        </aside>

        <aside v-else-if="estado.cierre" class="card">
          <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p class="text-xs font-bold uppercase text-gray-400">Jornada cerrada</p>
            <p v-if="estado.cierre?.createdAt" class="mt-2 text-sm text-gray-600">
              Cierre: {{ formatDateTime(estado.cierre.createdAt) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">Puedes consultar el historial operativo abajo.</p>
          </div>
          <div class="mt-4 space-y-2">
            <button v-if="!reopening" class="btn-primary w-full" @click="reopening = true">
              Abrir nuevo día
            </button>
            <button v-if="!modoReapertura" class="btn-secondary w-full text-xs" @click="fetchEstado">
              Actualizar estado
            </button>
          </div>
        </aside>
      </section>

      <section class="card">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold text-gray-700">Historial</h2>
          <button class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline" @click="fetchHistorial">
            <RefreshCw class="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-xs uppercase text-gray-500">
              <th class="pb-2 font-medium">Fecha</th>
              <th class="pb-2 text-right font-medium">Saldo calculado</th>
              <th class="pb-2 text-right font-medium">Saldo contado</th>
              <th class="pb-2 text-center font-medium">Caja cuadrada</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in historial" :key="h.id" class="border-b border-gray-50">
              <td class="py-2">{{ formatDate(h.fecha) }}</td>
              <td class="py-2 text-right">{{ formatCurrency(h.cierreCaja?.saldoCalculado ?? 0) }}</td>
              <td class="py-2 text-right">{{ formatCurrency(h.cierreCaja?.saldoContado ?? 0) }}</td>
              <td class="py-2 text-center">{{ h.cajaCuadrada ? 'Sí' : 'No' }}</td>
            </tr>
            <tr v-if="!historial.length">
              <td colspan="4" class="py-4 text-center text-gray-400">Sin historial</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  Factory,
  LockKeyhole,
  PackagePlus,
  Plus,
  RefreshCw,
  Truck,
  WalletCards,
} from 'lucide-vue-next'
import { formatCurrency, formatDate, formatDateTime, formatQuantity, todayISO } from '~/utils/formats'
import { defaultTanquesAgua, mapTanquesCatalogo } from '~/utils/tanquesAgua'
import { useFiltradas } from '~/composables/useFiltradas'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const notify = useNotification()
const apiResponse = useApiResponse()
const route = useRoute()
const router = useRouter()

// Filtradas (ajustes de inventario)
const {
  filtradaItems,
  filtradasPendientes,
  savingFiltrada,
  loadingPendientes,
  filtradaItemsValidos,
  registrarFiltrada,
  cargarFilttradasPendientes,
  agregarFiltrada,
  limpiarFiltradas,
} = useFiltradas()

const hoy = todayISO()
const fechaSeleccionada = ref(typeof route.query.fecha === 'string' ? route.query.fecha : hoy)
const loadingEstado = ref(true)
const savingApertura = ref(false)
const savingProduccion = ref(false)
const savingReempaque = ref(false)
const savingCierre = ref(false)
const diaPendiente = ref<string | null>(null)
const remanenteOrigen = ref<string | null>(null)

const estado = ref<any>({ apertura: null, cierre: null, pedidosPendientes: 0, rutasAbiertas: 0 })
const reopening = ref(false)
const modoReapertura = ref(false) // Flag para indicar que está en modo reapertura
const historial = ref<any[]>([])
const productos = ref<any[]>([])
const aperturaInventario = ref<{ productoId: number | undefined; cantidadInicial: number }[]>([])
const aperturaSaldoInicial = ref(0)
const produccionItems = ref<{ productoId: number | undefined; cantidad: number }[]>([])
const reempaqueItems = ref<Array<{
  productoId: number | undefined
  cantidadFiltrada?: number
  cantidadReempacada: number
  observaciones: string
}>>([])
const cierreInventario = ref<{ productoId: number; nombre: string; cantidadEsperada: number; cantidadContada: number }[]>([])
const tanquesAgua = ref(defaultTanquesAgua())
const cierreForm = reactive({ saldoContado: 0, observaciones: '' })

const jornadaState = computed(() => {
  if (!estado.value.apertura) {
    return {
      icon: CalendarDays,
      badge: 'Sin iniciar',
      title: 'Jornada sin iniciar',
      description: 'Registra saldo e inventario inicial para abrir la operación del día.',
      wrapperClass: 'border-blue-200 bg-blue-50',
      iconClass: 'bg-blue-100 text-blue-700',
      badgeClass: 'bg-blue-100 text-blue-700',
    }
  }

  if (modoReapertura.value) {
    return {
      icon: CheckCircle2,
      badge: 'Reabierta',
      title: 'Jornada reabierta - mismo día',
      description: 'Se recuperó el estado operativo del cierre. Todos los registros permanecen intactos.',
      wrapperClass: 'border-purple-200 bg-purple-50',
      iconClass: 'bg-purple-100 text-purple-700',
      badgeClass: 'bg-purple-100 text-purple-700',
    }
  }

  if (estado.value.cierre) {
    return {
      icon: LockKeyhole,
      badge: 'Cerrada',
      title: 'Jornada cerrada',
      description: 'El día quedó liquidado y las operaciones están bloqueadas.',
      wrapperClass: 'border-gray-200 bg-white',
      iconClass: 'bg-gray-100 text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-600',
    }
  }

  return {
    icon: CheckCircle2,
    badge: 'Abierta',
    title: 'Jornada activa',
    description: 'Pedidos, rutas y ventas están habilitados. Mantén producción y cierre al día.',
    wrapperClass: 'border-green-200 bg-green-50',
    iconClass: 'bg-green-100 text-green-700',
    badgeClass: 'bg-green-100 text-green-700',
  }
})

const jornadaStats = computed(() => [
  {
    icon: CalendarDays,
    label: 'Apertura',
    value: estado.value.apertura ? 'Registrada' : 'Sin abrir',
    iconClass: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Clock3,
    label: 'Cierre',
    value: !estado.value.apertura ? 'Sin iniciar' : (estado.value.cierre ? 'Registrado' : 'Pendiente'),
    iconClass: estado.value.cierre ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
  },
  {
    icon: ClipboardList,
    label: 'Pedidos',
    value: String(estado.value.pedidosPendientes ?? 0),
    iconClass: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Truck,
    label: 'Rutas',
    value: String(estado.value.rutasAbiertas ?? 0),
    iconClass: 'bg-red-100 text-red-700',
  },
])

const produccionRegistrada = computed(() => estado.value?.apertura?.producciondiaria ?? [])
const inventarioInicialTotal = computed(() => {
  const inventarios = estado.value?.apertura?.inventariosInicial ?? []
  return inventarios.reduce((sum: number, item: any) => sum + Number(item.cantidadInicial ?? 0), 0)
})
const produccionDiaTotal = computed(() =>
  produccionRegistrada.value.reduce((sum: number, item: any) => sum + Number(item.cantidad ?? item.cantidadProducida ?? 0), 0),
)
const produccionUsableTotal = computed(() =>
  inventarioInicialTotal.value + produccionDiaTotal.value,
)
const produccionTotal = produccionUsableTotal
const produccionFiltradaTotal = computed(() =>
  produccionRegistrada.value.reduce((sum: number, item: any) => sum + Number(item.cantidadFiltrada ?? 0), 0),
)
const produccionReempacadaTotal = computed(() =>
  produccionRegistrada.value.reduce((sum: number, item: any) => sum + Number(item.cantidadReempacada ?? 0), 0),
)
const produccionMermaTotal = computed(() =>
  produccionRegistrada.value.reduce((sum: number, item: any) => sum + Number(item.cantidadMerma ?? 0), 0),
)
const productosConProduccion = computed(() => {
  const map = new Map<number, { productoId: number; nombre: string; cantidad: number }>()

  for (const item of estado.value?.apertura?.inventariosInicial ?? []) {
    const cantidad = Number(item.cantidadInicial ?? 0)
    if (cantidad <= 0) continue
    map.set(item.productoId, {
      productoId: item.productoId,
      nombre: item.producto?.nombre ?? productoNombre(item.productoId),
      cantidad,
    })
  }

  for (const item of produccionRegistrada.value) {
    const cantidadDia = Number(item.cantidad ?? 0)
    const existente = map.get(item.productoId)
    if (existente) {
      existente.cantidad += cantidadDia
      continue
    }
    if (cantidadDia <= 0) continue
    map.set(item.productoId, {
      productoId: item.productoId,
      nombre: item.producto?.nombre ?? productoNombre(item.productoId),
      cantidad: cantidadDia,
    })
  }

  return [...map.values()].filter((item) => item.cantidad > 0)
})
const reempaqueItemsValidos = computed(() =>
  reempaqueItems.value.filter(
    item =>
      item.productoId &&
      Number(item.cantidadFiltrada ?? 0) > 0 &&
      Number(item.cantidadReempacada ?? 0) >= 0,
  ),
)
const reempaqueMermaPendiente = computed(() =>
  reempaqueItemsValidos.value.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.cantidadFiltrada ?? 0) - Number(item.cantidadReempacada ?? 0)),
    0,
  ),
)
const esReaperturaMismoDia = computed(() =>
  reopening.value && estado.value.apertura && estado.value.cierre,
)
const cierreBloqueos = computed(() => {
  const bloqueos: string[] = []
  const pedidos = Number(estado.value.pedidosPendientes ?? 0)
  const rutas = Number(estado.value.rutasAbiertas ?? 0)
  if (pedidos > 0) bloqueos.push(`${pedidos} pedidos pendientes`)
  if (rutas > 0) bloqueos.push(`${rutas} rutas abiertas`)
  return bloqueos
})
const cierreBloqueado = computed(() => cierreBloqueos.value.length > 0)

function syncCierreInventario() {
  const inventarios = estado.value?.apertura?.inventariosInicial ?? []
  const produccion = estado.value?.apertura?.producciondiaria ?? []
  const map = new Map<number, { productoId: number; nombre: string; cantidadEsperada: number }>()

  for (const item of inventarios) {
    map.set(item.productoId, {
      productoId: item.productoId,
      nombre: item.producto?.nombre ?? `Producto ${item.productoId}`,
      cantidadEsperada: Number(item.cantidadInicial ?? 0),
    })
  }

  for (const item of produccion) {
    const existente = map.get(item.productoId)
    const cantidadDia = Number(item.cantidad ?? 0)
    if (existente) {
      existente.cantidadEsperada += cantidadDia
      continue
    }
    map.set(item.productoId, {
      productoId: item.productoId,
      nombre: item.producto?.nombre ?? `Producto ${item.productoId}`,
      cantidadEsperada: cantidadDia,
    })
  }

  cierreInventario.value = [...map.values()].map((item) => ({
    ...item,
    cantidadContada: item.cantidadEsperada,
  }))
}

function productoNombre(productoId: number | undefined) {
  return productos.value.find((producto) => producto.id === productoId)?.nombre ?? `Producto ${productoId ?? ''}`.trim()
}

function produccionDisponible(productoId: number | undefined) {
  const inv = estado.value?.apertura?.inventariosInicial?.find(
    (item: any) => item.productoId === productoId,
  )
  const prod = produccionRegistrada.value.find((item: any) => item.productoId === productoId)
  const inventarioInicial = Number(inv?.cantidadInicial ?? 0)
  const produccionDia = Number(prod?.cantidad ?? 0)
  const filtradas = Number(prod?.cantidadFiltrada ?? 0)
  const reempacadas = Number(prod?.cantidadReempacada ?? 0)
  
  // Stock disponible = Inicial + Producción - (Filtradas + Reempacadas)
  return inventarioInicial + produccionDia - filtradas - reempacadas
}

function onFechaChange() {
  reopening.value = false
  modoReapertura.value = false
  router.replace({ path: '/operaciones/diario', query: { fecha: fechaSeleccionada.value } })
  fetchEstado()
}

function irACerrarDiaPendiente() {
  if (diaPendiente.value) {
    fechaSeleccionada.value = diaPendiente.value
    onFechaChange()
  }
}

async function fetchEstado() {
  loadingEstado.value = true
  try {
    const [estadoRes, diaPendienteRes] = await Promise.allSettled([
      api.get('/diario/estado', { params: { fecha: fechaSeleccionada.value } }),
      api.get('/diario/dia-abierto-pendiente', { params: { fecha: fechaSeleccionada.value } }),
    ])

    if (estadoRes.status === 'fulfilled') {
      estado.value = apiResponse.unwrap(estadoRes.value)
      const tieneOperaciones = 
        (estado.value.apertura?.producciondiaria?.length ?? 0) > 0 ||
        estado.value.pedidosPendientes > 0 ||
        estado.value.rutasAbiertas > 0

      modoReapertura.value = (
        !!estado.value.apertura &&
        (!!estado.value.cierre || tieneOperaciones) &&
        fechaSeleccionada.value === todayISO()
      )
    } else {
      throw estadoRes.reason
    }

    if (diaPendienteRes.status === 'fulfilled') {
      const pendiente = apiResponse.unwrap(diaPendienteRes.value) as any
      diaPendiente.value = pendiente?.fecha && pendiente.fecha !== fechaSeleccionada.value
        ? pendiente.fecha
        : null
    } else {
      diaPendiente.value = null
    }

    syncCierreInventario()
    await cargarInventarioRemanente()
  } catch (e: any) {
    const msg: string = e?.response?.data?.message ?? e?.message ?? ''
    const match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (e?.response?.status === 409 && match) {
      diaPendiente.value = match[1]
    } else {
      notify.error('Error al cargar estado del día')
    }
  } finally {
    loadingEstado.value = false
  }
}

async function fetchHistorial() {
  try {
    const res = await api.get('/diario/historial', { params: { limit: 10 } })
    historial.value = apiResponse.list(res)
  } catch {
    historial.value = []
    notify.error('Error al cargar el historial del día')
  }
}

async function cargarInventarioRemanente() {
  // Si está en modo reapertura o ya tiene apertura sin cierre, no cargar remanente
  if (modoReapertura.value || esReaperturaMismoDia.value || (estado.value.apertura && !estado.value.cierre && !reopening.value)) {
    remanenteOrigen.value = null
    return
  }

  // Si no está en fase de apertura, no cargar remanente
  if (estado.value.apertura && !(estado.value.cierre && reopening.value)) {
    remanenteOrigen.value = null
    return
  }

  try {
    const res = await api.get('/diario/inventario-remanente', {
      params: { fecha: fechaSeleccionada.value },
    })
    const data = apiResponse.unwrap(res) as any
    remanenteOrigen.value = data.fechaOrigen ?? null

    if (data.fechaOrigen) {
      if (Number(data.saldoInicial ?? 0) > 0) {
        aperturaSaldoInicial.value = Number(data.saldoInicial)
      }

      if (Array.isArray(data.items) && data.items.length) {
        const manual = new Map(
          aperturaInventario.value
            .filter((item) => item.productoId)
            .map((item) => [Number(item.productoId), item]),
        )

        aperturaInventario.value = data.items.map((item: any) => {
          const existente = manual.get(Number(item.productoId))
          return {
            productoId: Number(item.productoId),
            cantidadInicial: existente?.cantidadInicial ?? Number(item.cantidadInicial ?? 0),
          }
        })
      }
    }
  } catch {
    remanenteOrigen.value = null
  }
}

async function fetchProductos() {
  try {
    const res = await api.get('/catalogos/productos', { params: { activo: 'true', limit: 200 } })
    productos.value = apiResponse.list(res)
  } catch {
    productos.value = []
    notify.error('Error al cargar productos')
  }
}

async function fetchTanquesAgua() {
  try {
    const res = await api.get('/diario/tanques-agua')
    const tanques = apiResponse.list(res)
    tanquesAgua.value = mapTanquesCatalogo(tanques)
  } catch {
    tanquesAgua.value = defaultTanquesAgua()
  }
}

function agregarInventario() {
  aperturaInventario.value.push({ productoId: undefined, cantidadInicial: 0 })
}

function agregarProduccion() {
  produccionItems.value.push({ productoId: undefined, cantidad: 1 })
}

function agregarReempaque() {
  const primerProducto = productosConProduccion.value[0]?.productoId
  reempaqueItems.value.push({
    productoId: primerProducto,
    cantidadFiltrada: 1,
    cantidadReempacada: 1,
    observaciones: '',
  })
}

async function abrirDia() {
  savingApertura.value = true
  try {
    // Si ya existe apertura sin cierre, usar endpoint de reapertura
    const existeAperturaSinCierre = estado.value.apertura && !estado.value.cierre
    
    const endpoint = existeAperturaSinCierre ? '/diario/reapertura' : '/diario/apertura'
    const payload = existeAperturaSinCierre 
      ? undefined  // Reapertura no necesita payload adicional
      : {
          fecha: fechaSeleccionada.value,
          saldoInicial: aperturaSaldoInicial.value,
          inventario: aperturaInventario.value.filter(i => i.productoId).map(i => ({
            productoId: i.productoId,
            cantidadInicial: i.cantidadInicial,
          })),
          observaciones: `Apertura manual ${fechaSeleccionada.value}`,
        }

    const config = existeAperturaSinCierre 
      ? { params: { fecha: fechaSeleccionada.value } }
      : {}

    const response = await (
      payload
        ? api.post(endpoint, payload, config)
        : api.post(endpoint, {}, config)
    )

    const result = apiResponse.unwrap(response)
    
    if (existeAperturaSinCierre) {
      notify.success('Jornada reabierta - todos los datos operativos se preservan')
      modoReapertura.value = true
    } else {
      notify.success(remanenteOrigen.value
        ? `Día abierto con remanente del ${remanenteOrigen.value} (inventario y caja)`
        : 'Día abierto')
    }
    
    reopening.value = false
    aperturaInventario.value = []
    aperturaSaldoInicial.value = 0
    remanenteOrigen.value = null
    await fetchEstado()
  } catch (e: any) {
    const msg: string = e?.response?.data?.message ?? e?.message ?? ''
    const match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (e?.response?.status === 409 && match) {
      diaPendiente.value = match[1]
      notify.error(msg)
    } else {
      notify.error(msg || 'Error al abrir día')
    }
  } finally {
    savingApertura.value = false
  }
}

async function registrarProduccion() {
  savingProduccion.value = true
  try {
    await api.post('/diario/produccion', {
      items: produccionItems.value.filter(i => i.productoId && i.cantidad > 0).map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
      })),
    }, { params: { fecha: fechaSeleccionada.value } })
    notify.success('Producción registrada')
    produccionItems.value = []
    // Esperar a que estado se actualice COMPLETAMENTE antes de continuar
    await fetchEstado()
    // Pequeña pausa para asegurar que UI se sincroniza
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar producción')
  } finally {
    savingProduccion.value = false
  }
}

async function registrarFiltradasUI() {
  if (!filtradaItemsValidos.value.length) {
    notify.warning('Agrega al menos una paca filtrada')
    return
  }

  // Validar contra disponible calculado localmente
  const itemMayorDisponible = filtradaItemsValidos.value.find(
    item => Number(item.cantidadFiltrada ?? 0) > produccionDisponible(item.productoId),
  )
  if (itemMayorDisponible) {
    const disponible = produccionDisponible(itemMayorDisponible.productoId)
    const cantidad = Number(itemMayorDisponible.cantidadFiltrada ?? 0)
    const nombre = productoNombre(itemMayorDisponible.productoId)
    notify.error(`${nombre}: intenta filtrar ${cantidad} pero solo hay ${disponible} disponibles`)
    return
  }

  try {
    await registrarFiltrada(fechaSeleccionada.value)
    notify.success('Filtradas registradas')
    await Promise.all([
      fetchEstado(),
      cargarFilttradasPendientes(fechaSeleccionada.value),
    ])
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Error al registrar filtradas'
    notify.error(msg)
  }
}

async function registrarReempaque() {
  savingReempaque.value = true
  try {
    await api.post('/diario/produccion/reempaque', {
      items: reempaqueItemsValidos.value.map(item => ({
        productoId: item.productoId,
        cantidadReempacada: Number(item.cantidadReempacada ?? 0),
        observaciones: item.observaciones || undefined,
      })),
    }, { params: { fecha: fechaSeleccionada.value } })
    notify.success('Reempaque registrado')
    reempaqueItems.value = []
    await Promise.all([
      fetchEstado(),
      cargarFilttradasPendientes(fechaSeleccionada.value),
    ])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al registrar reempaque')
  } finally {
    savingReempaque.value = false
  }
}

async function cerrarDia() {
  savingCierre.value = true
  try {
    await api.post('/diario/cierre', {
      saldoContado: cierreForm.saldoContado,
      observaciones: cierreForm.observaciones,
      tanquesAgua: tanquesAgua.value.map(tanque => ({
        tanqueAguaId: tanque.id,
        nombre: tanque.nombre,
        litros: Number(tanque.litros ?? 0),
      })),
      inventario: cierreInventario.value.map(item => ({
        productoId: item.productoId,
        cantidadContada: item.cantidadContada,
      })),
    }, { params: { fecha: fechaSeleccionada.value } })
    notify.success('Día cerrado correctamente')
    diaPendiente.value = null
    tanquesAgua.value = defaultTanquesAgua()
    await Promise.all([fetchEstado(), fetchHistorial()])
  } catch (e: any) {
    notify.error(e?.response?.data?.message ?? 'Error al cerrar día')
  } finally {
    savingCierre.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchEstado(), fetchHistorial(), fetchProductos(), fetchTanquesAgua()])
})

watch(
  () => route.query.fecha,
  (fecha) => {
    if (typeof fecha === 'string' && fecha !== fechaSeleccionada.value) {
      fechaSeleccionada.value = fecha
      onFechaChange()
    }
  },
)
</script>
