/**
 * Composable para imprimir comprobantes de pedidos en impresoras POS (80mm).
 */

import { formatDate } from '~/utils/formats'

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

  async function imprimirPedido(pedido: any) {
    const empresa = await _getEmpresa()
    const numero = pedido.numeroPedido ?? pedido.numero ?? `#${pedido.id}`
    const cliente = pedido.cliente?.nombre ?? '-'
    const trabajador = pedido.trabajador?.nombre ?? (pedido.trabajadorId ? `Trabajador ${pedido.trabajadorId}` : '-')
    const fechaStr = formatDate(pedido.fechaPedido ?? pedido.fecha)
    const detalles: any[] = pedido.detalles ?? []
    const observaciones: string = pedido.observaciones ?? ''
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      color: #000 !important;
      font-weight: 700;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: 80mm auto; margin: 3mm 2.5mm; }
    body {
      font-family: Arial Black, Arial, Helvetica, sans-serif;
      font-size: 9.2pt;
      font-weight: 800;
      line-height: 1.34;
      width: 75mm;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-text-stroke: .08px #000;
      text-rendering: geometricPrecision;
    }
    .ticket { padding: 1mm 0; }
    .header { text-align: center; padding-bottom: 5px; border-bottom: 2px solid #000; }
    .logo { width: 18mm; height: 18mm; object-fit: contain; margin-bottom: 3px; filter: grayscale(1) contrast(2.4); }
    .company { font-size: 13.4pt; font-weight: 900; letter-spacing: .7px; text-transform: uppercase; color: #000; }
    .meta-small { font-size: 8pt; font-weight: 800; color: #000; margin-top: 1px; }
    .pill {
      display: inline-block;
      margin-top: 5px;
      padding: 3px 7px;
      border: 2px solid #000;
      border-radius: 999px;
      font-size: 7.8pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .section { margin-top: 7px; padding-top: 6px; border-top: 2px dashed #000; }
    .section-title { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; color: #000; margin-bottom: 4px; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .label { color: #000; white-space: nowrap; font-weight: 900; }
    .value { text-align: right; font-weight: 900; word-break: break-word; }
    .value.normal { font-weight: 800; }
    table { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
    th { padding: 4px 2px; border-bottom: 2px solid #000; font-size: 7.8pt; color: #000; text-transform: uppercase; text-align: left; font-weight: 900; }
    td { padding: 5px 2px; border-bottom: 1.5px solid #000; vertical-align: top; }
    .product strong { display: block; font-size: 9pt; font-weight: 900; color: #000; }
    .product span { display: block; margin-top: 1px; font-size: 7.8pt; font-weight: 800; color: #000; }
    .qty { width: 10mm; text-align: center; font-weight: 900; }
    .money { width: 23mm; text-align: right; font-weight: 900; white-space: nowrap; }
    .total-box { margin-top: 7px; padding: 7px 0; border-top: 3px solid #000; border-bottom: 3px solid #000; }
    .total-box .label { font-size: 9.8pt; font-weight: 900; color: #000; }
    .total-box .value { font-size: 14pt; font-weight: 900; color: #000; }
    .note { margin-top: 5px; padding: 5px; border: 2px solid #000; border-radius: 4px; font-size: 8pt; font-weight: 800; color: #000; }
    .footer { margin-top: 8px; text-align: center; font-size: 8pt; font-weight: 800; color: #000; }
    .thanks { font-size: 9.2pt; font-weight: 900; color: #000; margin-bottom: 2px; }
    @media print {
      body { font-weight: 900; }
      img { opacity: 1; }
    }
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
    <div class="row"><span class="label">Trabajador</span><span class="value">${_escapeHtml(trabajador)}</span></div>
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
    <div>Conserve este comprobante para control de entrega, pago y soporte.</div>
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
