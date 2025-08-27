import { toast } from "sonner"

interface AlertaEliminarOptions {
  titulo: string
  mensaje: string
  nombreItem: string
  onConfirm: () => Promise<void>
  mensajeExito?: string
  mensajeError?: string
  mensajeCargando?: string
}

export function alertaEliminar({
  titulo,
  mensaje,
  nombreItem,
  onConfirm,
  mensajeExito = `${nombreItem} eliminado correctamente`,
  mensajeError = `Error al eliminar ${nombreItem.toLowerCase()}`,
  mensajeCargando = `Eliminando ${nombreItem.toLowerCase()}...`
}: AlertaEliminarOptions) {
  // Usar confirmación nativa del navegador
  if (window.confirm(`${titulo}\n\n${mensaje}\n\nEsta acción no se puede deshacer.`)) {
    toast.promise(onConfirm(), {
      loading: mensajeCargando,
      success: mensajeExito,
      error: mensajeError,
    })
  }
}
