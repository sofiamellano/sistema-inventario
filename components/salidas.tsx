"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Save, PackageOpen, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  obtenerArticulos,
  crearSalida,
  crearDetalle,
  actualizarArticulo,
  type ArticuloOut,
  type SalidaPayload,
  type DetallePayload,
} from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DetalleSalida {
  idarticulo: number
  articulo: string
  cantidad: number
  stock_disponible: number
  precio_unitario: number
  total: number
}

const motivosSalida = ["Venta", "Transferencia", "Devolución", "Merma", "Uso interno", "Donación", "Otro"]

export default function Salidas() {
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Datos del registro principal
  const [salidaData, setSalidaData] = useState({
    nro_comprobante: "",
    fecha: new Date().toISOString().split("T")[0],
    usuario: "admin", // En una app real, esto vendría del usuario logueado
    destino: "",
    motivo: "",
    observaciones: "",
  })

  // Detalles de la salida
  const [detalles, setDetalles] = useState<DetalleSalida[]>([])

  // Formulario para agregar artículo
  const [nuevoDetalle, setNuevoDetalle] = useState({
    idarticulo: 0,
    cantidad: 1,
  })

  useEffect(() => {
    cargarArticulos()
  }, [])

  const cargarArticulos = async () => {
    try {
      setLoading(true)
      const articulosData = await obtenerArticulos()
      setArticulos(articulosData)
    } catch (error) {
      console.error("Error al cargar artículos:", error)
    } finally {
      setLoading(false)
    }
  }

  const agregarDetalle = () => {
    if (nuevoDetalle.idarticulo === 0) return

    const articulo = articulos.find((a) => a.idarticulo === nuevoDetalle.idarticulo)
    if (!articulo) return

    // Verificar si el artículo ya está en la lista
    const existeDetalle = detalles.find((d) => d.idarticulo === nuevoDetalle.idarticulo)
    if (existeDetalle) {
      alert("Este artículo ya está agregado a la salida")
      return
    }

    // Verificar stock disponible
    if (nuevoDetalle.cantidad > articulo.stock_actual) {
      alert(`Stock insuficiente. Disponible: ${articulo.stock_actual}`)
      return
    }

    const total = nuevoDetalle.cantidad * articulo.precio_venta

    const detalle: DetalleSalida = {
      idarticulo: nuevoDetalle.idarticulo,
      articulo: articulo.articulo,
      cantidad: nuevoDetalle.cantidad,
      stock_disponible: articulo.stock_actual,
      precio_unitario: articulo.precio_venta,
      total,
    }

    setDetalles([...detalles, detalle])
    setNuevoDetalle({
      idarticulo: 0,
      cantidad: 1,
    })
  }

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(nuevosDetalles)
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, detalle) => sum + detalle.total, 0)
  }

  const validarStock = (articuloId: number, cantidad: number) => {
    const articulo = articulos.find((a) => a.idarticulo === articuloId)
    return articulo ? cantidad <= articulo.stock_actual : false
  }

  const guardarSalida = async () => {
    if (!salidaData.nro_comprobante) {
      alert("Debe ingresar el número de comprobante")
      return
    }

    if (!salidaData.destino) {
      alert("Debe especificar el destino")
      return
    }

    if (!salidaData.motivo) {
      alert("Debe seleccionar un motivo")
      return
    }

    if (detalles.length === 0) {
      alert("Debe agregar al menos un artículo")
      return
    }

    // Validar stock para todos los artículos
    for (const detalle of detalles) {
      if (!validarStock(detalle.idarticulo, detalle.cantidad)) {
        alert(`Stock insuficiente para ${detalle.articulo}`)
        return
      }
    }

    try {
      setSaving(true)

      // Crear el registro principal
      const salidaPayload: SalidaPayload = {
        tipo_movimiento: "SALIDA",
        destino: salidaData.destino,
        fecha: salidaData.fecha,
        nro_comprobante: Number.parseInt(salidaData.nro_comprobante),
        usuario: salidaData.usuario,
        motivo: salidaData.motivo,
      }

      const salidaCreada = await crearSalida(salidaPayload)

      // Crear los detalles
      for (const detalle of detalles) {
        const detallePayload: DetallePayload = {
          idregistro: salidaCreada.idregistro,
          idarticulo: detalle.idarticulo,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          total: detalle.total,
        }

        await crearDetalle(detallePayload)

        // Actualizar el stock del artículo (disminuir)
        const articulo = articulos.find((a) => a.idarticulo === detalle.idarticulo)
        if (articulo) {
          const nuevoStock = articulo.stock_actual - detalle.cantidad
          await actualizarArticulo(articulo.idarticulo, {
            ...articulo,
            stock_actual: nuevoStock,
          })
        }
      }

      // Limpiar el formulario
      setSalidaData({
        nro_comprobante: "",
        fecha: new Date().toISOString().split("T")[0],
        usuario: "admin",
        destino: "",
        motivo: "",
        observaciones: "",
      })
      setDetalles([])

      alert("Salida registrada exitosamente")

      // Recargar artículos para mostrar el stock actualizado
      await cargarArticulos()
    } catch (error) {
      console.error("Error al guardar salida:", error)
      alert("Error al guardar la salida")
    } finally {
      setSaving(false)
    }
  }

  const articuloSeleccionado = articulos.find((a) => a.idarticulo === nuevoDetalle.idarticulo)

  if (loading) {
    return <div className="p-6">Cargando datos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <PackageOpen className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-800">Registro de Salidas de Stock</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del registro */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Salida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nro_comprobante">Número de Comprobante</Label>
                  <Input
                    id="nro_comprobante"
                    type="number"
                    value={salidaData.nro_comprobante}
                    onChange={(e) => setSalidaData({ ...salidaData, nro_comprobante: e.target.value })}
                    placeholder="Ej: 2001"
                  />
                </div>
                <div>
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={salidaData.fecha}
                    onChange={(e) => setSalidaData({ ...salidaData, fecha: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destino">Destino</Label>
                  <Input
                    id="destino"
                    value={salidaData.destino}
                    onChange={(e) => setSalidaData({ ...salidaData, destino: e.target.value })}
                    placeholder="Ej: Departamento de Ventas, Cliente XYZ"
                  />
                </div>
                <div>
                  <Label htmlFor="motivo">Motivo</Label>
                  <Select
                    value={salidaData.motivo}
                    onValueChange={(value) => setSalidaData({ ...salidaData, motivo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosSalida.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Textarea
                  id="observaciones"
                  value={salidaData.observaciones}
                  onChange={(e) => setSalidaData({ ...salidaData, observaciones: e.target.value })}
                  placeholder="Información adicional sobre la salida..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Agregar artículos */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Artículos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="articulo">Artículo</Label>
                  <Select
                    value={nuevoDetalle.idarticulo.toString()}
                    onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, idarticulo: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {articulos
                        .filter((articulo) => articulo.stock_actual > 0)
                        .map((articulo) => (
                          <SelectItem key={articulo.idarticulo} value={articulo.idarticulo.toString()}>
                            {articulo.articulo} (Stock: {articulo.stock_actual})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={articuloSeleccionado?.stock_actual || 1}
                    value={nuevoDetalle.cantidad}
                    onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, cantidad: Number.parseInt(e.target.value) })}
                  />
                  {articuloSeleccionado && (
                    <p className="text-xs text-gray-500 mt-1">Disponible: {articuloSeleccionado.stock_actual}</p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarDetalle} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {articuloSeleccionado && nuevoDetalle.cantidad > articuloSeleccionado.stock_actual && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La cantidad solicitada ({nuevoDetalle.cantidad}) excede el stock disponible (
                    {articuloSeleccionado.stock_actual}).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lista de artículos agregados */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos en la Salida</CardTitle>
            </CardHeader>
            <CardContent>
              {detalles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Artículo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Disp.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalles.map((detalle, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.articulo}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.cantidad}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={detalle.stock_disponible - detalle.cantidad < 5 ? "destructive" : "outline"}
                            >
                              {detalle.stock_disponible}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">${detalle.precio_unitario.toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">${detalle.total.toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button onClick={() => eliminarDetalle(index)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay artículos agregados a la salida</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Salida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Artículos:</span>
                <Badge variant="outline">{detalles.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cantidad total:</span>
                <Badge variant="outline">{detalles.reduce((sum, d) => sum + d.cantidad, 0)}</Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Valor total:</span>
                  <span>${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={guardarSalida} disabled={saving || detalles.length === 0} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Salida"}
              </Button>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Usuario:</strong> {salidaData.usuario}
              </div>
              {salidaData.destino && (
                <div className="text-sm">
                  <strong>Destino:</strong> {salidaData.destino}
                </div>
              )}
              {salidaData.motivo && (
                <div className="text-sm">
                  <strong>Motivo:</strong> {salidaData.motivo}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artículos con bajo stock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Artículos con Bajo Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {articulos
                  .filter((a) => a.stock_actual <= 5)
                  .slice(0, 3)
                  .map((articulo) => (
                    <div key={articulo.idarticulo} className="flex justify-between text-xs">
                      <span className="truncate">{articulo.articulo}</span>
                      <Badge variant="destructive" className="text-xs">
                        {articulo.stock_actual}
                      </Badge>
                    </div>
                  ))}
                {articulos.filter((a) => a.stock_actual <= 5).length === 0 && (
                  <p className="text-xs text-gray-500">No hay artículos con bajo stock</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
