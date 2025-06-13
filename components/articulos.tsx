"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  obtenerArticulos,
  obtenerCategorias,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo, // ✅ nuevo import
  type ArticuloOut,
  type CategoriaOut,
  type ArticuloPayload,
} from "@/lib/api"

export default function Articulos() {
  const [articulos, setArticulos] = useState<ArticuloOut[]>([])
  const [categorias, setCategorias] = useState<CategoriaOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState<ArticuloOut | null>(null)
  const [filtros, setFiltros] = useState({ categoria: "", busqueda: "" })

  const [formData, setFormData] = useState<ArticuloPayload>({
    articulo: "",
    idcategoria: 0,
    descripcion: "",
    precio_venta: 0,
    stock_actual: 0,
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [articulosData, categoriasData] = await Promise.all([obtenerArticulos(), obtenerCategorias()])
      setArticulos(articulosData)
      setCategorias(categoriasData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingArticulo) {
        await actualizarArticulo(editingArticulo.idarticulo, formData)
      } else {
        await crearArticulo(formData)
      }
      await cargarDatos()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar artículo:", error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este artículo?")) {
      try {
        await eliminarArticulo(id)
        await cargarDatos()
      } catch (error) {
        console.error("Error al eliminar artículo:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      articulo: "",
      idcategoria: 0,
      descripcion: "",
      precio_venta: 0,
      stock_actual: 0,
    })
    setEditingArticulo(null)
  }

  const openModal = (articulo?: ArticuloOut) => {
    if (articulo) {
      setEditingArticulo(articulo)
      setFormData({
        articulo: articulo.articulo,
        idcategoria: articulo.idcategoria,
        descripcion: articulo.descripcion || "",
        precio_venta: articulo.precio_venta,
        stock_actual: articulo.stock_actual,
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const articulosFiltrados = articulos
    .filter((a) => a.deleted !== 1) // ✅ filtrar los eliminados
    .filter((articulo) => {
      const matchCategoria = !filtros.categoria || articulo.idcategoria.toString() === filtros.categoria
      const matchBusqueda =
        !filtros.busqueda || articulo.articulo.toLowerCase().includes(filtros.busqueda.toLowerCase())
      return matchCategoria && matchBusqueda
    })

  if (loading) return <div className="p-6">Cargando artículos...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Artículos</h2>
        <Button onClick={() => openModal()} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Artículo</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.idcategoria} value={categoria.idcategoria}>
                    {categoria.categoria}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nombre del artículo..."
                  className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de artículos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articulosFiltrados.map((articulo) => {
                  const categoria = categorias.find((c) => c.idcategoria === articulo.idcategoria)
                  return (
                    <tr key={articulo.idarticulo}>
                      <td className="px-6 py-4 whitespace-nowrap">{articulo.articulo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{categoria?.categoria || "Sin categoría"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            articulo.stock_actual <= 5
                              ? "bg-red-100 text-red-800"
                              : articulo.stock_actual <= 10
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {articulo.stock_actual}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">${Number(articulo.precio_venta).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-blue-500 hover:text-blue-700 mr-3" onClick={() => openModal(articulo)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleEliminar(articulo.idarticulo)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-lg font-medium">{editingArticulo ? "Editar Artículo" : "Nuevo Artículo"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.articulo}
                    onChange={(e) => setFormData({ ...formData, articulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.idcategoria}
                    onChange={(e) => setFormData({ ...formData, idcategoria: Number.parseInt(e.target.value) })}
                    required
                  >
                    <option value={0}>Seleccionar categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.idcategoria} value={categoria.idcategoria}>
                        {categoria.categoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: Number.parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingArticulo ? "Actualizar" : "Guardar"} Artículo</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
