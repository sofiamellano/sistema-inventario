import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import { login } from "@/lib/api";


export default function App() {
	useEffect(() => {
		window.location.replace("/login");
	}, []);
	const [user, setUser] = useState("");
	const [pass, setPass] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleLogin = async (e) => {
		e.preventDefault();
		setError("");
		try {
			const res = await login({ usuario: user, pass });
			if (res.success) {
				localStorage.setItem("usuario", res.usuario || user);
				localStorage.setItem("idusuario", String(res.idusuario || ""));
				router.push("/page.tsx");
			} else {
				setError(res.error || "Usuario o contraseña incorrectos");
			}
		} catch {
			setError("Error de conexión");
		}
	};


		return null;
}
