<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Check Current Authenticated Session
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (empty($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'authenticated' => false, 'message' => 'Not authenticated.'], 401);
}

try {
    $stmt = $pdo->prepare("SELECT id, emp_id, full_name, email, mobile, emp_type, depot_name, depot_code, designation, address, dob, joining_date, profile_photo, status, created_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'ACTIVE') {
        session_unset();
        session_destroy();
        jsonResponse(['success' => false, 'authenticated' => false, 'message' => 'Session expired or invalid.'], 401);
    }

    jsonResponse([
        'success' => true,
        'authenticated' => true,
        'user' => $user
    ]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Session retrieval failed.'], 500);
}
