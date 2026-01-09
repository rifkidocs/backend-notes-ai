# Panduan Kolaborasi Real-time (Real-time Collaboration)

Dokumen ini menjelaskan cara menggunakan dan memahami fitur kolaborasi real-time pada aplikasi Notes AI. Fitur ini memungkinkan pengguna untuk mengedit dokumen bersamaan, melihat kursor pengguna lain, dan mengatur hak akses.

## 🚀 Fitur Utama

1.  **Live Editing**: Perubahan teks disinkronisasi secara instan ke semua pengguna yang sedang membuka dokumen.
2.  **Live Cursors**: Melihat posisi kursor dan nama pengguna lain yang sedang mengetik.
3.  **Presence Indicators**: Daftar avatar pengguna yang sedang aktif di dokumen saat ini.
4.  **Granular Permissions**: Kontrol akses detail (Viewer vs Editor).

---

## 👥 Cara Berbagi Note

Ada dua cara untuk mengundang orang lain ke dalam dokumen Anda:

### 1. Public Link (Tautan Publik)
Cocok untuk berbagi cepat ke banyak orang atau membuat dokumen terbuka.

*   Buka menu **Share** di pojok kanan atas.
*   Aktifkan toggle **"Share to web"**.
*   Pilih level akses:
    *   `Can view`: Pengguna lain hanya bisa membaca.
    *   `Can edit`: Pengguna lain bisa ikut mengedit (tanpa perlu login jika diizinkan, atau login required tergantung konfigurasi).
*   Salin tautan dan bagikan.

### 2. Private Invite (Undangan Email)
Cocok untuk kolaborasi tim yang aman.

*   Buka menu **Share**.
*   Masukkan alamat email pengguna di kolom input.
*   Pilih permission (`Viewer` atau `Editor`).
*   Klik **Invite**.
*   User akan melihat note tersebut di menu "Shared with me".

---

## 🔒 Level Akses (Permissions)

| Role | Deskripsi | Bisa Edit? | Bisa Hapus? | Bisa Share? |
| :--- | :--- | :---: | :---: | :---: |
| **Owner** | Pemilik dokumen. Memiliki kontrol penuh. | ✅ | ✅ | ✅ |
| **Editor** | Bisa mengubah konten dokumen secara real-time. | ✅ | ❌ | ❌ |
| **Viewer** | Hanya bisa membaca dan melihat aktivitas user lain. | ❌ | ❌ | ❌ |

---

## 📡 Indikator Visual

Saat berkolaborasi, Anda akan melihat elemen visual berikut:

### Active Users (Presence)
Di bagian atas editor (header), akan muncul deretan avatar (lingkaran profil) dari pengguna yang sedang membuka dokumen tersebut.
*   **Border Hijau/Aktif**: User sedang aktif di tab tersebut.
*   **Pudar**: User membuka dokumen tapi sedang tidak fokus (idle).

### Collaborative Cursors
Saat pengguna lain mengetik atau memblok teks:
1.  **Caret Berwarna**: Anda akan melihat garis kedip dengan warna unik untuk setiap user.
2.  **Nametag**: Nama user akan muncul di atas kursor mereka.
3.  **Selection**: Teks yang diblok user lain akan di-highlight dengan warna mereka.

---

## 🛠️ Troubleshooting

**Q: Kenapa saya tidak bisa mengedit padahal sudah diberi link?**
A: Pastikan pemilik dokumen memberikan akses **"Can edit"**. Jika aksesnya public tapi hanya "Can view", Anda tidak akan bisa mengetik.

**Q: Perubahan saya tidak tersimpan?**
A: Pastikan koneksi internet stabil. Ada indikator "Saved" atau "Saving..." di pojok atas. Jika merah/error, refresh halaman.

**Q: Kursor teman saya tidak bergerak?**
A: Ini mungkin terjadi jika koneksi WebSocket terputus sebentar. Coba refresh halaman untuk menyambungkan ulang sesi real-time.
