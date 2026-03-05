const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ✅ ใช้ Resend แทน nodemailer (Render Free บล็อก SMTP ทุก port)
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// PostgreSQL Connection
// ========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected to Supabase successfully!');
        release();
    }
});

const getConnection = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await pool.connect();
        } catch (error) {
            console.log(`⚠️ Connection attempt ${i + 1} failed, retrying...`);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// ========================================
// ✅ ฟังก์ชันส่งอีเมลผ่าน Resend API (ทำงานได้บน Render Free)
// ========================================
async function sendResetCodeEmail(email, name, code) {
    console.log('📧 ===== SENDING VIA RESEND API =====');
    console.log('📧 To:', email);
    console.log('📧 Code:', code);

    try {
        const { data, error } = await resend.emails.send({
            // ⚠️ หมายเหตุ: onboarding@resend.dev ส่งได้เฉพาะ verified email เท่านั้น
            // เมื่อ verify domain แล้ว เปลี่ยนเป็น: 'noreply@your-domain.com'
            from: 'SMH Chat <onboarding@resend.dev>',
            to: email,
            subject: '🔐 รหัสยืนยันการตั้งรหัสผ่านใหม่',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #667eea; text-align: center;">🔐 รหัสยืนยันการตั้งรหัสผ่านใหม่</h2>
                    <p style="font-size: 16px;">สวัสดี คุณ${name}</p>
                    <p style="font-size: 16px;">กรุณาใช้รหัส 6 หลักด้านล่าง:</p>
                    <div style="text-align: center; margin: 40px 0;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; font-weight: bold; letter-spacing: 10px; padding: 20px; border-radius: 10px; display: inline-block; font-family: monospace;">
                            ${code}
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #e74c3c; font-weight: bold;">⚠️ รหัสนี้หมดอายุใน 10 นาที</p>
                    </div>
                    <p style="color: #999; font-size: 14px; text-align: center;">หากคุณไม่ได้ขอรับรหัสนี้ กรุณาละเว้นอีเมลนี้</p>
                    <hr style="border: none; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; text-align: center;">© 2024 โรงพยาบาลเซนต์เมรี่ นครราชสีมา</p>
                </div>
            `
        });

        if (error) {
            console.error('❌ Resend error:', JSON.stringify(error));
            return false;
        }

        console.log('✅ Email sent via Resend, ID:', data.id);
        return true;

    } catch (err) {
        console.error('❌ Resend exception:', err.message);
        return false;
    }
}

// ========================================
// สร้างห้องแผนก
// ========================================
async function createDepartmentRooms() {
    const client = await getConnection();
    try {
        console.log('🔍 Checking department chat rooms...');
        const departmentsResult = await client.query('SELECT department_id, department_name FROM departments');
        const departments = departmentsResult.rows;
        console.log(`Found ${departments.length} departments`);
        let createdCount = 0;
        for (const dept of departments) {
            const existingRoomResult = await client.query(
                'SELECT room_id FROM chat_rooms WHERE department_id = $1 AND room_type = $2',
                [dept.department_id, 'department']
            );
            if (existingRoomResult.rows.length === 0) {
                await client.query(
                    'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES ($1, $2, $3)',
                    [`ห้องแชท - ${dept.department_name}`, 'department', dept.department_id]
                );
                createdCount++;
            }
        }
        if (createdCount > 0) console.log(`✅ Created ${createdCount} department chat rooms`);
        else console.log('✅ All department chat rooms already exist');

        const usersWithoutRoomsResult = await client.query(`
            SELECT u.user_id, u.department_id, d.department_name 
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE NOT EXISTS (
                SELECT 1 FROM room_members rm
                INNER JOIN chat_rooms cr ON rm.room_id = cr.room_id
                WHERE rm.user_id = u.user_id 
                AND cr.department_id = u.department_id 
                AND cr.room_type = 'department'
            )
        `);
        let addedCount = 0;
        for (const user of usersWithoutRoomsResult.rows) {
            if (!user.department_id) continue;
            const deptRoomResult = await client.query(
                'SELECT room_id FROM chat_rooms WHERE department_id = $1 AND room_type = $2',
                [user.department_id, 'department']
            );
            if (deptRoomResult.rows.length > 0) {
                await client.query(
                    'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
                    [deptRoomResult.rows[0].room_id, user.user_id]
                );
                addedCount++;
            }
        }
        if (addedCount > 0) console.log(`✅ Added ${addedCount} users to their department rooms`);
    } catch (error) {
        console.error('Error creating department rooms:', error);
    } finally {
        if (client) client.release();
    }
}

function createFallbackSummary(messages, roomName) {
    const uniqueUsers = [...new Set(messages.map(m => m.full_name))];
    const timeRange = messages.length > 0
        ? `${messages[0].date} ${messages[0].time} - ${messages[messages.length-1].date} ${messages[messages.length-1].time}`
        : 'ไม่ระบุ';
    const keywords = {};
    const stopWords = ['ครับ','ค่ะ','นะ','ได้','แล้ว','และ','หรือ','ที่','ใน','เป็น','มี','ให้','ไป','มา','จะ','ก็','แต่','เลย'];
    messages.forEach(m => {
        m.message_text.split(/\s+/).forEach(word => {
            if (word.length > 2 && !stopWords.includes(word)) keywords[word] = (keywords[word] || 0) + 1;
        });
    });
    const topKeywords = Object.entries(keywords).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([w])=>w).join(', ');
    const sampleMsgs = [];
    const seenUsers = new Set();
    for (const m of messages) {
        if (!seenUsers.has(m.full_name) && m.message_text.length > 10) {
            sampleMsgs.push(`- ${m.full_name}: "${m.message_text.substring(0,60)}..."`);
            seenUsers.add(m.full_name);
        }
        if (sampleMsgs.length >= 3) break;
    }
    return `**1. 📋 สรุปภาพรวม**\nการสนทนาในห้อง "${roomName}" ช่วง ${timeRange} มีผู้เข้าร่วม ${uniqueUsers.length} คน รวม ${messages.length} ข้อความ\n\n**2. 🎯 ประเด็นสำคัญ**\n- หัวข้อหลัก: ${topKeywords || 'ไม่สามารถระบุได้'}\n${sampleMsgs.join('\n')}\n\n**3. 📅 นัดหมาย**\n- ไม่พบการนัดหมาย\n\n**4. ✅ Action Items**\n- ไม่มี\n\n**5. ⚠️ ประเด็นค้างอยู่**\n- ไม่มี\n\n**6. 💊 ข้อมูลทางการแพทย์**\n- ไม่มี\n\n**7. 📊 สถิติ**\n- ผู้เข้าร่วม: ${uniqueUsers.join(', ')}\n- ช่วงเวลา: ${timeRange}\n- จำนวนข้อความ: ${messages.length}\n- โทน: ปกติ | ระดับ: 🟢 ทั่วไป\n\n⚠️ *สรุปโดยระบบสำรอง (Gemini AI ไม่พร้อมใช้งาน)*`;
}

async function createSummaryTable() {
    const client = await getConnection();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_summary_new (
                id SERIAL PRIMARY KEY,
                summary_id VARCHAR(50) UNIQUE,
                chat_content TEXT,
                summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                saved_at TIMESTAMP NULL
            )
        `);
        console.log('✅ Created/Checked chat_summary_new table');
    } catch (error) {
        console.error('Error creating summary table:', error);
    } finally {
        if (client) client.release();
    }
}

// ========================================
// File upload - Cloudinary
// ========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype && file.mimetype.startsWith('image/');
        return {
            folder: 'smh-hospital-chat',
            resource_type: isImage ? 'image' : 'raw',
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        };
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'smh-hospital-chat-secret-key-2024';

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
    }
};

