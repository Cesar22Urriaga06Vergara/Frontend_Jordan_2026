/**
 * REGLAS DE NEGOCIO - VALIDACIÓN FRONTEND
 * 
 * Este archivo contiene las validaciones y reglas de negocio que deben
 * implementarse en el frontend para bloquear visualmente acciones no permitidas
 * según el estado de los registros.
 * 
 * IMPORTANTE: Estas validaciones son de UX. Las validaciones reales ocurren en backend.
 */

/**
 * MÓDULO 1: GESTIÓN DE VENTAS
 * 
 * REGLA 1: Bloqueo de edición en ventas consolidadas
 * Estados que BLOQUEAN edición: COMPLETADA, PAGADA, LIQUIDADA
 * Acciones permitidas: Ver, Imprimir
 */
export const ESTADOS_VENTA_BLOQUEADOS = ['COMPLETADA', 'PAGADA', 'LIQUIDADA'];

export function puedeEditarVenta(estadoVenta: string): boolean {
  return !ESTADOS_VENTA_BLOQUEADOS.includes(estadoVenta);
}

export function puedeBorrarVenta(estadoVenta: string): boolean {
  return !ESTADOS_VENTA_BLOQUEADOS.includes(estadoVenta);
}

export function obtenerBotonesVenta(estadoVenta: string) {
  return {
    ver: true,
    imprimir: true,
    editar: puedeEditarVenta(estadoVenta),
    eliminar: puedeBorrarVenta(estadoVenta),
    generarNotaCredito: ESTADOS_VENTA_BLOQUEADOS.includes(estadoVenta),
  };
}

/**
 * REGLA 2: Ordenamiento secuencial de pedidos
 * Los pedidos deben ordenarse ascendentemente por número
 */
