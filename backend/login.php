<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils.php';

// Redirigir al nuevo sistema de sesiones
header("Content-Type: application/json");

// Incluir el archivo de sesiones
require_once __DIR__ . '/session.php';

// Llamar a la función de login del sistema de sesiones
handleLogin();
?> 