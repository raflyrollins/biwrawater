# Progress Deploy — Biwrawater ke VPS

> Riwayat deploy dari awal sampai **2026-08-29**. Saat ini aplikasi **sudah live** di `https://biwrawater.my.id`.
> Bagian atas adalah catatan setup awal; bagian **"Update 2026-08-29 (sore) - Google Login backend OAuth flow (LIVE)"** adalah status terkini - lanjutkan dari sana.

---

## Lingkungan VPS
- **Sistem**: Ubuntu Resolute (rilis baru)
- **Stack**: Nginx + PHP-FPM 8.4 + PostgreSQL + Reverb (broadcast) + Midtrans (sandbox)
- **Akses publik saat ini**: `https://biwrawater.my.id` — domain + SSL Let's Encrypt (gratis, auto-renew)
- **IP VPS**: `157.10.252.168` (nginx punya `server_name biwrawater.my.id 157.10.252.168`; http apa pun → redirect ke https domain)

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

### A. Arahkan Nginx ke Laravel `public`  ✅ (selesai)
- `root /var/www/biwrawater/public` + blok PHP (`fastcgi_pass unix:/run/php/php8.4-fpm.sock`) + blok `/app/` (proxy WS → 127.0.0.1:8080) sudah aktif.
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

### B. Hak akses folder Laravel  ✅ (dikonfirmasi)
- `storage` & `bootstrap/cache` owner `www-data:www-data`, mode `775` — sudah benar.
```bash
cd /var/www/biwrawater
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### C. Jalankan worker background via systemd  ✅ (selesai)
- `biwrawater-queue`, `biwrawater-schedule`, `biwrawater-reverb` semua **active + enabled**. Unit reverb diubah jadi `ExecStart=/usr/bin/php artisan reverb:start --host=0.0.0.0 --port=8080` (bind eksplisit).
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

### D. Cache Laravel  ✅ (selesai)
- `config:cache` aktif (juga setelah tiap ubah `.env`); `route:cache` tidak dipakai (sengaja; lalu `route:cahce` typos juga invalid).
```bash
php artisan config:cache
php artisan route:cache
```

### E. Buka port firewall  ✅ (dikonfirmasi)
- `ufw` active: 80, 443, 8080/tcp, 22 open (5432 juga terbuka padahal postgres hanya listen `127.0.0.1` — opsional ditutup).
```bash
sudo ufw allow 80
sudo ufw allow 8080/tcp
```

### F. Verifikasi akhir  ✅ (web & real-time)
- `http://157.10.252.168/` → halaman aplikasi Biwrawater (bukan "Welcome to nginx") — sudah.
- Tes alur bisnis lengkap (checkout → pay Midtrans → assign → driver flow real-time) **belum dilakukan end-to-end di VPS** — lihat "Lanjutan" di Update 2026-08-29.

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

---

# Update 2026-08-29 (sore) - Google Login backend OAuth flow (LIVE)

> Deploy commit `21e8ebc` ke VPS (`raplikun@157.10.252.168`, `/var/www/biwrawater`). Google login **sudah live** di web.

## Yang dideploy
1. **Backend OAuth flow Google** (web + mobile deep-link):
   - `GET /auth/google` - redirect ke Google (opsional `?redirect=` deep link untuk mobile).
   - `GET /auth/google/callback` - web: login session -> dashboard; mobile: Sanctum token -> `myapp://auth?token=...`.
   - `GoogleOAuthService` (redirect/user/resolveUser) + `GoogleOAuthController`.
   - Endpoint API akses-token tetap ada: `POST /api/v1/auth/social/google`.
2. **Migration** `add_google_id_and_avatar_to_users_table` - sudah `migrate --force`.
3. **`.env` VPS** ditambah: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=https://biwrawater.my.id/auth/google/callback`, `GOOGLE_MOBILE_REDIRECT_SCHEME=myapp`.
4. **Frontend**: tombol "Masuk/Daftar dengan Google" (`GoogleMark.tsx`) di halaman login/register; `npm ci && npm run build` ulang.
5. **Cache**: `php artisan optimize` (config/route/view) setelah deps + route baru.

## Jebakan baru yang teratasi
- **Route/config cache produksi ketertinggalan**: setelah `git pull`, `route:list --name=google` kosong dan `npm run build` gagal `UNRESOLVED_IMPORT '../../routes/auth/google'` - Wayfinder bikin modul dari route **segar**. Solusi: **`php artisan optimize:clear` dulu -> baru `npm run build` -> lalu `optimize` lagi**.
- **Izin storage saat deploy sebagai `raplikun`**: `composer install` gagal nulis `storage/logs` (owner `www-data`). Solusi: `sudo usermod -aG www-data raplikun` + `chmod -R g+rwX storage bootstrap/cache`. Group folder tetap `www-data:www-data` (PHP-FPM masih bisa tulis) + `raplikun` masuk grup `www-data`.

