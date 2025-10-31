"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
    obtenerClientes, 
  obtenerClientesPaginados,
    crearCliente, 
    actualizarCliente, 
    eliminarCliente,
    obtenerTiposResponsables,
    obtenerComprobantes,
    crearComprobante,
    obtenerListasPrecios,
    type ClienteOut, 
    type ClientePayload,
    type TipoResponsableOut,
    type ComprobanteOut,
    type ListaPrecioOut
} from "@/lib/api"
import { Plus, Edit, Trash2, Search, Users } from "lucide-react"
import { toast } from "react-toastify"

export default function Clientes() {
  const [clientes, setClientes] = useState<ClienteOut[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [limit, setLimit] = useState(10)
  const [tiposResponsables, setTiposResponsables] = useState<TipoResponsableOut[]>([])
  const [comprobantes, setComprobantes] = useState<ComprobanteOut[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecioOut[]>([])
  const [filtroClientes, setFiltroClientes] = useState("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOut | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [formData, setFormData] = useState<ClientePayload>({
    cliente: "",
    direccion: "",
    localidad: "",
    provincia: "",
    dni: "",
    idtiporesponsable: 0,
    idcomprobante: -1, // -1 indica "no seleccionado"
    idlistaprecio: 0,
  })

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, limit])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [clientesP, tiposData, comprobantesData, listasData] = await Promise.all([
        obtenerClientesPaginados(paginaActual, limit),
        obtenerTiposResponsables(),
        obtenerComprobantes(),
        obtenerListasPrecios()
      ])
      const clientesData = Array.isArray(clientesP?.data) ? clientesP.data : []
      const pagination = clientesP?.pagination || null
      if (pagination) {
        setPaginaActual(Number(pagination.current_page) || 1)
        setTotalPaginas(Number(pagination.total_pages) || 1)
        setHasNext(Boolean(pagination.has_next))
        setHasPrev(Boolean(pagination.has_prev))
      }
      
      // Mapear IDs de comprobantes - si vienen con ID 0, usar ID 1 que es el real en BD
      const comprobantesCorregidos = comprobantesData.map(comp => ({
        ...comp,
        idcomprobante: comp.idcomprobante === 0 ? 1 : comp.idcomprobante
      }))
      
      
  setClientes(clientesData)
      setTiposResponsables(tiposData)
      setComprobantes(comprobantesCorregidos)
      setListasPrecios(listasData)
    } catch (error) {
      toast.error("Error al cargar los datos")
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const clientesList = Array.isArray(clientes) ? clientes : []
  const clientesFiltrados = clientesList.filter(cliente =>
    cliente.cliente.toLowerCase().includes(filtroClientes.toLowerCase()) ||
    cliente.dni?.toLowerCase().includes(filtroClientes.toLowerCase()) ||
    cliente.localidad?.toLowerCase().includes(filtroClientes.toLowerCase())
  ).sort((a, b) => a.cliente.localeCompare(b.cliente))

  const limpiarFormulario = () => {
    setFormData({
      cliente: "",
      direccion: "",
      localidad: "",
      provincia: "",
      dni: "",
      idtiporesponsable: 0,
      idcomprobante: -1, // -1 indica "no seleccionado"
      idlistaprecio: 0,
    })
    setClienteSeleccionado(null)
  }

  const abrirModal = (cliente?: ClienteOut) => {
    if (cliente) {
      setClienteSeleccionado(cliente)
      setFormData({
        cliente: cliente.cliente,
        direccion: cliente.direccion || "",
        localidad: cliente.localidad || "",
        provincia: cliente.provincia || "",
        dni: cliente.dni || "",
        idtiporesponsable: cliente.idtiporesponsable,
        idcomprobante: cliente.idcomprobante,
        idlistaprecio: cliente.idlistaprecio,
      })
    } else {
      limpiarFormulario()
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    limpiarFormulario()
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente.trim()) {
      toast.error("El nombre del cliente es requerido")
      return
    }

    if (formData.idtiporesponsable === 0) {
      toast.error("Debe seleccionar un tipo de responsable")
      return
    }

    if (formData.idcomprobante === -1) {
      toast.error("Debe seleccionar un tipo de comprobante")
      return
    }

    if (formData.idlistaprecio === 0) {
      toast.error("Debe seleccionar una lista de precios")
      return
    }

    try {
          if (clienteSeleccionado) {
            await actualizarCliente(clienteSeleccionado.idcliente, formData)
            toast.success("Cliente actualizado correctamente")
          } else {
      console.log("Payload enviado al crear cliente:", formData);
      console.log("ID Tipo Responsable:", formData.idtiporesponsable);
      console.log("ID Comprobante:", formData.idcomprobante);
      console.log("ID Lista Precio:", formData.idlistaprecio);
            const resultado = await crearCliente(formData)
            toast.success("Cliente creado correctamente")
          }
          await cargarDatos()
          cerrarModal()
        } catch (error: any) {
          let msg = "Error al guardar el cliente";
          if (error instanceof Error) {
            msg += ": " + error.message;
          } else if (typeof error === "string") {
            msg += ": " + error;
          }
          toast.error(msg);
          console.error(error)
    }
  }

  const manejarEliminar = async (cliente: ClienteOut) => {
    toast.info(
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">¿Eliminar cliente?</h3>
        <p className="text-sm mb-4">
          ¿Estás seguro de que deseas eliminar el cliente "{cliente.cliente}"? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => {
              toast.dismiss()
              toast.promise(
                eliminarCliente(cliente.idcliente).then(() => cargarDatos()),
                {
                  pending: 'Eliminando cliente...',
                  success: `Cliente "${cliente.cliente}" eliminado correctamente`,
                  error: 'Error al eliminar el cliente',
                }
              )
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sí, eliminar
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
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        closeButton: false,
      }
    )
  }

  const obtenerNombreTipoResponsable = (id: number) => {
    const tipo = tiposResponsables.find(t => t.idtiporesponsable === id)
    return tipo?.tiporesponsable || "Sin especificar"
  }

  const obtenerNombreComprobante = (id: number) => {
    const comprobante = comprobantes.find(c => c.idcomprobante === id)
    return comprobante?.comprobante || "Sin especificar"
  }

  const obtenerNombreListaPrecio = (id: number) => {
    const lista = listasPrecios.find(l => l.idlistasprecios === id)
    return lista?.listaprecio || "Sin especificar"
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando clientes...</div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold ml-4">Lista de Clientes</h1>
        </div>
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirModal()} className="mr-4">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {clienteSeleccionado ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={manejarSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                  <Input
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Nombre completo o razón social"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI/CUIT</label>
                  <Input
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="12345678 o 20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle y número"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                  <Input
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                    placeholder="Localidad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <Input
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    placeholder="Provincia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Responsable *</label>
                  <Select 
                    value={formData.idtiporesponsable === 0 ? "" : formData.idtiporesponsable.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, idtiporesponsable: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposResponsables.map((tipo) => (
                        <SelectItem key={tipo.idtiporesponsable} value={tipo.idtiporesponsable.toString()}>
                          {tipo.tiporesponsable}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Comprobante *</label>
                  <Select 
                    value={formData.idcomprobante === -1 ? "" : formData.idcomprobante.toString()} 
                    onValueChange={(value) => {
                      const idComprobante = parseInt(value)
                      setFormData(prev => ({
                        ...prev,
                        idcomprobante: idComprobante
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de comprobante" />
                    </SelectTrigger>
                    <SelectContent>
                      {comprobantes.length > 0 ? (
                        <>
                          {comprobantes.map((comprobante, index) => {
                            return (
                              <SelectItem 
                                key={`comp-${comprobante.idcomprobante}-${index}`} 
                                value={comprobante.idcomprobante.toString()}
                              >
                                {comprobante.comprobante}
                              </SelectItem>
                            )
                          })}
                        </>
                      ) : (
                        <SelectItem value="0" disabled>No hay comprobantes disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {comprobantes.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No se pudieron cargar los tipos de comprobante</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Precios *</label>
                  <Select 
                    value={formData.idlistaprecio === 0 ? "" : formData.idlistaprecio.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, idlistaprecio: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar lista de precios" />
                    </SelectTrigger>
                    <SelectContent>
                      {listasPrecios.map((lista) => (
                        <SelectItem key={lista.idlistasprecios} value={lista.idlistasprecios.toString()}>
                          {lista.listaprecio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {clienteSeleccionado ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, DNI o localidad..."
                value={filtroClientes}
                onChange={(e) => setFiltroClientes(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI/CUIT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Responsable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lista de Precios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.idcliente} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cliente.cliente}</div>
                        {cliente.direccion && (
                          <div className="text-sm text-gray-500">{cliente.direccion}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.dni || "Sin especificar"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.localidad && cliente.provincia 
                        ? `${cliente.localidad}, ${cliente.provincia}`
                        : cliente.localidad || cliente.provincia || "Sin especificar"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">
                        {obtenerNombreTipoResponsable(cliente.idtiporesponsable)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">
                        {obtenerNombreListaPrecio(cliente.idlistaprecio)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModal(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => manejarEliminar(cliente)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientesFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {filtroClientes ? "No se encontraron clientes que coincidan con la búsqueda" : "No hay clientes registrados"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
