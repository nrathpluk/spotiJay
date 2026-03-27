# 🎵 SpotiJay — Music Streaming Player

SpotiJay เป็น Music Player แบบ Desktop Application ที่สร้างด้วย **Tauri + Vite** สตรีมเพลงจาก Cloud ได้ทันที ออกแบบมาให้ **เบาที่สุดเท่าที่จะทำได้** — รันได้ลื่นแม้บนเครื่องสเปกต่ำ

![SpotiJay Screenshot](https://img.shields.io/badge/Version-0.1.0-blueviolet?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue?style=for-the-badge&logo=tauri)
![Vite](https://img.shields.io/badge/Vite-v7-yellow?style=for-the-badge&logo=vite)
![RAM](https://img.shields.io/badge/RAM_Usage-~50MB-brightgreen?style=for-the-badge)

---

## 🤔 ทำไมต้อง SpotiJay?

ทำขึ้นมาเพราะเพื่อนในกลุ่มใช้เครื่องสเปกต่ำกันหมด เปิด Spotify หนัก เปิด Browser หนัก เลยทำ Player ตัวนี้ขึ้นมาเอง — เน้นประหยัด RAM สุดๆ ไม่มีโฆษณา ไม่มีฟีเจอร์เกินจำเป็น เพลงอยู่บน Cloud เปิดได้ทุกเครื่อง

---

## 📌 Features

- 🔐 ระบบ **Login / Register** (เก็บข้อมูลผู้ใช้บน Cloudflare KV)
- 🎧 เล่นเพลงแบบ **Streaming** จาก Cloudflare R2
- ⬆️ **Upload** เพลงขึ้น Cloud ได้ (รองรับ .m4a, .mp3, .wav, .ogg, .flac)
- 🗑️ **ลบเพลง** ออกจาก Library ได้
- 🖱️ ลาก **Drag & Drop** ไฟล์เพลงเพื่ออัปโหลด
- ⌨️ **Keyboard Shortcuts** — Space เล่น/หยุด, ← → ข้ามเพลง
- 💾 จำ Volume ไว้ให้ ไม่ต้องปรับใหม่ทุกครั้ง
- 🖥️ Build เป็นไฟล์ **.exe** ได้ด้วย Tauri

---

## 🛠️ Tech Stack

| ส่วน             | เทคโนโลยี                       |
| ---------------- | ------------------------------- |
| Frontend         | HTML, CSS, JavaScript (Vanilla) |
| Bundler          | Vite                            |
| Desktop App      | Tauri v2 (Rust)                 |
| Backend API      | Cloudflare Workers              |
| Storage (เพลง)   | Cloudflare R2                   |
| Storage (ผู้ใช้) | Cloudflare KV                   |
| Auth             | SHA-256 + HMAC Token            |

---

## 📂 โครงสร้างโปรเจกต์

```
SpotiJay/
├── worker.js                 # Cloudflare Worker (Backend API)
├── music-app/
│   └── player/
│       ├── index.html        # หน้าหลัก + หน้า Login
│       ├── src/
│       │   ├── main.js       # Entry point
│       │   ├── auth.js       # ระบบ Login/Register/Logout
│       │   ├── player.js     # Logic เล่นเพลง ควบคุม UI
│       │   └── app.css       # Stylesheet ทั้งหมด
│       ├── src-tauri/        # Tauri config สำหรับ build .exe
│       └── .env              # ตัวแปร API URL (ไม่ push ขึ้น Git)
```

---

## ☁️ API Endpoints (Cloudflare Worker)

| Method | Path                | คำอธิบาย                     |
| ------ | ------------------- | ---------------------------- |
| POST   | `/register`         | สมัครบัญชีใหม่               |
| POST   | `/login`            | เข้าสู่ระบบ รับ Token กลับมา |
| GET    | `/verify`           | ตรวจสอบ Token                |
| GET    | `/songs`            | ดึงรายการเพลงทั้งหมด         |
| GET    | `/stream/:filename` | สตรีมไฟล์เพลงจาก R2          |
| POST   | `/upload`           | อัปโหลดเพลงขึ้น R2           |
| DELETE | `/songs/:filename`  | ลบเพลง                       |

---

## ⚙️ วิธีติดตั้งและรัน

### สิ่งที่ต้องมีในเครื่อง

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (สำหรับ build .exe)

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/nrathpluk/spotiJay.git
cd spotiJay
```

### 2. ติดตั้ง Dependencies

```bash
cd music-app/player
npm install
```

### 3. สร้างไฟล์ `.env`

```env
# สร้างไฟล์ .env ใน music-app/player/
VITE_API_URL=https://your-worker-url.workers.dev
```

### 4. รันโปรเจกต์ (Development)

```bash
npm run dev
```

เปิด browser ไปที่ `http://localhost:5173`

### 5. Build เป็นไฟล์ .exe (Production)

```bash
npm run tauri build
```

ไฟล์ installer จะอยู่ที่ `src-tauri/target/release/bundle/`

---

## ☁️ การตั้งค่า Cloudflare (Backend)

1. สร้าง **R2 Bucket** สำหรับเก็บไฟล์เพลง
2. สร้าง **KV Namespace** ชื่อ `SPOTIJAY_USERS` สำหรับเก็บข้อมูลผู้ใช้
3. สร้าง **Worker** แล้ว copy code จาก `worker.js` ไปวาง
4. ตั้ง Bindings ใน Worker:
   - `MUSIC_BUCKET` → R2 Bucket
   - `USERS` → KV Namespace
5. เพิ่ม Environment Variable:
   - `AUTH_SECRET` → random string ยาวๆ (อย่างน้อย 32 ตัวอักษร)

---

## 🔐 ระบบ Authentication

- ผู้ใช้สามารถ **Register** สร้างบัญชีใหม่ หรือ **Login** เข้าใช้งาน
- Password ถูก hash ด้วย **SHA-256** ก่อนเก็บใน KV
- Token สร้างจาก **HMAC** มีอายุ 30 วัน เก็บใน `localStorage`
- เมื่อเปิดแอปจะ verify token อัตโนมัติ ไม่ต้อง login ซ้ำ

---

## ⚠️ ข้อจำกัดที่รู้อยู่แล้ว

- ไฟล์เพลงที่อัปโหลดได้ขึ้นอยู่กับ Cloudflare R2 free tier (10 GB/เดือน)
- ไม่มีระบบ Playlist (ตอนนี้เล่นเรียงตามลำดับใน Library)
- ยังไม่รองรับ Linux และ macOS (build สำหรับ Windows เท่านั้นตอนนี้)