## Verifikasi live
- `GET https://biwrawater.my.id/login` -> 200, HTML berisi "Masuk dengan Google".
- `GET https://biwrawater.my.id/auth/google` -> **302** ke `accounts.google.com/o/oauth2/auth` dengan `client_id` & `redirect_uri=https://biwrawater.my.id/auth/google/callback` & `scope=openid+profile+email`.

## Yang masih perlu
- [ ] **Google Cloud Console**: daftarkan `https://biwrawater.my.id/auth/google/callback` sebagai *Authorized redirect URI* (web) supaya login benar-benar bisa menyelesaikan OAuth.
- [ ] Selesaikan callback OAuth end-to-end (konsen -> callback -> session login) dari browser.
- [ ] Tes alur mobile deep-link (aplikasi: buka `myapp://auth?token=...`).

---

# Update 2026-08-29 — Domain + SSL + perbaikan instalasi (LIVE)

> Dicatat dari sesi remote-verifikasi SSH ke `raplikun@157.10.252.168`. Aplikasi **sudah 100% live**.
> Status ini yang dipakai untuk lanjut pengerjaan (termasuk dari laptop lain).

## Yang selesai di sesi ini
1. **Nulis benar di `.env`** (sebelumnya template placeholder):
   - `APP_URL=https://biwrawater.my.id`
   - `SESSION_DOMAIN=.biwrawater.my.id`
   - `REVERB_HOST=biwrawater.my.id`
   - **`REVERB_APP_ID/KEY/SECRET` di-regenerate random** (semula `CHANGE_ME_*` = lubang keamanan; key bilan terkunci)
   - `VITE_REVERB_SCHEME=https`, `VITE_REVERB_PORT=443` (WS lewat nginx, bukan ke port 8080 langsung)
   - `SESSION_SECURE_COOKIE=true`
2. **`SESSION_COOKIE=biwrawater-session-v2`** — rotasi nama cookie session. Ini **penyembuh 419 "Page Expired"**: cookie lama (identitas beda zaman IP/host-only) tidak lagi dibaca server → CSRF selalu cocok. Terbukti: simulasi login mengirim "cookie basi + baru" tetap `302 → /dashboard`.
3. **SSL Let's Encrypt (gratis)**: `sudo certbot --nginx -d biwrawater.my.id --redirect`. HTTPS 200, HTTP → 301 → https, cert expire 27-Nov-2026, auto-renew via `certbot.timer`. IP juga redirect ke domain.
4. **WebSocket real-time lewat HTTPS**: Echo build `wss://biwrawater.my.id` (nginx `/app/` → Reverb 8080). Handshake validasi `101 Switching Protocols` via `wss://biwrawater.my.id/app/{key}` ✓.
5. **Frontend build ulang** (`npm run build`) setelah semua `VITE_*` berubah — wajib, nilai embed saat build.
6. **Cache Laravel** `config:clear` + `config:cache` ulang + restart `biwrawater-reverb` tiap ganti `.env`.
7. **Pembersihan**: user uji probe dihapus, 37 session basi dihapus, file sampah (`cookie('appearance'`, `delete()`) dihapus.

## Lombok diketahui / jebakan baru
- **`SESSION_COOKIE`/domain**: jangan balik ke `null + nama lama` tanpa alasan — rotasi nama cookie adalah tombol "reset" immunitas 419.
- **Info Reverb & nginx**: jangan pernah set-kuartangkan `proxy_set_header Connection "upgrade"` di blok `/app/`; tes handshake harus pakai `Sec-WebSocket-Key` **valid base64 16 byte** (key invalid membuat Reverb mengirim 400 + stream tak berakhir → tampak "hang").
- **Ganti `REVERB_*`/`APP_URL` berapa pun** → wajib `npm run build` + `config:cache` + restart reverb.
- **Bot scanner `.env`** terus menyerang IP (lihat error log `GET /.env* 403`) — aman karena `deny all`, tapi tetap jangan `APP_DEBUG=true` di produksi.

## Yang masih bisa dilanjutkan
- [ ] **Tes alur bisnis end-to-end** di production: checkout → bayar Midtrans sandbox → pay-status → admin confirm/assign → driver **fill/depart/unload/deliver** → pantau real-time di 2 perangkat (admin+dashboard).
- [ ] **Verifikasi API `/api/v1` live** di VPS lewat Postman collection (base URL `https://biwrawater.my.id`), token Sanctum dari `/api/v1/login`.
- [ ] **`git pull` di VPS** (`/var/www/biwrawater`) — repo server tertinggal dari `origin/main`; pull setelah README/commit ini.
- [ ] **Opsional**: tutup `5432/tcp` di ufw (postgres hanya listen 127.0.0.1); tambah user admin/driver sample (roles via Spatie) untuk demo.
- [ ] **Opsional**: ganti auth ke SSH key (password login sudah dipakai di sesi; jangan commit sekret apa pun).

## Akses server
- SSH: `raplikun@157.10.252.168` (password ada di sesi obrolan, **tidak** dicatat di repo).
- Proyek: `/var/www/biwrawater` (repo git, branch `main`).
- Services: `biwrawater-queue`, `biwrawater-schedule`, `biwrawater-reverb`, `php8.4-fpm`, `nginx`, `postgresql`.
