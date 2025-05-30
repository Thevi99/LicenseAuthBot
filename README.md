## Bot ทำอะไรได้บ้าง?

LicenseAuthBot เป็นบอทที่ช่วยจัดการระบบไลเซนส์ในเซิร์ฟเวอร์ Discord ของคุณ ไม่ว่าคุณจะขายซอฟต์แวร์ บริการ หรือมีระบบสมาชิก บอทนี้จะช่วยตรวจสอบไลเซนส์ ติดตามวันหมดอายุ และจัดการสิทธิ์การเข้าถึงช่องต่างๆ ให้อัตโนมัติ

## ฟีเจอร์เด่น

- **ตรวจสอบไลเซนส์** - เช็คความถูกต้องและวันหมดอายุของไลเซนส์แต่ละตัว
- **ฐานข้อมูลผู้ใช้** - เก็บประวัติของสมาชิกและไลเซนส์ที่ใช้งาน
- **คำสั่งใช้งานง่าย** - มีคำสั่งสำหรับทั้งผู้ใช้ทั่วไปและแอดมิน
- **จัดการยศอัตโนมัติ** - ให้และเอายศตามสถานะไลเซนส์
- **แสดงผลสวยงาม** - ใช้ Discord Embed ที่ดูสวยงาม

## เริ่มใช้งาน

### วิธีติดตั้ง

1. ดาวน์โหลดโปรเจกต์:
```bash
git clone https://github.com/Thevi99/LicenseAuthBot_Discord.git
cd LicenseAuthBot_Discord
```

2. ติดตั้งแพ็คเกจที่จำเป็น:
```bash
npm install
```

3. สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:
```
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id
```

4. ตั้งค่าการเชื่อมต่อฐานข้อมูลใน `config.js`

5. เริ่มใช้งานบอท:
```bash
node index.js
```

## วิธีใช้งาน

### สำหรับสมาชิกทั่วไป
- `/register [license_key]` - ลงทะเบียนด้วยคีย์ไลเซนส์
- `/check` - เช็คสถานะไลเซนส์ปัจจุบัน
- `/help` - ดูคำสั่งทั้งหมด

### สำหรับแอดมิน
- `/admin-check [user]` - เช็คสถานะไลเซนส์ของสมาชิกคนอื่น
- `/generate-license [duration] [type]` - สร้างคีย์ไลเซนส์ใหม่
- `/ban [user] [reason]` - แบนผู้ใช้
- `/unban [user]` - ปลดแบน

## โครงสร้างโปรเจกต์

```
LicenseAuthBot_Discord/
├── commands/           # ไฟล์คำสั่งของบอท
├── events/             # จัดการอีเวนต์
├── database/           # จัดการฐานข้อมูล
├── utils/              # ฟังก์ชันช่วยเหลือ
├── index.js            # ไฟล์หลัก
└── config.js           # ไฟล์ตั้งค่า
```

## ความต้องการของระบบ

- Node.js (v16.9.0 ขึ้นไป)
- Discord.js (v14 ขึ้นไป)
- ฐานข้อมูล (MongoDB หรือ MySQL)
- Discord Bot Token (จาก Discord Developer Portal)


## ติดต่อสอบถาม

หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถ:
- แจ้งปัญหาใน GitHub
- เข้าร่วมเซิร์ฟเวอร์ Discord ของเรา
