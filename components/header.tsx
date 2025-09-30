"use client"


import { useEffect, useState } from "react"
import { getConfig, ConfigOut } from "@/lib/api"
import { Search, Bell } from "lucide-react"

interface HeaderProps {
  title: string
}
export default function Header({ title }: HeaderProps) {
  const [empresa, setEmpresa] = useState<ConfigOut | null>(null)
  useEffect(() => {
    getConfig().then(data => {
      if (data.length > 0) setEmpresa(data[0])
    })
  }, [])
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex flex-col items-start">
        <h1 className="text-xl font-semibold text-gray-800 ml-16 md:ml-0">{title}</h1>
          {/* Eliminado subtítulo con nombre de empresa debajo del nombre de la página */}
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  )
}
