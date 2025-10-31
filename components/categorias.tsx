"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { toast } from "react-toastify"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  obtenerCategoriasPaginadas,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type CategoriaOut,
  type CategoriaPayload,
} from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function Categorias() {
  const [categorias, setCategorias] = useState<CategoriaOut[]>([])
  const [loading, setLoading] = useState(true)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [limit, setLimit] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaOut | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [formData, setFormData] = useState<CategoriaPayload>({ categoria: "" })

  useEffect(() => {
    cargarCategorias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, limit])

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const resp = await obtenerCategoriasPaginadas(paginaActual, limit)
      const data = Array.isArray(resp?.data) ? resp.data : []
      const pagination = resp?.pagination || null
      if (pagination) {
        setPaginaActual(Number(pagination.current_page) || 1)
        setTotalPaginas(Number(pagination.total_pages) || 1)
        setHasNext(Boolean(pagination.has_next))
        setHasPrev(Boolean(pagination.has_prev))
      }
      setCategorias(data)
    } catch (error) {
      console.error("Error al cargar categorías:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategoria) {
        await actualizarCategoria(editingCategoria.idcategoria, formData)
      } else {
        await crearCategoria(formData)
      }
      await cargarCategorias()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar categoría:", error)
    }
  }

  const handleDelete = async (id: number) => {
    const categoriaAEliminar = categorias.find(c => c.idcategoria === id)
    
    toast.info(
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">¿Eliminar categoría?</h3>
        <p className="text-sm mb-4">
          ¿Estás seguro de que deseas eliminar la categoría "{categoriaAEliminar?.categoria}"? 
          Esta acción no se puede deshacer.
        </p>
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => {
              toast.dismiss()
              toast.promise(
                eliminarCategoria(id).then(() => cargarCategorias()),
                {
                  pending: 'Eliminando categoría...',
                  success: `Categoría "${categoriaAEliminar?.categoria}" eliminada correctamente`,
                  error: 'Error al eliminar la categoría',
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

  const resetForm = () => {
    setFormData({ categoria: "" })
    setEditingCategoria(null)
  }

  const openModal = (categoria?: CategoriaOut) => {
    if (categoria) {
      setEditingCategoria(categoria)
      setFormData({ categoria: categoria.categoria })
    } else {
      resetForm()
    }
    setShowModal(true)
  }



  const categoriasList = Array.isArray(categorias) ? categorias : []
  const categoriasFiltradas = categoriasList
    .filter(c => c.deleted !== 1)
    .filter(c => c.categoria.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.categoria.localeCompare(b.categoria))

  // Paginación helpers
  const paginaAnterior = () => { if (hasPrev) setPaginaActual(p => Math.max(1, p - 1)) }
  const paginaSiguiente = () => { if (hasNext) setPaginaActual(p => Math.min(totalPaginas, p + 1)) }

  if (loading) return <div className="p-6">Cargando categorías...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h2>
        <Button onClick={() => openModal()} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar categoría..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <Button onClick={paginaAnterior} disabled={!hasPrev}>Anterior</Button>
          <div className="text-sm">Página {paginaActual} de {totalPaginas}</div>
          <Button onClick={paginaSiguiente} disabled={!hasNext}>Siguiente</Button>
        </div>
      </Card>

      {/* Tabla de categorías */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoriasFiltradas.length > 0 ? (
                  categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.idcategoria}>
                      <td className="px-6 py-4 whitespace-nowrap">{categoria.idcategoria}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{categoria.categoria}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          className="text-blue-500 hover:text-blue-700 mr-3"
                          onClick={() => openModal(categoria)}
                          aria-label={`Editar ${categoria.categoria}`}
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(categoria.idcategoria)}
                          aria-label={`Eliminar ${categoria.categoria}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron categorías
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear/editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoria">Nombre de la categoría</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ingrese el nombre de la categoría"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingCategoria ? "Actualizar" : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  )
}
