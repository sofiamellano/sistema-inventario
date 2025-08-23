"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import Dashboard from "@/components/dashboard"
import Articulos from "@/components/articulos"
import Categorias from "@/components/categorias"
import Proveedores from "@/components/proveedores"
import Clientes from "@/components/clientes"
import ListasPrecios from "@/components/listas-precios"
import Entradas from "@/components/entradas"
import Salidas from "@/components/salidas"
// Importar el componente de registros
import Registros from "@/components/registros"
import Reportes from "@/components/reportes"


const sectionTitles = {
  dashboard: "Dashboard",
  articulos: "Artículos",
  categorias: "Categorías",
  proveedores: "Proveedores",
  clientes: "Clientes",
  "listas-precios": "Listas de Precios",
  entradas: "Entradas",
  salidas: "Salidas",
  registros: "Registros",
  reportes: "Reportes",
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard")

  // Actualizar la función renderContent para incluir el componente de registros
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "articulos":
        return <Articulos />
      case "categorias":
        return <Categorias />
      case "proveedores":
        return <Proveedores />
      case "clientes":
        return <Clientes />
      case "listas-precios":
        return <ListasPrecios />
      case "entradas":
        return <Entradas />
      case "salidas":
        return <Salidas />
      case "registros":
        return <Registros />
      case "reportes":
        return <Reportes />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header title={sectionTitles[activeSection as keyof typeof sectionTitles]} />

        <main className="flex-1 overflow-y-auto bg-gray-50">{renderContent()}</main>
      </div>
    </div>
  )
}
