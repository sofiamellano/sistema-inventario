const API_URL = "https://i20.com.ar/api_sofia/api.php";
const API_KEY = "isp";

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
  descripcion?: string;
  precio_venta: number;
  stock_actual: number;
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
  fecha: string; // ISO string
  nro_comprobante: number;
  usuario: string;
}

export interface RegistroOut extends RegistroPayload {
  idregistro: number;
  deleted?: number;
}

export interface DetallePayload {
  idregistro: number;
  idarticulo: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export interface DetalleOut extends DetallePayload {
  iddetalle: number;
  deleted?: number;
  articulo: string;
}

// Funciones de consulta

export async function obtenerCategorias(): Promise<CategoriaOut[]> {
  const url = `${API_URL}?recurso=categorias&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function obtenerArticulos(): Promise<ArticuloOut[]> {
  const url = `${API_URL}?recurso=articulos&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener artículos");
  return res.json();
}

export async function obtenerArticulosBajoStock(): Promise<ArticuloOut[]> {
  // Si tu API PHP tiene una forma de filtrar bajo stock, adaptalo acá
  // Por ejemplo, si fuera recurso=articulos_bajo_stock
  const url = `${API_URL}?recurso=articulos_bajo_stock&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener artículos con bajo stock");
  return res.json();
}

export async function obtenerProveedores(): Promise<ProveedorOut[]> {
  const url = `${API_URL}?recurso=proveedores&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener proveedores");
  return res.json();
}

export async function obtenerRegistros(): Promise<RegistroOut[]> {
  const url = `${API_URL}?recurso=registros&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener registros");
  return res.json();
}

export async function obtenerDetalles(): Promise<DetalleOut[]> {
  const url = `${API_URL}?recurso=detalles&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener detalles");
  return res.json();
}

// Funciones de creación

export async function crearCategoria(data: CategoriaPayload): Promise<CategoriaOut> {
  const url = `${API_URL}?recurso=categorias&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar categoría");
  return res.json();
}

export async function crearArticulo(data: ArticuloPayload): Promise<ArticuloOut> {
  const url = `${API_URL}?recurso=articulos&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar artículo");
  return res.json();
}

export async function actualizarArticulo(id: number, data: ArticuloPayload): Promise<ArticuloOut> {
  const url = `${API_URL}?recurso=articulos&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar artículo");
  return res.json();
}

export async function crearProveedor(data: ProveedorPayload): Promise<ProveedorOut> {
  const url = `${API_URL}?recurso=proveedores&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar proveedor");
  return res.json();
}

export async function crearRegistro(data: RegistroPayload): Promise<RegistroOut> {
  const url = `${API_URL}?recurso=registros&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar registro");
  return res.json();
}

export async function crearDetalle(data: DetallePayload): Promise<DetalleOut> {
  const url = `${API_URL}?recurso=detalles&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar detalle");
  return res.json();
}

export async function eliminarArticulo(id: number): Promise<void> {
  const url = `${API_URL}?recurso=articulos&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar artículo");
}

export async function actualizarCategoria(id: number, data: CategoriaPayload): Promise<CategoriaOut> {
  const url = `${API_URL}?recurso=categorias&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar categoría");
  return res.json();
}

export async function eliminarCategoria(id: number): Promise<void> {
  const url = `${API_URL}?recurso=categorias&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar categoría");
}

export async function actualizarProveedor(id: number, data: ProveedorPayload): Promise<ProveedorOut> {
  const url = `${API_URL}?recurso=proveedores&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar proveedor");
  return res.json();
}

export async function eliminarProveedor(id: number): Promise<void> {
  const url = `${API_URL}?recurso=proveedores&id=${id}&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar proveedor");
}

// Registro con detalles

export interface RegistroConDetalles extends RegistroOut {
  destino?: string;
  motivo?: string;
  total: number;
  detalles: DetalleOut[];
}

export async function obtenerRegistrosConDetalles(): Promise<RegistroConDetalles[]> {
  const url = `${API_URL}?recurso=registros_con_detalles&llave=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener registros con detalles");
  return res.json();
}

// Salidas

export interface SalidaPayload {
  tipo_movimiento: "SALIDA";
  destino: string;
  motivo: string;
  observaciones?: string;
  fecha: string;
  nro_comprobante: number;
  usuario: string;
}

export async function crearSalida(data: SalidaPayload): Promise<RegistroOut> {
  const url = `${API_URL}?recurso=registros&llave=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar salida");
  return res.json();
}
