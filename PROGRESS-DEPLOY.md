# Progress Deploy — Biwrawater ke VPS

> Catatan perkembangan deploy sampai **2026-08-28**. Dibuat agar bisa dilanjutkan di kantor.
> Status saat ini aplikasi **belum 100% live** — masih di tahap akhir setup VPS.

---

## Lingkungan VPS
- **Sistem**: Ubuntu Resolute (rilis baru)
- **Stack**: Nginx + PHP-FPM 8.4 + PostgreSQL + Reverb (broadcast) + Midtrans (sandbox)
- **Akses publik saat ini**: IP murni (tanpa domain, tanpa SSL untuk sementara)
- **IP VPS**: `157.10.252.168`

## Flow Stack yang dipakai
- **Laravel 13 (PHP 8.4)** — backend + Inertia/React frontend
- **PostgreSQL** — database
- **Reverb** — broadcast WebSocket real-time (dashboard & driver)
- **Midtrans** — payment gateway (sandbox)
- **Nginx** — web server + proxy WebSocket
- **systemd** — menjalankan worker (queue/schedule/reverb) otomatis saat boot

---

## Status Penyelesaian per Bagian

### 1. Nginx ✅ (sudah dibereskan)
- Sempat gagal start karena error:
  - `socket() [::]:80 failed (97: Address family not supported by protocol)` — VPS murni **IPv4**, sedangkan vhost default nginx bind IPv6 `[::]:80`.
- Solusi: hapus semua baris `listen [::]:80` dari config (vhost default).
- Sempat dilakukan **uninstall total + reinstall nginx** (untuk memulai bersih), lalu hapus lagi baris IPv6-nya.
- Sekarang: **nginx berjalan normal** di port 80 (IPv4), halaman "Welcome to nginx" tampil.

### 2. PHP 8.4 + FPM ✅
- Diinstal dari repo **Sury** (`packages.sury.org/php`) karena Ubuntu Resolute tidak didukung PPA `ondrej/php`.
- Service: **`php8.4-fpm`** (bukan `php8.3-fpm`).
- Socket: `/run/php/php8.4-fpm.sock` — **wajib benar di nginx `fastcgi_pass`**.
- Status: `active (running)`, enabled saat boot.

### 3. Git / Composer / Node.js ✅
- Git: terpasang.
- Composer: diinstal dari installer resmi (`composer.phar` → `/usr/local/bin/composer`).
- Node.js v20: dari NodeSource.

### 4. PostgreSQL ✅
- Server `postgresql` terpasang & enabled.
- User dibuat: `biwrawater`
- DB dibuat: `biwrawater` (owner `biwrawater`)
- Koneksi via `127.0.0.1` dengan password **sudah dites OK** (`SELECT 1` berhasil).

### 5. Project Laravel ✅ (setup selesai)
- Repo di-`git clone` ke `/var/www/biwrawater`.
- `.env` dibuat dari `.env.production.example`, sudah diisi:
  - `APP_URL=http://157.10.252.168`
  - `DB_*` (postgres biwrawater)
  - `REVERB_*`
  - `MIDTRANS_*` (sandbox)
- `php artisan key:generate` ✅
- `composer install --no-dev --optimize-autoloader` ✅
- `npm ci && npm run build` ✅
- `php artisan migrate --force` ✅
- `php artisan storage:link` ✅

### 6. Node / PHP ekstensi ✅
- Ekstensi PHP untuk Laravel (pgsql, mbstring, xml, curl, zip, intl, bcmath, gd) terpasang.

---

## Yang Masih Belum / Lanjutan (untuk besok di kantor)

> ⏳ **Bagian paling penting yang belum tuntas.**

### A. Arahkan Nginx ke Laravel `public`  ← BELUM DILAKUKAN
Vhost nginx sekarang masih menunjuk ke halaman default `/var/www/html`. Perlu diubah `root` ke folder Laravel:

```
root /var/www/biwrawater/public;
```

Dan tambahkan blok PHP:
```nginx
location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;   # HARUS 8.4, bukan 8.3
}
```

Serta blok `/app/` (proxy WebSocket Reverb):
```nginx
location /app/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

> Perhatian: jangan aktifkan `listen [::]:80` (VPS IPv4-only).

### B. Hak akses folder Laravel  ← BELUM DIKONFIRMASI
```bash
cd /var/www/biwrawater
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### C. Jalankan worker background via systemd  ← BELUM DILAKUKAN
File unit sudah ada di repo `deploy/`:
- `deploy/biwrawater-queue.service`
- `deploy/biwrawater-schedule.service`
- `deploy/biwrawater-reverb.service`

Cara aktifkan:
```bash
cd /var/www/biwrawater
sudo cp deploy/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now biwrawater-queue biwrawater-schedule biwrawater-reverb
systemctl status biwrawater-queue biwrawater-schedule biwrawater-reverb
```
> Pastikan path `php` di `ExecStart` benar (`which php`). Service dijalankan sebagai user `www-data`.

### D. Cache Laravel  ← BELUM DILAKUKAN
```bash
php artisan config:cache
php artisan route:cache
```

### E. Buka port firewall  ← BELUM KONFIRMASI
```bash
sudo ufw allow 80
sudo ufw allow 8080/tcp
```

### F. Verifikasi akhir
Buka `http://157.10.252.168/` → harusnya muncul halaman aplikasi Biwrawater (bukan "Welcome to nginx").
Tes alur lengkap: checkout → pay Midtrans → pay-status → admin assign → driver fill/depart/unload/deliver (real-time).

---

## Artefak yang Sudah di-Commit/Push (repo)
- `deploy/biwrawater-queue.service` — systemd unit queue worker
- `deploy/biwrawater-schedule.service` — systemd unit scheduler
- `deploy/biwrawater-reverb.service` — systemd unit Reverb server
- `.env.production.example` — template env production (tanpa secret)
- `biwrawater-api.postman_collection.json` + `biwrawater-api.postman_environment.json` — collection uji API mobile

---

## Catatan Penting / Jebakan
1. **Nama service FPM = `php8.4-fpm`** — banyak yang keliru menulis `8.3`.
2. **VPS IPv4-only** — jangan pakai `listen [::]:*` di nginx / dev Reverb.
3. **`.env` & secret tidak pernah ke-commit** (di-ignore).
4. **Deploy ke VPS butuh build frontend ulang** setiap ganti `REVERB_*`/`APP_URL` (nilai di-embed saat `npm run build`).
5. **Saat ganti ke domain + SSL nanti**: perlu ubah `APP_URL`, `SESSION_DOMAIN`, `REVERB_HOST/SCHEME/PORT`, nginx `443` + WSS proxy, redirect `http→https`, dan `config:clear` + cache ulang.
6. Sesi ini juga menghasilkan **Postman collection** untuk menguji API mobile (`/api/v1`).
