<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Backend API Configuration & Helper Utilities
 * Compatible with Hostinger Shared Hosting (PHP 8.x + MySQL + PDO)
 * Partner: Grofasto Digital Solutions (www.grofasto.com)
 */

// Strict error handling
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Set Indian Standard Time (IST)
date_default_timezone_set('Asia/Kolkata');

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Content-Type: application/json; charset=UTF-8');

// CORS Configuration
$allowedOrigins = [
    'https://upsrctc.grofasto.com',
    'http://localhost:3000',
    'http://localhost:5173'
];

$httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($httpOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $httpOrigin");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Secure Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? 80) == 443;
    session_set_cookie_params([
        'lifetime' => 86400 * 7, // 7 days
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Database Credentials from Environment or Hostinger Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u123456789_upsrctc');
define('DB_USER', getenv('DB_USER') ?: 'u123456789_user');
define('DB_PASS', getenv('DB_PASSWORD') ?: 'Hostinger_MySQL_Secret_Password');
define('DB_CHARSET', 'utf8mb4');

/**
 * Standard JSON Response Helper
 */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

/**
 * Get Decoded JSON Request Body
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Require Authenticated Session
 */
function requireAuth(): array {
    if (empty($_SESSION['user_id'])) {
        jsonResponse([
            'success' => false,
            'message' => 'Session expired or unauthenticated. Please login again.'
        ], 401);
    }
    return [
        'id' => $_SESSION['user_id'],
        'emp_id' => $_SESSION['emp_id'],
        'emp_name' => $_SESSION['emp_name'],
        'emp_type' => $_SESSION['emp_type'],
        'depot_name' => $_SESSION['depot_name'],
        'email' => $_SESSION['email'] ?? ''
    ];
}

/**
 * Require Admin or Super Admin Role
 */
function requireAdmin(): array {
    $user = requireAuth();
    if (!in_array($user['emp_type'], ['ADMIN', 'SUPER_ADMIN'], true)) {
        jsonResponse([
            'success' => false,
            'message' => 'Access Denied. Administrator privileges required.'
        ], 403);
    }
    return $user;
}

/**
 * Log System Action for Audit Trail
 */
function recordAuditLog(PDO $pdo, ?int $userId, ?string $empId, string $action, ?string $recordId = null, $details = null): void {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $agent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
        $detailsJson = is_string($details) ? $details : json_encode($details);

        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, emp_id, action, record_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $empId, $action, $recordId, $ip, $agent, $detailsJson]);
    } catch (\Throwable $e) {
        // Silently skip audit error so business action doesn't crash
        error_log("Audit log failed: " . $e->getMessage());
    }
}
