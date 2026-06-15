/**
 * useVentasRestricciones
 * Composable que gestiona las restricciones de edición en ventas
 * Implementa la regla de negocio de bloqueo en estados consolidados
 */

import { computed, ref } from 'vue';
import {
  ESTADOS_VENTA_BLOQUEADOS,
  puedeEditarVenta,
  puedeBorrarVenta,
  obtenerBotonesVenta,
} from '@/utils/reglas-negocio';

export interface Venta {
  id: number;
  numero: string;
  estado: string;
  totalVenta: number;
  [key: string]: any;
}

export function useVentasRestricciones() {
  const venta = ref<Venta | null>(null);

  /**
   * Validar si la venta está bloqueada
   */
  const estaBloqueada = computed(() => {
    return venta.value && ESTADOS_VENTA_BLOQUEADOS.includes(venta.value.estado);
  });

  /**
   * Obtener acciones disponibles
   */
  const accionesDisponibles = computed(() => {
    return venta.value ? obtenerBotonesVenta(venta.value.estado) : {};
  });

  /**
   * Determinar si puede editar
   */
  const puedeEditar = computed(() => {
    return venta.value ? puedeEditarVenta(venta.value.estado) : false;
  });

  /**
   * Determinar si puede eliminar
   */
  const puedeEliminar = computed(() => {
    return venta.value ? puedeBorrarVenta(venta.value.estado) : false;
  });

  /**
   * Obtener mensaje de estado
   */
  const mensajeEstado = computed(() => {
    if (!venta.value) return '';

    if (estaBloqueada.value) {
      return `Esta venta está en estado ${venta.value.estado} y está congelada para auditoría. ` +
        `Solo puede ver o imprimir. Para correcciones, use Nota de Crédito.`;
    }

    return `Estado actual: ${venta.value.estado}`;
  });

  /**
   * Cargar venta y aplicar restricciones
   */
  const cargarVenta = (ventaData: Venta) => {
    venta.value = ventaData;
  };

  /**
   * Limpiar
   */
  const limpiar = () => {
    venta.value = null;
  };

  return {
    venta,
    estaBloqueada,
    accionesDisponibles,
    puedeEditar,
    puedeEliminar,
    mensajeEstado,
    cargarVenta,
    limpiar,
  };
}
