"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Save, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  obtenerProveedores,
  obtenerArticulos,
  crearRegistro,
  crearDetalle,
  actualizarArticulo,
  type ProveedorOut,
  type ArticuloOut,
  type RegistroPayload,
  type DetallePayload,
} from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DetalleEntrada {
  idarticulo: number
  articulo: string
  cantidad: number
  precio_unitario: number
  total: number
}

export default function Entradas() {
  const [proveedores, setProveedores] = useState<ProveedorOut[]>([])
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Datos del registro principal
  const [registroData, setRegistroData] = useState({
    idproveedor: 0,
    nro_comprobante: "",
    fecha: new Date().toISOString().split("T")[0],
    usuario: "admin", // En una app real, esto vendría del usuario logueado
  })

  // Detalles de la entrada
  const [detalles, setDetalles] = useState<DetalleEntrada[]>([])

  // Formulario para agregar artículo
  const [nuevoDetalle, setNuevoDetalle] = useState({
    idarticulo: 0,
    cantidad: 1,
    precio_unitario: 0,
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [proveedoresData, articulosData] = await Promise.all([obtenerProveedores(), obtenerArticulos()])
      setProveedores(proveedoresData)
      setArticulos(articulosData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
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
      alert("Este artículo ya está agregado a la entrada")
      return
    }

    const total = nuevoDetalle.cantidad * nuevoDetalle.precio_unitario

    const detalle: DetalleEntrada = {
      idarticulo: nuevoDetalle.idarticulo,
      articulo: articulo.articulo,
      cantidad: nuevoDetalle.cantidad,
      precio_unitario: nuevoDetalle.precio_unitario,
      total,
    }

    setDetalles([...detalles, detalle])
    setNuevoDetalle({
      idarticulo: 0,
      cantidad: 1,
      precio_unitario: 0,
    })
  }

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(nuevosDetalles)
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, detalle) => sum + detalle.total, 0)
  }

  const guardarEntrada = async () => {
    if (registroData.idproveedor === 0) {
      alert("Debe seleccionar un proveedor")
      return
    }

    if (!registroData.nro_comprobante) {
      alert("Debe ingresar el número de comprobante")
      return
    }

    if (detalles.length === 0) {
      alert("Debe agregar al menos un artículo")
      return
    }

    try {
      setSaving(true)

      const proveedor = proveedores.find((p) => p.idproveedor === registroData.idproveedor)

      // Crear el registro principal
      const registroPayload: RegistroPayload = {
        idproveedor: registroData.idproveedor,
        tipo_movimiento: "ENTRADA",
        proveedor: proveedor?.proveedor || "",
        fecha: registroData.fecha,
        nro_comprobante: Number.parseInt(registroData.nro_comprobante),
        usuario: registroData.usuario,
      }

      const registroCreado = await crearRegistro(registroPayload)

      // Crear los detalles
      for (const detalle of detalles) {
        const detallePayload: DetallePayload = {
          idregistro: registroCreado.idregistro,
          idarticulo: detalle.idarticulo,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          total: detalle.total,
        }

        await crearDetalle(detallePayload)

        // Actualizar el stock del artículo
        const articulo = articulos.find((a) => a.idarticulo === detalle.idarticulo)
        if (articulo) {
          const nuevoStock = articulo.stock_actual + detalle.cantidad
          await actualizarArticulo(articulo.idarticulo, {
            ...articulo,
            stock_actual: nuevoStock,
          })
        }
      }

      // Limpiar el formulario
      setRegistroData({
        idproveedor: 0,
        nro_comprobante: "",
        fecha: new Date().toISOString().split("T")[0],
        usuario: "admin",
      })
      setDetalles([])

      alert("Entrada registrada exitosamente")

      // Recargar artículos para mostrar el stock actualizado
      await cargarDatos()
    } catch (error) {
      console.error("Error al guardar entrada:", error)
      alert("Error al guardar la entrada")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando datos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Package className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Registro de Entradas de Stock</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del registro */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Select
                    value={registroData.idproveedor.toString()}
                    onValueChange={(value) => setRegistroData({ ...registroData, idproveedor: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((proveedor) => (
                        <SelectItem key={proveedor.idproveedor} value={proveedor.idproveedor.toString()}>
                          {proveedor.proveedor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nro_comprobante">Número de Comprobante</Label>
                  <Input
                    id="nro_comprobante"
                    type="number"
                    value={registroData.nro_comprobante}
                    onChange={(e) => setRegistroData({ ...registroData, nro_comprobante: e.target.value })}
                    placeholder="Ej: 1001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={registroData.fecha}
                    onChange={(e) => setRegistroData({ ...registroData, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="usuario">Usuario</Label>
                  <Input id="usuario" value={registroData.usuario} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agregar artículos */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Artículos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      {articulos.map((articulo) => (
                        <SelectItem key={articulo.idarticulo} value={articulo.idarticulo.toString()}>
                          {articulo.articulo}
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
                    value={nuevoDetalle.cantidad}
                    onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, cantidad: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="precio_unitario">Precio Unitario</Label>
                  <Input
                    id="precio_unitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoDetalle.precio_unitario}
                    onChange={(e) =>
                      setNuevoDetalle({ ...nuevoDetalle, precio_unitario: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarDetalle} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de artículos agregados */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos en la Entrada</CardTitle>
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
                <div className="text-center py-8 text-gray-500">No hay artículos agregados a la entrada</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Entrada</CardTitle>
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
                  <span>Total:</span>
                  <span>${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={guardarEntrada} disabled={saving || detalles.length === 0} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Entrada"}
              </Button>
            </CardContent>
          </Card>

          {/* Información del proveedor seleccionado */}
          {registroData.idproveedor > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proveedor Seleccionado</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const proveedor = proveedores.find((p) => p.idproveedor === registroData.idproveedor)
                  return proveedor ? (
                    <div className="space-y-2">
                      <div>
                        <strong>{proveedor.proveedor}</strong>
                      </div>
                      {proveedor.direccion && <div className="text-sm text-gray-600">{proveedor.direccion}</div>}
                      <div className="text-sm text-gray-600">{proveedor.telefono}</div>
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
