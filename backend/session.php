<?php
// CORS ya está incluido en route.php, no necesitamos incluirlo aquí
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils.php';

// Detectar si es producción (HTTPS)
$isProduction = (
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
);

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '', // O '.fiestaselfi.com.ar' si usas subdominios
    'secure' => $isProduction, // true en producción HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json");

// Obtener la acción solicitada
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check':
        checkSession();
        break;
    case 'user':
        getCurrentUser();
        break;
    default:
        handleError('Acción no válida', 400);
}

// Función para manejar el login y crear sesión
function handleLogin() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        handleError('Email y contraseña son requeridos', 400);
    }
    
    $email = $data['email'];
    $password = $data['password'];
    
    try {
        $stmt = $pdo->prepare('SELECT user_id, name, email, password, role_id FROM zpusers WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Crear sesión
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_role'] = $user['role_id'];
            $_SESSION['logged_in'] = true;
            $_SESSION['login_time'] = time();
            
            // No enviar la contraseña al frontend
            unset($user['password']);
            
            jsonResponse([
                'success' => true,
                'message' => 'Login exitoso',
                'user' => $user,
                'session_id' => session_id()
            ]);
        } else {
            handleError('Credenciales inválidas', 401);
        }
    } catch (Exception $e) {
        handleError('Error interno del servidor', 500);
    }
}

// Función para manejar el logout
function handleLogout() {
    // Destruir la sesión
    session_unset();
    session_destroy();

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

    jsonResponse([
        'success' => true,
        'message' => 'Logout exitoso'
    ]);
}

// Función para verificar si hay una sesión activa
function checkSession() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        jsonResponse([
            'success' => true,
            'logged_in' => true,
            'user_id' => $_SESSION['user_id'],
            'session_id' => session_id()
        ]);
    } else {
        jsonResponse([
            'success' => true,
            'logged_in' => false
        ]);
    }
}

// Función para obtener datos del usuario actual
function getCurrentUser() {
    global $pdo;
    
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        handleError('No hay sesión activa', 401);
    }
    
    try {
        $stmt = $pdo->prepare('SELECT user_id, name, email, role_id FROM zpusers WHERE user_id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            jsonResponse([
                'success' => true,
                'user' => $user
            ]);
        } else {
            handleError('Usuario no encontrado', 404);
        }
    } catch (Exception $e) {
        handleError('Error interno del servidor', 500);
    }
}

// Función helper para verificar si el usuario está autenticado
function isAuthenticated() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// Función helper para obtener el ID del usuario actual
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Función helper para obtener el rol del usuario actual
function getCurrentUserRole() {
    return $_SESSION['user_role'] ?? null;
}
?>