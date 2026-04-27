/**
 * Composable para imprimir tickets de pedidos en impresoras térmica POS (80mm)
 */

let _empresaCache: { nombre: string; nit?: string; direccion?: string; ciudad?: string; telefono?: string; slogan?: string } | null = null

export function usePrintTicket() {
  const api = useApi()

  async function _getEmpresa() {
    if (_empresaCache) return _empresaCache
    try {
      const res = await api.get('/configuracion/empresa')
      const d = (res.data?.data ?? res.data) as any
      _empresaCache = {
        nombre: d?.nombre || 'Mi Empresa',
        nit: d?.nit ?? null,
        direccion: d?.direccion ?? null,
        ciudad: d?.ciudad ?? null,
        telefono: d?.telefono ?? null,
        slogan: d?.slogan ?? null,
      }
    } catch {
      _empresaCache = { nombre: 'Mi Empresa' }
    }
    return _empresaCache!
  }

  function _formatCOP(value: number): string {
    return `$${value.toLocaleString('es-CO')}`
  }

  function _formatFecha(fecha: string | undefined): string {
    if (!fecha) return '—'
    const d = new Date(fecha.includes('T') ? fecha : fecha + 'T12:00:00')
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  async function imprimirPedido(pedido: any) {
    const empresa = await _getEmpresa()
    const numero = pedido.numeroPedido ?? pedido.numero ?? `#${pedido.id}`
    const cliente = pedido.cliente?.nombre ?? '—'
    const fechaStr = _formatFecha(pedido.fechaPedido ?? pedido.fecha)
    const detalles: any[] = pedido.detalles ?? []
    const observaciones: string = pedido.observaciones ?? ''

    const total = detalles.reduce((acc: number, d: any) => {
      return acc + Number(d.subtotal ?? (Number(d.cantidad) * Number(d.precioUnitario)))
    }, 0)

    const filasProductos = detalles.map((d: any) => {
      const nombre = d.producto?.nombre ?? `Prod.${d.productoId}`
      const cant = Number(d.cantidad)
      const precio = Number(d.precioUnitario)
      const sub = Number(d.subtotal ?? cant * precio)
      return `
        <tr>
          <td style="padding:2px 2px;word-break:break-word">${nombre}</td>
          <td style="padding:2px 2px;text-align:center;white-space:nowrap">${cant}</td>
          <td style="padding:2px 2px;text-align:right;white-space:nowrap">${_formatCOP(precio)}</td>
          <td style="padding:2px 6px 2px 2px;text-align:right;white-space:nowrap;font-weight:600">${_formatCOP(sub)}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pedido ${numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: 80mm auto;
      margin: 4mm 2mm;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      width: 76mm;
      color: #000;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .linea  { border-top: 1px dashed #000; margin: 5px 0; }
    .row    { display: flex; justify-content: space-between; margin: 1px 0; }
    table   { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th      { font-weight: bold; text-align: left; padding: 2px; border-bottom: 1px solid #000; }
    th:nth-child(2) { text-align:center; }
    th:nth-child(3), th:nth-child(4) { text-align:right; }
  </style>
</head>
<body>

  <div class="center bold" style="font-size:14pt;letter-spacing:1px">${empresa.nombre.toUpperCase()}</div>
  ${empresa.nit ? `<div class="center" style="font-size:8pt">NIT: ${empresa.nit}</div>` : ''}
  ${empresa.direccion || empresa.ciudad ? `<div class="center" style="font-size:8pt">${[empresa.direccion, empresa.ciudad].filter(Boolean).join(' — ')}</div>` : ''}
  ${empresa.telefono ? `<div class="center" style="font-size:8pt">Tel: ${empresa.telefono}</div>` : ''}
  ${empresa.slogan ? `<div class="center" style="font-size:8pt;font-style:italic;margin-top:2px">${empresa.slogan}</div>` : ''}

  <div class="linea"></div>

  <div class="row"><span>N°:</span><span class="bold">${numero}</span></div>
  <div class="row"><span>Fecha:</span><span>${fechaStr}</span></div>
  <div class="row"><span>Cliente:</span><span style="text-align:right;max-width:52mm">${cliente}</span></div>
  ${observaciones ? `<div class="row"><span>Obs:</span><span style="text-align:right;max-width:50mm">${observaciones}</span></div>` : ''}

  <div class="linea"></div>

  <table>
    <thead>
      <tr>
        <th style="width:38%">Producto</th>
        <th style="width:10%;text-align:center">Cant</th>
        <th style="width:24%;text-align:right">Precio</th>
        <th style="width:28%;text-align:right;padding-right:6px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${filasProductos}
    </tbody>
  </table>

  <div class="linea"></div>

  <div class="row bold" style="font-size:11pt">
    <span>TOTAL:</span>
    <span>${_formatCOP(total)}</span>
  </div>

  <div class="linea"></div>

  <div class="center" style="font-size:8pt;margin-top:6px">— Gracias por su compra —</div>
  <div class="center" style="font-size:7pt;margin-top:2px">Conserve este comprobante</div>

</body>
</html>`

    const win = window.open('', '_blank', 'width=320,height=500,scrollbars=no')
    if (!win) {
      alert('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para imprimir.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    // Pequeño delay para que el navegador termine de renderizar antes de imprimir
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }

  return { imprimirPedido }
}
