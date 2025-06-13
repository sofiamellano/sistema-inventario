"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

interface MetricasAvanzadasProps {
  datos: any[]
}

export default function MetricasAvanzadas({ datos }: MetricasAvanzadasProps) {
  const chartConfig = {
    ventas: {
      label: "Ventas",
      color: "hsl(var(--chart-1))",
    },
    compras: {
      label: "Compras",
      color: "hsl(var(--chart-2))",
    },
    margen: {
      label: "Margen",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Análisis de Rentabilidad</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="compras" fill="var(--color-compras)" name="Compras" />
                <Bar dataKey="ventas" fill="var(--color-ventas)" name="Ventas" />
                <Line type="monotone" dataKey="margen" stroke="var(--color-margen)" strokeWidth={2} name="Margen %" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Indicadores Clave</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Rotación de Inventario</span>
              </div>
              <span className="text-lg font-bold text-green-600">4.2x</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Valor Promedio de Inventario</span>
              </div>
              <span className="text-lg font-bold text-blue-600">$12,450</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Días de Stock Promedio</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">87 días</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Artículos Sin Movimiento</span>
              </div>
              <span className="text-lg font-bold text-red-600">12</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
