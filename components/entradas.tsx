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
  type ProveedorOut,
  type ArticuloOut,
  type RegistroPayload,
  type DetallePayload,
  obtenerCategorias,
  crearArticulo,
  type CategoriaOut,
  crearProveedor,
} from "@/lib/api"
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { calcularCostoPromedioPonderado } from "@/lib/utils"
import { actualizarArticulo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DetalleEntrada {
  idarticulo: number
  articulo: string
  cantidad: number
  precio_unitario: number
  total: number
  fecha?: string
}

export default function Entradas() {
  const [proveedores, setProveedores] = useState<ProveedorOut[]>([])
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaOut[]>([])
  const [nuevoArticuloExtra, setNuevoArticuloExtra] = useState({ idcategoria: 0, idproveedor: 0 })
  const [creandoArticulo, setCreandoArticulo] = useState(false)

  // Datos del registro principal
  const [registroData, setRegistroData] = useState({
    proveedor: "",
    idproveedor: 0,
    nro_comprobante: "",
    fecha: new Date().toISOString().split("T")[0],
  })

  // Detalles de la entrada
  const [detalles, setDetalles] = useState<DetalleEntrada[]>([])

  // Formulario para agregar artículo
  const [nuevoDetalle, setNuevoDetalle] = useState({
    articulo: "",
    idarticulo: 0,
    cantidad: 1,
    precio_unitario: 0,
  })

  const [nuevoProveedorExtra, setNuevoProveedorExtra] = useState({ direccion: "", telefono: "" })
  const [creandoProveedor, setCreandoProveedor] = useState(false)
  const { toast } = useToast();

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      console.log("cargarDatos - Iniciando carga de datos")
      
      const [proveedoresData, articulosData, categoriasData] = await Promise.all([
        obtenerProveedores(),
        obtenerArticulos(),
        obtenerCategorias()
      ])
      
      console.log("cargarDatos - Proveedores cargados:", proveedoresData.length)
      console.log("cargarDatos - Artículos cargados:", articulosData.length)
      console.log("cargarDatos - Primeros 3 artículos:", articulosData.slice(0, 3))
      
      setProveedores(proveedoresData)
      setArticulos(articulosData)
      setCategorias(categoriasData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const agregarDetalle = async () => {
    // Buscar el artículo por nombre exacto (ignorando mayúsculas/minúsculas)
    const articuloExistente = articulos.find(
      (a) => a.articulo.trim().toLowerCase() === nuevoDetalle.articulo.trim().toLowerCase()
    )
    let idarticulo = articuloExistente ? articuloExistente.idarticulo : 0

    // Si no existe, mostrar campos extra y esperar confirmación
    if (!articuloExistente && !creandoArticulo) {
      setCreandoArticulo(true)
      return
    }

    // Validaciones generales
    if (nuevoDetalle.cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0")
      return
    }
    if (nuevoDetalle.precio_unitario < 0) {
      alert("El precio unitario no puede ser negativo")
      return
    }
    if (detalles.find((d) => d.articulo.trim().toLowerCase() === nuevoDetalle.articulo.trim().toLowerCase())) {
      alert("Este artículo ya está agregado a la entrada")
      return
    }

    // Si no existe, crearlo
    if (!articuloExistente) {
      let idproveedorArticulo = nuevoArticuloExtra.idproveedor;
      if (idproveedorArticulo === -1) {
        // Usar el proveedor de la entrada (nuevo o existente)
        idproveedorArticulo = registroData.idproveedor;
        // Si el proveedor de la entrada aún no existe, crearlo primero
        if (!idproveedorArticulo || idproveedorArticulo === 0) {
          if (!registroData.proveedor.trim() || !nuevoProveedorExtra.direccion.trim() || !nuevoProveedorExtra.telefono.trim()) {
            alert("Debe completar los datos del nuevo proveedor para poder crear el artículo")
            return;
          }
          try {
            const nuevoProv = await crearProveedor({
              proveedor: registroData.proveedor.trim(),
              direccion: nuevoProveedorExtra.direccion.trim(),
              telefono: nuevoProveedorExtra.telefono.trim(),
            });
            idproveedorArticulo = nuevoProv.idproveedor;
            setRegistroData({ ...registroData, idproveedor: idproveedorArticulo });
            await cargarDatos();
          } catch (error) {
            alert("Error al crear el proveedor para el artículo")
            return;
          }
        }
      }
      if (!nuevoArticuloExtra.idcategoria || !idproveedorArticulo) {
        alert("Debe seleccionar categoría y proveedor para el nuevo artículo")
        return
      }
      // Crear el artículo
      try {
        const nuevoArticulo = await crearArticulo({
          articulo: nuevoDetalle.articulo.trim(),
          idcategoria: nuevoArticuloExtra.idcategoria,
          idproveedor: idproveedorArticulo,
          descripcion: "",
          precio_venta: nuevoDetalle.precio_unitario,
          stock_actual: 0,
          costo: nuevoDetalle.precio_unitario,
        })
        idarticulo = nuevoArticulo.idarticulo
        // Recargar artículos para tener el nuevo en la lista
        await cargarDatos()
        setCreandoArticulo(false)
        setNuevoArticuloExtra({ idcategoria: 0, idproveedor: 0 })
      } catch (error: any) {
        let msg = "Error al crear el artículo"
        if (error instanceof Error) {
          msg += ": " + error.message
        }
        alert(msg)
        return
      }
    }

    // Buscar el artículo actualizado
    const articulo = articulos.find((a) => a.idarticulo === idarticulo) || {
      articulo: nuevoDetalle.articulo,
      idarticulo,
    }
    const total = nuevoDetalle.cantidad * nuevoDetalle.precio_unitario
    const detalle = {
      idarticulo,
      articulo: articulo.articulo,
      cantidad: nuevoDetalle.cantidad,
      precio_unitario: nuevoDetalle.precio_unitario,
      total,
    }
    setDetalles([...detalles, detalle])
    setNuevoDetalle({ articulo: "", idarticulo: 0, cantidad: 1, precio_unitario: 0 })
    setCreandoArticulo(false)
    setNuevoArticuloExtra({ idcategoria: 0, idproveedor: 0 })
  }

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index)
    setDetalles(nuevosDetalles)
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, detalle) => sum + detalle.total, 0)
  }

  const guardarEntrada = async () => {
    // Validar proveedor
    if (!registroData.proveedor.trim()) {
      alert("Debe ingresar el nombre del proveedor")
      return
    }
    let idproveedor = registroData.idproveedor
    const proveedorExistente = proveedores.find(p => p.proveedor === registroData.proveedor)
    if (!proveedorExistente && !creandoProveedor) {
      setCreandoProveedor(true)
      return
    }
    if (!proveedorExistente && creandoProveedor) {
      if (!nuevoProveedorExtra.direccion.trim() || !nuevoProveedorExtra.telefono.trim()) {
        alert("Debe completar dirección y teléfono del nuevo proveedor")
        return
      }
      try {
        const nuevoProv = await crearProveedor({
          proveedor: registroData.proveedor.trim(),
          direccion: nuevoProveedorExtra.direccion.trim(),
          telefono: nuevoProveedorExtra.telefono.trim(),
        })
        idproveedor = nuevoProv.idproveedor
        await cargarDatos()
        setRegistroData({ ...registroData, idproveedor })
        setCreandoProveedor(false)
        setNuevoProveedorExtra({ direccion: "", telefono: "" })
      } catch (error) {
        alert("Error al crear el proveedor")
        return
      }
    } else if (proveedorExistente) {
      idproveedor = proveedorExistente.idproveedor
    }
    if (!idproveedor || idproveedor === 0) {
      alert("Debe seleccionar un proveedor válido")
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

      const proveedor = proveedores.find((p) => p.idproveedor === idproveedor)
      const totalEntrada = calcularTotal()

      // Crear el registro principal
      const registroPayload: RegistroPayload = {
        idproveedor,
        tipo_movimiento: "ENTRADA",
        proveedor: registroData.proveedor,
        fecha: registroData.fecha,
        nro_comprobante: Number(registroData.nro_comprobante),
      }

      const registroCreado = await crearRegistro(registroPayload)

      // Crear los detalles y actualizar stock y costo promedio
      for (const detalle of detalles) {
        const detallePayload: DetallePayload = {
          idregistro: registroCreado.idregistro,
          idarticulo: detalle.idarticulo,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          total: detalle.total,
          costo: detalle.precio_unitario,
          fecha: registroData.fecha,
        }
        await crearDetalle(detallePayload)

        // Calcular y actualizar el costo promedio ponderado
        const articulo = articulos.find((a) => Number(a.idarticulo) === Number(detalle.idarticulo))
        if (articulo) {
          const nuevoStock = articulo.stock_actual + detalle.cantidad
          const nuevoCosto = calcularCostoPromedioPonderado(
            articulo.stock_actual,
            articulo.costo,
            detalle.cantidad,
            detalle.precio_unitario
          )
          await actualizarArticulo(articulo.idarticulo, {
            ...articulo,
            stock_actual: nuevoStock,
            costo: nuevoCosto,
          })
          // ALERTA si el precio de venta es igual o menor al nuevo costo
          if (nuevoCosto > articulo.precio_venta) {
            toast({
              title: `¡Atención!`,
              description: `El costo del artículo "${articulo.articulo}" ha aumentado ($${nuevoCosto.toFixed(2)}). Considera actualizar el precio de venta para mantener tu margen de ganancia.`,
              variant: "default",
            })
          }
        }
      }

      // Limpiar el formulario
      setRegistroData({
        proveedor: "",
        idproveedor: 0,
        nro_comprobante: "",
        fecha: new Date().toISOString().split("T")[0],
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
                  <input
                    id="proveedor"
                    list="proveedores-list"
                    value={registroData.proveedor || ""}
                    onChange={e => {
                      const nombre = e.target.value;
                      setRegistroData({
                        ...registroData,
                        proveedor: nombre,
                        idproveedor: proveedores.find(p => p.proveedor === nombre)?.idproveedor || 0
                      });
                      setCreandoProveedor(false);
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <datalist id="proveedores-list">
                    {proveedores.map((p) => (
                      <option key={p.idproveedor} value={p.proveedor} />
                    ))}
                  </datalist>
                  {/* Mostrar campos de dirección y teléfono si el proveedor es nuevo */}
                  {registroData.proveedor && !proveedores.some(p => p.proveedor === registroData.proveedor) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 rounded mt-2">
                      <div>
                        <Label>Dirección</Label>
                        <Input
                          value={nuevoProveedorExtra.direccion}
                          onChange={e => setNuevoProveedorExtra({ ...nuevoProveedorExtra, direccion: e.target.value })}
                          placeholder="Dirección del proveedor"
                        />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          value={nuevoProveedorExtra.telefono}
                          onChange={e => setNuevoProveedorExtra({ ...nuevoProveedorExtra, telefono: e.target.value })}
                          placeholder="Teléfono del proveedor"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <span className="text-yellow-700 text-sm">Se creará un nuevo proveedor con estos datos</span>
                      </div>
                    </div>
                  )}
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
                  <input
                    list="articulos-list"
                    value={nuevoDetalle.articulo || ""}
                    onChange={e => {
                      setNuevoDetalle({ ...nuevoDetalle, articulo: e.target.value })
                      setCreandoArticulo(false)
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
                    value={nuevoDetalle.cantidad === 0 ? "" : nuevoDetalle.cantidad}
                    onChange={(e) => {
                      const valor = Number(e.target.value)
                      setNuevoDetalle({ ...nuevoDetalle, cantidad: isNaN(valor) ? 0 : valor })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="precio_unitario">Precio Unitario</Label>
                  <Input
                    id="precio_unitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoDetalle.precio_unitario === 0 ? "" : nuevoDetalle.precio_unitario}
                    onChange={(e) => {
                      const valor = Number(e.target.value)
                      setNuevoDetalle({ ...nuevoDetalle, precio_unitario: isNaN(valor) ? 0 : valor })
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarDetalle} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
              {creandoArticulo && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-yellow-50 p-4 rounded mt-2">
                  <div>
                    <Label>Categoría</Label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={nuevoArticuloExtra.idcategoria}
                      onChange={e => setNuevoArticuloExtra({ ...nuevoArticuloExtra, idcategoria: Number(e.target.value) })}
                    >
                      <option value={0}>Seleccionar categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.idcategoria} value={cat.idcategoria}>{cat.categoria}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Proveedor</Label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={nuevoArticuloExtra.idproveedor}
                      onChange={e => setNuevoArticuloExtra({ ...nuevoArticuloExtra, idproveedor: Number(e.target.value) })}
                    >
                      <option value={0}>Seleccionar proveedor</option>
                      {/* Opción temporal si el proveedor de la entrada no existe */}
                      {registroData.proveedor && !proveedores.some(p => p.proveedor === registroData.proveedor) && (
                        <option value={-1}>{registroData.proveedor} (nuevo proveedor de la entrada)</option>
                      )}
                      {proveedores.map((prov) => (
                        <option key={prov.idproveedor} value={prov.idproveedor}>{prov.proveedor}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex items-end">
                    <span className="text-yellow-700 text-sm">Se creará un nuevo artículo con estos datos</span>
                  </div>
                </div>
              )}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Detalle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalles.map((detalle, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">{detalle.fecha ? detalle.fecha : registroData.fecha}</td>
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
