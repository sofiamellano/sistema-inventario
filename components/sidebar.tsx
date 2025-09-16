"use client"

import { useState, useEffect } from "react"
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
  ChevronDown,
  ChevronRight,
  Menu,
  Users,
  DollarSign,
  FileText,
  UserCheck,
  TrendingUpDown,
  Settings,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  subItems?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { 
    id: "articulos", 
    label: "Artículos", 
    icon: Package,
    subItems: [
      { id: "articulos", label: "Artículos", icon: Package },
      { id: "categorias", label: "Categorías", icon: Tags },
      { id: "listas-precios", label: "Listas de Precios", icon: DollarSign },
      { id: "proveedores", label: "Proveedores", icon: Truck },
      { id: "clientes", label: "Clientes", icon: Users },
    ]
  },
  { 
    id: "movimientos", 
    label: "Movimientos", 
    icon: TrendingUpDown,
    subItems: [
      { id: "entradas", label: "Entradas", icon: ArrowDown },
      { id: "salidas", label: "Salidas", icon: ArrowUp },
      { id: "registros", label: "Registros", icon: RefreshCw },
    ]
  },
  { id: "configuraciones",
    label: "Configuraciones",
    icon: Settings,
    subItems: [
      { id: "tipos-responsables", label: "Tipos Responsables", icon: UserCheck },
      { id: "comprobantes", label: "Comprobantes", icon: FileText },
    ]
  },
  { id: "reportes", label: "Reportes", icon: PieChart },
]

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hasActiveToast, setHasActiveToast] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Detectar si hay toasts activos
  useEffect(() => {
    const checkForActiveToasts = () => {
      const toastElements = document.querySelectorAll('[data-testid="toast"]')
      setHasActiveToast(toastElements.length > 0)
    }

    const interval = setInterval(checkForActiveToasts, 100)
    return () => clearInterval(interval)
  }, [])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon
    const isExpanded = expandedItems.includes(item.id)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isActive = activeSection === item.id
    
    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (!hasActiveToast) {
              if (hasSubItems && !isCollapsed) {
                toggleExpanded(item.id)
              } else {
                onSectionChange(item.id)
                setIsMobileOpen(false)
              }
            }
          }}
          disabled={hasActiveToast}
          className={`
            w-full flex items-center justify-between p-2 rounded transition-colors
            ${level > 0 ? "ml-4 text-sm" : ""}
            ${isActive ? "bg-blue-600 text-white" : ""}
            ${hasActiveToast ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700"}
          `}
        >
          <div className="flex items-center space-x-2">
            <Icon className="w-6 h-6" />
            {!isCollapsed && <span>{item.label}</span>}
          </div>
          {!isCollapsed && hasSubItems && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {!isCollapsed && hasSubItems && isExpanded && (
          <div className="ml-2 mt-1 space-y-1">
            {item.subItems?.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    )
  }

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
          {!isCollapsed && <span className="text-xl font-bold">InventarioDUO</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map((item) => renderMenuItem(item))}
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

        {/* Usuario y cerrar sesión */}
        <SidebarFooter />
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
    </>
  )
}

// Footer del sidebar con usuario y logout
function SidebarFooter() {
  const [usuario, setUsuario] = useState<string | null>(null);

  useEffect(() => {
    setUsuario(localStorage.getItem("usuario"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("idusuario");
    window.location.href = "/inventario/login/";
  };

  return (
    <div className="w-full flex flex-col items-center mb-4 mt-auto">
      <div className="w-11/12 mb-2 bg-gray-100 rounded-lg p-3 text-center text-sm text-gray-700">
        Usuario: <span className="font-semibold">{usuario || "-"}</span>
      </div>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded w-11/12"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
