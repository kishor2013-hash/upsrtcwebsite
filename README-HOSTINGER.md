# UPSRCTC ROADWAYS – DIGITAL DUTY PORTAL V4.0
## Complete Hostinger Shared Hosting Deployment Manual
**Domain / Subdomain:** `https://upsrctc.grofasto.com/`  
**Hostinger Directory:** `/public_html/upsrctc/`  
**Technology Stack:** Progressive Web App (PWA) + React SPA + PHP 8.x + MySQL (PDO)  
**Technology Partner:** Grofasto Digital Solutions (GROW | CONNECT | SUCCEED. | +91 9457690255)

---

### Prerequisites
1. Hostinger Shared Hosting or Cloud Hosting plan with **PHP 8.1 / 8.2** enabled.
2. Subdomain created in Hostinger hPanel: `upsrctc.grofasto.com` pointing to `/public_html/upsrctc/`.
3. Free SSL certificate activated for `upsrctc.grofasto.com`.

---

### Step-by-Step Production Deployment (16 Steps)

#### 1. Create MySQL Database
1. Log in to your Hostinger **hPanel**.
2. Navigate to **Databases** > **MySQL Databases**.
3. Under *Create a New MySQL Database and User*, specify:
   - **MySQL Database Name:** e.g., `u123456789_upsrctc`
   - Note down this exact database name.

#### 2. Create MySQL User
1. In the same form, specify:
   - **MySQL Username:** e.g., `u123456789_user`
   - **Password:** Generate a strong, secure password (at least 16 characters).
   - Save these credentials securely.

#### 3. Assign Permissions
1. Hostinger hPanel automatically grants full privileges to the created user for the associated database. Verify the database and user are active.

#### 4. Open phpMyAdmin
1. In Hostinger hPanel under **Databases**, find your new database `u123456789_upsrctc`.
2. Click **Enter phpMyAdmin**.

#### 5. Import `database.sql`
1. Inside phpMyAdmin, click the **Import** tab on the top menu.
2. Click **Choose File** and select `database.sql` from this project.
3. Keep Character set as `utf8mb4` and click **Go** (Import).
4. Verify that the tables (`users`, `duty_records`, `duty_drafts`, `depots`, `buses`, `routes`, `external_portal_links`, `application_settings`, `audit_logs`) were created successfully.
> **Note:** The database starts with **ZERO demo employees** and **ZERO fake duty records** as per official security protocols.

#### 6. Configure Database Credentials
1. On your local machine or in Hostinger File Manager, open `/api/config.php` (or configure Hostinger Environment Variables):
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_upsrctc');
   define('DB_USER', 'u123456789_user');
   define('DB_PASS', 'YourActualHostingerPassword');
   ```
2. Save the file. Ensure this file is never publicly committed with real credentials.

#### 7. Build Frontend Production Files
1. On your development machine, run:
   ```bash
   npm install
   npm run build
   ```
2. The static web build will be compiled into the `dist/` directory.

#### 8. Upload Frontend & PHP API to Hostinger
1. Open Hostinger **File Manager** (or connect via SFTP / Git deployment).
2. Open `/public_html/upsrctc/`.
3. Upload all files from `dist/`:
   - `index.html`
   - `manifest.webmanifest`
   - `service-worker.js`
   - `icon.svg`, `favicon.png`, `apple-touch-icon.png`, `pwa-*.png`
   - `assets/`
   - `.htaccess`
4. Upload the `/api/` folder directly to `/public_html/upsrctc/api/`.

#### 9. Configure Domain / Subdomain
1. In Hostinger hPanel > **Websites** > **Subdomains**, verify that `upsrctc.grofasto.com` document root is set to `public_html/upsrctc`.

#### 10. Enable HTTPS
1. In Hostinger hPanel > **Security** > **SSL**, ensure SSL is active and **Force HTTPS** is enabled.
2. `.htaccess` automatically redirects HTTP to HTTPS.

#### 11. Test API Connectivity
1. Open your browser and navigate to:
   `https://upsrctc.grofasto.com/api/settings/get.php`
2. You should receive a JSON response with status 200, confirming that PHP, PDO, and MySQL are communicating properly.

#### 12. Test Login
1. Open `https://upsrctc.grofasto.com/`.
2. Notice that **ONLY the Login screen** appears. No dashboard or fake data is visible.

#### 13. Test Registration
1. Click **"New Employee? Create Account"**.
2. Complete registration for a Driver or Conductor with a real 10-digit mobile, valid email, and unique Employee ID / CND.
3. Submit and verify the success message: *"Account created successfully. Please login to continue."*
4. Log in with the newly created credentials.

#### 14. Test Feed Duty
1. Navigate to **FEED DUTY**.
2. Verify that Employee Name, CND/Emp ID, Employee Type, and Depot load automatically from the database.
3. Select Duty Date using the native date picker (`<input type="date">`).
4. Enter today's duty operational details (KM, Income, Shift, Route).
5. Click **SUBMIT DUTY** and verify that a unique Record ID (`UP-DUTY-...`) is generated and stored in MySQL.
6. Verify duplicate prevention (immediate re-clicking will prevent double submission).

#### 15. Test Show Data & Smart Auto-Fill
1. Go to **SHOW DATA**. Verify your newly recorded duty appears with exact calculated monthly totals.
2. Return to **FEED DUTY** for another entry: notice that reusable details (Bus Number, Route, Points) are smartly retrieved from your previous record while daily operational numbers remain fresh for entry.

#### 16. Test PWA Installation
1. On an Android smartphone, open `https://upsrctc.grofasto.com/` in Google Chrome.
2. Tap the in-app **"Install App"** button or Chrome menu > **"Add to Home screen"**.
3. Open the installed UPSRCTC Roadways app from your phone's home screen.
4. Verify standalone full-screen operation, touch responsive UI, and persistent central MySQL synchronization.

---

### Support & Maintenance
- **Technology Partner:** Grofasto Digital Solutions
- **Helpline:** +91 9457690255
- **Website:** [www.grofasto.com](https://www.grofasto.com)
