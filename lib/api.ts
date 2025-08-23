const API_URL = "https://i20.com.ar/api_sofia/api.php";

// Interfaces tipadas

export interface CategoriaPayload {
  categoria: string;
}

export interface CategoriaOut extends CategoriaPayload {
  idcategoria: number;
  deleted?: number;
}

export interface ArticuloPayload {
  articulo: string;
  idcategoria: number;
  idproveedor?: number;
  descripcion?: string;
  precio_venta: number;
  stock_actual: number;
  costo: number;
}

export interface ArticuloOut extends ArticuloPayload {
  idarticulo: number;
  deleted?: number;
}

export interface ProveedorPayload {
  proveedor: string;
  direccion?: string;
  telefono: string;
}

export interface ProveedorOut extends ProveedorPayload {
  idproveedor: number;
  deleted?: number;
}

export interface RegistroPayload {
  idproveedor: number;
  tipo_movimiento: string;
  proveedor: string;
  fecha: string;
  nro_comprobante: number;
}

export interface RegistroOut extends RegistroPayload {
  idregistro: number;
  total: number;
  detalles: DetalleOut[];
}

export interface DetallePayload {
  idregistro: number;
  idarticulo: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  costo: number;
  fecha: string;
}

export interface DetalleOut extends DetallePayload {
  iddetalle: number;
  deleted?: number;
  articulo?: string; // Viene del JOIN con articulos
}

// Interface para registros con detalles
export interface RegistroConDetalles extends RegistroOut {
  detalles: DetalleOut[];
  destino?: string;
  motivo?: string;
}

// ==================== NUEVAS INTERFACES ====================

export interface ClientePayload {
  cliente: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  dni?: string;
  idtiporesponsable: number;
  idcomprobante: number;
  idlistaprecio: number;
}

export interface ClienteOut extends ClientePayload {
  idcliente: number;
  deleted?: number;
}

export interface ComprobantePayload {
  comprobante: string;
}

export interface ComprobanteOut extends ComprobantePayload {
  idcomprobante: number;
  deleted?: number;
}

export interface ListaPrecioPayload {
  listaprecio: string;
}

export interface ListaPrecioOut extends ListaPrecioPayload {
  idlistasprecios: number;
  deleted?: number;
}

export interface TipoResponsablePayload {
  tiporesponsable: string;
}

export interface TipoResponsableOut extends TipoResponsablePayload {
  idtiporesponsable: number;
  deleted?: number;
}

// ==================== CATEGORÍAS ====================

export async function obtenerCategorias(): Promise<CategoriaOut[]> {
  const url = `${API_URL}?categorias&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function obtenerCategoriaPorId(id: number): Promise<CategoriaOut> {
  const url = `${API_URL}?categorias&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener categoría");
  return res.json();
}

export async function crearCategoria(data: CategoriaPayload): Promise<CategoriaOut> {
  const url = `${API_URL}?categorias&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear categoría");
  return res.json();
}

export async function actualizarCategoria(id: number, data: CategoriaPayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?categorias&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar categoría");
  return res.json();
}

export async function eliminarCategoria(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?categorias&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar categoría");
  return res.json();
}

// ==================== ARTÍCULOS ====================

export async function obtenerArticulos(): Promise<ArticuloOut[]> {
  const url = `${API_URL}?articulos&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener artículos");
  return res.json();
}

export async function obtenerArticuloPorId(id: number): Promise<ArticuloOut[]> {
  const url = `${API_URL}?articulos&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener artículo");
  return res.json();
}

export async function obtenerArticulosBajoStock(): Promise<ArticuloOut[]> {
  const url = `${API_URL}?articulos&id=bajo-stock&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener artículos con bajo stock");
  return res.json();
}

export async function crearArticulo(data: ArticuloPayload): Promise<ArticuloOut> {
  const url = `${API_URL}?articulos&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear artículo");
  return res.json();
}

export async function actualizarArticulo(id: number, data: ArticuloPayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?articulos&id=${id}&llave=isp`;
  
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al actualizar artículo: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}

export async function eliminarArticulo(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?articulos&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar artículo");
  return res.json();
}

