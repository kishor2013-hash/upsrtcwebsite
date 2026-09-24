<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Employee Authentication / Login Endpoint
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();

$loginId = trim($input['login_id'] ?? $input['email'] ?? '');
$password = $input['password'] ?? '';
$rememberMe = !empty($input['remember_me']);

if (empty($loginId) || empty($password)) {
    jsonResponse(['success' => false, 'message' => 'Login ID / Email and Password are required.'], 422);
}

try {
    // Find user by Email OR Employee ID
    $stmt = $pdo->prepare("SELECT id, emp_id, full_name, email, mobile, password_hash, emp_type, depot_name, depot_code, designation, status FROM users WHERE (LOWER(email) = LOWER(?) OR UPPER(emp_id) = UPPER(?)) AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$loginId, $loginId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'Invalid Login ID / Email or Password.'], 401);
    }

    if ($user['status'] !== 'ACTIVE') {
        jsonResponse(['success' => false, 'message' => 'Your account is ' . strtolower($user['status']) . '. Please contact your depot administrator.'], 403);
    }

    // Set secure session data
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['emp_id'] = $user['emp_id'];
    $_SESSION['emp_name'] = $user['full_name'];
    $_SESSION['emp_type'] = $user['emp_type'];
    $_SESSION['depot_name'] = $user['depot_name'];
    $_SESSION['email'] = $user['email'];

    // Update last login
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    recordAuditLog($pdo, $user['id'], $user['emp_id'], 'LOGIN', (string)$user['id'], [
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ]);

    unset($user['password_hash']);

    jsonResponse([
        'success' => true,
        'message' => 'Login successful.',
        'user' => $user
    ]);

} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Authentication service error. Please try again.'], 500);
}
