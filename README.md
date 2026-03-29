# 🎵 SpotiJay

> โปรเจกต์นี้เป็นส่วนหนึ่งของรายวิชา ... มหาวิทยาลัย ...

Music Player เล็กๆ ที่ทำขึ้นมาเพราะเพื่อนคอมกากกันหมด เปิด Spotify ไม่ไหว
สตรีมเพลงจาก Cloud ได้เลย ไม่กิน RAM ไม่มีโฆษณา ใช้กันในกลุ่มเพื่อน

![Version](https://img.shields.io/badge/Version-0.1.0-blueviolet?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue?style=for-the-badge&logo=tauri)
![Vite](https://img.shields.io/badge/Vite-v7-yellow?style=for-the-badge&logo=vite)
![RAM](https://img.shields.io/badge/RAM_Usage-~25--35MB-brightgreen?style=for-the-badge)

---

## ทำอะไรได้บ้าง

- Login / Register เก็บข้อมูลบน Cloudflare KV
- สตรีมเพลงจาก Cloudflare R2
- อัปโหลดเพลงขึ้น Cloud ได้ (.mp3, .m4a, .wav, .ogg, .flac)
- ลบเพลงออกจาก Library ได้
- Drag & Drop ไฟล์เพื่ออัปโหลด
- Space เล่น/หยุด, ← → ข้ามเพลง
- จำ Volume ไว้ให้
- Build เป็น .exe ได้

---

## Tech Stack

| ส่วน        | เทคโนโลยี                       |
| ----------- | ------------------------------- |
| Frontend    | HTML, CSS, JavaScript (Vanilla) |
| Bundler     | Vite                            |
| Desktop App | Tauri v2 (Rust)                 |
| Backend     | Cloudflare Workers              |
| เก็บเพลง    | Cloudflare R2                   |
| เก็บ User   | Cloudflare KV                   |
| Auth        | SHA-256 + HMAC Token            |

---

## โครงสร้างโปรเจกต์

```
SpotiJay/
├── worker.js                 # Backend (Cloudflare Worker)
├── music-app/
│   └── player/
│       ├── index.html        # หน้าหลัก + Login
│       ├── src/
│       │   ├── main.js       # Entry point
│       │   ├── auth.js       # Login/Register/Logout
│       │   ├── player.js     # Logic เล่นเพลง
│       │   └── app.css       # Style ทั้งหมด
│       ├── src-tauri/        # Config สำหรับ build .exe
│       └── .env              # API URL (ไม่ push ขึ้น Git)
```

---

## API Endpoints

| Method | Path                | คำอธิบาย               |
| ------ | ------------------- | ---------------------- |
| POST   | `/register`         | สมัครบัญชี             |
| POST   | `/login`            | Login รับ Token กลับมา |
| GET    | `/verify`           | เช็ค Token             |
| GET    | `/songs`            | ดึงรายการเพลง          |
| GET    | `/stream/:filename` | สตรีมเพลงจาก R2        |
| POST   | `/upload`           | อัปโหลดเพลง            |
| DELETE | `/songs/:filename`  | ลบเพลง                 |

---

## วิธีรัน

ต้องมีก่อน: [Node.js](https://nodejs.org/) v18+ และ [Rust](https://rustup.rs/)

```bash
git clone https://github.com/nrathpluk/spotiJay.git
cd spotiJay/music-app/player
npm install
```

สร้างไฟล์ `.env`:

```env
VITE_API_URL=https://your-worker-url.workers.dev
```

รัน dev:

```bash
npm run dev
# เปิด http://localhost:5173
```

Build .exe:

```bash
npm run tauri build
# ไฟล์อยู่ที่ src-tauri/target/release/bundle/
```

---

## ตั้งค่า Cloudflare

1. สร้าง R2 Bucket สำหรับเก็บเพลง
2. สร้าง KV Namespace ชื่อ `SPOTIJAY_USERS`
3. สร้าง Worker แล้ว copy code จาก `worker.js` ไปวาง
4. ตั้ง Bindings:
   - `MUSIC_BUCKET` → R2 Bucket
   - `USERS` → KV Namespace
5. เพิ่ม `AUTH_SECRET` ใน Environment Variables (random string ยาวๆ)

---

## Auth ทำงานยังไง

- Password hash ด้วย SHA-256 ก่อนเก็บ
- Token มาจาก HMAC อายุ 30 วัน เก็บใน localStorage
- เปิดแอปมา verify token อัตโนมัติ ไม่ต้อง login ใหม่

---

## ข้อจำกัด

- R2 free tier อยู่ที่ 10 GB ถ้าเพลงเยอะอาจเต็ม
- ยังไม่มี Playlist เล่นเรียงตาม Library อย่างเดียว
- รองรับแค่ Windows ตอนนี้

---

## ผู้จัดทำ

| ชื่อ | รหัสนักศึกษา | หน้าที่            |
| ---- | ------------ | ------------------ |
| นราธิป | 6600904          | Frontend / Backend |

---

_ทำเพื่อการศึกษาและใช้กันเองในกลุ่ม_
