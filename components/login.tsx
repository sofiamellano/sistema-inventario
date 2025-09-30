"use client";
import { login } from "@/lib/api";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginProps {
    onLogin?: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Por favor, ingrese usuario y contraseña.');
            return;
        }
        setError('');
        // Usar la función login de api.ts
        login({ usuario: username, pass: password })
            .then(data => {
                if (data.success) {
                    // Guardar datos de sesión en localStorage
                    localStorage.setItem("usuario", data.usuario || username);
                    localStorage.setItem("idusuario", String(data.idusuario || ""));
                    router.push("/");
                } else {
                    setError(data.error || 'Usuario o contraseña incorrectos.');
                }
            })
            .catch(() => setError('Error de conexión con el servidor.'));
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Iniciar Sesión en Inventario</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm text-center py-2 bg-red-50 rounded-lg border border-red-200">{error}</div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-150"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;