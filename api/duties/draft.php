<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Save & Retrieve Duty Drafts
 */

require_once __DIR__ . '/../db.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = getJsonInput();
    $dutyDate = trim($input['duty_date'] ?? date('Y-m-d'));
    $draftId = trim($input['draft_id'] ?? ('DRAFT-' . time() . '-' . rand(100, 999)));
    $draftData = json_encode($input['draft_data'] ?? $input);

    try {
        $stmt = $pdo->prepare("INSERT INTO duty_drafts (draft_id, user_id, emp_id, duty_date, draft_data)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE draft_data = VALUES(draft_data), duty_date = VALUES(duty_date), updated_at = CURRENT_TIMESTAMP");
        
        $stmt->execute([$draftId, $currentUser['id'], $currentUser['emp_id'], $dutyDate, $draftData]);

        recordAuditLog($pdo, $currentUser['id'], $currentUser['emp_id'], 'SAVE_DRAFT', $draftId);

        jsonResponse([
            'success' => true,
            'message' => 'Duty draft saved to database successfully.',
            'draft_id' => $draftId
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to save draft.'], 500);
    }
} else if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT draft_id, duty_date, draft_data, updated_at FROM duty_drafts WHERE user_id = ? ORDER BY updated_at DESC");
        $stmt->execute([$currentUser['id']]);
        $drafts = $stmt->fetchAll();

        foreach ($drafts as &$d) {
            $d['draft_data'] = json_decode($d['draft_data'], true);
        }

        jsonResponse([
            'success' => true,
            'drafts' => $drafts
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to fetch drafts.'], 500);
    }
} else if ($method === 'DELETE') {
    $draftId = $_GET['draft_id'] ?? '';
    try {
        $stmt = $pdo->prepare("DELETE FROM duty_drafts WHERE draft_id = ? AND user_id = ?");
        $stmt->execute([$draftId, $currentUser['id']]);
        jsonResponse(['success' => true, 'message' => 'Draft deleted.']);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to delete draft.'], 500);
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}