// ==================== PROVEEDORES ====================

export async function obtenerProveedores(): Promise<ProveedorOut[]> {
  const url = `${API_URL}?proveedores&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
}

export async function obtenerProveedorPorId(id: number): Promise<ProveedorOut[]> {
  const url = `${API_URL}?proveedores&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener proveedor");
  return res.json();
}

export async function crearProveedor(data: ProveedorPayload): Promise<ProveedorOut> {
  const url = `${API_URL}?proveedores&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear proveedor");
  return res.json();
}

export async function actualizarProveedor(id: number, data: ProveedorPayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?proveedores&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar proveedor");
  return res.json();
}

export async function eliminarProveedor(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?proveedores&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar proveedor");
  return res.json();
}

// ==================== REGISTROS ====================

export async function obtenerRegistros(): Promise<RegistroOut[]> {
  const url = `${API_URL}?registros&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener registros");
  return res.json();
}

export async function obtenerRegistrosConDetalles(): Promise<RegistroConDetalles[]> {
  const url = `${API_URL}?registros&id=con-detalles&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener registros con detalles");
  return res.json();
}

export async function crearRegistro(data: RegistroPayload): Promise<RegistroOut> {
  const url = `${API_URL}?registros&llave=isp`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear registro: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}

// ==================== DETALLES ====================

export async function obtenerDetalles(): Promise<DetalleOut[]> {
  const url = `${API_URL}?detalles&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener detalles");
  return res.json();
}

export async function crearDetalle(data: DetallePayload): Promise<DetalleOut> {
  const url = `${API_URL}?detalles&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear detalle");
  return res.json();
}

// ==================== ENTRADAS ====================

// Interface para entradas (que son registros con tipo_movimiento = "ENTRADA")
export interface EntradaPayload {
  idproveedor: number;
  tipo_movimiento: "ENTRADA";
  proveedor: string;
  fecha: string;
  nro_comprobante: number;
}

export async function crearEntrada(data: EntradaPayload): Promise<RegistroOut> {
  // Las entradas se crean como registros normales
  const registroPayload: RegistroPayload = {
    idproveedor: data.idproveedor,
    tipo_movimiento: data.tipo_movimiento,
    proveedor: data.proveedor,
    fecha: data.fecha,
    nro_comprobante: data.nro_comprobante,
  };

  const url = `${API_URL}?registros&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registroPayload),
  });
  if (!res.ok) throw new Error("Error al crear entrada");
  return res.json();
}

export async function obtenerEntradas(): Promise<RegistroOut[]> {
  const registros = await obtenerRegistros();
  return registros.filter(registro => registro.tipo_movimiento === "ENTRADA");
}

export async function obtenerEntradasConDetalles(): Promise<RegistroConDetalles[]> {
  const registros = await obtenerRegistrosConDetalles();
  return registros.filter(registro => registro.tipo_movimiento === "ENTRADA");
}

// ==================== SALIDAS ====================

// Interface para salidas (que son registros con tipo_movimiento = "SALIDA")
export interface SalidaPayload {
  tipo_movimiento: "SALIDA";
  destino: string;
  motivo: string;
  observaciones?: string;
  fecha: string;
  nro_comprobante: number;
}

