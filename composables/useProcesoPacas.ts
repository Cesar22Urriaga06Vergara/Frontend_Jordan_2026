/**
 * useProcesoPacas
 * Composable que gestiona el filtrado y reempacado de pacas
 * Implementa validaciones de balance y auditoría
 */

import { computed, ref } from 'vue';
import {
  calcularBalancePacas,
  validarBalancePacas,
  RAZONES_AJUSTE_PACAS,
  esObligatorioNotasAjuste,
  MENSAJES_ERROR,
} from '@/utils/reglas-negocio';

export interface ProcesoPacas {
  id?: number;
  numero?: string;
  loteInicial: string;
  pacasIniciales: number;
  pacasDescartadas: number;
  pacasReempacadas: number;
  pacasFinales: number;
  observaciones?: string;
}

export interface Ajuste {
  pacasAntes: number;
  pacasAhora: number;
  razon: string;
  notasAjuste: string;
}

export function useProcesoPacas() {
  const proceso = ref<ProcesoPacas>({
    loteInicial: '',
    pacasIniciales: 0,
    pacasDescartadas: 0,
    pacasReempacadas: 0,
    pacasFinales: 0,
  });

  const ajustes = ref<Ajuste[]>([]);
  const validacionBalance = ref<{ valido: boolean; mensaje?: string }>({ valido: true });

  /**
   * Calcular balance dinámico
   */
  const balanceEsperado = computed(() => {
    return calcularBalancePacas(
      proceso.value.pacasIniciales,
      proceso.value.pacasDescartadas,
      proceso.value.pacasReempacadas,
    );
  });

  /**
   * Discrepancia si existe
   */
  const tieneDiscrepancia = computed(() => {
    return proceso.value.pacasFinales !== balanceEsperado.value;
  });

  /**
   * Validar balance completo
   */
  const validarBalance = (): { valido: boolean; mensaje?: string; balanceEsperado?: number } => {
    const resultado = validarBalancePacas(
      proceso.value.pacasIniciales,
      proceso.value.pacasDescartadas,
      proceso.value.pacasReempacadas,
      proceso.value.pacasFinales,
    );
    validacionBalance.value = resultado;
    return resultado;
  };

  /**
   * Notas de ajuste son obligatorias si hay discrepancia
   */
  const notasObligatorias = computed(() => {
    return esObligatorioNotasAjuste(
      proceso.value.pacasFinales,
      balanceEsperado.value,
    );
  });

  /**
   * Agregar un ajuste a la bitácora
   */
  const agregarAjuste = (ajuste: Ajuste): { exitoso: boolean; mensaje: string } => {
    // Validar que si hay discrepancia, notasAjuste no está vacío
    if (esObligatorioNotasAjuste(ajuste.pacasAntes, ajuste.pacasAhora)) {
      if (!ajuste.notasAjuste || ajuste.notasAjuste.trim().length === 0) {
        return {
          exitoso: false,
          mensaje: MENSAJES_ERROR.PACAS_DISCREPANCIA,
        };
      }
    }

    ajustes.value.push(ajuste);
    return {
      exitoso: true,
      mensaje: `Ajuste registrado: ${ajuste.pacasAntes} → ${ajuste.pacasAhora} (${ajuste.razon})`,
    };
  };

  /**
   * Obtener razones de ajuste disponibles
   */
  const obtenerRazonesAjuste = () => RAZONES_AJUSTE_PACAS;

  /**
   * Actualizar datos del proceso
   */
  const actualizarProceso = (datos: Partial<ProcesoPacas>) => {
    Object.assign(proceso.value, datos);
  };

  /**
   * Validar que el proceso es completable
   */
  const esCompletable = computed(() => {
    const validacion = validarBalance();
    return validacion.valido;
  });

  /**
   * Obtener resumen del proceso
   */
  const obtenerResumen = () => ({
    lote: proceso.value.loteInicial,
    inicial: proceso.value.pacasIniciales,
    descartadas: proceso.value.pacasDescartadas,
    reempacadas: proceso.value.pacasReempacadas,
    finales: proceso.value.pacasFinales,
    balanceEsperado: balanceEsperado.value,
    tieneDiscrepancia: tieneDiscrepancia.value,
    ajustesRegistrados: ajustes.value.length,
  });

  /**
   * Reiniciar formulario
   */
  const reiniciar = () => {
    proceso.value = {
      loteInicial: '',
      pacasIniciales: 0,
      pacasDescartadas: 0,
      pacasReempacadas: 0,
      pacasFinales: 0,
    };
    ajustes.value = [];
    validacionBalance.value = { valido: true };
  };

  return {
    proceso,
    ajustes,
    balanceEsperado,
    tieneDiscrepancia,
    notasObligatorias,
    validacionBalance,
    esCompletable,
    validarBalance,
    agregarAjuste,
    obtenerRazonesAjuste,
    actualizarProceso,
    obtenerResumen,
    reiniciar,
  };
}
