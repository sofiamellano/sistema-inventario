
import React, { useEffect, useState } from "react";
import { getConfig, updateConfig, ConfigOut, ConfigPayload } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

export default function ConfigEmpresa() {
  const [config, setConfig] = useState<ConfigOut | null>(null);
  const [form, setForm] = useState<ConfigPayload>({
    empresa: "",
    responsable: "",
    cuit: "",
    direccion: "",
    telefono: "",
    condicion_fiscal: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getConfig().then((data) => {
      if (data.length > 0) {
        setConfig(data[0]);
        setForm({
          empresa: data[0].empresa || "",
          responsable: data[0].responsable || "",
          cuit: data[0].cuit || "",
          direccion: data[0].direccion || "",
          telefono: data[0].telefono || "",
          condicion_fiscal: data[0].condicion_fiscal || "",
        });
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      if (config) {
        await updateConfig(config.idconfig, form);
        setSuccess("Datos actualizados correctamente");
        setConfig({ ...config, ...form });
        setOpen(false);
      }
    } catch (err) {
      setError("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardContent>
        <h2 className="text-xl font-bold mb-4">Datos de la Empresa</h2>
        {config ? (
          <div className="space-y-2">
            <div><b>Empresa:</b> {config.empresa}</div>
            <div><b>Responsable:</b> {config.responsable}</div>
            <div><b>CUIT:</b> {config.cuit}</div>
            <div><b>Dirección:</b> {config.direccion}</div>
            <div><b>Teléfono:</b> {config.telefono}</div>
            <div><b>Condición fiscal:</b> {config.condicion_fiscal}</div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Editar datos</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar datos de la empresa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Nombre de la empresa" required />
                  <Input name="responsable" value={form.responsable} onChange={handleChange} placeholder="Responsable" required />
                  <Input name="cuit" value={form.cuit} onChange={handleChange} placeholder="CUIT" required />
                  <Input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" required />
                  <Input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" required />
                  <Input name="condicion_fiscal" value={form.condicion_fiscal} onChange={handleChange} placeholder="Condición fiscal" required />
                  <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
                  {success && <div className="text-green-600 mt-2">{success}</div>}
                  {error && <div className="text-red-600 mt-2">{error}</div>}
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-gray-500">Cargando datos...</div>
        )}
      </CardContent>
    </Card>
  );
}