export async function crearSalida(data: SalidaPayload): Promise<RegistroOut> {
  // Las salidas se crean como registros con datos específicos
  const registroPayload: RegistroPayload = {
    idproveedor: 0, // Para salidas no hay proveedor específico
    tipo_movimiento: data.tipo_movimiento,
    proveedor: data.destino, // Usamos el campo proveedor para almacenar el destino
    fecha: data.fecha,
    nro_comprobante: data.nro_comprobante,
  };

  const url = `${API_URL}?registros&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registroPayload),
  });
  if (!res.ok) throw new Error("Error al crear salida");
  return res.json();
}

export async function obtenerSalidas(): Promise<RegistroOut[]> {
  const registros = await obtenerRegistros();
  return registros.filter(registro => registro.tipo_movimiento === "SALIDA");
}

export async function obtenerSalidasConDetalles(): Promise<RegistroConDetalles[]> {
  const registros = await obtenerRegistrosConDetalles();
  return registros.filter(registro => registro.tipo_movimiento === "SALIDA");
}

// ==================== FUNCIONES DE STOCK ====================

// Función para obtener el stock actual de un artículo
export async function obtenerStockArticulo(idArticulo: number): Promise<number> {
  const articulos = await obtenerArticuloPorId(idArticulo);
  if (articulos.length === 0) {
    throw new Error("Artículo no encontrado");
  }
  return articulos[0].stock_actual;
}

// Función para actualizar solo el stock de un artículo
export async function actualizarStockArticulo(idArticulo: number, nuevoStock: number): Promise<{ success: boolean }> {
  // Primero obtenemos los datos actuales del artículo
  const articulos = await obtenerArticuloPorId(idArticulo);
  if (articulos.length === 0) {
    throw new Error("Artículo no encontrado");
  }
  
  const articuloActual = articulos[0];
  
  // Actualizamos solo cambiando el stock
  const datosActualizados: ArticuloPayload = {
    articulo: articuloActual.articulo,
    idcategoria: articuloActual.idcategoria,
    idproveedor: articuloActual.idproveedor,
    descripcion: articuloActual.descripcion,
    precio_venta: articuloActual.precio_venta,
    stock_actual: nuevoStock,
    costo: articuloActual.costo,
  };

  return await actualizarArticulo(idArticulo, datosActualizados);
}

// ==================== FUNCIONES DE MOVIMIENTOS COMPLETOS ====================

// Función para crear una entrada completa (registro + detalles)
export async function crearEntradaCompleta(
  entrada: EntradaPayload, 
  detalles: Omit<DetallePayload, 'idregistro'>[]
): Promise<{ registro: RegistroOut; detalles: DetalleOut[] }> {
  // Crear el registro de entrada
  const registro = await crearEntrada(entrada);
  
  // Crear los detalles
  const detallesCreados: DetalleOut[] = [];
  for (const detalle of detalles) {
    const detalleCompleto: DetallePayload = {
      ...detalle,
      idregistro: registro.idregistro,
    };
    const detalleCreado = await crearDetalle(detalleCompleto);
    detallesCreados.push(detalleCreado);
    
    // Actualizar stock del artículo (sumar)
    const stockActual = await obtenerStockArticulo(detalle.idarticulo);
    await actualizarStockArticulo(detalle.idarticulo, stockActual + detalle.cantidad);
  }
  
  return { registro, detalles: detallesCreados };
}

// Función para crear una salida completa (registro + detalles)
export async function crearSalidaCompleta(
  salida: SalidaPayload, 
  detalles: Omit<DetallePayload, 'idregistro'>[]
): Promise<{ registro: RegistroOut; detalles: DetalleOut[] }> {
  // Verificar que hay suficiente stock para todos los artículos
  for (const detalle of detalles) {
    const stockActual = await obtenerStockArticulo(detalle.idarticulo);
    if (stockActual < detalle.cantidad) {
      const articulos = await obtenerArticuloPorId(detalle.idarticulo);
      const nombreArticulo = articulos[0]?.articulo || `ID: ${detalle.idarticulo}`;
      throw new Error(`Stock insuficiente para ${nombreArticulo}. Stock actual: ${stockActual}, cantidad solicitada: ${detalle.cantidad}`);
    }
  }
  
  // Crear el registro de salida
  const registro = await crearSalida(salida);
  
  // Crear los detalles
  const detallesCreados: DetalleOut[] = [];
  for (const detalle of detalles) {
    const detalleCompleto: DetallePayload = {
      ...detalle,
      idregistro: registro.idregistro,
    };
    const detalleCreado = await crearDetalle(detalleCompleto);
    detallesCreados.push(detalleCreado);
    
    // Actualizar stock del artículo (restar)
    const stockActual = await obtenerStockArticulo(detalle.idarticulo);
    await actualizarStockArticulo(detalle.idarticulo, stockActual - detalle.cantidad);
  }
  
  return { registro, detalles: detallesCreados };
}

// ==================== FUNCIONES UTILITARIAS ====================

// Función para manejar errores de la API
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido en la API";
}

// Función para validar respuestas de la API
export function validateApiResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
  }
}

// Función para formatear fecha para la API
export function formatearFechaParaAPI(fecha: Date): string {
  return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Función para calcular el total de un detalle
export function calcularTotalDetalle(cantidad: number, precioUnitario: number): number {
  return Number((cantidad * precioUnitario).toFixed(2));
}

// Función para calcular el total de una lista de detalles
export function calcularTotalRegistro(detalles: DetallePayload[]): number {
  return detalles.reduce((total, detalle) => total + detalle.total, 0);
}

// ==================== CLIENTES ====================

export async function obtenerClientes(): Promise<ClienteOut[]> {
  const url = `${API_URL}?clientes&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

export async function obtenerClientePorId(id: number): Promise<ClienteOut> {
  const url = `${API_URL}?clientes&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener cliente");
  return res.json();
}

export async function crearCliente(data: ClientePayload): Promise<ClienteOut> {
  const url = `${API_URL}?clientes&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear cliente");
  return res.json();
}

export async function actualizarCliente(id: number, data: ClientePayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?clientes&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar cliente");
  return res.json();
}

export async function eliminarCliente(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?clientes&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar cliente");
  return res.json();
}

// ==================== COMPROBANTES ====================

export async function obtenerComprobantes(): Promise<ComprobanteOut[]> {
  const url = `${API_URL}?comprobantes&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener comprobantes");
  return res.json();
}

export async function obtenerComprobantePorId(id: number): Promise<ComprobanteOut> {
  const url = `${API_URL}?comprobantes&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener comprobante");
  return res.json();
}

export async function crearComprobante(data: ComprobantePayload): Promise<ComprobanteOut> {
  const url = `${API_URL}?comprobantes&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear comprobante");
  return res.json();
}

export async function actualizarComprobante(id: number, data: ComprobantePayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?comprobantes&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar comprobante");
  return res.json();
}

export async function eliminarComprobante(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?comprobantes&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar comprobante");
  return res.json();
}

// ==================== LISTAS DE PRECIOS ====================

export async function obtenerListasPrecios(): Promise<ListaPrecioOut[]> {
  const url = `${API_URL}?listasprecios&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener listas de precios");
  return res.json();
}

export async function obtenerListaPrecioPorId(id: number): Promise<ListaPrecioOut> {
  const url = `${API_URL}?listasprecios&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener lista de precio");
  return res.json();
}

export async function crearListaPrecio(data: ListaPrecioPayload): Promise<ListaPrecioOut> {
  const url = `${API_URL}?listasprecios&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear lista de precio");
  return res.json();
}

export async function actualizarListaPrecio(id: number, data: ListaPrecioPayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?listasprecios&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar lista de precio");
  return res.json();
}

export async function eliminarListaPrecio(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?listasprecios&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar lista de precio");
  return res.json();
}

// ==================== TIPOS DE RESPONSABLES ====================

export async function obtenerTiposResponsables(): Promise<TipoResponsableOut[]> {
  const url = `${API_URL}?tiposresponsables&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener tipos de responsables");
  return res.json();
}

export async function obtenerTipoResponsablePorId(id: number): Promise<TipoResponsableOut> {
  const url = `${API_URL}?tiposresponsables&id=${id}&llave=isp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener tipo de responsable");
  return res.json();
}

export async function crearTipoResponsable(data: TipoResponsablePayload): Promise<TipoResponsableOut> {
  const url = `${API_URL}?tiposresponsables&llave=isp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear tipo de responsable");
  return res.json();
}

export async function actualizarTipoResponsable(id: number, data: TipoResponsablePayload): Promise<{ success: boolean }> {
  const url = `${API_URL}?tiposresponsables&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar tipo de responsable");
  return res.json();
}

export async function eliminarTipoResponsable(id: number): Promise<{ deleted: boolean }> {
  const url = `${API_URL}?tiposresponsables&id=${id}&llave=isp`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar tipo de responsable");
  return res.json();
}