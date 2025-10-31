"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  obtenerListasPrecios, 
  obtenerListasPreciosPaginadas,
  crearListaPrecio, 
  actualizarListaPrecio, 
  eliminarListaPrecio,
  obtenerClientes,
  type ListaPrecioOut, 
  type ListaPrecioPayload,
  type ClienteOut
} from "@/lib/api"
import { Plus, Edit, Trash2, Search, DollarSign, Users } from "lucide-react"
import { toast } from "react-toastify"

export default function ListasPrecios() {
  const [listasPrecios, setListasPrecios] = useState<ListaPrecioOut[]>([])
  const [clientes, setClientes] = useState<ClienteOut[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [limit, setLimit] = useState(10)
  const [filtroListas, setFiltroListas] = useState("")
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaPrecioOut | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [formData, setFormData] = useState<ListaPrecioPayload>({
    listaprecio: "",
  })

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, limit])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const [listasP, clientesData] = await Promise.all([
        obtenerListasPreciosPaginadas(paginaActual, limit),
        obtenerClientes()
      ])
      const listasData = Array.isArray(listasP?.data) ? listasP.data : []
      const pagination = listasP?.pagination || null
      if (pagination) {
        setPaginaActual(Number(pagination.current_page) || 1)
        setTotalPaginas(Number(pagination.total_pages) || 1)
        setHasNext(Boolean(pagination.has_next))
        setHasPrev(Boolean(pagination.has_prev))
      }
      setListasPrecios(listasData)
      setClientes(clientesData)
    } catch (error) {
      toast.error("Error al cargar las listas de precios")
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const listasList = Array.isArray(listasPrecios) ? listasPrecios : []
  const listasFiltradas = listasList.filter(lista =>
    lista.listaprecio.toLowerCase().includes(filtroListas.toLowerCase())
  )

  const limpiarFormulario = () => {
    setFormData({
      listaprecio: "",
    })
    setListaSeleccionada(null)
  }

  const abrirModal = (lista?: ListaPrecioOut) => {
    if (lista) {
      setListaSeleccionada(lista)
      setFormData({
        listaprecio: lista.listaprecio,
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
    
    if (!formData.listaprecio.trim()) {
      toast.error("El nombre de la lista de precios es requerido")
      return
    }

    try {
      if (listaSeleccionada) {
        await actualizarListaPrecio(listaSeleccionada.idlistasprecios, formData)
        toast.success("Lista de precios actualizada correctamente")
      } else {
        await crearListaPrecio(formData)
        toast.success("Lista de precios creada correctamente")
      }
      
      await cargarDatos()
      cerrarModal()
    } catch (error) {
      toast.error("Error al guardar la lista de precios")
      console.error(error)
    }
  }

  const manejarEliminar = async (lista: ListaPrecioOut) => {
    // Verificar si hay clientes usando esta lista de precios
    const clientesList = Array.isArray(clientes) ? clientes : []
    const clientesUsandoLista = clientesList.filter(cliente => cliente.idlistaprecio === lista.idlistasprecios)

    if (clientesUsandoLista.length > 0) {
      toast.error(`No se puede eliminar la lista "${lista.listaprecio}" porque está siendo utilizada por ${clientesUsandoLista.length} cliente(s)`)
      return
    }

    // Confirmación simple
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar la lista "${lista.listaprecio}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    try {
      await eliminarListaPrecio(lista.idlistasprecios)
      toast.success(`Lista "${lista.listaprecio}" eliminada correctamente`)
      await cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar la lista')
      console.error(error)
    }
  }

  const contarClientesPorLista = (idLista: number) => {
  const clientesList = Array.isArray(clientes) ? clientes : []
  return clientesList.filter(cliente => cliente.idlistaprecio === idLista).length
  }

  // Paginación helpers
  const paginaAnterior = () => { if (hasPrev) setPaginaActual(p => Math.max(1, p - 1)) }
  const paginaSiguiente = () => { if (hasNext) setPaginaActual(p => Math.min(totalPaginas, p + 1)) }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando listas de precios...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold ml-4">Listas de Precios</h1>
        </div>
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirModal()} className="mr-4">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Lista de Precios
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {listaSeleccionada ? "Editar Lista de Precios" : "Nueva Lista de Precios"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Lista *</label>
                <Input
                  value={formData.listaprecio}
                  onChange={(e) => setFormData({ ...formData, listaprecio: e.target.value })}
                  placeholder="Ej: Lista Mayorista, Lista Minorista, Lista VIP"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre se usará para identificar la lista en el sistema
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {listaSeleccionada ? "Actualizar" : "Crear"}
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
              <span>Listas de Precios</span>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar lista..."
                  value={filtroListas}
                  onChange={(e) => setFiltroListas(e.target.value)}
                  className="w-80"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Nombre</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Clientes Asignados</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listasFiltradas.map((lista) => {
                    const clientesCount = contarClientesPorLista(lista.idlistasprecios)
                    return (
                      <tr key={lista.idlistasprecios} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap w-1/2">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900">{lista.listaprecio}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center w-1/4">
                          <div className="flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <Badge variant={clientesCount > 0 ? "default" : "secondary"}>
                              {clientesCount} {clientesCount === 1 ? "cliente" : "clientes"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center w-1/4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModal(lista)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => manejarEliminar(lista)}
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
              {listasFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filtroListas ? "No se encontraron listas que coincidan con la búsqueda" : "No hay listas de precios registradas"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
