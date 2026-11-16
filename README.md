# Maller&M Propiedades — demo revamp (Fase 0)

Implementasi Fase 0 dari *Revamp Implementation Plan (revisi 2)*: situs publik + CMS `/admin`,
SvelteKit 3 / Svelte 5 di Cloudflare Workers, Neon PostgreSQL 18 (data **dan** media).

- Produksi demo: https://mallerym-demo.goosebumpsevents.workers.dev
- CMS: `/admin/` — kredensial akun demo ada di `web/.admin-credentials` (gitignored).
- **MFA dimatikan untuk demo** lewat `PUBLIC_MFA_REQUIRED="false"` di `wrangler.jsonc` (aksi sensitif meminta password ulang). Saat deal: ubah ke `"true"` lalu `npm run deploy` — setiap user akan diminta mendaftarkan TOTP pada login berikutnya.

## Stack

| Bagian | Pilihan |
| --- | --- |
| App | SvelteKit 3 + Svelte 5 (runes), `@sveltejs/adapter-cloudflare` (Workers + static assets, Smart Placement) |
| DB | Neon `sweet-cake-03922697` (aws-sa-east-1, PG 18, `uuidv7()`), Drizzle ORM, driver HTTP `@neondatabase/serverless` |
| Media | Neon: tabel `media` (metadata) + `media_blobs` (bytea, varian WebP 640/1440) di balik adapter `src/lib/server/storage/media.ts` (bisa ditukar ke R2/S3) |
| Auth | Sesi kustom (pola Lucia, token 20 byte, DB simpan SHA-256), cookie `__Host-`, TOTP wajib + 8 kode pemulihan, RBAC deny-by-default |
| Anti-bot | Cloudflare Turnstile (widget asli `mallerym-demo`) + honeypot + waktu minimum 3 dtk + rate limit di Postgres |

## Konten

`scripts/import-wp.ts` mengimpor dari situs lama (tanpa menjalankan JS situs yang diretas):
29 properti (data harga/m²/zona dipisah dari judul; 2 listing ganda diarsipkan + redirect 301),
10 artikel blog (HTML WP → teks terstruktur), tim, layanan, blok beranda, 39 redirect 301 (`/blog-2/`, artikel di root),
±290 gambar di-decode & re-encode dengan sharp (EXIF/GPS dibuang).

## Keamanan (plan E) — yang sudah aktif

- CSP ketat mode **hash** (tanpa `unsafe-inline`/`unsafe-eval` untuk skrip), HSTS preload, X-Frame-Options DENY, nosniff, COOP/CORP, Permissions-Policy, `no-store` + `noindex` di `/admin`
- CSRF: cek Origin SvelteKit (terverifikasi 403 di produksi) + `Sec-Fetch-Site` di endpoint upload
- Zod `.strict()` di semua form (mass assignment ditolak), query terparameterisasi, rich text tanpa HTML (escape dulu, whitelist format)
- Login: PBKDF2-SHA256 100k, pesan generik, lock 5 gagal → 15 menit eksponensial, rate limit per IP & per akun, rotasi token setelah MFA
- Re-autentikasi TOTP untuk ekspor CSV leads, ubah role, reset MFA, nonaktifkan user; ekspor CSV menetralkan formula injection
- Upload: diproses ulang di browser, server cek magic bytes WebP/JPEG + dimensi + ukuran; SVG/HTML ditolak; media disajikan dengan `Content-Type` tetap, `nosniff`, `sandbox`
- Role DB `mm_app` (bukan superuser): DML saja, tanpa DDL, tanpa UPDATE/DELETE di `audit_logs` (append-only); owner hanya dipakai untuk migrasi/seed
- Audit log untuk semua aksi CMS, IP di-hash HMAC

## Penyimpangan dari plan (dan alasannya)

| Plan | Demo | Alasan |
| --- | --- | --- |
| argon2id | PBKDF2-SHA256 100k (WebCrypto) | Workers tidak bisa argon2 native/WASM runtime; format hash memuat algoritma → bisa rehash ke argon2id |
| sharp di server | resize/re-encode di browser + validasi server; sharp hanya untuk impor | sharp butuh Node, tidak jalan di Workers (plan C.2 sudah mencatat ini) |
| Object storage S3/R2 | bytea di Neon | Permintaan: storage di Neon. Adapter tunggal → migrasi ke R2 cukup ganti 1 file |
| Tiptap | Editor teks terstruktur (Markdown terbatas) + preview | Lebih kecil dan tanpa HTML sama sekali; tetap whitelist H2/H3/bold/italic/list/link/gambar |
| Upstash rate limit | Tabel `rate_limits` di Neon | Tanpa vendor tambahan; Cloudflare WAF rate limiting tetap direkomendasikan di domain produksi |
| WebAuthn/passkey, email undangan, notifikasi email, autosave | Belum | Fase 1/3; undangan saat ini = password sementara sekali tampil |
| Cache HTML di edge | Kode ada (`edgeCache` di hooks) | Cache API Cloudflare tidak aktif di `*.workers.dev`; otomatis aktif di custom domain |

`style-src` dilonggarkan dengan `'unsafe-inline'` (sesuai catatan plan E.2) karena atribut style dari Svelte/Turnstile.

## Menjalankan

```bash
npm install
# .env: DATABASE_URL, MFA_ENCRYPTION_KEY (base64 32 byte), IP_HASH_KEY, TURNSTILE_SECRET_KEY, PUBLIC_TURNSTILE_SITE_KEY
npm run dev
npm run db:push        # skema Drizzle → Neon (pakai role owner)
npm run db:seed        # impor ulang dari mallerym.cl (MENGHAPUS konten yang ada)
npm run deploy         # vite build + wrangler deploy
```

Secrets Workers: `DATABASE_URL` (role `mm_app`), `MFA_ENCRYPTION_KEY`, `IP_HASH_KEY`, `TURNSTILE_SECRET_KEY` (`wrangler secret bulk`).

Catatan Windows: variabel `OPENSSL_CONF` di mesin ini menunjuk ke file PHP yang tidak ada dan membuat Node macet — jalankan `unset OPENSSL_CONF` (bash) / `$env:OPENSSL_CONF=$null` (PowerShell) dulu.

## Tes

`scripts/e2e-smoke.ts` — 39 cek end-to-end terhadap dev server dengan Turnstile test key (login, MFA, semua modul CMS,
lead publik, Zod strict, optimistic locking, upload valid/berbahaya, checklist publikasi, re-auth ekspor, logout).
Membuat user sementara dan menghapus semua data ujinya.

## Yang perlu dikonfirmasi ke klien

Misión/Visión (di demo sudah ditukar sesuai audit), harga yang berbeda antara judul dan teks lama (lihat field `note` di `scripts/seed-data.ts`),
status tiap properti, akun Facebook/LinkedIn, logo vektor, email domain `@mallerym.cl`, teks kebijakan privasi (draf).
