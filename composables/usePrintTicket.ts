/**
 * Composable para imprimir comprobantes de pedidos en impresoras POS (80mm).
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
        nombre: d?.nombre || 'JORDAN',
        nit: d?.nit ?? null,
        direccion: d?.direccion ?? null,
        ciudad: d?.ciudad ?? null,
        telefono: d?.telefono ?? null,
        slogan: d?.slogan ?? null,
      }
    } catch {
      _empresaCache = { nombre: 'JORDAN' }
    }
    return _empresaCache!
  }

  function _escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function _formatCOP(value: number): string {
    return `$ ${Number(value ?? 0).toLocaleString('es-CO')}`
  }

  function _formatFecha(fecha: string | undefined): string {
    if (!fecha) return '-'
    const d = new Date(fecha.includes('T') ? fecha : `${fecha}T12:00:00`)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function _facturaPrincipal(pedido: any) {
    return Array.isArray(pedido.ventas) && pedido.ventas.length ? pedido.ventas[0] : null
  }

  function _estadoFactura(pedido: any) {
    const venta = _facturaPrincipal(pedido)
    if (!venta) return { numero: 'Sin factura', estado: 'SIN FACTURA', saldo: 0 }
    return {
      numero: venta.numero ?? 'Sin numero',
      estado: venta.estado ?? 'SIN ESTADO',
      saldo: Number(venta.saldoPendiente ?? 0),
    }
  }

  async function imprimirPedido(pedido: any) {
    const empresa = await _getEmpresa()
    const numero = pedido.numeroPedido ?? pedido.numero ?? `#${pedido.id}`
    const cliente = pedido.cliente?.nombre ?? '-'
    const fechaStr = _formatFecha(pedido.fechaPedido ?? pedido.fecha)
    const detalles: any[] = pedido.detalles ?? []
    const observaciones: string = pedido.observaciones ?? ''
    const factura = _estadoFactura(pedido)
    const logoUrl = `${window.location.origin}/LOGO.png`

    const total = detalles.reduce((acc: number, d: any) => {
      return acc + Number(d.subtotal ?? (Number(d.cantidad) * Number(d.precioUnitario)))
    }, 0)

    const filasProductos = detalles.map((d: any) => {
      const nombre = d.producto?.nombre ?? `Producto ${d.productoId}`
      const cant = Number(d.cantidad ?? 0)
      const precio = Number(d.precioUnitario ?? 0)
      const sub = Number(d.subtotal ?? cant * precio)
      return `
        <tr>
          <td class="product">
            <strong>${_escapeHtml(nombre)}</strong>
            <span>${cant} x ${_formatCOP(precio)}</span>
          </td>
          <td class="qty">${cant}</td>
          <td class="money">${_formatCOP(sub)}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pedido ${_escapeHtml(numero)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 80mm auto; margin: 4mm 3mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.6pt;
      line-height: 1.28;
      width: 74mm;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket { padding: 1mm 0; }
    .header { text-align: center; padding-bottom: 5px; border-bottom: 1px solid #d1d5db; }
    .logo { width: 18mm; height: 18mm; object-fit: contain; margin-bottom: 3px; }
    .company { font-size: 12.5pt; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; color: #0f172a; }
    .meta-small { font-size: 7.1pt; color: #374151; margin-top: 1px; }
    .pill {
      display: inline-block;
      margin-top: 5px;
      padding: 3px 7px;
      border: 1px solid #94a3b8;
      border-radius: 999px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .section { margin-top: 7px; padding-top: 6px; border-top: 1px dashed #94a3b8; }
    .section-title { font-size: 7.1pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #475569; margin-bottom: 4px; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .label { color: #64748b; white-space: nowrap; }
    .value { text-align: right; font-weight: 700; word-break: break-word; }
    .value.normal { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 8pt; }
    th { padding: 4px 2px; border-bottom: 1px solid #111827; font-size: 7pt; color: #475569; text-transform: uppercase; text-align: left; }
    td { padding: 5px 2px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .product strong { display: block; font-size: 8.2pt; color: #111827; }
    .product span { display: block; margin-top: 1px; font-size: 7pt; color: #64748b; }
    .qty { width: 10mm; text-align: center; font-weight: 700; }
    .money { width: 22mm; text-align: right; font-weight: 800; white-space: nowrap; }
    .total-box { margin-top: 7px; padding: 7px 0; border-top: 2px solid #111827; border-bottom: 2px solid #111827; }
    .total-box .label { font-size: 9pt; font-weight: 800; color: #111827; }
    .total-box .value { font-size: 13pt; color: #111827; }
    .note { margin-top: 5px; padding: 5px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 7.3pt; color: #374151; }
    .footer { margin-top: 8px; text-align: center; font-size: 7.3pt; color: #475569; }
    .thanks { font-size: 8.5pt; font-weight: 800; color: #111827; margin-bottom: 2px; }
  </style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="Logo Jordan">
    <div class="company">${_escapeHtml(empresa.nombre)}</div>
    ${empresa.slogan ? `<div class="meta-small">${_escapeHtml(empresa.slogan)}</div>` : ''}
    ${empresa.nit ? `<div class="meta-small">NIT: ${_escapeHtml(empresa.nit)}</div>` : ''}
    ${empresa.direccion || empresa.ciudad ? `<div class="meta-small">${_escapeHtml([empresa.direccion, empresa.ciudad].filter(Boolean).join(' - '))}</div>` : ''}
    ${empresa.telefono ? `<div class="meta-small">Tel: ${_escapeHtml(empresa.telefono)}</div>` : ''}
    <div class="pill">Comprobante de pedido</div>
  </div>

  <div class="section">
    <div class="section-title">Informacion del pedido</div>
    <div class="row"><span class="label">Pedido</span><span class="value">${_escapeHtml(numero)}</span></div>
    <div class="row"><span class="label">Fecha</span><span class="value normal">${fechaStr}</span></div>
    <div class="row"><span class="label">Cliente</span><span class="value">${_escapeHtml(cliente)}</span></div>
    <div class="row"><span class="label">Factura</span><span class="value normal">${_escapeHtml(factura.numero)}</span></div>
    ${factura.saldo > 0 ? `<div class="row"><span class="label">Saldo factura</span><span class="value">${_formatCOP(factura.saldo)}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Detalle de productos</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filasProductos}</tbody>
    </table>
  </div>

  <div class="total-box">
    <div class="row">
      <span class="label">TOTAL PEDIDO</span>
      <span class="value">${_formatCOP(total)}</span>
    </div>
  </div>

  ${observaciones ? `<div class="note"><strong>Observaciones:</strong> ${_escapeHtml(observaciones)}</div>` : ''}

  <div class="footer">
    <div class="thanks">Gracias por su compra</div>
    <div>Conserve este comprobante para control y soporte.</div>
    <div style="margin-top:3px">Sistema JORDAN - Gestion 2026</div>
  </div>
</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=360,height=620,scrollbars=no')
    if (!win) {
      alert('El navegador bloqueo la ventana emergente. Permite ventanas emergentes para imprimir.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 800)
  }

  return { imprimirPedido }
}
