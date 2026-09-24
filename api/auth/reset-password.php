<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Reset Password Execution Endpoint
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();
$token = trim($input['token'] ?? '');
$newPassword = $input['new_password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

if (empty($token) || empty($newPassword)) {
    jsonResponse(['success' => false, 'message' => 'Token and new password are required.'], 422);
}

if (strlen($newPassword) < 6) {
    jsonResponse(['success' => false, 'message' => 'Password must be at least 6 characters long.'], 422);
}

if ($newPassword !== $confirmPassword) {
    jsonResponse(['success' => false, 'message' => 'Passwords do not match.'], 422);
}

try {
    $stmt = $pdo->prepare("SELECT id, email, emp_id, expires_at FROM password_resets WHERE token = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1");
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        jsonResponse(['success' => false, 'message' => 'Invalid or expired password reset token.'], 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);

    $pdo->beginTransaction();

    $updUser = $pdo->prepare("UPDATE users SET password_hash = ? WHERE emp_id = ?");
    $updUser->execute([$newHash, $reset['emp_id']]);

    $updReset = $pdo->prepare("UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?");
    $updReset->execute([$reset['id']]);

    $pdo->commit();

    recordAuditLog($pdo, null, $reset['emp_id'], 'PASSWORD_RESET_SUCCESS', $reset['emp_id']);

    jsonResponse([
        'success' => true,
        'message' => 'Password reset successfully. You can now login with your new password.'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => 'Failed to reset password.'], 500);
}
