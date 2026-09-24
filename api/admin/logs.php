<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Audit Logs API
 */

require_once __DIR__ . '/../db.php';

$admin = requireAdmin();

$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, max(10, intval($_GET['limit'] ?? 25)));
$offset = ($page - 1) * $limit;
$action = trim($_GET['action'] ?? '');
$empId = trim($_GET['emp_id'] ?? '');

$sql = "SELECT id, user_id, emp_id, action, record_id, ip_address, user_agent, details, created_at FROM audit_logs WHERE 1=1";
$params = [];

if (!empty($action)) {
    $sql .= " AND action = ?";
    $params[] = $action;
}
if (!empty($empId)) {
    $sql .= " AND emp_id = ?";
    $params[] = $empId;
}

$countSql = "SELECT COUNT(*) FROM (" . $sql . ") AS count_table";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$totalLogs = intval($countStmt->fetchColumn());

$sql .= " ORDER BY id DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    foreach ($logs as &$log) {
        if (!empty($log['details'])) {
            $log['details'] = json_decode($log['details'], true) ?: $log['details'];
        }
    }

    jsonResponse([
        'success' => true,
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalLogs,
            'pages' => ceil($totalLogs / $limit)
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Failed to fetch audit logs.'], 500);
}
