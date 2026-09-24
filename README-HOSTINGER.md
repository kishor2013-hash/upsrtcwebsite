# Hostinger Deployment Guide - Standalone Static Application

## Overview
This application is a **pure standalone static web application** (HTML5, Vanilla JavaScript, CSS) paired with a lightweight PHP 8.x + MySQL backend.

**Zero Node.js or `npm run build` required!** You can upload these files directly to Hostinger File Manager or FTP.

---

## Directory Structure to Upload to `public_html/`

```text
public_html/
├── index.html            <-- Main portal entry point
├── app.js                <-- Pure Vanilla JavaScript logic
├── style.css             <-- Standalone styling & print stylesheets
├── manifest.webmanifest  <-- PWA Manifest
├── service-worker.js     <-- PWA Service Worker (offline support)
├── icon.svg              <-- UPSRCTC Emblem
├── favicon.png           <-- Favicon
├── pwa-192x192.png       <-- App Icon 192px
├── pwa-512x512.png       <-- App Icon 512px
├── apple-touch-icon.png  <-- iOS Home Screen Icon
├── database.sql          <-- MySQL Database Schema
├── .htaccess             <-- Apache security and HTTPS rules
└── api/                  <-- PHP REST API endpoints
    ├── config.php        <-- Database credentials (DB_HOST, DB_NAME, DB_USER, DB_PASS)
    ├── auth/
    │   ├── login.php
    │   ├── register.php
    │   ├── me.php
    │   └── logout.php
    ├── duties/
    │   ├── feed.php
    │   ├── list.php
    │   └── latest.php
    ├── admin/
    │   ├── settings.php
    │   └── users.php
    └── reports/
        └── pdf-data.php
```

---

## Step-by-Step Hostinger Setup

### 1. Database Setup in hPanel
1. Log in to your Hostinger hPanel.
2. Go to **Databases** -> **MySQL Databases**.
3. Create a new database:
   - Database Name: `u123456789_upsrctc`
   - Username: `u123456789_admin`
   - Password: `YourSecurePassword123!`
4. Open **phpMyAdmin** for this database.
5. Click **Import** and upload `database.sql`.

### 2. Configure Database Credentials
Edit `api/config.php` with your database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_upsrctc');
define('DB_USER', 'u123456789_admin');
define('DB_PASS', 'YourSecurePassword123!');
```

### 3. Upload Files
Upload all files into your domain's `public_html/` folder using Hostinger File Manager or FileZilla FTP.

### 4. Done!
Visit `https://yourdomain.com/` (or `https://upsrctc.grofasto.com/`).
- The portal opens immediately to the **Login Page**.
- New employees can register via **Sign Up**.
- Drivers and conductors can record duties, view monthly certified statements, and access official department portals.
