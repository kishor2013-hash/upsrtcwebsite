<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Depots Master Data API
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, depot_code, depot_name, region, is_active FROM depots WHERE is_active = 1 ORDER BY depot_name ASC");
        $depots = $stmt->fetchAll();

        // If table is newly created and empty, provide initial standard UPSRCTC master depot list
        if (empty($depots)) {
            $defaultDepots = [
                ['depot_code' => 'SOHRAB', 'depot_name' => 'Sohrab Gate Depot', 'region' => 'Meerut'],
                ['depot_code' => 'MEERUT', 'depot_name' => 'Meerut Depot', 'region' => 'Meerut'],
                ['depot_code' => 'GZB', 'depot_name' => 'Ghaziabad Depot', 'region' => 'Ghaziabad'],
                ['depot_code' => 'NOIDA', 'depot_name' => 'Noida Depot', 'region' => 'Noida'],
                ['depot_code' => 'AGRA', 'depot_name' => 'Agra Fort Depot', 'region' => 'Agra'],
                ['depot_code' => 'ALIG', 'depot_name' => 'Aligarh Depot', 'region' => 'Aligarh'],
                ['depot_code' => 'MB', 'depot_name' => 'Moradabad Depot', 'region' => 'Moradabad'],
                ['depot_code' => 'BLY', 'depot_name' => 'Bareilly Old Depot', 'region' => 'Bareilly'],
                ['depot_code' => 'LKO_CB', 'depot_name' => 'Charbagh Depot Lucknow', 'region' => 'Lucknow'],
                ['depot_code' => 'KNP', 'depot_name' => 'Kanpur Central Depot', 'region' => 'Kanpur'],
                ['depot_code' => 'VNS', 'depot_name' => 'Varanasi Cantt Depot', 'region' => 'Varanasi'],
                ['depot_code' => 'GKP', 'depot_name' => 'Gorakhpur Depot', 'region' => 'Gorakhpur'],
                ['depot_code' => 'AYD', 'depot_name' => 'Ayodhya Dham Depot', 'region' => 'Ayodhya']
            ];

            $ins = $pdo->prepare("INSERT IGNORE INTO depots (depot_code, depot_name, region) VALUES (?, ?, ?)");
            foreach ($defaultDepots as $d) {
                $ins->execute([$d['depot_code'], $d['depot_name'], $d['region']]);
            }

            $stmt = $pdo->query("SELECT id, depot_code, depot_name, region, is_active FROM depots WHERE is_active = 1 ORDER BY depot_name ASC");
            $depots = $stmt->fetchAll();
        }

        jsonResponse(['success' => true, 'depots' => $depots]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to fetch depots.'], 500);
    }
} else if ($method === 'POST') {
    $admin = requireAdmin();
    $input = getJsonInput();
    $code = strtoupper(trim($input['depot_code'] ?? ''));
    $name = trim($input['depot_name'] ?? '');
    $region = trim($input['region'] ?? 'Uttar Pradesh');

    if (empty($code) || empty($name)) {
        jsonResponse(['success' => false, 'message' => 'Depot code and name are required.'], 422);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO depots (depot_code, depot_name, region) VALUES (?, ?, ?)");
        $stmt->execute([$code, $name, $region]);
        jsonResponse(['success' => true, 'message' => 'New depot added successfully.']);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to add depot. Code may already exist.'], 409);
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}
