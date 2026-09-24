<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Public / Authenticated Settings & External Portal Links
 */

require_once __DIR__ . '/../db.php';

try {
    // 1. External Portal Links
    $linkStmt = $pdo->query("SELECT portal_key, portal_name, url, icon_name, description FROM external_portal_links WHERE is_active = 1 ORDER BY id ASC");
    $links = $linkStmt->fetchAll();

    // 2. Application Settings (Grofasto partner info, app details)
    $settStmt = $pdo->query("SELECT setting_key, setting_value FROM application_settings");
    $rawSettings = $settStmt->fetchAll();
    
    $settings = [];
    foreach ($rawSettings as $s) {
        $settings[$s['setting_key']] = $s['setting_value'];
    }

    jsonResponse([
        'success' => true,
        'portal_links' => $links,
        'settings' => $settings
    ]);

} catch (PDOException $e) {
    jsonResponse([
        'success' => true,
        'portal_links' => [
            ['portal_key' => 'PAY_SLIP', 'portal_name' => 'Pay Slip Portal', 'url' => 'https://payroll.mectoi.in/EmpLogin.aspx'],
            ['portal_key' => 'PF_PORTAL', 'portal_name' => 'PF Portal', 'url' => 'https://passbook.epfindia.gov.in/MemberPassBook/login'],
            ['portal_key' => 'CHALLAN', 'portal_name' => 'Challan Portal', 'url' => 'https://echallan.parivahan.gov.in/index/challan-print'],
            ['portal_key' => 'MANAV_SAMPADA', 'portal_name' => 'Manav Sampada', 'url' => 'https://ehrms.upsdc.gov.in/']
        ],
        'settings' => [
            'partner_name' => 'Grofasto Digital Solutions',
            'partner_tagline' => 'GROW | CONNECT | SUCCEED.',
            'partner_phone' => '+91 9457690255',
            'partner_website' => 'www.grofasto.com',
            'app_title' => 'UPSRCTC ROADWAYS',
            'app_subtitle' => 'DIGITAL DUTY PORTAL V4.0'
        ]
    ]);
}
