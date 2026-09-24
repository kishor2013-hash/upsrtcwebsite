<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Admin Users Management Endpoint
 */

require_once __DIR__ . '/../db.php';

$admin = requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $depot = trim($_GET['depot'] ?? '');
    $role = trim($_GET['role'] ?? '');

    $sql = "SELECT id, emp_id, full_name, email, mobile, emp_type, depot_name, depot_code, designation, status, last_login, created_at FROM users WHERE deleted_at IS NULL";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (full_name LIKE ? OR emp_id LIKE ? OR email LIKE ? OR mobile LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if (!empty($depot)) {
        $sql .= " AND depot_name = ?";
        $params[] = $depot;
    }
    if (!empty($role)) {
        $sql .= " AND emp_type = ?";
        $params[] = $role;
    }

    $sql .= " ORDER BY id DESC";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'users' => $users
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to fetch users.'], 500);
    }
} else if ($method === 'POST') {
    // Update user status or role
    $input = getJsonInput();
    $targetId = intval($input['user_id'] ?? 0);
    $newStatus = trim($input['status'] ?? '');
    $newRole = trim($input['role'] ?? '');

    if ($targetId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Valid User ID is required.'], 422);
    }

    try {
        $fields = [];
        $params = [];

        if (!empty($newStatus) && in_array($newStatus, ['ACTIVE', 'SUSPENDED'], true)) {
            $fields[] = "status = ?";
            $params[] = $newStatus;
        }

        if (!empty($newRole) && in_array($newRole, ['DRIVER', 'CONDUCTOR', 'ADMIN', 'SUPER_ADMIN'], true)) {
            $fields[] = "emp_type = ?";
            $params[] = $newRole;
        }

        if (empty($fields)) {
            jsonResponse(['success' => false, 'message' => 'No valid changes specified.'], 422);
        }

        $params[] = $targetId;
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        recordAuditLog($pdo, $admin['id'], $admin['emp_id'], 'ADMIN_USER_UPDATE', (string)$targetId, $input);

        jsonResponse([
            'success' => true,
            'message' => 'Employee record updated successfully.'
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to update employee record.'], 500);
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}
