"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { login } from "@/lib/api";

export default function AuthGuard() {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      setShowModal(true);
      setCountdown(3);
    }
  }, []);

  useEffect(() => {
    if (!showModal) return;
    if (countdown === 0) {
      window.location.replace("/inventario/login/");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [showModal, countdown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ usuario: user, pass });
      if (res.success) {
        localStorage.setItem("usuario", res.usuario || user);
        localStorage.setItem("idusuario", String(res.idusuario || ""));
                router.push("/inventario");
      } else {
        setError(res.error || "Usuario o contraseña incorrectos");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Debe iniciar sesión
            </h2>
            <p className="mb-2">
              Será redirigido al login en{" "}
              <span className="font-bold text-blue-600">{countdown}</span>{" "}
              segundos...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
