import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { RegistroConDetalles, ProveedorOut, CategoriaOut, ArticuloOut } from "./api"
import { obtenerArticulos, getConfig, ConfigOut } from "./api"

// Extender el tipo jsPDF para incluir autoTable - necesario para TypeScript
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Interfaz que define los filtros disponibles para generar reportes
interface FiltrosReporte {
  tipo: "todos" | "entradas" | "salidas"  // Tipo de movimientos a incluir
  fechaDesde: string                      // Fecha de inicio del período
  fechaHasta: string                      // Fecha de fin del período
  proveedor: string                       // ID del proveedor a filtrar
  categoria: string                       // ID de la categoría a filtrar
  incluirDetalles: boolean               // Si incluir detalles de cada movimiento
  incluirGraficos: boolean               // Si incluir gráficos (no implementado)
  incluirResumen: boolean                // Si incluir resumen ejecutivo
}

// Función que configura el encabezado estándar de todos los PDFs
const configurarPDF = async (doc: jsPDF, titulo: string) => {
  doc.setFont("helvetica")
  // Obtener datos de empresa
  let empresa: ConfigOut | null = null
  try {
    const config = await getConfig()
    if (config.length > 0) empresa = config[0]
  } catch {}

  // Título principal de la aplicación y empresa
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(empresa?.empresa || "InventarioDUO", 20, 25)
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  if (empresa) {
    doc.text(`CUIT: ${empresa.cuit} | Responsable: ${empresa.responsable} | ${empresa.condicion_fiscal}`, 20, 32)
    doc.text(`Dirección: ${empresa.direccion} | Tel: ${empresa.telefono}`, 20, 38)
  }

  // Título específico del reporte
  doc.setFontSize(16)
  doc.setTextColor(60, 60, 60)
  doc.text(titulo, 20, 45)

  // Línea separadora visual
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 50, 190, 50)

  // Fecha y hora de generación del reporte
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Generado el: ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`,
    20,
    56,
  )

  return 66 // Retorna la posición Y donde debe comenzar el contenido
}

// Función que agrega pie de página con numeración y marca de la aplicación
const agregarPiePagina = (doc: jsPDF, numeroPagina: number, totalPaginas: number) => {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  // Número de página en la esquina inferior izquierda
  doc.text(`Página ${numeroPagina} de ${totalPaginas}`, 20, pageHeight - 10)
  // Marca de la aplicación centrada en el pie
  doc.text("InventarioDUO - Sistema de Gestión de Inventario", 105, pageHeight - 10, { align: "center" })
}

// FUNCIÓN PRINCIPAL: Generar reporte de movimientos de inventario
export const generarReportePDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  proveedores: ProveedorOut[],
  categorias: CategoriaOut[],
  articulos: ArticuloOut[],
) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  let yPosition = await configurarPDF(doc, "Reporte de Movimientos de Inventario")

  // SECCIÓN 1: Mostrar los filtros aplicados en el reporte
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Filtros Aplicados:", 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  // Mostrar período de fechas
  doc.text(`Período: ${filtros.fechaDesde} al ${filtros.fechaHasta}`, 20, yPosition)
  yPosition += 6
  // Mostrar tipo de movimientos incluidos
  doc.text(`Tipo: ${filtros.tipo === "todos" ? "Todos los movimientos" : filtros.tipo}`, 20, yPosition)
  yPosition += 6

  // Si hay filtro de proveedor, mostrarlo
  if (filtros.proveedor) {
    const proveedor = proveedores.find((p) => p.idproveedor.toString() === filtros.proveedor)
    doc.text(`Proveedor: ${proveedor?.proveedor || "No encontrado"}`, 20, yPosition)
    yPosition += 6
  }

  yPosition += 10

  // SECCIÓN 2: Resumen ejecutivo (opcional)
  if (filtros.incluirResumen) {
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    doc.text("Resumen Ejecutivo:", 20, yPosition)
    yPosition += 10

    // Calcular estadísticas de entradas y salidas
    const totalEntradas = registros.filter((r) => r.tipo_movimiento === "ENTRADA")
    const totalSalidas = registros.filter((r) => r.tipo_movimiento === "SALIDA")
    const valorEntradas = totalEntradas.reduce((sum, r) => sum + Number(r.total || 0), 0)
    const valorSalidas = totalSalidas.reduce((sum, r) => sum + Number(r.total || 0), 0)

    // Mostrar estadísticas calculadas
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

  // SECCIÓN 3: Tabla principal con todos los movimientos
  const columnas = [
    "Fecha Detalle",
    "Tipo",
    "Comprobante",
    "Proveedor",
    "Destino",
    "Artículo",
    "Categoría",
    "Cantidad",
    "Precio Unitario",
    "Total Detalle"
  ];
  
  // Transformar los datos para la tabla - cada detalle es una fila
  const filas = registros.flatMap((registro) =>
    registro.detalles.map((detalle) => {
      const articulo = articulos.find((a) => a.idarticulo === detalle.idarticulo);
      const categoriaNombre = categorias.find((cat) => cat.idcategoria === articulo?.idcategoria)?.categoria || "-";
      return [
        detalle.fecha ? new Date(detalle.fecha).toLocaleDateString("es-ES") : new Date(registro.fecha).toLocaleDateString("es-ES"),
        registro.tipo_movimiento,
        `#${registro.nro_comprobante}`,
        registro.tipo_movimiento === "ENTRADA"
          ? registro.proveedor || proveedores.find((p) => p.idproveedor === registro.idproveedor)?.proveedor || ""
          : "-",
        registro.tipo_movimiento === "SALIDA" ? registro.proveedor || "" : "-",
        detalle.articulo || "",
        categoriaNombre,
        detalle.cantidad.toString(),
        `$${Number(detalle.precio_unitario).toFixed(2)}`,
        `$${Number(detalle.total).toFixed(2)}`
      ];
    })
  );

  // Generar la tabla con autoTable
  autoTable(doc, {
    head: [columnas],
    body: filas,
    startY: yPosition,
    margin: { left: 15, right: 5 },
    tableWidth: 'wrap',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [66, 139, 202], // Azul para encabezados
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Gris claro para filas alternas
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 'auto' },
      9: { cellWidth: 'auto', halign: "right" },
    },
  });

  // SECCIÓN 4: Detalles expandidos de movimientos (opcional)
  if (filtros.incluirDetalles) {
    let currentY = (doc as any).lastAutoTable.finalY + 20

    // Limitar a 5 registros para evitar PDFs excesivamente largos
    for (const registro of registros.slice(0, 5)) {
      // Si no hay espacio, crear nueva página
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      // Título del detalle
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

      // Tabla de detalles para este registro específico
      const columnasDetalle = ["Artículo", "Cantidad", "Precio Unit.", "Total"]
      const filasDetalle = registro.detalles.map((detalle) => [
        detalle.articulo || "",
        detalle.cantidad.toString(),
        `$${Number(detalle.precio_unitario).toFixed(2)}`,
        `$${Number(detalle.total).toFixed(2)}`,
      ])

      autoTable(doc, {
        head: [columnasDetalle],
        body: filasDetalle,
        startY: currentY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [108, 117, 125], // Gris para encabezados de detalle
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

  // SECCIÓN 5: Agregar numeración de páginas a todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  // SECCIÓN 6: Descargar el archivo PDF
  doc.save(`reporte_movimientos_${new Date().toISOString().split("T")[0]}.pdf`)
}

// FUNCIÓN: Generar reporte del estado actual del inventario
export const generarReporteInventarioPDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  categorias: CategoriaOut[],
  proveedores: ProveedorOut[],
) => {
  const doc = new jsPDF()
  let yPosition = await configurarPDF(doc, "Reporte de Estado de Inventario")

  // Título de la sección
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Estado Actual del Inventario:", 20, yPosition)
  yPosition = yPosition + 15

  // Obtener datos actuales del inventario desde la API
  let articulos = await obtenerArticulos()

  // Aplicar filtro de categoría si está especificado
  if (filtros.categoria) {
    articulos = articulos.filter(a => a.idcategoria === Number(filtros.categoria))
  }

  // Transformar datos para el reporte, calculando valores
  const datosInventario = articulos.map((item) => {
    const categoriaNombre = categorias.find((c) => c.idcategoria === item.idcategoria)?.categoria || "Sin categoría"
    const proveedorNombre = proveedores.find((p) => p.idproveedor === item.idproveedor)?.proveedor || "Sin proveedor"
    const stock = Number(item.stock_actual)
    const precioVenta = Number(item.precio_venta)
    const costo = Number(item.costo)
    const valorCosto = stock * costo        // Valor del stock a precio de costo
    const valorVenta = stock * precioVenta  // Valor del stock a precio de venta
    return {
      articulo: item.articulo,
      categoria: categoriaNombre,
      proveedor: proveedorNombre,
      stock,
      costo,
      precioVenta,
      valorCosto,
      valorVenta,
    }
  })

  // Crear tabla del inventario
  const columnas = ["Artículo", "Categoría", "Proveedor", "Stock", "Costo Unit.", "Valor a Costo", "Precio Venta", "Valor a Venta"]
  const filas = datosInventario.map((item) => [
    item.articulo,
    item.categoria,
    item.proveedor,
    item.stock.toString(),
    `$${item.costo.toFixed(2)}`,
    `$${item.valorCosto.toFixed(2)}`,
    `$${item.precioVenta.toFixed(2)}`,
    `$${item.valorVenta.toFixed(2)}`,
  ])

  autoTable(doc, {
    head: [columnas],
    body: filas,
  startY: yPosition,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [40, 167, 69], // Verde para reporte de inventario
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 25, halign: "right" },
    },
  })

  // Sección de resumen con totales calculados
  const currentY = (doc as any).lastAutoTable.finalY + 20
  const valorTotalCosto = datosInventario.reduce((sum, item) => sum + item.valorCosto, 0)
  const valorTotalVenta = datosInventario.reduce((sum, item) => sum + item.valorVenta, 0)

  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Resumen de Valorización:", 20, currentY)

  doc.setFontSize(10)
  doc.text(`Valor total del inventario a costo: $${valorTotalCosto.toFixed(2)}`, 20, currentY + 15)
  doc.text(`Valor total del inventario a precio de venta: $${valorTotalVenta.toFixed(2)}`, 20, currentY + 25)
  doc.text(`Artículos únicos: ${datosInventario.length}`, 20, currentY + 35)
  doc.text(`Stock total: ${datosInventario.reduce((sum, item) => sum + item.stock, 0)} unidades`, 20, currentY + 45)

  // Agregar numeración de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  // Descargar el PDF
  doc.save(`reporte_inventario_${new Date().toISOString().split("T")[0]}.pdf`)
}

