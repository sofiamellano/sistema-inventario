"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type CategoriaOut,
  type CategoriaPayload,
} from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Categorias() {
  const [categorias, setCategorias] = useState<CategoriaOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaOut | null>(null)
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaOut | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [formData, setFormData] = useState<CategoriaPayload>({ categoria: "" })

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const data = await obtenerCategorias()
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

  const handleDelete = async () => {
    if (!categoriaToDelete) return
    try {
      await eliminarCategoria(categoriaToDelete.idcategoria)
      await cargarCategorias()
      setShowDeleteDialog(false)
      setCategoriaToDelete(null)
    } catch (error) {
      console.error("Error al eliminar categoría:", error)
    }
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

  const openDeleteDialog = (categoria: CategoriaOut) => {
    setCategoriaToDelete(categoria)
    setShowDeleteDialog(true)
  }

  const categoriasFiltradas = categorias
    .filter(c => c.deleted !== 1)
    .filter(c => c.categoria.toLowerCase().includes(busqueda.toLowerCase()))

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
                          onClick={() => openDeleteDialog(categoria)}
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

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{categoriaToDelete?.categoria}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
