import jsPDF from "jspdf"
import "jspdf-autotable"
import type { RegistroConDetalles, ProveedorOut, CategoriaOut } from "./api"

// Extender el tipo jsPDF para incluir autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface FiltrosReporte {
  tipo: "todos" | "entradas" | "salidas"
  fechaDesde: string
  fechaHasta: string
  proveedor: string
  categoria: string
  incluirDetalles: boolean
  incluirGraficos: boolean
  incluirResumen: boolean
}

// Configuración base para PDFs
const configurarPDF = (doc: jsPDF, titulo: string) => {
  // Configurar fuente
  doc.setFont("helvetica")

  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text("InventarioPro", 20, 25)

  doc.setFontSize(16)
  doc.setTextColor(60, 60, 60)
  doc.text(titulo, 20, 35)

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 40, 190, 40)

  // Fecha de generación
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Generado el: ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`,
    20,
    50,
  )

  return 60 // Posición Y inicial para el contenido
}

// Función para agregar pie de página
const agregarPiePagina = (doc: jsPDF, numeroPagina: number, totalPaginas: number) => {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Página ${numeroPagina} de ${totalPaginas}`, 20, pageHeight - 10)
  doc.text("InventarioPro - Sistema de Gestión de Inventario", 105, pageHeight - 10, { align: "center" })
}

