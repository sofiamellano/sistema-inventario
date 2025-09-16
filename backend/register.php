<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils.php';

header("Content-Type: application/json");

// Leer datos del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);

$errors = validateInput($data, ['name', 'email', 'password']);
if (!empty($errors)) {
    handleError(implode(", ", $errors), 400);
}

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    handleError('El correo electrónico no es válido', 400);
}

try {
    // Verificar si el email ya existe
    $stmt = $pdo->prepare('SELECT user_id FROM zpusers WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        handleError('El email ya está registrado', 409);
    }

    // Registrar usuario
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO zpusers (name, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $hashedPassword]);
    $user_id = $pdo->lastInsertId();

    // Devuelve los datos del usuario para el frontend
    jsonResponse([
        'message' => 'Usuario registrado correctamente',
        'user' => [
            'user_id' => $user_id,
            'name' => $name,
            'email' => $email,
            'role' => 'usuario' // O el rol que corresponda
        ]
    ], 201);
} catch (Exception $e) {
    handleError('Error interno del servidor', 500);
}