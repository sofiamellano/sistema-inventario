"use client"

import { useState } from "react"
import {
  Warehouse,
  BarChart3,
  Package,
  Tags,
  Truck,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  PieChart,
  ChevronLeft,
  Menu,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "articulos", label: "Artículos", icon: Package },
  { id: "categorias", label: "Categorías", icon: Tags },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "entradas", label: "Entradas", icon: ArrowDown },
  { id: "salidas", label: "Salidas", icon: ArrowUp },
  { id: "registros", label: "Registros", icon: RefreshCw },
  { id: "reportes", label: "Reportes", icon: PieChart },
]

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-0 h-full bg-gray-800 text-white z-40 transition-all duration-300
        ${isCollapsed ? "w-16" : "w-64"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="p-4 flex items-center space-x-2 border-b border-gray-700">
          <Warehouse className="text-blue-400 w-8 h-8" />
          {!isCollapsed && <span className="text-xl font-bold">InventarioPro</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id)
                    setIsMobileOpen(false)
                  }}
                  className={`
                    w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors
                    ${activeSection === item.id ? "bg-blue-600 text-white" : ""}
                  `}
                >
                  <Icon className="w-6 h-6" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Collapse button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
          >
            <ChevronLeft className={`w-6 h-6 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
            {!isCollapsed && <span>Contraer</span>}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  )
}
