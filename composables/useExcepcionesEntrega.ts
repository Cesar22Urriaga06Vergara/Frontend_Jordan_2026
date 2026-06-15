/**
 * useExcepcionesEntrega
 * Composable que gestiona excepciones en entregas con validaciones
 * Implementa validaciones de: no-entregado, mercancía incorrecta, cambio de ruta
 */

import { computed, ref } from 'vue';
import {
  validarMarcarEntregado,
  RAZONES_FALLO_ENTREGA,
  MENSAJES_ERROR,
} from '@/utils/reglas-negocio';

export interface ItemRuta {
  id: number;
  pedidoId: number;
  numero: string;
  cliente: string;
  estado: string;
  fueEntregado?: boolean;
  razonFallo?: string;
}

export function useExcepcionesEntrega() {
  const itemsRuta = ref<ItemRuta[]>([]);
  const validaciones = ref<Map<number, { valido: boolean; mensaje?: string }>>(
    new Map(),
  );

  /**
   * Validar cambio de estado a "entregado" o "no entregado"
   */
  const validarEstadoEntrega = (
    itemId: number,
    fueEntregado: boolean,
    razonFallo?: string,
  ): { valido: boolean; mensaje?: string } => {
    const resultado = validarMarcarEntregado(fueEntregado, razonFallo);
    validaciones.value.set(itemId, resultado);
    return resultado;
  };

  /**
   * Marcar como no entregado (obliga a seleccionar razón)
   */
  const marcarNoEntregado = (
    itemId: number,
    razonFallo: string,
  ): { exitoso: boolean; mensaje: string } => {
    if (!razonFallo || !RAZONES_FALLO_ENTREGA.includes(razonFallo)) {
      return {
        exitoso: false,
        mensaje: MENSAJES_ERROR.NO_ENTREGADO_SIN_RAZON,
      };
    }

    const item = itemsRuta.value.find((i) => i.id === itemId);
    if (item) {
      item.fueEntregado = false;
      item.razonFallo = razonFallo;
      validaciones.value.set(itemId, { valido: true });
    }

    return {
      exitoso: true,
      mensaje: `Pedido ${item?.numero} marcado como no entregado por: ${razonFallo}`,
    };
  };

  /**
   * Marcar como entregado
   */
  const marcarEntregado = (itemId: number): { exitoso: boolean; mensaje: string } => {
    const item = itemsRuta.value.find((i) => i.id === itemId);
    if (item) {
      item.fueEntregado = true;
      item.razonFallo = undefined;
      validaciones.value.set(itemId, { valido: true });
    }

    return {
      exitoso: true,
      mensaje: `Pedido ${item?.numero} marcado como entregado`,
    };
  };

  /**
   * Registrar excepción de mercancía incorrecta
   */
  const registrarMercanciaIncorrecta = (
    itemId: number,
    descripcionIncorrecta: string,
  ): { exitoso: boolean; mensaje: string } => {
    const item = itemsRuta.value.find((i) => i.id === itemId);
    if (!item) {
      return {
        exitoso: false,
        mensaje: 'Item no encontrado',
      };
    }

    // Marcar como excepción
    item.estado = 'MERCANCIA_INCORRECTA';

    return {
      exitoso: true,
      mensaje: `Excepcion registrada: mercancia incorrecta ("${descripcionIncorrecta}"). Requiere gestion manual (nota de credito o ajuste operativo).`,
    };
  };

  /**
   * Obtener razones de fallo disponibles
   */
  const obtenerRazonesFallo = (): Array<{ valor: string; label: string }> => {
    return RAZONES_FALLO_ENTREGA.map((razon) => ({
      valor: razon,
      label: razon
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' '),
    }));
  };

  /**
   * Validar que no se guarde si hay excepciones sin resolver
   */
  const tieneExcepcionesPendientes = computed(() => {
    return itemsRuta.value.some((item) => {
      const validacion = validaciones.value.get(item.id);
      return validacion && !validacion.valido;
    });
  });

  /**
   * Cargar items de ruta
   */
  const cargarItems = (items: ItemRuta[]) => {
    itemsRuta.value = items;
    validaciones.value.clear();
  };

  /**
   * Limpiar
   */
  const limpiar = () => {
    itemsRuta.value = [];
    validaciones.value.clear();
  };

  return {
    itemsRuta,
    validaciones,
    validarEstadoEntrega,
    marcarNoEntregado,
    marcarEntregado,
    registrarMercanciaIncorrecta,
    obtenerRazonesFallo,
    tieneExcepcionesPendientes,
    cargarItems,
    limpiar,
  };
}
