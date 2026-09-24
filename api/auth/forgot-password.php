<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Forgot Password Request Endpoint
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();
$identifier = trim($input['identifier'] ?? $input['email'] ?? $input['emp_id'] ?? '');

if (empty($identifier)) {
    jsonResponse(['success' => false, 'message' => 'Please provide your registered Email or Employee ID.'], 422);
}

try {
    $stmt = $pdo->prepare("SELECT id, emp_id, full_name, email FROM users WHERE (LOWER(email) = LOWER(?) OR UPPER(emp_id) = UPPER(?)) AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        // Do not reveal whether user exists for security
        jsonResponse([
            'success' => true,
            'message' => 'If this account exists in the UPSRCTC system, password reset instructions and security token have been generated.'
        ]);
    }

    $token = bin2hex(random_bytes(16));
    $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

    $ins = $pdo->prepare("INSERT INTO password_resets (email, emp_id, token, expires_at) VALUES (?, ?, ?, ?)");
    $ins->execute([$user['email'], $user['emp_id'], $token, $expires]);

    recordAuditLog($pdo, $user['id'], $user['emp_id'], 'FORGOT_PASSWORD_REQUEST', $token);

    jsonResponse([
        'success' => true,
        'message' => 'Password reset request verified. Please enter your new password with the reset token.',
        'reset_token' => $token, // Provided for direct verification workflow
        'emp_id' => $user['emp_id']
    ]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Service error during password reset request.'], 500);
}
