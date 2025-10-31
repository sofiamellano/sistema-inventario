"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Calendar, Search, FileText, ArrowDown, ArrowUp, ChevronDown, ChevronUp, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  obtenerRegistrosConDetalles,
  type RegistroConDetalles,
  obtenerProveedores,
  type ProveedorOut,
} from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import * as XLSX from "xlsx"

export default function Registros() {
  const [registros, setRegistros] = useState<RegistroConDetalles[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<RegistroConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRegistro, setExpandedRegistro] = useState<number | null>(null)
  const [proveedores, setProveedores] = useState<ProveedorOut[]>([])

  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: "todos", // todos, entrada, salida
    fechaDesde: "",
    fechaHasta: "",
    busqueda: "",
  })

  useEffect(() => {
    cargarRegistros()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [filtros, registros])

  const cargarRegistros = async () => {
    try {
      setLoading(true)
      const [data, proveedoresData] = await Promise.all([obtenerRegistrosConDetalles(), obtenerProveedores()])
      setRegistros(data)
      setFilteredRegistros(data)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error al cargar registros:", error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...registros]

    // Filtrar por tipo
    if (filtros.tipo !== "todos") {
  resultado = (Array.isArray(resultado) ? resultado : []).filter((registro) => registro.tipo_movimiento.toLowerCase() === filtros.tipo.toLowerCase())
    }

    // Filtrar por fecha desde
    if (filtros.fechaDesde) {
  resultado = (Array.isArray(resultado) ? resultado : []).filter((registro) => new Date(registro.fecha) >= new Date(filtros.fechaDesde))
    }

    // Filtrar por fecha hasta
    if (filtros.fechaHasta) {
  resultado = (Array.isArray(resultado) ? resultado : []).filter((registro) => new Date(registro.fecha) <= new Date(filtros.fechaHasta))
    }

    // Filtrar por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
  resultado = (Array.isArray(resultado) ? resultado : []).filter(
        (registro) =>
          registro.nro_comprobante.toString().includes(busqueda) ||
          (registro.proveedor && registro.proveedor.toLowerCase().includes(busqueda)) ||
          (registro.destino && registro.destino.toLowerCase().includes(busqueda)),
      )
    }

    setFilteredRegistros(resultado)
  }

  const resetFiltros = () => {
    setFiltros({
      tipo: "todos",
      fechaDesde: "",
      fechaHasta: "",
      busqueda: "",
    })
  }

  const toggleExpandRegistro = (idregistro: number) => {
    if (expandedRegistro === idregistro) {
      setExpandedRegistro(null)
    } else {
      setExpandedRegistro(idregistro)
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Exportar a Excel xlsx SheetJS
  const exportarExcel = () => {
    const wsData = [
      [
        "ID Registro",
        "Tipo",
        "Fecha Detalle",
        "Comprobante",
        "Proveedor",
        "Destino",
        "Artículo",
        "Cantidad",
        "Precio Unitario",
        "Total Detalle"
      ]
    ];
    filteredRegistros.forEach((registro) => {
      registro.detalles.forEach((detalle) => {
        wsData.push([
          String(registro.idregistro),
          String(registro.tipo_movimiento),
          String(formatFecha(detalle.fecha || registro.fecha)),
          String(registro.nro_comprobante),
          registro.tipo_movimiento === "ENTRADA"
            ? String(registro.proveedor || proveedores.find((p) => p.idproveedor === registro.idproveedor)?.proveedor || "-")
            : "-",
          registro.tipo_movimiento === "SALIDA" ? String(registro.proveedor) : "-",
          String(detalle.articulo),
          String(detalle.cantidad),
          Number(detalle.precio_unitario).toFixed(2),
          Number(detalle.total).toFixed(2)
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `historial_movimientos_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  if (loading) {
    return <div className="p-6">Cargando historial de movimientos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Historial de Movimientos</h2>
        </div>
        <Button onClick={exportarExcel} variant="outline" className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Exportar Excel</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Movimiento</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="salida">Salidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fechaDesde">Desde</Label>
              <div className="relative">
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <Label htmlFor="fechaHasta">Hasta</Label>
              <div className="relative">
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <Label htmlFor="busqueda">Buscar</Label>
              <div className="relative">
                <Input
                  id="busqueda"
                  type="text"
                  placeholder="Comprobante, proveedor, destino..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={resetFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Movimientos</p>
              <h3 className="text-2xl font-bold">{filteredRegistros.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <ArrowDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Entradas</p>
              <h3 className="text-2xl font-bold">
                {(Array.isArray(filteredRegistros) ? filteredRegistros : []).filter((r) => r.tipo_movimiento === "ENTRADA").length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <ArrowUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Salidas</p>
              <h3 className="text-2xl font-bold">
                {(Array.isArray(filteredRegistros) ? filteredRegistros : []).filter((r) => r.tipo_movimiento === "SALIDA").length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos ({filteredRegistros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistros.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Detalle</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Total Detalle</TableHead>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistros.flatMap((registro) =>
                    registro.detalles.map((detalle) => (
                      <TableRow key={detalle.iddetalle}>
                        <TableCell>{registro.idregistro}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              registro.tipo_movimiento === "ENTRADA"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {registro.tipo_movimiento === "ENTRADA" ? (
                              <ArrowDown className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 mr-1" />
                            )}
                            {registro.tipo_movimiento}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFecha(detalle.fecha || registro.fecha)}</TableCell>
                        <TableCell>{registro.nro_comprobante}</TableCell>
                        <TableCell>{registro.tipo_movimiento === "ENTRADA"
                          ? registro.proveedor || proveedores.find((p) => p.idproveedor === registro.idproveedor)?.proveedor || "-"
                          : "-"}</TableCell>
                        <TableCell>{registro.tipo_movimiento === "SALIDA" ? registro.proveedor : "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(detalle.total).toFixed(2)}
                        </TableCell>
                        <TableCell>{detalle.articulo}</TableCell>
                        <TableCell>{detalle.cantidad}</TableCell>
                        <TableCell>${Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se encontraron registros con los filtros aplicados</div>
          )}
        </CardContent>
      </Card>

      {/* Vista por Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Vista por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="entradas">Entradas</TabsTrigger>
              <TabsTrigger value="salidas">Salidas</TabsTrigger>
            </TabsList>
            <TabsContent value="todos">
              <Accordion type="single" collapsible className="w-full">
                {filteredRegistros.map((registro) => (
                  <AccordionItem key={registro.idregistro} value={registro.idregistro.toString()}>
                    <AccordionTrigger>
                      <div className="flex items-center space-x-4">
                        <Badge
                          className={
                            registro.tipo_movimiento === "ENTRADA"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {registro.tipo_movimiento}
                        </Badge>
                        <span>
                          {formatFecha(registro.fecha)} - Comprobante #{registro.nro_comprobante}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Fecha:</p>
                            <p>{formatFecha(registro.fecha)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Comprobante:</p>
                            <p>#{registro.nro_comprobante}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {registro.tipo_movimiento === "ENTRADA" ? "Proveedor:" : "Destino:"}
                            </p>
                            <p>{registro.tipo_movimiento === "ENTRADA" ? registro.proveedor : registro.proveedor}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Artículos:</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Artículo</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Precio Unitario</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {registro.detalles.map((detalle) => (
                                <TableRow key={detalle.iddetalle}>
                                  <TableCell>{detalle.articulo}</TableCell>
                                  <TableCell>{detalle.cantidad}</TableCell>
                                  <TableCell>${Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${Number(detalle.total).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex justify-end">
                          <p className="font-bold">Total: ${Number(registro.total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
            <TabsContent value="entradas">
              <Accordion type="single" collapsible className="w-full">
                {filteredRegistros
                  .filter((r) => r.tipo_movimiento === "ENTRADA")
                  .map((registro) => (
                    <AccordionItem key={registro.idregistro} value={registro.idregistro.toString()}>
                      <AccordionTrigger>
                        <div className="flex items-center space-x-4">
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <ArrowDown className="w-3 h-3 mr-1" />
                            ENTRADA
                          </Badge>
                          <span>
                            {formatFecha(registro.fecha)} - {registro.proveedor}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Fecha:</p>
                              <p>{formatFecha(registro.fecha)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Comprobante:</p>
                              <p>#{registro.nro_comprobante}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Proveedor:</p>
                              <p>{registro.proveedor}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Artículos:</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Artículo</TableHead>
                                  <TableHead>Cantidad</TableHead>
                                  <TableHead>Precio Unitario</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {registro.detalles.map((detalle) => (
                                  <TableRow key={detalle.iddetalle}>
                                    <TableCell>{detalle.articulo}</TableCell>
                                    <TableCell>{detalle.cantidad}</TableCell>
                                    <TableCell>${Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${Number(detalle.total).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="flex justify-end">
                            <p className="font-bold">Total: ${Number(registro.total || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </TabsContent>
            <TabsContent value="salidas">
              <Accordion type="single" collapsible className="w-full">
                {filteredRegistros
                  .filter((r) => r.tipo_movimiento === "SALIDA")
                  .map((registro) => (
                    <AccordionItem key={registro.idregistro} value={registro.idregistro.toString()}>
                      <AccordionTrigger>
                        <div className="flex items-center space-x-4">
                          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            SALIDA
                          </Badge>
                          <span>
                            {formatFecha(registro.fecha)} - {registro.proveedor}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Fecha:</p>
                              <p>{formatFecha(registro.fecha)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Comprobante:</p>
                              <p>#{registro.nro_comprobante}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Destino:</p>
                              <p>{registro.proveedor}</p>
                            </div>
                          </div>
                          {registro.motivo && (
                            <div>
                              <p className="text-sm font-medium">Motivo:</p>
                              <p>{registro.motivo}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium mb-2">Artículos:</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Artículo</TableHead>
                                  <TableHead>Cantidad</TableHead>
                                  <TableHead>Precio Unitario</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {registro.detalles.map((detalle) => (
                                  <TableRow key={detalle.iddetalle}>
                                    <TableCell>{detalle.articulo}</TableCell>
                                    <TableCell>{detalle.cantidad}</TableCell>
                                    <TableCell>${Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${Number(detalle.total).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="flex justify-end">
                            <p className="font-bold">Total: ${Number(registro.total || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
