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
  obtenerProveedores,
  crearRegistro,
  crearProveedor,
  type ArticuloOut,
  type SalidaPayload,
  type DetallePayload,
} from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { toast } from "react-toastify"

interface DetalleSalida {
  idarticulo: number
  articulo: string
  cantidad: number
  stock_disponible: number
  precio_unitario: number
  total: number
  fecha?: string
}

const motivosSalida = ["Venta", "Devolución"]

export default function Salidas() {
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Usar localStorage para el estado persistente
  const [salidaData, setSalidaData] = useLocalStorage('salida-registro', {
    nro_comprobante: "",
    fecha: new Date().toISOString().split("T")[0],
    destino: "",
    motivo: "",
    observaciones: "",
  })

  const [detalles, setDetalles] = useLocalStorage<DetalleSalida[]>('salida-detalles', [])

  const [nuevoDetalle, setNuevoDetalle] = useLocalStorage('salida-nuevo-detalle', {
    idarticulo: 0,
    cantidad: 0,
    articulo: "",
  })

  // Función para limpiar todo el estado
  const limpiarEstado = () => {
    setSalidaData({
      nro_comprobante: "",
      fecha: new Date().toISOString().split("T")[0],
      destino: "",
      motivo: "",
      observaciones: "",
    })
    setDetalles([])
    setNuevoDetalle({
      idarticulo: 0,
      cantidad: 0,
      articulo: "",
    })
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [articulosData, proveedoresData] = await Promise.all([
        obtenerArticulos(),
        obtenerProveedores()
      ])
      setArticulos(articulosData)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarArticulos = async () => {
    try {
      const articulosData = await obtenerArticulos()
      setArticulos(articulosData)
    } catch (error) {
      console.error("Error al cargar artículos:", error)
    }
  }

  const agregarDetalle = () => {
    console.log("Función agregarDetalle llamada")
    console.log("nuevoDetalle:", nuevoDetalle)
    console.log("articulos:", articulos)
    console.log("Buscando artículo con ID:", nuevoDetalle.idarticulo, "tipo:", typeof nuevoDetalle.idarticulo)
    console.log("IDs disponibles:", articulos.map(a => ({ id: a.idarticulo, tipo: typeof a.idarticulo, nombre: a.articulo })))
    
    if (nuevoDetalle.idarticulo === 0) {
      console.log("No se seleccionó artículo")
      toast.error("Debe seleccionar un artículo")
      return
    }

    if (nuevoDetalle.cantidad <= 0 || isNaN(nuevoDetalle.cantidad)) {
      console.log("Cantidad inválida")
      toast.error("Debe ingresar una cantidad mayor a 0")
      return
    }

    const articulo = articulos.find((a) => a.idarticulo === nuevoDetalle.idarticulo)
    console.log("artículo encontrado:", articulo)
    
    if (!articulo) {
      console.log("No se encontró el artículo")
      toast.error("Artículo no encontrado")
      return
    }

    // Verificar si el artículo ya está en la lista
    const existeDetalle = detalles.find((d) => d.idarticulo === nuevoDetalle.idarticulo)
    if (existeDetalle) {
      console.log("Artículo ya existe en la lista")
      toast.error("Este artículo ya está agregado a la salida")
      return
    }

    // Verificar stock disponible
    if (nuevoDetalle.cantidad > Number(articulo.stock_actual)) {
      console.log("Stock insuficiente")
      toast.error(`Stock insuficiente. Disponible: ${articulo.stock_actual}`)
      return
    }

      // Ajustar el signo de la cantidad según el motivo
      let cantidadFinal = nuevoDetalle.cantidad;
      if (salidaData.motivo === "Venta") {
        cantidadFinal = -Math.abs(nuevoDetalle.cantidad);
      } else if (salidaData.motivo === "Devolución") {
        cantidadFinal = Math.abs(nuevoDetalle.cantidad);
      }
      const total = Math.abs(cantidadFinal) * Number(articulo.precio_venta);
      console.log("Total calculado:", total);

      const detalle: DetalleSalida = {
        idarticulo: nuevoDetalle.idarticulo,
        articulo: articulo.articulo,
        cantidad: cantidadFinal,
        stock_disponible: Number(articulo.stock_actual),
        precio_unitario: Number(articulo.precio_venta),
        total,
      }

    console.log("Detalle a agregar:", detalle)
    setDetalles([...detalles, detalle])
    setNuevoDetalle({
      idarticulo: 0,
      cantidad: 0,
      articulo: "",
    })
    console.log("Detalle agregado exitosamente")
  }

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(nuevosDetalles)
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, detalle) => sum + Number(detalle.total), 0)
  }

  const validarStock = (articuloId: number, cantidad: number) => {
    const articulo = articulos.find((a) => a.idarticulo === articuloId || a.idarticulo === Number(articuloId) || Number(a.idarticulo) === articuloId)
    return articulo ? cantidad <= Number(articulo.stock_actual) : false
  }

  const guardarSalida = async () => {
    if (!salidaData.nro_comprobante) {
      toast.error("Debe ingresar el número de comprobante")
      return
    }

    if (!salidaData.destino) {
      toast.error("Debe especificar el destino")
      return
    }

    if (!salidaData.motivo) {
      toast.error("Debe seleccionar un motivo")
      return
    }

    if (detalles.length === 0) {
      toast.error("Debe agregar al menos un artículo")
      return
    }

    // Validar stock para todos los artículos
    for (const detalle of detalles) {
      if (!validarStock(detalle.idarticulo, detalle.cantidad)) {
        toast.error(`Stock insuficiente para ${detalle.articulo}`)
        return
      }
    }

    try {
      setSaving(true)

      // Buscar o crear un proveedor específico para salidas
      let proveedorSalidas = proveedores.find(p => p.proveedor.toLowerCase().includes('salida') || p.proveedor.toLowerCase().includes('sistema'))
      
      if (!proveedorSalidas) {
        console.log("Creando proveedor para salidas...")
        try {
          proveedorSalidas = await crearProveedor({
            proveedor: "Sistema - Salidas Internas",
            direccion: "Sistema interno de inventario",
            telefono: "000-000-0000"
          })
          console.log("Proveedor para salidas creado:", proveedorSalidas)
          
          // Actualizar la lista de proveedores
          const nuevosProveedores = await obtenerProveedores()
          setProveedores(nuevosProveedores)
        } catch (error) {
          console.error("Error al crear proveedor para salidas:", error)
          // Si no se puede crear, usar el primer proveedor disponible
          proveedorSalidas = proveedores.length > 0 ? proveedores[0] : { idproveedor: 1 }
        }
      }

      console.log("Datos a enviar a la API:")
      console.log("Proveedor para salidas:", proveedorSalidas)
      console.log("Detalles:", detalles)

      // Crear el registro principal usando la función crearRegistro directamente
      const registroPayload = {
        idproveedor: proveedorSalidas.idproveedor,
        tipo_movimiento: "SALIDA",
        proveedor: salidaData.destino, // Usar destino como proveedor
        fecha: salidaData.fecha, // Formato YYYY-MM-DD
        nro_comprobante: Number.parseInt(salidaData.nro_comprobante),
      }

      console.log("Payload del registro:", registroPayload)
      console.log("Tipo de fecha:", typeof salidaData.fecha)
      console.log("Fecha formateada:", salidaData.fecha)

      const salidaCreada = await crearRegistro(registroPayload)

      console.log("Registro creado:", salidaCreada)

      // Crear los detalles
      for (const detalle of detalles) {
        const detallePayload: DetallePayload = {
          idregistro: salidaCreada.idregistro,
          idarticulo: detalle.idarticulo,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          total: detalle.total,
          costo: detalle.precio_unitario,
          fecha: salidaData.fecha,
        }

  // ...existing code...
        await crearDetalle(detallePayload)

        // Actualizar el stock del artículo (disminuir)
        const articulo = articulos.find((a) => a.idarticulo === detalle.idarticulo || a.idarticulo === Number(detalle.idarticulo) || Number(a.idarticulo) === detalle.idarticulo)
        if (articulo) {
          let nuevoStock = Number(articulo.stock_actual);
          if (detalle.cantidad < 0) {
            nuevoStock = nuevoStock + detalle.cantidad; // cantidad negativa, resta
          } else {
            nuevoStock = nuevoStock + detalle.cantidad; // cantidad positiva, suma
          }
          await actualizarArticulo(articulo.idarticulo, {
            ...articulo,
            stock_actual: nuevoStock,
          });
        }
      }

      // Limpiar el formulario usando la función del contexto
      limpiarEstado()

      toast.success("Salida registrada exitosamente")

      // Recargar artículos para mostrar el stock actualizado
      await cargarArticulos()
    } catch (error) {
      console.error("Error al guardar salida:", error)
      toast.error("Error al guardar la salida: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setSaving(false)
    }
  }

  const articuloSeleccionado = articulos.find((a) => a.idarticulo === nuevoDetalle.idarticulo || a.idarticulo === Number(nuevoDetalle.idarticulo) || Number(a.idarticulo) === nuevoDetalle.idarticulo)

      const articulosList = Array.isArray(articulos) ? articulos : []
      const proveedoresList = Array.isArray(proveedores) ? proveedores : []
      const articulosFiltrados = salidaData.destino
    ? articulosList.filter((a) => {
        const proveedor = proveedoresList.find((p) => p.proveedor === salidaData.destino);
        return proveedor && a.idproveedor === proveedor.idproveedor;
      })
    : [];

  if (loading) {
    return <div className="p-6">Cargando datos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PackageOpen className="w-8 h-8 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Registro de Salidas de Stock</h2>
        </div>
        {(detalles.length > 0 || salidaData.nro_comprobante || salidaData.destino || salidaData.motivo) && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Cambios sin guardar
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                toast.info(
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">¿Descartar todos los cambios?</h3>
                    <p className="text-sm mb-4">
                      Esta acción eliminará todos los datos de la salida actual, incluyendo el destino, 
                      motivo y todos los artículos agregados.
                    </p>
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => {
                          toast.dismiss()
                          toast.promise(
                            new Promise((resolve) => {
                              setTimeout(() => {
                                limpiarEstado()
                                resolve(true)
                              }, 500)
                            }),
                            {
                              pending: 'Descartando cambios...',
                              success: 'Cambios descartados correctamente',
                              error: 'Error al descartar cambios',
                            }
                          )
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Sí, descartar
                      </button>
                      <button
                        onClick={() => toast.dismiss()}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>,
                  {
                    position: "top-center",
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    closeButton: false,
                    style: {
                      minWidth: '400px',
                      maxWidth: '500px'
                    }
                  }
                )
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Descartar Cambios
            </Button>
          </div>
        )}
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
                  <input
                    id="destino"
                    value={salidaData.destino}
                    onChange={e => setSalidaData({ ...salidaData, destino: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Ej: Cliente, área, etc."
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
                  <input
                    list="articulos-list"
                    value={nuevoDetalle.articulo || ""}
                    onChange={e => {
                      const nombre = e.target.value;
                      const articuloObj = articulos.find(a => a.articulo === nombre);
                      setNuevoDetalle({
                        ...nuevoDetalle,
                        articulo: nombre,
                        idarticulo: articuloObj ? articuloObj.idarticulo : 0
                      });
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <datalist id="articulos-list">
                    {articulos.map((a) => (
                      <option key={a.idarticulo} value={a.articulo} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={articuloSeleccionado ? Number(articuloSeleccionado.stock_actual) : 1}
                    value={nuevoDetalle.cantidad}
                    onChange={(e) => {
                      const valor = e.target.value
                      const cantidad = valor === "" ? 0 : Number.parseInt(valor) || 0
                      setNuevoDetalle({ ...nuevoDetalle, cantidad })
                    }}
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

              {articuloSeleccionado && nuevoDetalle.cantidad > Number(articuloSeleccionado.stock_actual) && (
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Detalle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Disp.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalles.map((detalle, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.fecha ? detalle.fecha : salidaData.fecha}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.articulo}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.cantidad}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={detalle.stock_disponible - detalle.cantidad < 5 ? "destructive" : "outline"}
                            >
                              {detalle.stock_disponible}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">${Number(detalle.precio_unitario).toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">${Number(detalle.total).toFixed(2)}</td>
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
                {(Array.isArray(articulos) ? articulos : [])
                  .filter((a) => Number(a.stock_actual) <= 5)
                  .slice(0, 3)
                  .map((articulo) => (
                    <div key={articulo.idarticulo} className="flex justify-between text-xs">
                      <span className="truncate">{articulo.articulo}</span>
                      <Badge variant="destructive" className="text-xs">
                        {articulo.stock_actual}
                      </Badge>
                    </div>
                  ))}
                {(Array.isArray(articulos) ? articulos : []).filter((a) => Number(a.stock_actual) <= 5).length === 0 && (
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
