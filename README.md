# ระบบสื่อสารภายในโรงพยาบาลเซนต์เมรี่ จังหวัดนครราชสีมา

ระบบสื่อสารแบบเรียลไทม์สำหรับบุคลากรภายในโรงพยาบาล พัฒนาด้วย Node.js, Express.js, Socket.io และ MySQL

## คุณสมบัติหลัก

- ✅ **แชทแบบเรียลไทม์** - สื่อสารทันทีระหว่างแผนก
- ✅ **ห้องสนทนาตามแผนก** - อัตโนมัติสำหรับ 53 แผนก
- ✅ **ส่งไฟล์เอกสาร** - รองรับรูปภาพ, PDF, Word, Excel, ไฟล์เสียง
- ✅ **ประวัติการสนทนา** - ค้นหาและตรวจสอบย้อนหลัง
- ✅ **AI สรุปการสนทนา** - สรุปรายวัน/สัปดาห์/เดือน
- ✅ **Text-to-Speech** - อ่านข้อความด้วยเสียง
- ✅ **ระบุตัวตน** - ด้วยรหัสพนักงาน
- ✅ **รองรับทุกอุปกรณ์** - คอมพิวเตอร์, แท็บเล็ต, สมาร์ทโฟน
- ✅ **ความปลอดภัย** - เข้ารหัสข้อมูลและการสื่อสาร

## เทคโนโลยีที่ใช้

### Backend
- Node.js
- Express.js
- Socket.io (Real-time communication)
- MySQL (ฐานข้อมูล)
- JWT (Authentication)
- Bcrypt (Password hashing)

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive Design
- Thai Language Support (UTF-8)

### Development Tools
- Visual Studio Code
- Git
- Nodemon (Development)

## การติดตั้ง

### 1. กำหนดค่าฐานข้อมูล

```bash
# สร้างฐานข้อมูล MySQL
mysql -u root -p

# ใน MySQL console
CREATE DATABASE ChatSMHKorat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ChatSMHKorat;

# รัน SQL script
source database.sql