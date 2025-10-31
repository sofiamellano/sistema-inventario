"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  obtenerComprobantesPaginados, 
  crearComprobante, 
  actualizarComprobante, 
  eliminarComprobante,
  obtenerClientes,
  type ComprobanteOut, 
  type ComprobantePayload,
  type ClienteOut
} from "@/lib/api"
import { Plus, Edit, Trash2, Search, FileText, Users } from "lucide-react"
import { getConfig, ConfigOut } from "@/lib/api"
import { toast } from "react-toastify"

export default function Comprobantes() {
  const [comprobantes, setComprobantes] = useState<ComprobanteOut[]>([])
  const [empresa, setEmpresa] = useState<ConfigOut | null>(null)
  const [clientes, setClientes] = useState<ClienteOut[]>([])
  const [filtroComprobantes, setFiltroComprobantes] = useState("")
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<ComprobanteOut | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [limit, setLimit] = useState(10)

  const [formData, setFormData] = useState<ComprobantePayload>({
    comprobante: "",
  })

  useEffect(() => {
    cargarDatos()
    getConfig().then(data => {
      if (data.length > 0) setEmpresa(data[0])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, limit])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [comprobantesResp, clientesData] = await Promise.all([
        obtenerComprobantesPaginados(paginaActual, limit),
        obtenerClientes()
      ])
      const comprobantesData = Array.isArray(comprobantesResp?.data) ? comprobantesResp.data : []
      const pagination = comprobantesResp?.pagination || null
      if (pagination) {
        setPaginaActual(Number(pagination.current_page) || 1)
        setTotalPaginas(Number(pagination.total_pages) || 1)
        setHasNext(Boolean(pagination.has_next))
        setHasPrev(Boolean(pagination.has_prev))
      }
      setComprobantes(comprobantesData)
      setClientes(clientesData)
    } catch (error) {
      toast.error("Error al cargar los comprobantes")
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const comprobantesList = Array.isArray(comprobantes) ? comprobantes : []
  const comprobantesFiltrados = comprobantesList.filter(comprobante =>
    comprobante.comprobante.toLowerCase().includes(filtroComprobantes.toLowerCase())
  )

  const limpiarFormulario = () => {
    setFormData({
      comprobante: "",
    })
    setComprobanteSeleccionado(null)
  }

  const abrirModal = (comprobante?: ComprobanteOut) => {
    if (comprobante) {
      setComprobanteSeleccionado(comprobante)
      setFormData({
        comprobante: comprobante.comprobante,
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
    
    if (!formData.comprobante.trim()) {
      toast.error("El nombre del comprobante es requerido")
      return
    }

    try {
      if (comprobanteSeleccionado) {
        await actualizarComprobante(comprobanteSeleccionado.idcomprobante, formData)
        toast.success("Comprobante actualizado correctamente")
      } else {
        await crearComprobante(formData)
        toast.success("Comprobante creado correctamente")
      }
      
      await cargarDatos()
      cerrarModal()
    } catch (error) {
      toast.error("Error al guardar el comprobante")
      console.error(error)
    }
  }

  const manejarEliminar = async (comprobante: ComprobanteOut) => {
    // Verificar si hay clientes usando este comprobante
      const clientesList = Array.isArray(clientes) ? clientes : []
      const clientesUsandoComprobante = clientesList.filter(cliente => cliente.idcomprobante === comprobante.idcomprobante)
    
    if (clientesUsandoComprobante.length > 0) {
      toast.error(`No se puede eliminar el comprobante "${comprobante.comprobante}" porque está siendo utilizado por ${clientesUsandoComprobante.length} cliente(s)`)
      return
    }

    toast.info(
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">¿Eliminar comprobante?</h3>
        <p className="text-sm mb-4">
          ¿Estás seguro de que deseas eliminar el comprobante "{comprobante.comprobante}"? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => {
              toast.dismiss()
              toast.promise(
                eliminarComprobante(comprobante.idcomprobante).then(() => cargarDatos()),
                {
                  pending: 'Eliminando comprobante...',
                  success: `Comprobante "${comprobante.comprobante}" eliminado correctamente`,
                  error: 'Error al eliminar el comprobante',
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

  const contarClientesPorComprobante = (idComprobante: number) => {
    const clientesList = Array.isArray(clientes) ? clientes : []
    return clientesList.filter(cliente => cliente.idcomprobante === idComprobante).length
  }

  // Paginación helpers
  const paginaAnterior = () => { if (hasPrev) setPaginaActual(p => Math.max(1, p - 1)) }
  const paginaSiguiente = () => { if (hasNext) setPaginaActual(p => Math.min(totalPaginas, p + 1)) }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando comprobantes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ...el resto de la pantalla de comprobantes sin datos de empresa visibles... */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold ml-4">Tipos de Comprobantes</h1>
        </div>
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirModal()} className="mr-4">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Comprobante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {comprobanteSeleccionado ? "Editar Comprobante" : "Nuevo Comprobante"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Comprobante *</label>
                <Input
                  value={formData.comprobante}
                  onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                  placeholder="Ej: Factura A, Factura B, Factura C, Recibo"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este será el tipo de comprobante que se asignará a los clientes
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {comprobanteSeleccionado ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tipos de Comprobantes</span>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar comprobante..."
                  value={filtroComprobantes}
                  onChange={(e) => setFiltroComprobantes(e.target.value)}
                  className="w-48"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Comprobante</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes Asignados</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comprobantesFiltrados.map((comprobante) => {
                    const clientesCount = contarClientesPorComprobante(comprobante.idcomprobante)
                    return (
                      <tr key={comprobante.idcomprobante} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900">{comprobante.comprobante}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <Badge variant={clientesCount > 0 ? "default" : "secondary"}>
                              {clientesCount} {clientesCount === 1 ? "cliente" : "clientes"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModal(comprobante)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => manejarEliminar(comprobante)}
                              className={`${clientesCount > 0 ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                              disabled={clientesCount > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {comprobantesFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filtroComprobantes ? "No se encontraron comprobantes que coincidan con la búsqueda" : "No hay comprobantes registrados"}
                </div>
              )}
            </div>
          </CardContent>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <Button onClick={paginaAnterior} disabled={!hasPrev}>Anterior</Button>
          <div className="text-sm">Página {paginaActual} de {totalPaginas}</div>
          <Button onClick={paginaSiguiente} disabled={!hasNext}>Siguiente</Button>
        </div>
        </Card>
      </div>
    </div>
  )
}
