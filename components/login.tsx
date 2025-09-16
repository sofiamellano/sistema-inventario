import React, { useState } from 'react';

interface LoginProps {
    onLogin?: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Por favor, ingrese usuario y contraseña.');
            return;
        }
        setError('');
        if (onLogin) {
            onLogin(username, password);
        }
        // Aquí podrías agregar lógica de autenticación real
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="username">Usuario</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        style={{ width: '100%', padding: 8, marginTop: 4 }}
                        autoComplete="username"
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', padding: 8, marginTop: 4 }}
                        autoComplete="current-password"
                    />
                </div>
                {error && (
                    <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
                )}
                <button type="submit" style={{ width: '100%', padding: 10 }}>
                    Entrar
                </button>
            </form>
        </div>
    );
};

export default Login;