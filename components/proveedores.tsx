"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search, Phone, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  type ProveedorOut,
  type ProveedorPayload,
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
import { Badge } from "@/components/ui/badge"

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<ProveedorOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<ProveedorOut | null>(null)
  const [proveedorToDelete, setProveedorToDelete] = useState<ProveedorOut | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [formData, setFormData] = useState<ProveedorPayload>({
    proveedor: "",
    direccion: "",
    telefono: "",
  })

  useEffect(() => {
    cargarProveedores()
  }, [])

  const cargarProveedores = async () => {
    try {
      setLoading(true)
      const data = await obtenerProveedores()
      setProveedores(data)
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProveedor) {
        await actualizarProveedor(editingProveedor.idproveedor, formData)
      } else {
        await crearProveedor(formData)
      }
      await cargarProveedores()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar proveedor:", error)
    }
  }

  const handleDelete = async () => {
    if (!proveedorToDelete) return

    try {
      await eliminarProveedor(proveedorToDelete.idproveedor)
      await cargarProveedores()
      setShowDeleteDialog(false)
      setProveedorToDelete(null)
    } catch (error) {
      console.error("Error al eliminar proveedor:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      proveedor: "",
      direccion: "",
      telefono: "",
    })
    setEditingProveedor(null)
  }

  const openModal = (proveedor?: ProveedorOut) => {
    if (proveedor) {
      setEditingProveedor(proveedor)
      setFormData({
        proveedor: proveedor.proveedor,
        direccion: proveedor.direccion || "",
        telefono: proveedor.telefono,
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const openDeleteDialog = (proveedor: ProveedorOut) => {
    setProveedorToDelete(proveedor)
    setShowDeleteDialog(true)
  }

  const proveedoresFiltrados = proveedores.filter(
    (proveedor) =>
      proveedor.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      (proveedor.direccion && proveedor.direccion.toLowerCase().includes(busqueda.toLowerCase())) ||
      proveedor.telefono.includes(busqueda),
  )

  if (loading) {
    return <div className="p-6">Cargando proveedores...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Proveedores</h2>
        <Button onClick={() => openModal()} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
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
                placeholder="Buscar por nombre, dirección o teléfono..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proveedoresFiltrados.length > 0 ? (
                  proveedoresFiltrados.map((proveedor) => (
                    <tr key={proveedor.idproveedor}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{proveedor.proveedor}</div>
                        <div className="text-xs text-gray-500">ID: {proveedor.idproveedor}</div>
                      </td>
                      <td className="px-6 py-4">
                        {proveedor.direccion ? (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span>{proveedor.direccion}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            No especificada
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{proveedor.telefono}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          className="text-blue-500 hover:text-blue-700 mr-3"
                          onClick={() => openModal(proveedor)}
                          aria-label={`Editar ${proveedor.proveedor}`}
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteDialog(proveedor)}
                          aria-label={`Eliminar ${proveedor.proveedor}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron proveedores
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="proveedor">Nombre del proveedor</Label>
              <Input
                id="proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                placeholder="Ingrese el nombre del proveedor"
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección (opcional)</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ingrese la dirección del proveedor"
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Ingrese el teléfono del proveedor"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingProveedor ? "Actualizar" : "Guardar"}</Button>
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
              Esta acción eliminará el proveedor "{proveedorToDelete?.proveedor}". Esta acción no se puede deshacer.
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
