# WebSocket API Documentation (Frontend Guide)

Dokumen ini berisi spesifikasi teknis untuk implementasi fitur Real-time Collaboration di frontend. Backend menggunakan `Socket.io` dan membutuhkan autentikasi JWT.

## 🔌 Connection Setup

**Endpoint:** `http://localhost:5000` (atau sesuaikan dengan environment)
**Path:** `/socket.io/` (Default)
**Transports:** `['websocket', 'polling']`

### Authentication
Token JWT harus dikirim saat handshake awal. Bisa melalui objek `auth` atau header.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN" // Dapatkan dari login response
  },
  // Alternatif via headers:
  // extraHeaders: {
  //   Authorization: "Bearer YOUR_JWT_TOKEN"
  // }
});
```

---

## 📄 Document Events

Digunakan untuk bergabung ke sesi edit, meninggalkan sesi, dan sinkronisasi konten.

### 1. Join Document room
Panggil ini saat user membuka halaman editor.

*   **Emit (Client -> Server):** `document:join`
    ```javascript
    socket.emit("document:join", { noteId: "your_note_id" });
    ```
    *Note: Server akan otomatis meng-handle room dengan prefix `note_{id}`.*

*   **Listen (Server -> Client):** `document:users` (Daftar user saat ini)
    Diterima oleh user yang baru saja join.
    ```javascript
    socket.on("document:users", ({ users }) => {
      console.log("Current users in room:", users);
      // users: [{ userId: "uuid-1", userName: "Alice", color: "#FF5733", socketId: "s-1" }, ...]
    });
    ```

*   **Listen (Server -> Client):** `document:user:joined` (Notifikasi user baru masuk)
    Diterima oleh user lain di room yang sama.
    ```javascript
    socket.on("document:user:joined", ({ userId, userName, color, socketId }) => {
      console.log(`${userName} joined!`);
      // Simpan color untuk rendering kursor/avatar
    });
    ```

### 2. Leave Document
Panggil saat user menutup tab atau pindah halaman (unmount component).

*   **Emit:** `document:leave`
    ```javascript
    socket.emit("document:leave", { noteId: "your_note_id" });
    ```

*   **Listen:** `document:user:left`
    ```javascript
    socket.on("document:user:left", ({ userId }) => {
      // Remove user cursor and avatar
    });
    ```

### 3. Sync Content (Editing) - Optimistic Concurrency
Sistem menggunakan **Optimistic Concurrency Control**.
Client harus mengirimkan **Base Version** (versi dokumen sebelum diedit). Jika cocok dengan versi server, server akan menaikkan versi dan broadcast update.

*   **Emit:** `document:edit`
    ```javascript
    socket.emit("document:edit", {
      noteId: "your_note_id",
      version: 0, // PENTING: Kirim versi dokumen saat ini (Base Version)
      operations: [
        // Format operasi editor
        { insert: "Hello world", at: 0 }
      ]
    });
    ```

*   **Listen:** `document:updated` (Broadcast ke **SEMUA** client, termasuk sender)
    Backend akan mem-broadcast event ini segera setelah validasi versi sukses.
    ```javascript
    socket.on("document:updated", ({ operations, version, userId, userName, timestamp }) => {
      // Update 'currentVersion' client ke 'version' yang baru diterima.
      // Jika 'userId' adalah saya, biasanya kita abaikan operations karena sudah diterapkan (optimistic UI),
      // ATAU gunakan untuk konfirmasi bahwa server sudah menerima perubahan (ack).
      
      if (userId !== myUserId) {
        editor.applyOps(operations);
      }
      
      // PENTING: Selalu update versi lokal
      localDocVersion = version;
    });
    ```

*   **Error Handling (Conflict):** `document:conflict`
    Terjadi jika client mengirim `version` yang tidak sama dengan server (misal: user lain sudah mengedit duluan).
    ```javascript
    socket.on("document:conflict", ({ currentVersion, yourVersion }) => {
      console.warn(`Conflict! Server: ${currentVersion}, You: ${yourVersion}`);
      // Action: Fetch ulang konten terbaru dari server untuk reset state
      // atau lakukan logic rebase jika memungkinkan.
    });
    ```

---

## 🖱️ Cursor & Presence

Fitur visual untuk melihat siapa yang sedang aktif dan di mana mereka mengetik.

### 1. Cursor Movement
Kirim posisi kursor setiap kali user memindahkan kursor atau mengetik.

*   **Emit:** `cursor:update`
    ```javascript
    socket.emit("cursor:update", {
      noteId: "your_note_id",
      position: { line: 10, ch: 5 } // Sesuaikan dengan editor
    });
    ```

*   **Listen:** `cursor:moved`
    ```javascript
    socket.on("cursor:moved", ({ userId, userName, position, color }) => {
      // Render remote cursor user lain
      // 'color' dibuat konsisten oleh backend berdasarkan userId
    });
    ```

### 2. Presence (Online Status)
Mengetahui siapa saja yang sedang online di dokumen ini.

*   **Emit:** `presence:subscribe`
    ```javascript
    socket.emit("presence:subscribe", { noteId: "your_note_id" });
    ```

*   **Listen:** `presence:online`
    ```javascript
    socket.on("presence:online", ({ users }) => {
      // users: [{ id: "user_1" }, ...]
    });
    ```

*   **Listen:** `presence:offline`
    Event ini dibroadcast ke semua room dokumen yang ditempati user saat user disconnect.
    ```javascript
    socket.on("presence:offline", ({ userId }) => {
      // Set status user jadi offline
    });
    ```

---

## ⚠️ Error Handling

Socket.io akan mengirim event `error` jika terjadi masalah (auth gagal, permission denied, invalid data).

```javascript
socket.on("error", (err) => {
  console.error("Socket error:", err.message);
  // Tampilkan toast error
});
```