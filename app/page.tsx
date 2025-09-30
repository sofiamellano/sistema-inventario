"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import Dashboard from "@/components/dashboard"
import Articulos from "@/components/articulos"
import Categorias from "@/components/categorias"
import Proveedores from "@/components/proveedores"
import Clientes from "@/components/clientes"
import ListasPrecios from "@/components/listas-precios"
import TiposResponsables from "@/components/tipos-responsables"
import Comprobantes from "@/components/comprobantes"
import Entradas from "@/components/entradas"
import Salidas from "@/components/salidas"
import Registros from "@/components/registros"
import Reportes from "@/components/reportes"
import ConfigEmpresa from "@/components/config-empresa"


const sectionTitles = {
  dashboard: "Dashboard",
  articulos: "Artículos",
  categorias: "Categorías",
  proveedores: "Proveedores",
  clientes: "Clientes",
  "listas-precios": "Listas de Precios",
  "tipos-responsables": "Tipos Responsables",
  comprobantes: "Comprobantes",
  movimientos: "Movimientos",
  entradas: "Entradas",
  salidas: "Salidas",
  registros: "Registros",
  reportes: "Reportes",
  configuraciones: "Configuraciones",
}

export default function Home() {
  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      window.location.replace("/inventario/login/");
    }
  }, []);
  // Redirección eliminada, ahora se maneja en app.jsx con modal y cuenta regresiva
  const [activeSection, setActiveSection] = useState("dashboard")
  const [usuario, setUsuario] = useState<string | null>(null);
  useEffect(() => {
    const user = localStorage.getItem("usuario");
    setUsuario(user);
  }, []);

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
      case "tipos-responsables":
        return <TiposResponsables />
      case "comprobantes":
        return <Comprobantes />
      case "movimientos":
        return <Entradas /> 
      case "entradas":
        return <Entradas />
      case "salidas":
        return <Salidas />
      case "registros":
        return <Registros />
      case "reportes":
        return <Reportes />
      case "configuraciones":
        return <ConfigEmpresa />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header title={sectionTitles[activeSection as keyof typeof sectionTitles]} />
        {/* Eliminado barra superior de usuario y cerrar sesión, ahora está en el sidebar */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{renderContent()}</main>
      </div>
    </div>
  )
}
