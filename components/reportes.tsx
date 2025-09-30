"use client"

import { useEffect, useState } from "react"
import { FileText, Download, Filter, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  obtenerRegistrosConDetalles,
  obtenerProveedores,
  obtenerCategorias,
  obtenerArticulos,
  type RegistroConDetalles,
  type ProveedorOut,
  type CategoriaOut,
  type ArticuloOut,
} from "@/lib/api"
import { generarReportePDF, generarReporteInventarioPDF, generarReporteComparativoPDF } from "@/lib/pdf-generator"
import { getConfig, ConfigOut } from "@/lib/api"

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
export default function Reportes() {
  const [empresa, setEmpresa] = useState<ConfigOut | null>(null)
  const [registros, setRegistros] = useState<RegistroConDetalles[]>([])
  const [proveedores, setProveedores] = useState<ProveedorOut[]>([])
  const [categorias, setCategorias] = useState<CategoriaOut[]>([])
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [vistaPreviaVisible, setVistaPreviaVisible] = useState(false)

  const [filtros, setFiltros] = useState<FiltrosReporte>({
    tipo: "todos",
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    fechaHasta: new Date().toISOString().split("T")[0],
    proveedor: "",
    categoria: "",
    incluirDetalles: true,
    incluirGraficos: true,
    incluirResumen: true,
  })

  useEffect(() => {
    cargarDatos()
    getConfig().then(data => {
      if (data.length > 0) setEmpresa(data[0])
    })
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [registrosData, proveedoresData, categoriasData, articulosData] = await Promise.all([
        obtenerRegistrosConDetalles(),
        obtenerProveedores(),
        obtenerCategorias(),
        obtenerArticulos(),
      ])
      setRegistros(registrosData)
      setProveedores(proveedoresData)
      setCategorias(categoriasData)
      setArticulos(articulosData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...registros]

    // Filtrar por tipo
    if (filtros.tipo !== "todos") {
      const tipoFiltrado = filtros.tipo === "entradas" ? "ENTRADA" : "SALIDA"
      resultado = resultado.filter((registro) => registro.tipo_movimiento === tipoFiltrado)
    }

    // Filtrar por fecha
    if (filtros.fechaDesde) {
      resultado = resultado.filter((registro) => new Date(registro.fecha) >= new Date(filtros.fechaDesde))
    }
    if (filtros.fechaHasta) {
      resultado = resultado.filter((registro) => new Date(registro.fecha) <= new Date(filtros.fechaHasta))
    }

    // Filtrar por proveedor
    if (filtros.proveedor && filtros.proveedor !== "all") {
      resultado = resultado.filter((registro) => registro.idproveedor?.toString() === filtros.proveedor)
    }

    return resultado
  }

  const generarReporte = async (tipoReporte: "movimientos" | "inventario" | "comparativo") => {
    try {
      setGenerando(true)
      const registrosFiltrados = aplicarFiltros()

      switch (tipoReporte) {
        case "movimientos":
          await generarReportePDF(registrosFiltrados, filtros, proveedores, categorias, articulos)
          break
        case "inventario":
          await generarReporteInventarioPDF(registrosFiltrados, filtros, categorias, proveedores)
          break
        case "comparativo":
          await generarReporteComparativoPDF(registrosFiltrados, filtros, proveedores)
          break
      }
    } catch (error) {
      console.error("Error al generar reporte:", error)
      alert("Error al generar el reporte")
    } finally {
      setGenerando(false)
    }
  }

  const resetFiltros = () => {
    setFiltros({
      tipo: "todos",
      fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      fechaHasta: new Date().toISOString().split("T")[0],
      proveedor: "",
      categoria: "",
      incluirDetalles: true,
      incluirGraficos: true,
      incluirResumen: true,
    })
  }

  const registrosFiltrados = aplicarFiltros()
  const totalEntradas = registrosFiltrados.filter((r) => r.tipo_movimiento === "ENTRADA")
  const totalSalidas = registrosFiltrados.filter((r) => r.tipo_movimiento === "SALIDA")
  const valorTotalEntradas = totalEntradas.reduce((sum, r) => sum + Number(r.total || 0), 0)
  const valorTotalSalidas = totalSalidas.reduce((sum, r) => sum + Number(r.total || 0), 0)

  if (loading) {
    return <div className="p-6">Cargando datos para reportes...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* ...el resto de la pantalla de reportes sin datos de empresa visibles... */}
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FileText className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Generación de Reportes</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de filtros */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtros del Reporte</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tipo">Tipo de Movimiento</Label>
                <Select value={filtros.tipo} onValueChange={(value: any) => setFiltros({ ...filtros, tipo: value })}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los movimientos</SelectItem>
                    <SelectItem value="entradas">Solo entradas</SelectItem>
                    <SelectItem value="salidas">Solo salidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="fechaDesde">Fecha desde</Label>
                  <Input
                    id="fechaDesde"
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaHasta">Fecha hasta</Label>
                  <Input
                    id="fechaHasta"
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="proveedor">Proveedor (opcional)</Label>
                <Select
                  value={filtros.proveedor}
                  onValueChange={(value) => setFiltros({ ...filtros, proveedor: value })}
                >
                  <SelectTrigger id="proveedor">
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.idproveedor} value={proveedor.idproveedor.toString()}>
                        {proveedor.proveedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Opciones del reporte</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirDetalles"
                      checked={filtros.incluirDetalles}
                      onCheckedChange={(checked) => setFiltros({ ...filtros, incluirDetalles: checked as boolean })}
                    />
                    <Label htmlFor="incluirDetalles" className="text-sm">
                      Incluir detalles de artículos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirGraficos"
                      checked={filtros.incluirGraficos}
                      onCheckedChange={(checked) => setFiltros({ ...filtros, incluirGraficos: checked as boolean })}
                    />
                    <Label htmlFor="incluirGraficos" className="text-sm">
                      Incluir gráficos estadísticos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirResumen"
                      checked={filtros.incluirResumen}
                      onCheckedChange={(checked) => setFiltros({ ...filtros, incluirResumen: checked as boolean })}
                    />
                    <Label htmlFor="incluirResumen" className="text-sm">
                      Incluir resumen ejecutivo
                    </Label>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={resetFiltros} className="w-full">
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumen de datos filtrados */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Datos Filtrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{registrosFiltrados.length}</p>
                  <p className="text-sm text-gray-600">Total Movimientos</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{totalEntradas.length}</p>
                  <p className="text-sm text-gray-600">Entradas</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{totalSalidas.length}</p>
                  <p className="text-sm text-gray-600">Salidas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Valor Total Entradas</span>
                    <span className="font-medium text-green-600">${valorTotalEntradas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor Total Salidas</span>
                    <span className="font-medium text-red-600">${valorTotalSalidas.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Balance</span>
                    <span>${(valorTotalEntradas - valorTotalSalidas).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipos de reportes */}
          <Tabs defaultValue="movimientos">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
            </TabsList>

            <TabsContent value="movimientos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Reporte de Movimientos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Genera un reporte detallado de todas las entradas y salidas de inventario en el período
                    seleccionado.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">El reporte incluye:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Lista completa de movimientos</li>
                      <li>• Detalles de artículos por movimiento</li>
                      <li>• Información de proveedores/destinos</li>
                      <li>• Totales y subtotales</li>
                      <li>• Gráficos de tendencias</li>
                    </ul>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => generarReporte("movimientos")}
                      disabled={generando}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{generando ? "Generando..." : "Generar PDF"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={() => setVistaPreviaVisible(!vistaPreviaVisible)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{vistaPreviaVisible ? "Ocultar" : "Vista previa"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventario">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Reporte de Inventario</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Genera un reporte del estado actual del inventario con análisis de stock y valorización.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">El reporte incluye:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Estado actual de stock por artículo</li>
                      <li>• Valorización del inventario</li>
                      <li>• Artículos con bajo stock</li>
                      <li>• Análisis por categorías</li>
                      <li>• Indicadores de rotación</li>
                    </ul>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => generarReporte("inventario")}
                      disabled={generando}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{generando ? "Generando..." : "Generar PDF"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={() => setVistaPreviaVisible(!vistaPreviaVisible)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{vistaPreviaVisible ? "Ocultar" : "Vista previa"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparativo">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Reporte Comparativo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Genera un análisis comparativo de entradas vs salidas con métricas de rendimiento.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">El reporte incluye:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Comparación entradas vs salidas</li>
                      <li>• Análisis de tendencias temporales</li>
                      <li>• Rendimiento por proveedor</li>
                      <li>• Métricas de eficiencia</li>
                      <li>• Proyecciones y recomendaciones</li>
                    </ul>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => generarReporte("comparativo")}
                      disabled={generando}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{generando ? "Generando..." : "Generar PDF"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={() => setVistaPreviaVisible(!vistaPreviaVisible)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{vistaPreviaVisible ? "Ocultar" : "Vista previa"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Vista previa de datos */}
          {vistaPreviaVisible && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Detalle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrosFiltrados.slice(0, 10).flatMap((registro) =>
                        registro.detalles.map((detalle) => {
                          const articulo = articulos.find((a) => a.idarticulo === detalle.idarticulo)
                          const categoriaNombre = categorias.find((cat) => cat.idcategoria === articulo?.idcategoria)?.categoria || "-";
                          return (
                            <tr key={detalle.iddetalle}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {detalle.fecha ? new Date(detalle.fecha).toLocaleDateString("es-ES") : new Date(registro.fecha).toLocaleDateString("es-ES")}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Badge
                                  className={
                                    registro.tipo_movimiento === "ENTRADA"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {registro.tipo_movimiento}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">#{registro.nro_comprobante}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {registro.tipo_movimiento === "ENTRADA"
                                  ? registro.proveedor || proveedores.find((p) => p.idproveedor === registro.idproveedor)?.proveedor || "-"
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {registro.tipo_movimiento === "SALIDA" ? registro.proveedor : "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{detalle.articulo}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{categoriaNombre}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{detalle.cantidad}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">${Number(detalle.precio_unitario).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">${Number(detalle.total).toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right font-bold">
                          Total General:
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          ${(valorTotalEntradas - valorTotalSalidas).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {registrosFiltrados.length > 10 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      ... y {registrosFiltrados.length - 10} registros más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
