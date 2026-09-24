<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Fetch Previous Duty Record for Smart Form Auto-fill
 * CRITICAL RULE:
 * Returns reusable route and bus fields ONLY for the authenticated employee.
 * Does NOT return operational fields (KM, Income, Passenger count, Load Factor, etc.)
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$currentUser = requireAuth();

try {
    $stmt = $pdo->prepare("SELECT 
        id,
        record_id,
        duty_date,
        duty_number,
        bus_number,
        bus_reg_number,
        route,
        route_number,
        start_point,
        end_point,
        shift
    FROM duty_records 
    WHERE user_id = ? AND status = 'SUBMITTED' AND deleted_at IS NULL
    ORDER BY duty_date DESC, id DESC 
    LIMIT 1");

    $stmt->execute([$currentUser['id']]);
    $previousDuty = $stmt->fetch();

    if ($previousDuty) {
        jsonResponse([
            'success' => true,
            'has_previous' => true,
            'previous_duty' => [
                'ref_record_id' => $previousDuty['record_id'],
                'ref_duty_date' => $previousDuty['duty_date'],
                'duty_number' => $previousDuty['duty_number'],
                'bus_number' => $previousDuty['bus_number'],
                'bus_reg_number' => $previousDuty['bus_reg_number'],
                'route' => $previousDuty['route'],
                'route_number' => $previousDuty['route_number'],
                'start_point' => $previousDuty['start_point'],
                'end_point' => $previousDuty['end_point'],
                'shift' => $previousDuty['shift']
            ]
        ]);
    } else {
        jsonResponse([
            'success' => true,
            'has_previous' => false,
            'previous_duty' => null
        ]);
    }

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Failed to fetch previous duty.'], 500);
}
