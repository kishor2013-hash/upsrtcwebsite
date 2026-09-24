<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Admin Settings & External Portal Links Update Endpoint
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$admin = requireAdmin();
$input = getJsonInput();

try {
    $pdo->beginTransaction();

    // Update portal links if provided
    if (!empty($input['portal_links']) && is_array($input['portal_links'])) {
        $linkUpd = $pdo->prepare("UPDATE external_portal_links SET url = ? WHERE portal_key = ?");
        foreach ($input['portal_links'] as $key => $url) {
            $linkUpd->execute([trim($url), trim($key)]);
        }
    }

    // Update system & Grofasto settings if provided
    if (!empty($input['settings']) && is_array($input['settings'])) {
        $settUpd = $pdo->prepare("INSERT INTO application_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        foreach ($input['settings'] as $key => $value) {
            $settUpd->execute([trim($key), trim($value)]);
        }
    }

    $pdo->commit();

    recordAuditLog($pdo, $admin['id'], $admin['emp_id'], 'SETTINGS_UPDATE', null, [
        'updated_by' => $admin['emp_name']
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'System settings and portal links updated successfully.'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => 'Failed to update settings.'], 500);
}
