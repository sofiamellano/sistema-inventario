"use client"

import { useEffect, useState, type ReactElement } from "react"
import {
  Package, Truck, RefreshCw, TrendingUp, TrendingDown, BarChart3
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart"
import {
  obtenerArticulos,
  obtenerProveedores,
  obtenerRegistrosConDetalles,
  obtenerArticulosBajoStock,
  obtenerCategorias,
  type ArticuloOut,
  type RegistroConDetalles,
  type CategoriaOut,
} from "@/lib/api"
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from "recharts"

import { getConfig, ConfigOut } from "@/lib/api"
import { useCallback } from "react"

const chartConfig = {
  entradas: { label: "Entradas", color: "hsl(var(--chart-1))" },
  salidas: { label: "Salidas", color: "hsl(var(--chart-2))" },
  stock: { label: "Stock", color: "hsl(var(--chart-3))" },
  valor: { label: "Valor", color: "hsl(var(--chart-4))" },
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]
export default function Dashboard() {
  const [stats, setStats] = useState({ articulos: 0, proveedores: 0, movimientos: 0 })
  const [empresa, setEmpresa] = useState<ConfigOut | null>(null)
  const [articulosBajoStock, setArticulosBajoStock] = useState<ArticuloOut[]>([])
  const [movimientosPorMes, setMovimientosPorMes] = useState<any[]>([])
  const [stockPorCategoria, setStockPorCategoria] = useState<any[]>([])
  const [valorInventario, setValorInventario] = useState<any[]>([])
  const [tendenciaMovimientos, setTendenciaMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
    getConfig().then(data => {
      if (data.length > 0) setEmpresa(data[0])
    })
  }, [])

  const cargarDatos = async () => {
    try {
      const [articulos, proveedores, registros, bajoStock, categorias] = await Promise.all([
        obtenerArticulos(),
        obtenerProveedores(),
        obtenerRegistrosConDetalles(),
        obtenerArticulosBajoStock(),
        obtenerCategorias(),
      ])

      const articulosActivos = articulos.filter(a => a.deleted !== 1)
      const categoriasActivas = categorias.filter(c => c.deleted !== 1)

      setStats({
        articulos: articulosActivos.length,
        proveedores: proveedores.length,
        movimientos: registros.length,
      })

      setArticulosBajoStock(bajoStock.filter(a => a.deleted !== 1))

      procesarMovimientosPorMes(registros)
      procesarStockPorCategoria(articulosActivos, categoriasActivas)
      procesarValorInventario(articulosActivos, categoriasActivas)
      procesarTendenciaMovimientos(registros)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const procesarMovimientosPorMes = (registros: RegistroConDetalles[]) => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const datos = meses.map((mes, index) => {
      const entradas = registros.filter((r) => new Date(r.fecha).getMonth() === index && r.tipo_movimiento === "ENTRADA").length
      const salidas = registros.filter((r) => new Date(r.fecha).getMonth() === index && r.tipo_movimiento === "SALIDA").length
      return { mes, entradas, salidas, total: entradas + salidas }
    })
    setMovimientosPorMes(datos)
  }

  const procesarStockPorCategoria = (articulos: ArticuloOut[], categorias: CategoriaOut[]) => {
    const datos = categorias.map((categoria) => {
      const articulosCategoria = articulos.filter((a) => a.idcategoria === categoria.idcategoria)
      return {
        categoria: categoria.categoria,
        stock: articulosCategoria.reduce((sum, a) => sum + Number(a.stock_actual), 0),
        articulos: articulosCategoria.length,
        valor: articulosCategoria.reduce((sum, a) => sum + Number(a.stock_actual) * Number(a.precio_venta), 0),
      }
    })
    setStockPorCategoria(datos)
  }

  const procesarValorInventario = (articulos: ArticuloOut[], categorias: CategoriaOut[]) => {
    const datos = categorias.map((categoria) => {
      const articulosCategoria = articulos.filter((a) => a.idcategoria === categoria.idcategoria)
      return {
        name: categoria.categoria,
        value: articulosCategoria.reduce((sum, a) => sum + Number(a.stock_actual) * Number(a.precio_venta), 0),
        articulos: articulosCategoria.length,
      }
    })
    setValorInventario(datos)
  }

  // FUNCIÓN CORREGIDA
  const procesarTendenciaMovimientos = (registros: RegistroConDetalles[]) => {
    const datos = []
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const fechaStr = fecha.toISOString().split("T")[0]
      const movimientosDia = registros.filter((r) => r.fecha === fechaStr)
      const entradas = movimientosDia.filter((r) => r.tipo_movimiento === "ENTRADA")
      const salidas = movimientosDia.filter((r) => r.tipo_movimiento === "SALIDA")
      
      // CORRECCIÓN: Sumar el total de los detalles de cada registro
      const totalEntradas = entradas.reduce((sum, r) => {
        return sum + r.detalles.reduce((detSum, detalle) => detSum + detalle.total, 0)
      }, 0)
      
      const totalSalidas = salidas.reduce((sum, r) => {
        return sum + r.detalles.reduce((detSum, detalle) => detSum + detalle.total, 0)
      }, 0)

      datos.push({
        fecha: fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
        entradas: totalEntradas,
        salidas: totalSalidas,
        movimientos: movimientosDia.length,
      })
    }
    setTendenciaMovimientos(datos)
  }

  if (loading) return <div className="p-6">Cargando dashboard...</div>

  return (
    <div className="p-6 space-y-6">
      {/* ...el resto del dashboard sin datos de empresa visibles... */}
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Package />} label="Artículos" value={stats.articulos} hint="Total registrados" color="blue" />
        <StatCard icon={<Truck />} label="Proveedores" value={stats.proveedores} hint="Activos" color="green" />
        <StatCard icon={<RefreshCw />} label="Movimientos" value={stats.movimientos} hint="Total registrados" color="purple" />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Movimientos por Mes" icon={<BarChart3 />}>
          <BarChart data={movimientosPorMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="entradas" fill="var(--color-entradas)" name="Entradas" />
            <Bar dataKey="salidas" fill="var(--color-salidas)" name="Salidas" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Tendencia de Valor (Últimos 7 días)" icon={<TrendingUp />}>
          <AreaChart data={tendenciaMovimientos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="entradas"
              stackId="1"
              stroke="var(--color-entradas)"
              fill="var(--color-entradas)"
              name="Entradas ($)"
            />
            <Area
              type="monotone"
              dataKey="salidas"
              stackId="1"
              stroke="var(--color-salidas)"
              fill="var(--color-salidas)"
              name="Salidas ($)"
            />
          </AreaChart>
        </ChartCard>
      </div>

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Stock por Categoría" icon={<Package />}>
          <LineChart data={stockPorCategoria}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey="stock" stroke="var(--color-stock)" strokeWidth={2} name="Stock Total" />
            <Line type="monotone" dataKey="articulos" stroke="var(--color-valor)" strokeWidth={2} name="Cantidad de Artículos" />
          </LineChart>
        </ChartCard>

        <ChartCard title="Valor del Inventario por Categoría" icon={<TrendingDown />}>
          <PieChart>
            <Pie
              data={valorInventario}
              cx="50%" cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {valorInventario.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">Valor: ${data.value.toFixed(2)}</p>
                      <p className="text-sm">Artículos: {data.articulos}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ChartCard>
      </div>

      {/* Artículos con bajo stock */}
      <Card>
        <CardHeader><CardTitle>Artículos con Bajo Stock</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artículo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articulosBajoStock.length > 0 ? articulosBajoStock.map((articulo) => (
                  <tr key={articulo.idarticulo}>
                    <td className="px-4 py-3">{articulo.articulo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        articulo.stock_actual <= 2 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {articulo.stock_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3">${Number(articulo.precio_venta).toFixed(2)}</td>
                    <td className="px-4 py-3"><button className="text-blue-500 hover:text-blue-700 text-sm">Solicitar</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No hay artículos con bajo stock</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, hint, color }: {
  icon: ReactElement; label: string; value: number; hint: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>{icon}</div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <h3 className="text-2xl font-bold">{value.toLocaleString()}</h3>
          <p className="text-green-500 text-xs font-medium">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, icon, children }: {
  title: string; icon: ReactElement; children: ReactElement;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          {children ?? <></>}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}