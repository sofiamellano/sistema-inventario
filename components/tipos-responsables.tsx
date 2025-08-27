"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  obtenerTiposResponsables, 
  crearTipoResponsable, 
  actualizarTipoResponsable, 
  eliminarTipoResponsable,
  obtenerClientes,
  type TipoResponsableOut, 
  type TipoResponsablePayload,
  type ClienteOut
} from "@/lib/api"
import { Plus, Edit, Trash2, Search, Shield, Users } from "lucide-react"
import { toast } from "react-toastify"

export default function TiposResponsables() {
  const [tiposResponsables, setTiposResponsables] = useState<TipoResponsableOut[]>([])
  const [clientes, setClientes] = useState<ClienteOut[]>([])
  const [filtroTipos, setFiltroTipos] = useState("")
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoResponsableOut | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [formData, setFormData] = useState<TipoResponsablePayload>({
    tiporesponsable: "",
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [tiposData, clientesData] = await Promise.all([
        obtenerTiposResponsables(),
        obtenerClientes()
      ])
      setTiposResponsables(tiposData)
      setClientes(clientesData)
    } catch (error) {
      toast.error("Error al cargar los tipos de responsables")
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const tiposFiltrados = tiposResponsables.filter(tipo =>
    tipo.tiporesponsable.toLowerCase().includes(filtroTipos.toLowerCase())
  )

  const limpiarFormulario = () => {
    setFormData({
      tiporesponsable: "",
    })
    setTipoSeleccionado(null)
  }

  const abrirModal = (tipo?: TipoResponsableOut) => {
    if (tipo) {
      setTipoSeleccionado(tipo)
      setFormData({
        tiporesponsable: tipo.tiporesponsable,
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
    
    if (!formData.tiporesponsable.trim()) {
      toast.error("El tipo de responsable es requerido")
      return
    }

    try {
      if (tipoSeleccionado) {
        await actualizarTipoResponsable(tipoSeleccionado.idtiporesponsable, formData)
        toast.success("Tipo de responsable actualizado correctamente")
      } else {
        await crearTipoResponsable(formData)
        toast.success("Tipo de responsable creado correctamente")
      }
      
      await cargarDatos()
      cerrarModal()
    } catch (error) {
      toast.error("Error al guardar el tipo de responsable")
      console.error(error)
    }
  }

  const manejarEliminar = async (tipo: TipoResponsableOut) => {
    // Verificar si hay clientes usando este tipo de responsable
    const clientesUsandoTipo = clientes.filter(cliente => cliente.idtiporesponsable === tipo.idtiporesponsable)
    
    if (clientesUsandoTipo.length > 0) {
      toast.error(`No se puede eliminar el tipo "${tipo.tiporesponsable}" porque está siendo utilizado por ${clientesUsandoTipo.length} cliente(s)`)
      return
    }

    toast.info(
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">¿Eliminar tipo de responsable?</h3>
        <p className="text-sm mb-4">
          ¿Estás seguro de que deseas eliminar el tipo "{tipo.tiporesponsable}"? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => {
              toast.dismiss()
              toast.promise(
                eliminarTipoResponsable(tipo.idtiporesponsable).then(() => cargarDatos()),
                {
                  pending: 'Eliminando tipo de responsable...',
                  success: `Tipo "${tipo.tiporesponsable}" eliminado correctamente`,
                  error: 'Error al eliminar el tipo de responsable',
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
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          minWidth: '400px',
          maxWidth: '500px'
        }
      }
    )
  }

  const contarClientesPorTipo = (idTipo: number) => {
    return clientes.filter(cliente => cliente.idtiporesponsable === idTipo).length
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando tipos de responsables...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold ml-4">Tipos de Responsables</h1>
        </div>
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirModal()} className="mr-4">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo de Responsable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tipoSeleccionado ? "Editar Tipo de Responsable" : "Nuevo Tipo de Responsable"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Responsable *</label>
                <Input
                  value={formData.tiporesponsable}
                  onChange={(e) => setFormData({ ...formData, tiporesponsable: e.target.value })}
                  placeholder="Ej: Responsable Inscripto, Monotributista, Consumidor Final"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define la categoría fiscal del cliente ante AFIP
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {tipoSeleccionado ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tipos de Responsables Fiscales</span>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tipo..."
                  value={filtroTipos}
                  onChange={(e) => setFiltroTipos(e.target.value)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Responsable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes Asignados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tiposFiltrados.map((tipo) => {
                    const clientesCount = contarClientesPorTipo(tipo.idtiporesponsable)
                    return (
                      <tr key={tipo.idtiporesponsable} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-amber-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900">{tipo.tiporesponsable}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <Badge variant={clientesCount > 0 ? "default" : "secondary"}>
                              {clientesCount} {clientesCount === 1 ? "cliente" : "clientes"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModal(tipo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manejarEliminar(tipo)}
                            className={`${clientesCount > 0 ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                            disabled={clientesCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {tiposFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filtroTipos ? "No se encontraron tipos que coincidan con la búsqueda" : "No hay tipos de responsables registrados"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-2">
                <p><strong>Responsable Inscripto:</strong> Empresas que emiten facturas A/M.</p>
                <p><strong>Monotributista:</strong> Pequeños contribuyentes que emiten facturas C.</p>
                <p><strong>Consumidor Final:</strong> No requiere comprobante fiscal específico.</p>
                <p><strong>Exento:</strong> Organismos exentos del pago de IVA.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
