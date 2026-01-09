# Tutorial: Google OAuth Setup

## Langkah 1: Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in dengan akun Google Anda
3. Klik tombol **"Select a project"** di bagian atas
4. Klik **"NEW PROJECT"**

   ![New Project](https://cloud.google.com/static/storage/docs/images/quickstart-create-project.png)

5. Isi form:
   - **Project name**: `Notes AI` (atau nama lain)
   - **Location**: No organization (atau pilih organisasi jika ada)
6. Klik **"CREATE"**
7. Tunggu beberapa detik hingga project selesai dibuat

---

## Langkah 2: Aktifkan Google+ API

1. Di sidebar kiri, cari **"APIs & Services"** → klik **"Library"**
2. Cari "Google+ API" atau "Google Identity"
3. Klik pada hasil pencarian
4. Klik tombol **"ENABLE"**

   ![Enable API](https://cloud.google.com/static/endpoints/docs/images/enable-api.png)

---

## Langkah 3: Buat OAuth 2.0 Consent Screen

1. Di sidebar, navigasi ke **"APIs & Services"** → **"OAuth consent screen"**
2. Pilih tipe pengguna:
   - **External** (jika aplikasi publik) - RECOMMENDED
   - **Internal** (hanya untuk organisasi Google Workspace)
3. Klik **"CREATE"**

### 3.1 Isi Informasi Consent Screen

**Step 1: OAuth consent screen**
- **App name**: `Notes AI`
- **User support email**: email Anda
- **Developer contact information**: email Anda
- Klik **"SAVE AND CONTINUE"**

**Step 2: Scopes**
- Klik **"ADD OR REMOVE SCOPES"**
- Pilih scope minimal:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Klik **"SAVE AND CONTINUE"**

**Step 3: Test Users**
- Opsional: Tambahkan email tester untuk development
- Klik **"SAVE AND CONTINUE"**

**Step 4: Summary**
- Review konfigurasi
- Klik **"BACK TO DASHBOARD"**

---

## Langkah 4: Buat OAuth 2.0 Credentials

1. Navigasi ke **"APIs & Services"** → **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** di bagian atas
3. Pilih **"OAuth client ID"**

   ![Create OAuth Client](https://developers.google.com/identity/images/oauth-client-create.png)

### 4.2 Pilih Application Type

Pilih **"Web application"**

### 4.3 Isi Form OAuth Client

**Name**: `Notes AI Web Client`

**Authorized JavaScript origins** (untuk development):
```
http://localhost:3000
```

**Authorized redirect URIs**:
```
http://localhost:3000/api/auth/google/callback
```

Jika sudah deploy ke production, tambahkan:
```
https://yourdomain.com/api/auth/google/callback
```

4. Klik **"CREATE"**

---

## Langkah 5: Simpan Credentials

Setelah berhasil, Anda akan melihat popup berisi:

```
Client ID:     123456789-abcdefg.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxx
```

⚠️ **PENTING**: Salin kedua nilai tersebut karena **Client Secret hanya ditampilkan sekali**!

---

## Langkah 6: Konfigurasi di Project

Buka file `.env` di project root:

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Paste nilai yang sudah disalin:

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

---

## Langkah 7: Verifikasi Setup

### Cek Environment Variables

Pastikan file `.env` berisi:

```bash
# Backend URL (untuk callback)
BACKEND_URL=http://localhost:5000

# OAuth - Google
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

### Routing Backend

Pastikan route OAuth sudah terdaftar di `src/routes/auth.ts`:

```typescript
// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);
```

---

## Testing

### 1. Jalankan Backend

```bash
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 2. Test Endpoint

Buka browser dan akses:

```
http://localhost:5000/api/auth/google
```

### 3. Flow yang Terjadi

1. Redirect ke halaman login Google
2. Pilih akun Google
3. Approve permissions (jika first time)
4. Redirect kembali ke: `http://localhost:5000/api/auth/google/callback`
5. Backend mengenerate JWT tokens
6. Redirect ke frontend dengan tokens

---

## Production Deployment

Untuk production, update:

### 1. Google Cloud Console Credentials

Tambahkan production URLs:

**Authorized JavaScript origins**:
```
https://yourdomain.com
```

**Authorized redirect URIs**:
```
https://yourdomain.com/api/auth/google/callback
```

### 2. Environment Variables

```bash
# Production
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
```

---

## Troubleshooting

### Error: redirect_uri_mismatch

**Masalah**: Callback URL tidak terdaftar di Google Cloud Console

**Solusi**:
1. Cek exact URL yang di-request di error message
2. Pastikan URL tersebut ditambahkan di **Authorized redirect URIs**
3. Pastikan tidak ada trailing slash berlebih

### Error: unauthorized_client

**Masalah**: OAuth client tidak diaktifkan

**Solusi**:
1. Pastikan Google+ API sudah di-enable
2. Cek OAuth consent screen sudah selesai

### Error: invalid_client

**Masalah**: Client ID atau Client Secret salah

**Solusi**:
1. Verifikasi nilai di `.env`
2. Pastikan tidak ada spasi berlebih
3. Cek apakah credentials sudah benar-benar disalin

### CORS Error

**Masalah**: Frontend tidak bisa akses API

**Solusi**:
```bash
# .env
FRONTEND_URL=http://localhost:3000  # Sesuaikan dengan frontend URL
```

---

## Referensi

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Setting up OAuth 2.0](https://support.google.com/cloud/answer/6158849)
- [Passport.js Google OAuth Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

---

## Checklist

- [ ] Project Google Cloud dibuat
- [ ] Google+ API di-enable
- [ ] OAuth consent screen dikonfigurasi
- [ ] OAuth credentials dibuat
- [ ] Client ID & Client Secret disalin ke `.env`
- [ ] Callback URL sesuai dengan backend route
- [ ] Testing development berhasil
- [ ] Production credentials disiapkan (sebelum deploy)