// FUNCIÓN: Generar reporte comparativo entre entradas y salidas
export const generarReporteComparativoPDF = async (
  registros: RegistroConDetalles[],
  filtros: FiltrosReporte,
  proveedores: ProveedorOut[],
) => {
  const doc = new jsPDF()
  let yPosition = await configurarPDF(doc, "Reporte Comparativo de Movimientos")

  // Separar y analizar entradas vs salidas
  const entradas = registros.filter((r) => r.tipo_movimiento === "ENTRADA")
  const salidas = registros.filter((r) => r.tipo_movimiento === "SALIDA")
  const valorEntradas = entradas.reduce((sum, r) => sum + Number(r.total || 0), 0)
  const valorSalidas = salidas.reduce((sum, r) => sum + Number(r.total || 0), 0)

  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text("Análisis Comparativo:", 20, yPosition)
  yPosition = yPosition + 15

  // Tabla comparativa principal
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

  autoTable(doc, {
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

  // Análisis detallado por proveedor
  const currentY = (doc as any).lastAutoTable.finalY + 20

  doc.setFontSize(12)
  doc.text("Análisis por Proveedor:", 20, currentY)

  // Calcular estadísticas por proveedor
  const analisisProveedores = proveedores.map((proveedor) => {
    const movimientosProveedor = entradas.filter((e) => e.idproveedor === proveedor.idproveedor)
    const valorProveedor = movimientosProveedor.reduce((sum, m) => sum + Number(m.total || 0), 0)
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
    `${((item.valor / valorEntradas) * 100).toFixed(1)}%`, // Porcentaje del total
  ])

  autoTable(doc, {
    head: [["Proveedor", "Movimientos", "Valor Total", "% del Total"]],
    body: filasProveedores,
    startY: currentY + 10,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 53, 69], // Rojo para reporte comparativo
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

  // Agregar numeración de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    agregarPiePagina(doc, i, totalPages)
  }

  // Descargar el PDF
  doc.save(`reporte_comparativo_${new Date().toISOString().split("T")[0]}.pdf`)
}