export function ordenarPedidosAscendente<T>(
  pedidos: T[],
  getNumero: (item: T) => string = (item) => (item as { numero: string }).numero,
): T[] {
  return [...pedidos].sort((a, b) => {
    const numA = parseInt(getNumero(a).replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(getNumero(b).replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}

/**
 * Filtro en vivo para liquidación y listados operativos.
 * Coincide por número de pedido o nombre de cliente (sin acentos, case-insensitive).
 */
export function filtrarPedidosPorTexto<T>(
  pedidos: T[],
  query: string,
  getNumero: (item: T) => string = (item) => (item as { numero: string }).numero,
  getCliente: (item: T) => string = (item) =>
    (item as { clienteNombre?: string }).clienteNombre ?? '',
): T[] {
  const normalizar = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();

  const coincideTexto = (haystack: string, query: string): boolean => {
    if (!query) return true;
    if (haystack.includes(query)) return true;

    const tokens = haystack.split(/\s+/).filter((token) => token.length >= 2);
    return tokens.some((token) => {
      if (token.includes(query) || query.includes(token)) return true;
      const prefijo = Math.min(3, query.length, token.length);
      return prefijo >= 3 && query.slice(0, prefijo) === token.slice(0, prefijo);
    });
  };

  const q = normalizar(query);
  if (!q) return pedidos;

  return pedidos.filter((item) => {
    const numero = normalizar(getNumero(item));
    const cliente = normalizar(getCliente(item));
    return numero.includes(q) || coincideTexto(cliente, q);
  });
}

/**
 * REGLA 3: Validación de entrega
 * NO se puede marcar como ENTREGADO si no se especifica razón cuando falla
 */
export const RAZONES_FALLO_ENTREGA = [
  'CLIENTE_NO_DISPONIBLE',
  'CLIENTE_RECHAZA',
  'DIRECCION_INCORRECTA',
  'ENTREGA_PARCIAL',
  'REPROGRAMADA',
  'OTRO',
];

export function validarMarcarEntregado(
  fueEntregado: boolean,
  razonFallo?: string,
): { valido: boolean; mensaje?: string } {
  if (!fueEntregado && !razonFallo) {
    return {
      valido: false,
      mensaje:
        'Debe especificar el motivo de fallo de entrega cuando el pedido NO fue entregado',
    };
  }

  if (!fueEntregado && razonFallo && !RAZONES_FALLO_ENTREGA.includes(razonFallo)) {
    return {
      valido: false,
      mensaje: `Razón de fallo inválida. Debe ser una de: ${RAZONES_FALLO_ENTREGA.join(', ')}`,
    };
  }

  return { valido: true };
}

/**
 * MÓDULO 2: CONTROL DE INVENTARIO - PACAS
 * 
 * REGLA 4: Conservación de masa en reempacado
 * Balance esperado: Pacas Iniciales - Descartadas - Reempacadas = Finales
 */
export function calcularBalancePacas(
  iniciales: number,
  descartadas: number,
  reempacadas: number,
): number {
  return iniciales - descartadas - reempacadas;
}

export function validarBalancePacas(
  iniciales: number,
  descartadas: number,
  reempacadas: number,
  finales: number,
): { valido: boolean; mensaje?: string; balanceEsperado?: number } {
  const balanceEsperado = calcularBalancePacas(iniciales, descartadas, reempacadas);

  if (finales !== balanceEsperado) {
    return {
      valido: false,
      mensaje: `Discrepancia en pacas. Balance esperado: ${balanceEsperado}, ingresó: ${finales}. Debe especificar motivo en Notas de Ajuste.`,
      balanceEsperado,
    };
  }

  return { valido: true };
}

export const RAZONES_AJUSTE_PACAS = [
  { valor: 'MERMAS', label: 'Mermas (Pérdida de peso)' },
  { valor: 'PRODUCTO_DEFECTUOSO', label: 'Producto defectuoso' },
  { valor: 'DIVISION_UNIDADES', label: 'División de unidades' },
  { valor: 'ERROR_CONTEO', label: 'Error de conteo' },
  { valor: 'OTRO', label: 'Otro' },
];

export function esObligatorioNotasAjuste(pacasAntes: number, pacasAhora: number): boolean {
  return pacasAntes !== pacasAhora;
}

/**
 * MÓDULO 3: LOGÍSTICA Y RUTAS
 * 
 * REGLA 5: Excepción obligatoria en no-entrega
 */
export function validarExcepcionEntrega(
  tipoExcepcion: string,
  razonFallo?: string,
): { valido: boolean; mensaje?: string } {
  if (tipoExcepcion === 'NO_ENTREGADO' && !razonFallo) {
    return {
      valido: false,
      mensaje: 'El motivo de fallo de entrega es OBLIGATORIO cuando el tipo es NO_ENTREGADO',
    };
  }

  return { valido: true };
}

/**
 * REGLA 6: Reasignación de pedido
 * Permite cambiar dinámicamente el pedido a otra ruta
 */
export interface DataReasignacion {
  pedidoNumero: string;
  rutaOriginal: string;
  domiciliarioOriginal: string;
  rutaNueva: string;
  domiciliarioNuevo: string;
  motivo: string;
}

export function obtenerMensajeReasignacion(data: DataReasignacion): string {
  return `Reasignando pedido ${data.pedidoNumero} de ruta ${data.rutaOriginal} (${data.domiciliarioOriginal}) ` +
    `a ruta ${data.rutaNueva} (${data.domiciliarioNuevo}). Motivo: ${data.motivo}`;
}

/**
 * REGLA 7: Permisos por rol (UX — el backend es la fuente de verdad)
 *
 * Roles persistidos hoy: ADMIN, CONTADOR (ver /configuracion y DTOs de usuarios).
 * Todas las mutaciones críticas exigen @Roles('ADMIN') en el API; CONTADOR solo lectura.
 * Roles operativos (COORDINADOR_LOGISTICA, REPARTIDOR, etc.) quedan planificados en ROLES_PLANIFICADOS.
 */
export const ROL_MUTACION_REQUERIDO = 'ADMIN' as const;

export const PERMISOS_POR_ROL = {
  ADMIN: {
    ingresosPago: true,
    notasCredito: true,
    procesoPacas: true,
    excepciones: true,
    reasignaciones: true,
    liquidarRuta: true,
    ajusteInventario: true,
    diarioCaja: true,
  },
  CONTADOR: {
    ingresosPago: false,
    notasCredito: false,
    procesoPacas: false,
    excepciones: false,
    reasignaciones: false,
    liquidarRuta: false,
    ajusteInventario: false,
    diarioCaja: false,
  },
} as const;

/** Roles aspiracionales — no existen en BD ni en JWT hasta implementación futura. */
export const ROLES_PLANIFICADOS = {
  COORDINADOR_LOGISTICA: {
    ingresosPago: false,
    notasCredito: false,
    procesoPacas: false,
    excepciones: true,
    reasignaciones: true,
    liquidarRuta: false,
    ajusteInventario: false,
    diarioCaja: false,
  },
  REPARTIDOR: {
    ingresosPago: false,
    notasCredito: false,
    procesoPacas: false,
    excepciones: true,
    reasignaciones: false,
    liquidarRuta: false,
    ajusteInventario: false,
    diarioCaja: false,
  },
  GESTOR_INVENTARIO: {
    ingresosPago: false,
    notasCredito: false,
    procesoPacas: true,
    excepciones: false,
    reasignaciones: false,
    liquidarRuta: false,
    ajusteInventario: true,
    diarioCaja: false,
  },
} as const;

/**
 * VALIDADORES GENERALES
 */
export function tienePermiso(rol: string, accion: string): boolean {
  const permisos = PERMISOS_POR_ROL[rol as keyof typeof PERMISOS_POR_ROL];
  return permisos ? permisos[accion as keyof typeof permisos] === true : false;
}

/**
 * MENSAJES DE ERROR ESTANDARIZADOS
 */
export const MENSAJES_ERROR = {
  VENTA_BLOQUEADA:
    'Esta venta está en estado final y no se puede editar. Use Nota de Crédito para reversiones.',
  NO_ENTREGADO_SIN_RAZON:
    'Debe especificar la razón del fallo de entrega antes de marcar como no entregado.',
  PACAS_DISCREPANCIA:
    'Hay discrepancia en el balance de pacas. Especifique obligatoriamente el motivo en Notas de Ajuste.',
  SIN_PERMISO:
    'No tiene permiso para realizar esta acción con su rol actual.',
  EXCEPCION_INCOMPLETA:
    'Faltan datos requeridos para la excepción. Verifique que seleccionó el motivo si corresponde.',
};

/**
 * CONSTANTES DE VALIDACIÓN
 */
export const VALIDACION = {
  NUMERO_FACTURA_MIN_LONGITUD: 3,
  NOMBRE_CLIENTE_MIN_LONGITUD: 3,
  VALOR_MINIMO: 0.01,
  VALOR_MAXIMO: 999999999.99,
  PACAS_MINIMO: 1,
  PACAS_MAXIMO: 9999,
};
