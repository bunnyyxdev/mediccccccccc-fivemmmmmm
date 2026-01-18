# ระบบหมอ Biz City

ระบบจัดการสำหรับแพทย์ Biz City ที่มี UI/UX ที่ทันสมัยและใช้งานง่าย

## คุณสมบัติ

### สำหรับแพทย์ (User)
- **Dashboard** - แดชบอร์ดสำหรับดูข้อมูลสรุป
- **เบิกของในตู้** - บันทึกการเบิกของในตู้
- **ลงเวลาพี่เลี้ยง** - บันทึกเวลาพี่เลี้ยง
- **รันคิว** - จัดการคิวผู้ป่วย
- **สตอรี่** - อัปโหลดและแชร์สตอรี่/รูปภาพ
- **แจ้งแคส** - รายงานและแจ้งแคสต่างๆ
- **แบล็คลิส** - จัดการรายการแบล็คลิส
- **โทษวินัยแพทย์** - บันทึกโทษวินัยแพทย์
- **เสนอความคิดเห็น** - เสนอความคิดเห็นและข้อเสนอแนะ
- **อื่น** - แจ้งลา, แจ้งแคช, แจ้งเหม๋อ

### สำหรับผู้ดูแลระบบ (Admin)
- **Dashboard** - แดชบอร์ดผู้ดูแลระบบ
- **จัดการผู้ใช้** - สร้าง แก้ไข และลบบัญชีแพทย์
- **สถิติ** - ดูสถิติผู้ใช้ทั้งหมด

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Token)
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Backup/Integration**: Google Sheets API
- **Webhook**: Discord Webhook

## การติดตั้ง

1. **Clone repository** หรือดาวน์โหลดโปรเจกต์
   ```bash
   cd "MEDIC WEB"
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า environment variables**
   - สร้างไฟล์ `.env` ใน root directory
   - กรอกข้อมูลที่จำเป็น:
     ```env
     # MongoDB Configuration
     MONGODB_URI=mongodb://localhost:27017
     MONGODB_DB_NAME=medic_web_v1
     
     # JWT Secret
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     
     # Admin Credentials
     ADMIN_USERNAME=administrator
     ADMIN_PASSWORD=bizcity#123456
     
     # Discord Webhooks (can use multiple webhooks per type, separated by commas)
     DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-general-webhook-url
     DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/your-general-webhook-url
     DISCORD_WEBHOOK_NOTIFICATIONS=https://discord.com/api/webhooks/your-notifications-webhook-url
     DISCORD_WEBHOOK_WITHDRAWALS=https://discord.com/api/webhooks/your-withdrawals-webhook-url
     DISCORD_WEBHOOK_ADMIN=https://discord.com/api/webhooks/your-admin-webhook-url
     DISCORD_WEBHOOK_ACTIVITIES=https://discord.com/api/webhooks/your-activities-webhook-url
     
     # Google Sheets Configuration
     GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
     ```

4. **Initialize database (first time only)**
   ```bash
   npm run init-db
   ```
   This will create the default admin user and set up database indexes.

5. **ตั้งค่า Google Sheets credentials**
   - ดาวน์โหลด Service Account credentials จาก Google Cloud Console
   - เปลี่ยนชื่อไฟล์เป็น `credentials.json`
   - วางไฟล์ `credentials.json` ใน root directory ของโปรเจกต์
   - (อ้างอิงจาก `credentials.example.json` สำหรับรูปแบบไฟล์)

6. **รัน development server**
   ```bash
   npm run dev
   ```

7. **เปิดเบราว์เซอร์**
   - ไปที่ `http://localhost:3000`

## การใช้งาน

### เข้าสู่ระบบ

#### สำหรับ Admin
- **Username**: `administrator`
- **Password**: `bizcity#123456`

#### สำหรับแพทย์
- Admin จะสร้างบัญชีให้แพทย์แต่ละคนผ่านหน้า Admin Panel

### การสร้างบัญชีแพทย์ (Admin Only)

1. เข้าสู่ระบบด้วยบัญชี Admin
2. ไปที่ **Dashboard Admin** > **จัดการผู้ใช้**
3. คลิก **สร้างผู้ใช้**
4. กรอกข้อมูล:
   - ชื่อผู้ใช้ (Username)
   - รหัสผ่าน (Password - ขั้นต่ำ 6 ตัวอักษร)
   - ชื่อ-นามสกุล
   - อีเมล (ไม่บังคับ)
   - บทบาท (แพทย์/Admin)
5. คลิก **สร้างบัญชี**

## โครงสร้างโปรเจกต์

```
MEDIC WEB/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── admin/        # Admin endpoints
│   ├── dashboard/        # Dashboard pages
│   │   ├── admin/       # Admin dashboard
│   │   └── others/      # Other menu items
│   ├── login/           # Login page
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page (redirects to login)
├── components/          # React components
│   ├── Sidebar.tsx     # Sidebar navigation
│   ├── Layout.tsx      # Layout wrapper
│   ├── Button.tsx      # Button component
│   └── Alert.tsx       # Alert component
├── docs/               # Documentation
│   └── README.md       # Documentation files
├── lib/                # Utility libraries
│   ├── mongodb.ts      # MongoDB connection
│   ├── auth.ts         # Authentication utilities
│   ├── discord-webhook.ts  # Discord webhook
│   └── google-sheets.ts    # Google Sheets integration
├── models/             # MongoDB models
│   └── User.ts         # User model
├── public/             # Static files
└── package.json        # Dependencies
```

## Security Features

- **JWT Authentication** - ใช้ JWT สำหรับ authentication
- **Password Hashing** - ใช้ bcryptjs สำหรับ hash password
- **Protected Routes** - หน้า dashboard ต้อง login ก่อน
- **Role-based Access** - แยกสิทธิ์ Admin และ Doctor
- **Environment Variables** - เก็บข้อมูลสำคัญใน .env

## Features ที่พร้อมใช้งาน

✅ **Authentication System** - Login/Logout
✅ **User Management** - Admin สามารถสร้างผู้ใช้ได้
✅ **Dashboard** - สำหรับทั้ง User และ Admin
✅ **Sidebar Navigation** - เมนูครบถ้วนตามที่กำหนด
✅ **UI Components** - ปุ่ม, Alert, และ Notifications พร้อม success/warning states
✅ **Form Validation** - ฟอร์มมี validation พื้นฐาน
✅ **Responsive Design** - รองรับการแสดงผลบน mobile/tablet/desktop

## Features ที่ต้องเพิ่มเติมในอนาคต

- [ ] API routes สำหรับบันทึกข้อมูลลง MongoDB
- [ ] Image upload system สำหรับสตอรี่
- [ ] Google Sheets integration สำหรับ backup
- [ ] Discord webhook integration สำหรับแจ้งเตือน
- [ ] Notification system แบบ real-time
- [ ] Export ข้อมูลเป็น Excel/PDF

## การ Build สำหรับ Production

```bash
npm run build
npm start
```

## License

Private - สำหรับการใช้งานภายใน Biz City เท่านั้น

## Contact

สำหรับคำถามหรือปัญหา ติดต่อทีมพัฒนา
#   m e d i c c c c c c c c c - f i v e m m m m m m m m m m m m  
 #   m e d i c c c c c c c c c - f i v e m m m m m m m m m m m m  
 #   m e d i c c c c c c c c c - f i v e m m m m m m  
 