// Generar reporte de movimientos
export const generarReportePDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  proveedores: ProveedorOut[],
  categorias: CategoriaOut[],
) => {
  const doc = new jsPDF()
  let yPosition = configurarPDF(doc, "Reporte de Movimientos de Inventario")

  // Información de filtros aplicados
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Filtros Aplicados:", 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Período: ${filtros.fechaDesde} al ${filtros.fechaHasta}`, 20, yPosition)
  yPosition += 6
  doc.text(`Tipo: ${filtros.tipo === "todos" ? "Todos los movimientos" : filtros.tipo}`, 20, yPosition)
  yPosition += 6

  if (filtros.proveedor) {
    const proveedor = proveedores.find((p) => p.idproveedor.toString() === filtros.proveedor)
    doc.text(`Proveedor: ${proveedor?.proveedor || "No encontrado"}`, 20, yPosition)
    yPosition += 6
  }

  yPosition += 10

  // Resumen ejecutivo si está habilitado
  if (filtros.incluirResumen) {
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.text("Resumen Ejecutivo:", 20, yPosition)
    yPosition += 10

    const totalEntradas = registros.filter((r) => r.tipo_movimiento === "ENTRADA")
    const totalSalidas = registros.filter((r) => r.tipo_movimiento === "SALIDA")
    const valorEntradas = totalEntradas.reduce((sum, r) => sum + r.total, 0)
    const valorSalidas = totalSalidas.reduce((sum, r) => sum + r.total, 0)

    doc.setFontSize(10)
    doc.text(`Total de movimientos: ${registros.length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Entradas: ${totalEntradas.length} (Valor: $${valorEntradas.toFixed(2)})`, 20, yPosition)
    yPosition += 6
    doc.text(`Salidas: ${totalSalidas.length} (Valor: $${valorSalidas.toFixed(2)})`, 20, yPosition)
    yPosition += 6
    doc.text(`Balance: $${(valorEntradas - valorSalidas).toFixed(2)}`, 20, yPosition)
    yPosition += 15
  }

  // Tabla de movimientos
  const columnas = ["Fecha", "Tipo", "Comprobante", "Proveedor/Destino", "Usuario", "Total"]
  const filas = registros.map((registro) => [
    new Date(registro.fecha).toLocaleDateString("es-ES"),
    registro.tipo_movimiento,
    `#${registro.nro_comprobante}`,
    registro.tipo_movimiento === "ENTRADA" ? registro.proveedor || "" : registro.destino || "",
    registro.usuario,
    `$${registro.total.toFixed(2)}`,
  ])

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25, halign: "right" },
    },
  })

  // Detalles de artículos si está habilitado
  if (filtros.incluirDetalles) {
    let currentY = (doc as any).lastAutoTable.finalY + 20

    for (const registro of registros.slice(0, 5)) {
      // Limitar a 5 registros para evitar PDFs muy largos
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text(
        `Detalles del ${registro.tipo_movimiento} #${registro.nro_comprobante} - ${new Date(
          registro.fecha,
        ).toLocaleDateString("es-ES")}`,
        20,
        currentY,
      )
      currentY += 10

      const columnasDetalle = ["Artículo", "Cantidad", "Precio Unit.", "Total"]
      const filasDetalle = registro.detalles.map((detalle) => [
        detalle.articulo,
        detalle.cantidad.toString(),
        `$${detalle.precio_unitario.toFixed(2)}`,
        `$${detalle.total.toFixed(2)}`,
      ])

      doc.autoTable({
        head: [columnasDetalle],
        body: filasDetalle,
        startY: currentY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [108, 117, 125],
          textColor: 255,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 25, halign: "right" },
          3: { cellWidth: 25, halign: "right" },
        },
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
    }
  }

  // Agregar número de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  // Descargar el PDF
  doc.save(`reporte_movimientos_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Generar reporte de inventario
export const generarReporteInventarioPDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  categorias: CategoriaOut[],
) => {
  const doc = new jsPDF()
  let yPosition = configurarPDF(doc, "Reporte de Estado de Inventario")

  // Información general
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Estado Actual del Inventario:", 20, yPosition)
  yPosition += 15

  // Aquí simularemos datos de inventario actual
  // En una implementación real, estos datos vendrían de la API
  const datosInventario = [
    { articulo: 'Monitor LED 24"', categoria: "Tecnología", stock: 10, precio: 189.99, valor: 1899.9 },
    { articulo: "Teclado Mecánico", categoria: "Tecnología", stock: 5, precio: 79.99, valor: 399.95 },
    { articulo: "Mouse Inalámbrico", categoria: "Tecnología", stock: 15, precio: 29.99, valor: 449.85 },
  ]

  const columnas = ["Artículo", "Categoría", "Stock", "Precio Unit.", "Valor Total"]
  const filas = datosInventario.map((item) => [
    item.articulo,
    item.categoria,
    item.stock.toString(),
    `$${item.precio.toFixed(2)}`,
    `$${item.valor.toFixed(2)}`,
  ])

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: yPosition,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [40, 167, 69],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
    },
  })

  // Resumen de valorización
  const currentY = (doc as any).lastAutoTable.finalY + 20
  const valorTotal = datosInventario.reduce((sum, item) => sum + item.valor, 0)

  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Resumen de Valorización:", 20, currentY)

  doc.setFontSize(10)
  doc.text(`Valor total del inventario: $${valorTotal.toFixed(2)}`, 20, currentY + 15)
  doc.text(`Artículos únicos: ${datosInventario.length}`, 20, currentY + 25)
  doc.text(`Stock total: ${datosInventario.reduce((sum, item) => sum + item.stock, 0)} unidades`, 20, currentY + 35)

  // Agregar número de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  doc.save(`reporte_inventario_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Generar reporte comparativo
export const generarReporteComparativoPDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  proveedores: ProveedorOut[],
) => {
  const doc = new jsPDF()
  let yPosition = configurarPDF(doc, "Reporte Comparativo de Movimientos")

  // Análisis comparativo
  const entradas = registros.filter((r) => r.tipo_movimiento === "ENTRADA")
  const salidas = registros.filter((r) => r.tipo_movimiento === "SALIDA")
  const valorEntradas = entradas.reduce((sum, r) => sum + r.total, 0)
  const valorSalidas = salidas.reduce((sum, r) => sum + r.total, 0)

  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Análisis Comparativo:", 20, yPosition)
  yPosition += 15

  // Tabla comparativa
  const datosComparativos = [
    ["Concepto", "Entradas", "Salidas", "Diferencia"],
    [
      "Cantidad de movimientos",
      entradas.length.toString(),
      salidas.length.toString(),
      (entradas.length - salidas.length).toString(),
    ],
    [
      "Valor total",
      `$${valorEntradas.toFixed(2)}`,
      `$${valorSalidas.toFixed(2)}`,
      `$${(valorEntradas - valorSalidas).toFixed(2)}`,
    ],
    [
      "Promedio por movimiento",
      `$${(valorEntradas / entradas.length || 0).toFixed(2)}`,
      `$${(valorSalidas / salidas.length || 0).toFixed(2)}`,
      "-",
    ],
  ]

  doc.autoTable({
    body: datosComparativos,
    startY: yPosition,
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [108, 117, 125],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 35, halign: "center" },
    },
  })

  // Análisis por proveedor
  const currentY = (doc as any).lastAutoTable.finalY + 20

  doc.setFontSize(12)
  doc.text("Análisis por Proveedor:", 20, currentY)

  const analisisProveedores = proveedores.map((proveedor) => {
    const movimientosProveedor = entradas.filter((e) => e.idproveedor === proveedor.idproveedor)
    const valorProveedor = movimientosProveedor.reduce((sum, m) => sum + m.total, 0)
    return {
      proveedor: proveedor.proveedor,
      movimientos: movimientosProveedor.length,
      valor: valorProveedor,
    }
  })

  const filasProveedores = analisisProveedores.map((item) => [
    item.proveedor,
    item.movimientos.toString(),
    `$${item.valor.toFixed(2)}`,
    `${((item.valor / valorEntradas) * 100).toFixed(1)}%`,
  ])

  doc.autoTable({
    head: [["Proveedor", "Movimientos", "Valor Total", "% del Total"]],
    body: filasProveedores,
    startY: currentY + 10,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 53, 69],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
    },
  })

  // Agregar número de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  doc.save(`reporte_comparativo_${new Date().toISOString().split("T")[0]}.pdf`)
}
