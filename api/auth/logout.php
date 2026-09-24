<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Logout & Session Invalidation Endpoint
 */

require_once __DIR__ . '/../db.php';

if (!empty($_SESSION['user_id'])) {
    recordAuditLog($pdo, $_SESSION['user_id'], $_SESSION['emp_id'] ?? null, 'LOGOUT', (string)$_SESSION['user_id']);
}

// Clear all session variables
$_SESSION = [];

// Invalidate cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy session
session_destroy();

jsonResponse([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