// ========================================
// API Routes
// ========================================

// 1. Register
app.post('/api/register', async (req, res) => {
    const client = await getConnection();
    try {
        const { employee_id, username, password, full_name, email, department_id } = req.body;
        if (!employee_id || !username || !password || !full_name || !department_id)
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

        const existingResult = await client.query(
            'SELECT user_id FROM users WHERE employee_id = $1 OR username = $2',
            [employee_id, username]
        );
        if (existingResult.rows.length > 0)
            return res.status(400).json({ error: 'รหัสพนักงานหรือชื่อผู้ใช้มีอยู่แล้ว' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await client.query(
            `INSERT INTO users (employee_id, username, password, full_name, email, department_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
            [employee_id, username, hashedPassword, full_name, email, department_id]
        );
        const userId = userResult.rows[0].user_id;

        let departmentRoomResult = await client.query(
            'SELECT room_id FROM chat_rooms WHERE department_id = $1 AND room_type = $2',
            [department_id, 'department']
        );
        let departmentRoom = departmentRoomResult.rows;

        if (departmentRoom.length === 0) {
            const deptInfoResult = await client.query('SELECT department_name FROM departments WHERE department_id = $1', [department_id]);
            const departmentName = deptInfoResult.rows.length > 0 ? deptInfoResult.rows[0].department_name : 'แผนกไม่ทราบชื่อ';
            const roomResult = await client.query(
                'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES ($1, $2, $3) RETURNING room_id',
                [`ห้องแชท - ${departmentName}`, 'department', department_id]
            );
            departmentRoom = [{ room_id: roomResult.rows[0].room_id }];
        }

        if (departmentRoom.length > 0)
            await client.query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [departmentRoom[0].room_id, userId]);

        const token = jwt.sign({ user_id: userId, employee_id, username, department_id }, JWT_SECRET, { expiresIn: '7d' });
        const deptDataResult = await client.query('SELECT department_name FROM departments WHERE department_id = $1', [department_id]);
        const department_name = deptDataResult.rows.length > 0 ? deptDataResult.rows[0].department_name : 'ไม่ทราบแผนก';

        res.status(201).json({ success: true, message: 'ลงทะเบียนสำเร็จ', token, user: { user_id: userId, employee_id, username, full_name, email, department_id, department_name } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    } finally {
        if (client) client.release();
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const client = await getConnection();
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });

        const usersResult = await client.query(
            `SELECT u.*, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.username = $1 OR u.employee_id = $2`,
            [username, username]
        );
        if (usersResult.rows.length === 0) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

        const user = usersResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

        await client.query('UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = $1', [user.user_id]);
        const token = jwt.sign({ user_id: user.user_id, employee_id: user.employee_id, username: user.username, department_id: user.department_id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, user: { user_id: user.user_id, employee_id: user.employee_id, username: user.username, full_name: user.full_name, email: user.email, department_id: user.department_id, department_name: user.department_name, profile_image: user.profile_image, is_online: true } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    } finally {
        if (client) client.release();
    }
});

// 3. Get current user
app.get('/api/me', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const usersResult = await client.query(
            `SELECT u.*, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.user_id = $1`,
            [req.user.user_id]
        );
        if (usersResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json({ success: true, user: usersResult.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 4. Get departments
app.get('/api/departments', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM departments ORDER BY department_name');
            client.release();
            if (result.rows.length > 0) return res.json({ success: true, departments: result.rows, source: 'database' });
            return sendBackupDepartments(res);
        } catch (queryError) {
            client.release();
            return sendBackupDepartments(res);
        }
    } catch (connectionError) {
        return sendBackupDepartments(res);
    }
});

function sendBackupDepartments(res) {
    const departmentNames = [
        'แผนกเกษตรกรรม','แผนกประชาสัมพันธ์ตลาด','แผนกสิทธิประโยชน์','แผนกเวชระเบียน',
        'แผนกลูกค้าสัมพันธ์และลงทะเบียน','แผนกเทคโนโลยีสารสนเทศ','แผนกอภิบาล','ศูนย์วางแผนและพัฒนา',
        'แผนกโทรศัพท์','แผนกรักษาความปลอดภัย','แผนกการเงิน','แผนกบัญชี-งานวิเคราะห์','แผนกจัดซื้อ',
        'แผนกคลัง','ศูนย์คุณภาพ','คลินิกทันตกรรม','แผนกอุบัติเหตุฉุกเฉินและศูนย์รถพยาบาล','แผนกผ่าตัด',
        'แผนกบริการเปล','แผนกผู้ป่วยในชั้น 4 มารีย์','แผนกผู้ป่วยในชั้น 4 วังกาแวร์','แผนกผู้ป่วยในชั้น 5 มารีย์',
        'แผนกผู้ป่วยในชั้น 5 วังกาแวร์','แผนกผู้ป่วยในชั้น 6 มารีย์','แผนกผู้ป่วยในชั้น 6 วังกาแวร์',
        'แผนกผู้ป่วยในชั้น 7 วังกาแวร์','แผนกผู้ป่วยในชั้น 8 วังกาแวร์','แผนกผู้ป่วยวิกฤต','แผนกเภสัชกรรม',
        'แผนกรังสีวิทยา','ผู้จัดการและรองผู้จัดการ','งานนิติกร','งานที่ดิน','ฝ่ายการแพทย์',
        'นักปฏิบัติการการแพทย์ฉุกเฉิน','เลขานุการฝ่ายการแพทย์','ผู้ช่วยแพทย์แผนจีน','ศูนย์ตรวจสุขภาพ',
        'ตรวจการ','ฝ่ายการพยาบาล','คลินิกอายุรกรรม','คลินิกศัลยกรรม/กระดูกและข้อ','คลินิกสูตินรเวช-กุมารเวช',
        'คลินิกเฉพาะทาง(จักษุ หู จมูก คอ)','แผนกห้องปฏิบัติการ','แผนกกายภาพบำบัด','แผนกจ่ายกลาง',
        'แผนกวิศวกรรมการแพทย์','แผนกเคหะบริการ','บริการส่วนหน้า',
        'แผนกทรัพยากรบุคคล งานธุรการ และกองเลขานุการ','แผนกซ่อมบำรุงและก่อสร้าง','แผนกยานพาหนะ'
    ];
    res.json({ success: true, departments: departmentNames.map((name, i) => ({ department_id: i+1, department_name: name, created_at: new Date().toISOString() })), source: 'backup' });
}

// 5. Get chat rooms
app.get('/api/chat-rooms', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const userId = req.user.user_id;
        const roomsResult = await client.query(`
            SELECT cr.room_id, cr.room_name, cr.room_type, cr.department_id, cr.created_at, d.department_name,
                (SELECT COUNT(*) FROM messages m WHERE m.room_id = cr.room_id AND m.sender_id != $1
                 AND m.created_at > COALESCE((SELECT MAX(joined_at) FROM room_members rm2 WHERE rm2.room_id = cr.room_id AND rm2.user_id = $2), '2000-01-01')
                 AND NOT EXISTS (SELECT 1 FROM message_reads mr WHERE mr.message_id = m.message_id AND mr.user_id = $3)) as unread_count,
                (SELECT message_text FROM messages WHERE room_id = cr.room_id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM chat_rooms cr
            LEFT JOIN departments d ON cr.department_id = d.department_id
            WHERE cr.room_id IN (SELECT room_id FROM room_members WHERE user_id = $4)
            ORDER BY unread_count DESC, cr.room_type, cr.room_name
        `, [userId, userId, userId, userId]);
        res.json({ success: true, rooms: roomsResult.rows, count: roomsResult.rows.length });
    } catch (error) {
        console.error('❌ Get chat rooms error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องสนทนา' });
    } finally {
        if (client) client.release();
    }
});

// Mark as read
app.post('/api/chat-rooms/:roomId/read', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const userId = req.user.user_id;
        await client.query(
            `INSERT INTO message_reads (message_id, user_id, read_at)
             SELECT m.message_id, $1, NOW() FROM messages m WHERE m.room_id = $2 AND m.sender_id != $3
             AND NOT EXISTS (SELECT 1 FROM message_reads mr WHERE mr.message_id = m.message_id AND mr.user_id = $4)`,
            [userId, roomId, userId, userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 6. Create chat room
app.post('/api/chat-rooms', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_name, room_type = 'group', member_ids = [] } = req.body;
        const creator_id = req.user.user_id;
        if (!room_name || room_name.trim() === '') return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อห้องสนทนา' });

        const roomResult = await client.query(
            'INSERT INTO chat_rooms (room_name, room_type, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING room_id',
            [room_name.trim(), room_type, creator_id]
        );
        const roomId = roomResult.rows[0].room_id;
        const allMemberIds = [...new Set([...member_ids, creator_id])];
        for (const memberId of allMemberIds)
            await client.query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [roomId, memberId]);

        const roomsResult = await client.query(
            `SELECT cr.room_id, cr.room_name, cr.room_type, cr.created_at, cr.created_by, d.department_name FROM chat_rooms cr LEFT JOIN departments d ON cr.department_id = d.department_id WHERE cr.room_id = $1`,
            [roomId]
        );
        const newRoom = roomsResult.rows[0] || null;
        res.status(201).json({ success: true, message: 'สร้างห้องสนทนาสำเร็จ', room: newRoom, member_ids: allMemberIds, room_id: roomId });

        allMemberIds.forEach(memberId => {
            const memberSocket = onlineUsers.get(memberId);
            if (memberSocket) io.to(memberSocket).emit(memberId === creator_id ? 'room_created' : 'added_to_room', { room_id: roomId, room_name, room: newRoom });
        });
    } catch (error) {
        console.error('❌ Create chat room error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างห้องสนทนา' });
    } finally {
        if (client) client.release();
    }
});

// 7. Get room messages
app.get('/api/chat-rooms/:roomId/messages', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const membershipResult = await client.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.user.user_id]);
        if (membershipResult.rows.length === 0) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' });

        const messagesResult = await client.query(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name,
             (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.message_id) as read_count
             FROM messages m JOIN users u ON m.sender_id = u.user_id LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE m.room_id = $1 ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`,
            [roomId, parseInt(limit), parseInt(offset)]
        );
        await client.query(
            `INSERT INTO message_reads (message_id, user_id) SELECT m.message_id, $1 FROM messages m WHERE m.room_id = $2 AND m.sender_id != $3 AND m.message_id NOT IN (SELECT message_id FROM message_reads WHERE user_id = $4)`,
            [req.user.user_id, roomId, req.user.user_id, req.user.user_id]
        );
        res.json({ success: true, messages: messagesResult.rows.reverse(), room_id: roomId });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 8. Send message
app.post('/api/chat-rooms/:roomId/messages', authenticateToken, upload.single('file'), async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const { message_text, message_type = 'text' } = req.body;
        const membershipResult = await client.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.user.user_id]);
        if (membershipResult.rows.length === 0) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้' });

        let file_url = null, file_name = null, file_size = null, message_type_actual;
        if (req.file) {
            file_url = req.file.path;
            file_name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            file_size = req.file.size || req.file.bytes || 0;
            message_type_actual = req.file.mimetype && req.file.mimetype.startsWith('image/') ? 'image' : 'file';
        } else {
            message_type_actual = message_type;
        }

        const messageResult = await client.query(
            `INSERT INTO messages (room_id, sender_id, message_text, message_type, file_url, file_name, file_size) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING message_id`,
            [roomId, req.user.user_id, message_text, message_type_actual, file_url, file_name, file_size]
        );
        const messagesResult = await client.query(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name FROM messages m JOIN users u ON m.sender_id = u.user_id LEFT JOIN departments d ON u.department_id = d.department_id WHERE m.message_id = $1`,
            [messageResult.rows[0].message_id]
        );
        if (messagesResult.rows.length === 0) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });

        const newMessage = messagesResult.rows[0];
        io.to(`room_${roomId}`).emit('new_message', newMessage);
        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    } finally {
        if (client) client.release();
    }
});

// 9. Search users
app.get('/api/users/search', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ success: true, users: [] });
        const usersResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, u.profile_image, u.is_online, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE (u.username ILIKE $1 OR u.full_name ILIKE $2 OR u.employee_id ILIKE $3) AND u.user_id != $4 ORDER BY u.full_name LIMIT 20`,
            [`%${q}%`, `%${q}%`, `%${q}%`, req.user.user_id]
        );
        res.json({ success: true, users: usersResult.rows });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 10. Update profile
app.put('/api/profile', authenticateToken, upload.single('profile_image'), async (req, res) => {
    const client = await getConnection();
    try {
        const { full_name, email } = req.body;
        const updateFields = [], values = [];
        let paramIndex = 1;
        if (full_name) { updateFields.push(`full_name = $${paramIndex++}`); values.push(full_name); }
        if (email) { updateFields.push(`email = $${paramIndex++}`); values.push(email); }
        if (req.file) { updateFields.push(`profile_image = $${paramIndex++}`); values.push(req.file.path); }
        if (updateFields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัพเดท' });
        values.push(req.user.user_id);
        await client.query(`UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`, values);
        const usersResult = await client.query(`SELECT u.*, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.user_id = $1`, [req.user.user_id]);
        res.json({ success: true, message: 'อัพเดทโปรไฟล์สำเร็จ', user: usersResult.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์' });
    } finally {
        if (client) client.release();
    }
});

// 11. Change password
app.post('/api/change-password', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
        if (new_password.length < 6) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        const usersResult = await client.query('SELECT password FROM users WHERE user_id = $1', [req.user.user_id]);
        if (usersResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        const validPassword = await bcrypt.compare(current_password, usersResult.rows[0].password);
        if (!validPassword) return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await client.query('UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2', [hashedPassword, req.user.user_id]);
        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    } finally {
        if (client) client.release();
    }
});

// 14. Get room members
app.get('/api/chat-rooms/:roomId/members', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const membersResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.profile_image, u.is_online, u.last_seen, d.department_name FROM room_members rm JOIN users u ON rm.user_id = u.user_id LEFT JOIN departments d ON u.department_id = d.department_id WHERE rm.room_id = $1 ORDER BY u.full_name`,
            [roomId]
        );
        res.json({ success: true, members: membersResult.rows });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 15. Add member to room
app.post('/api/chat-rooms/:roomId/members', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ success: false, error: 'กรุณาระบุผู้ใช้' });
        const roomsResult = await client.query('SELECT room_type, room_name FROM chat_rooms WHERE room_id = $1', [roomId]);
        if (roomsResult.rows.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบห้องสนทนา' });
        const room = roomsResult.rows[0];
        if (room.room_type !== 'group') return res.status(400).json({ success: false, error: 'สามารถเพิ่มสมาชิกได้เฉพาะห้องแบบกลุ่ม' });
        const existingResult = await client.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, user_id]);
        if (existingResult.rows.length > 0) return res.status(400).json({ success: false, error: 'ผู้ใช้เป็นสมาชิกห้องนี้อยู่แล้ว' });
        await client.query('INSERT INTO room_members (room_id, user_id, joined_at) VALUES ($1, $2, NOW())', [roomId, user_id]);
        const newMemberResult = await client.query(`SELECT u.user_id, u.employee_id, u.username, u.full_name, u.profile_image, u.is_online, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.user_id = $1`, [user_id]);
        res.json({ success: true, message: 'เพิ่มสมาชิกสำเร็จ', member: newMemberResult.rows[0] || null });
        const memberSocket = onlineUsers.get(user_id);
        if (memberSocket) io.to(memberSocket).emit('added_to_room', { room_id: roomId, room_name: room.room_name, added_by: req.user.user_id });
    } catch (error) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก' });
    } finally {
        if (client) client.release();
    }
});

// 16. Get online users
app.get('/api/users/online', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const usersResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, u.profile_image, 1 as is_online, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.is_online = true AND u.user_id != $1 ORDER BY u.full_name`,
            [req.user.user_id]
        );
        res.json({ success: true, users: usersResult.rows, count: usersResult.rows.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 17. Leave room
app.delete('/api/chat-rooms/:roomId/leave', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const roomsResult = await client.query('SELECT room_type FROM chat_rooms WHERE room_id = $1', [roomId]);
        if (roomsResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบห้องสนทนา' });
        if (roomsResult.rows[0].room_type === 'department') return res.status(400).json({ error: 'ไม่สามารถออกจากห้องแผนกได้' });
        await client.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, req.user.user_id]);
        res.json({ success: true, message: 'ออกจากห้องสนทนาสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const usersResult = await client.query(
            `SELECT u.user_id, u.full_name, u.employee_id, u.profile_image, u.is_online, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.user_id != $1 ORDER BY u.is_online DESC, u.full_name LIMIT 500`,
            [req.user.user_id]
        );
        res.json({ success: true, users: usersResult.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (client) client.release();
    }
});

// Get user by ID
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { userId } = req.params;
        const usersResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, u.profile_image, u.is_online, u.last_seen, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.user_id = $1`,
            [userId]
        );
        if (usersResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        res.json({ success: true, user: usersResult.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// AI Summary Routes
// ========================================
app.post('/api/chat-summary', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_id, message_count = 100, custom_instruction, start_date, end_date } = req.body;
        if (!room_id) return res.status(400).json({ success: false, error: 'กรุณาระบุ room_id' });

        const membershipResult = await client.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [room_id, req.user.user_id]);
        if (membershipResult.rows.length === 0) return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' });

        const roomsResult = await client.query('SELECT room_name FROM chat_rooms WHERE room_id = $1', [room_id]);
        if (roomsResult.rows.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบห้องสนทนา' });
        const roomName = roomsResult.rows[0].room_name;

        let query = `SELECT m.message_id, m.message_text, TO_CHAR(m.created_at,'HH24:MI') as time, TO_CHAR(m.created_at,'DD/MM/YYYY') as date, u.full_name, d.department_name FROM messages m JOIN users u ON m.sender_id = u.user_id LEFT JOIN departments d ON u.department_id = d.department_id WHERE m.room_id = $1 AND m.message_type = 'text' AND m.message_text IS NOT NULL AND LENGTH(TRIM(m.message_text)) > 0`;
        const queryParams = [room_id];
        let paramIndex = 2;
        if (start_date) { query += ` AND DATE(m.created_at) >= $${paramIndex++}`; queryParams.push(start_date); }
        if (end_date) { query += ` AND DATE(m.created_at) <= $${paramIndex++}`; queryParams.push(end_date); }
        query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
        queryParams.push(parseInt(message_count));

        const messagesResult = await client.query(query, queryParams);
        const messages = messagesResult.rows;
        if (messages.length === 0) return res.status(404).json({ success: false, error: 'ไม่มีข้อความในช่วงเวลาที่เลือก' });

        const sortedMessages = messages.reverse();
        const formattedMessages = sortedMessages.map(msg => `[${msg.date} ${msg.time}] ${msg.full_name} (${msg.department_name || 'ไม่มีแผนก'}): ${msg.message_text}`).join('\n');
        const firstMsg = sortedMessages[0], lastMsg = sortedMessages[sortedMessages.length - 1];
        const actualTimeframe = `${firstMsg.date} ${firstMsg.time} - ${lastMsg.date} ${lastMsg.time}`;

        // วันที่/เวลาภาษาไทย พุทธศักราช
        const _now = new Date();
        const _buddhistYear = _now.getFullYear() + 543;
        const _thaiDate = new Intl.DateTimeFormat('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            timeZone: 'Asia/Bangkok'
        }).format(_now).replace(_now.getFullYear().toString(), _buddhistYear.toString());
        const _thaiTime = new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        }).format(_now);

        const prompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์การสื่อสารภายในโรงพยาบาล

**ข้อมูลห้อง:** ${roomName} (${messages.length} ข้อความ ช่วง ${actualTimeframe})
**วันที่/เวลาที่สรุป:** ${_thaiDate} เวลา ${_thaiTime} น.

**การสนทนา:**
${formattedMessages}

${custom_instruction ? `**คำแนะนำเพิ่มเติม:** ${custom_instruction}\n\n` : ''}สรุปการสนทนาเฉพาะ 3 ส่วนต่อไปนี้เท่านั้น ห้ามเพิ่มหัวข้ออื่น:

**1. 📋 สรุปภาพรวม**
เขียนสรุปเรื่องที่คุยกันโดยรวม 2-3 ประโยค กระชับ ชัดเจน ใช้ภาษาเป็นทางการ

**2. 🎯 ประเด็นสำคัญ**
- [ประเด็นที่ 1]
- [ประเด็นที่ 2]
(สรุปเนื้อหาสำคัญเป็นข้อๆ ไม่เกิน 7 ข้อ)

**3. ✅ สิ่งที่ต้องทำ (Action Items)**
| เรื่อง | ผู้รับผิดชอบ | กำหนดแล้วเสร็จ | สถานะ |
|-------|-------------|----------------|--------|
| [งาน] | [ชื่อหรือตำแหน่ง] | [วันที่ หรือ ไม่ระบุ] | [⏳ กำลังดำเนินการ / ✅ เสร็จแล้ว / 🔴 ด่วน / 🔵 รอดำเนินการ] |

ถ้าไม่มี Action Items ให้เขียนว่า: ไม่มีงานที่ต้องดำเนินการเพิ่มเติม

---
📅 สรุปโดย AI เมื่อ: ${_thaiDate} เวลา ${_thaiTime} น.`;

        let summary;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            summary = createFallbackSummary(messages, roomName);
        } else {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { temperature: 0.3, topP: 0.8, maxOutputTokens: 3000 } });
                const result = await model.generateContent(prompt);
                summary = result.response.text();
            } catch (aiError) {
                console.error('❌ Gemini Error:', aiError.message);
                summary = createFallbackSummary(messages, roomName);
            }
        }

        const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            await client.query(`INSERT INTO chat_summary_new (summary_id, chat_content, summary, created_at) VALUES ($1, $2, $3, NOW())`, [summaryId, formattedMessages, summary]);
        } catch (dbError) {
            console.warn('⚠️ ไม่สามารถบันทึก:', dbError.message);
        }

        res.json({ success: true, summary, summary_id: summaryId, report_url: `/report?id=${summaryId}&room_id=${room_id}`, stats: { room_id, room_name: roomName, message_count: messages.length, timeframe: actualTimeframe, date: firstMsg.date } });
    } catch (error) {
        console.error('❌ Summary Error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสรุป' });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/chat-summary/history', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { limit = 10, offset = 0 } = req.query;
        const summariesResult = await client.query(`SELECT id, summary_id, LEFT(chat_content,200) as chat_preview, LEFT(summary,300) as summary_preview, created_at, saved_at FROM chat_summary_new ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [parseInt(limit), parseInt(offset)]);
        const totalCountResult = await client.query('SELECT COUNT(*) as total FROM chat_summary_new');
        res.json({ success: true, summaries: summariesResult.rows, count: summariesResult.rows.length, total: parseInt(totalCountResult.rows[0].total) || 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/chat-summary/save', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_id, summary_text, summary_title } = req.body;
        if (!room_id || !summary_text) return res.status(400).json({ success: false, error: 'กรุณาระบุ room_id และ summary_text' });
        const membershipResult = await client.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [room_id, req.user.user_id]);
        if (membershipResult.rows.length === 0) return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' });
        const summaryId = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const roomsResult = await client.query('SELECT room_name FROM chat_rooms WHERE room_id = $1', [room_id]);
        const roomName = roomsResult.rows.length > 0 ? roomsResult.rows[0].room_name : `ห้อง ${room_id}`;
        const result = await client.query(`INSERT INTO chat_summary_new (summary_id, chat_content, summary, created_at, saved_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`, [summaryId, summary_text, summary_title || `สรุป: ${roomName}`]);
        res.status(201).json({ success: true, message: 'บันทึกสรุปสำเร็จ', summary_id: summaryId, report_url: `/report?id=${summaryId}&room_id=${room_id}` });
    } catch (error) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/chat-summary/details', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { id: summaryId, room_id } = req.query;
        if (!summaryId) return res.status(400).json({ success: false, error: 'กรุณาระบุ summary id' });
        const summaryResult = await client.query(`SELECT summary_id, chat_content, summary, created_at, saved_at FROM chat_summary_new WHERE summary_id = $1`, [summaryId]);
        if (summaryResult.rows.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลสรุป' });
        const summaryData = summaryResult.rows[0];
        let roomName = 'ไม่ระบุห้อง', messageCount = 0;
        if (room_id) {
            const roomResult = await client.query('SELECT room_name FROM chat_rooms WHERE room_id = $1', [room_id]);
            if (roomResult.rows.length > 0) roomName = roomResult.rows[0].room_name;
            if (summaryData.chat_content) messageCount = summaryData.chat_content.split('\n').filter(l => l.trim()).length;
        }
        const dateRange = new Date(summaryData.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        res.json({ success: true, summary_id: summaryData.summary_id, summary: summaryData.summary, chat_content: summaryData.chat_content, room_name: roomName, room_id, date_range: dateRange, message_count: messageCount, created_at: summaryData.created_at, saved_at: summaryData.saved_at });
    } catch (error) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// Socket.IO
// ========================================
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('✅ New socket connection:', socket.id);

    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.user_id;
            socket.userId = userId;
            socket.username = decoded.username;
            onlineUsers.set(userId, socket.id);
            const client = await getConnection();
            await client.query('UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = $1', [userId]);
            client.release();
            socket.emit('authenticated', { user_id: userId, username: decoded.username });
            socket.broadcast.emit('user_online', { user_id: userId });
        } catch (error) {
            socket.emit('auth_error', { error: 'Authentication failed' });
        }
    });

    socket.on('user_data', (data) => { if (data.user_id) { socket.userId = data.user_id; onlineUsers.set(data.user_id, socket.id); } });
    socket.on('join_room', (roomId) => { socket.join(`room_${roomId}`); });
    socket.on('leave_room', (roomId) => { socket.leave(`room_${roomId}`); });
    socket.on('typing', (data) => { socket.to(`room_${data.room_id}`).emit('user_typing', { user_id: socket.userId, room_id: data.room_id }); });
    socket.on('stop_typing', (data) => { socket.to(`room_${data.room_id}`).emit('user_stop_typing', { user_id: socket.userId, room_id: data.room_id }); });

    socket.on('member_added', (data) => {
        const memberSocket = onlineUsers.get(data.user_id);
        if (memberSocket) io.to(memberSocket).emit('added_to_room', { room_id: data.room_id, room_name: data.room_name, added_by: data.added_by });
        socket.to(`room_${data.room_id}`).emit('member_joined', { room_id: data.room_id, user_id: data.user_id });
    });

    socket.on('room_created', (data) => {
        if (data.member_ids && Array.isArray(data.member_ids)) {
            data.member_ids.forEach(memberId => {
                const memberSocket = onlineUsers.get(memberId.toString());
                if (memberSocket) io.to(memberSocket).emit('added_to_room', { room_id: data.room_id, room_name: data.room_name, added_by: socket.userId });
            });
        }
    });

    socket.on('disconnect', async () => {
        const userId = socket.userId;
        if (userId) {
            onlineUsers.delete(userId);
            const client = await getConnection();
            await client.query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE user_id = $1', [userId]);
            client.release();
            socket.broadcast.emit('user_offline', { user_id: userId });
        }
        console.log('🔌 Socket disconnected:', socket.id);
    });
});

// ========================================
// Frontend routes
// ========================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/report', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report.html')));
app.get('/report/:summaryId', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report.html')));

// ========================================
// Password Reset APIs
// ========================================
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล' });

    let client;
    try {
        client = await pool.connect();
        const userResult = await client.query('SELECT user_id, full_name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0)
            return res.json({ success: true, message: 'หากอีเมลนี้มีในระบบ เราจะส่งรหัส 6 หลักให้คุณ' });

        const user = userResult.rows[0];
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await client.query('DELETE FROM password_resets WHERE user_id = $1 AND used = FALSE', [user.user_id]);
        await client.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.user_id, resetCode, expiresAt]);

        const emailSent = await sendResetCodeEmail(email, user.full_name, resetCode);

        if (emailSent) {
            res.json({ success: true, message: 'ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว', expires_in: 10 });
        } else {
            // fallback แสดง code ใน response (development only)
            console.log(`🔑 [DEV] Reset code for ${email}: ${resetCode}`);
            res.json({ success: true, message: 'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบ Render logs สำหรับรหัส' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสยืนยัน' });

    let client;
    try {
        client = await pool.connect();
        const userResult = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(400).json({ success: false, message: 'ไม่พบผู้ใช้นี้ในระบบ' });

        const userId = userResult.rows[0].user_id;
        const codeResult = await client.query(
            `SELECT * FROM password_resets WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND used = FALSE`,
            [userId, code]
        );
        if (codeResult.rows.length === 0) return res.status(400).json({ success: false, message: 'รหัสไม่ถูกต้องหรือหมดอายุแล้ว' });

        const tempToken = jwt.sign({ user_id: userId, purpose: 'password_reset', email }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ success: true, message: 'รหัสถูกต้อง', temp_token: tempToken });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/reset-password-with-code', async (req, res) => {
    const { temp_token, password } = req.body;
    if (!temp_token || !password) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });

    let client;
    try {
        const decoded = jwt.verify(temp_token, JWT_SECRET);
        if (decoded.purpose !== 'password_reset') return res.status(400).json({ success: false, message: 'Token ไม่ถูกต้อง' });

        client = await pool.connect();
        await client.query('BEGIN');
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query('UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2', [hashedPassword, decoded.user_id]);
        await client.query('UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE', [decoded.user_id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        if (error.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'หมดเวลาดำเนินการ กรุณาขอรหัสใหม่' });
        if (error.name === 'JsonWebTokenError') return res.status(400).json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' });
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/validate-reset-token', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.json({ valid: false });
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = FALSE`, [token]);
        res.json({ valid: result.rows.length > 0 });
    } catch (error) {
        res.json({ valid: false });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// Error handling
// ========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: 'ไฟล์มีขนาดใหญ่เกิน 10MB' });
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
});

// ========================================
// Start server
// ========================================
async function startServer() {
    try {
        console.log('🔄 Testing database connection...');
        const testClient = await pool.connect();
        console.log('✅ Database connection successful');
        testClient.release();

        createSummaryTable().catch(err => console.warn('⚠️ Summary table:', err.message));
        createDepartmentRooms().catch(err => console.warn('⚠️ Department rooms:', err.message));

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📧 Email: Resend API`);
            console.log(`📁 Database: PostgreSQL (Supabase)`);
        });
    } catch (error) {
        console.error('❌ Cannot start server:', error.message);
        console.log('💡 Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
    }
}

startServer();