const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg'); // เปลี่ยนจาก mysql2 เป็น pg
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");


// ตั้งค่า Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// PostgreSQL Connection (สำหรับ Supabase/Render)
// ========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // จำเป็นสำหรับ Supabase
    },
    connectionTimeoutMillis: 10000, // รอเชื่อมต่อ 10 วินาที
    idleTimeoutMillis: 30000, // ปิด connection ที่ไม่ใช้แล้ว
    max: 20 // จำนวน connection สูงสุด
});

// ทดสอบการเชื่อมต่อ (ไม่จำเป็น เพราะ startServer จะทำ)
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected to Supabase successfully!');
        release();
    }
});

// Helper function to get database connection with retry
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
// ฟังก์ชันสร้างห้องแผนก (ปรับเป็น PostgreSQL)
// ========================================
async function createDepartmentRooms() {
    const client = await getConnection();
    try {
        console.log('🔍 Checking department chat rooms...');
        
        const departmentsResult = await client.query(
            'SELECT department_id, department_name FROM departments'
        );
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
                console.log(`✅ Created chat room for: ${dept.department_name}`);
            }
        }
        
        if (createdCount > 0) {
            console.log(`✅ Created ${createdCount} department chat rooms`);
        } else {
            console.log('✅ All department chat rooms already exist');
        }
        
        // ตรวจสอบและเพิ่มสมาชิกที่ยังไม่ได้อยู่ในห้องแผนก
        console.log('🔍 Checking department room memberships...');
        
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
        const usersWithoutRooms = usersWithoutRoomsResult.rows;
        
        let addedCount = 0;
        for (const user of usersWithoutRooms) {
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
                console.log(`✅ Added user ${user.user_id} to ${user.department_name} department room`);
            }
        }
        
        if (addedCount > 0) {
            console.log(`✅ Added ${addedCount} users to their department rooms`);
        }
        
    } catch (error) {
        console.error('Error creating department rooms:', error);
    } finally {
        if (client) client.release();
    }
}


// ฟังก์ชันสร้างสรุปสำรองเมื่อ AI ไม่ทำงาน
function createFallbackSummary(messages, roomName) {
    const uniqueUsers = [...new Set(messages.map(m => m.full_name))];
    const timeRange = messages.length > 0 
        ? `${messages[0].date} - ${messages[messages.length-1].date}`
        : 'ไม่ระบุ';
    
    return `📊 **สรุปการสนทนาห้อง ${roomName}**\n\n` +
           `📅 ช่วงเวลา: ${timeRange}\n` +
           `👥 ผู้เข้าร่วม: ${uniqueUsers.length} คน\n` +
           `💬 จำนวนข้อความ: ${messages.length} ข้อความ\n\n` +
           `**ข้อความตัวอย่าง:**\n` +
           messages.slice(0, 5).map(m => 
               `- ${m.date} ${m.time} ${m.full_name}: ${m.message_text.substring(0, 50)}...`
           ).join('\n');
}
// ========================================
// ฟังก์ชันสร้างตาราง summary (ปรับเป็น PostgreSQL)
// ========================================
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
// File upload configuration
// ========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // แก้ไข encoding ของชื่อไฟล์
        let originalName = file.originalname;
        
        // แปลงจาก latin1 เป็น utf8 (สำหรับ browser ที่ส่ง encoding ผิด)
        try {
            originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {
            console.log('⚠️ Cannot decode filename, using original');
        }
        
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const randomStr = Math.round(Math.random() * 1E9);
        const uniqueName = `${timestamp}-${randomStr}${ext}`;
        
        console.log('📁 Original filename:', file.originalname);
        console.log('📁 Decoded filename:', originalName);
        console.log('📁 Saved as:', uniqueName);
        
        // เก็บชื่อเดิมไว้ใน file object
        file.decodedName = originalName;
        
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Decode filename ก่อนตรวจสอบ
        let filename = file.originalname;
        try {
            filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {}
        
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|webp/;
        const extname = allowedTypes.test(path.extname(filename).toLowerCase());
        
        if (extname) {
            cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ, เอกสาร, และเสียง'));
        }
    }
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'smh-hospital-chat-secret-key-2024';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
    }
};

// ========================================
// API Routes (ปรับเป็น PostgreSQL)
// ========================================

// 1. Register
app.post('/api/register', async (req, res) => {
    const client = await getConnection();
    try {
        const { employee_id, username, password, full_name, email, department_id } = req.body;
        
        if (!employee_id || !username || !password || !full_name || !department_id) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Check existing user
        const existingResult = await client.query(
            'SELECT user_id FROM users WHERE employee_id = $1 OR username = $2',
            [employee_id, username]
        );

        if (existingResult.rows.length > 0) {
            return res.status(400).json({ error: 'รหัสพนักงานหรือชื่อผู้ใช้มีอยู่แล้ว' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await client.query(
            `INSERT INTO users (employee_id, username, password, full_name, email, department_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
            [employee_id, username, hashedPassword, full_name, email, department_id]
        );

        const userId = userResult.rows[0].user_id;

        // ตรวจสอบว่ามีห้องแผนกนี้หรือไม่
        let departmentRoomResult = await client.query(
            'SELECT room_id FROM chat_rooms WHERE department_id = $1 AND room_type = $2',
            [department_id, 'department']
        );
        let departmentRoom = departmentRoomResult.rows;

        // ถ้าไม่มีห้องแผนก ให้สร้างห้องใหม่
        if (departmentRoom.length === 0) {
            let departmentName = 'แผนกไม่ทราบชื่อ';
            const deptInfoResult = await client.query(
                'SELECT department_name FROM departments WHERE department_id = $1',
                [department_id]
            );
            
            if (deptInfoResult.rows.length > 0) {
                departmentName = deptInfoResult.rows[0].department_name;
            }
            
            const roomResult = await client.query(
                'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES ($1, $2, $3) RETURNING room_id',
                [`ห้องแชท - ${departmentName}`, 'department', department_id]
            );
            
            departmentRoom = [{ room_id: roomResult.rows[0].room_id }];
        }

        // เพิ่มผู้ใช้เข้าไปในห้องแผนกของตนเอง
        if (departmentRoom.length > 0) {
            await client.query(
                'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
                [departmentRoom[0].room_id, userId]
            );
        }

        // Create token
        const token = jwt.sign(
            { 
                user_id: userId, 
                employee_id, 
                username,
                department_id 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ดึงข้อมูลแผนกสำหรับ response
        const deptDataResult = await client.query(
            'SELECT department_name FROM departments WHERE department_id = $1',
            [department_id]
        );

        const department_name = deptDataResult.rows.length > 0 ? deptDataResult.rows[0].department_name : 'ไม่ทราบแผนก';

        res.status(201).json({
            success: true,
            message: 'ลงทะเบียนสำเร็จ',
            token,
            user: {
                user_id: userId,
                employee_id,
                username,
                full_name,
                email,
                department_id,
                department_name
            }
        });

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

        if (!username || !password) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
        }

        const usersResult = await client.query(
            `SELECT u.*, d.department_name 
             FROM users u 
             LEFT JOIN departments d ON u.department_id = d.department_id 
             WHERE u.username = $1 OR u.employee_id = $2`,
            [username, username]
        );

        if (usersResult.rows.length === 0) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = usersResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Update online status
        await client.query(
            'UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        // Create token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                employee_id: user.employee_id,
                username: user.username,
                department_id: user.department_id
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                user_id: user.user_id,
                employee_id: user.employee_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                department_id: user.department_id,
                department_name: user.department_name,
                profile_image: user.profile_image,
                is_online: true
            }
        });

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
            `SELECT u.*, d.department_name 
             FROM users u 
             LEFT JOIN departments d ON u.department_id = d.department_id 
             WHERE u.user_id = $1`,
            [req.user.user_id]
        );

        if (usersResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        const user = usersResult.rows[0];
        res.json({ success: true, user });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 4. Get all departments
app.get('/api/departments', async (req, res) => {
    console.log('📋 Requesting departments...');
    
    try {
        const client = await pool.connect();
        
        try {
            const departmentsResult = await client.query(
                'SELECT * FROM departments ORDER BY department_name'
            );
            
            client.release();
            
            if (departmentsResult.rows.length > 0) {
                console.log(`✅ Found ${departmentsResult.rows.length} departments in database`);
                return res.json({ 
                    success: true, 
                    departments: departmentsResult.rows,
                    source: 'database'
                });
            } else {
                console.log('ℹ️ Database connected but no departments found');
                return sendBackupDepartments(res);
            }
            
        } catch (queryError) {
            client.release();
            console.log('⚠️ Database query failed:', queryError.message);
            return sendBackupDepartments(res);
        }
        
    } catch (connectionError) {
        console.log('⚠️ Database connection failed:', connectionError.message);
        return sendBackupDepartments(res);
    }
});

// ฟังก์ชันตรวจสอบ API Key
function validateGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'dummy-key') {
        console.warn('⚠️  GEMINI_API_KEY ไม่ได้ตั้งค่าใน .env');
        console.log('💡 วิธีได้ API Key ฟรี:');
        console.log('1. ไปที่: https://makersuite.google.com/app/apikey');
        console.log('2. ล็อกอินด้วย Gmail');
        console.log('3. กด "Create API Key"');
        console.log('4. คัดลอก Key ไปใส่ใน .env');
        return false;
    }
    
    // ตรวจสอบ format (AIzaSy...)
    if (!apiKey.startsWith('AIza')) {
        console.warn('⚠️  GEMINI_API_KEY format อาจไม่ถูกต้อง');
        return false;
    }
    
    return true;
}

// ฟังก์ชันเรียก Gemini
async function generateWithGemini(prompt) {
    try {
        console.log('🤖 กำลังเรียกใช้ Gemini AI...');
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                topK: 64,
                maxOutputTokens: 1500,
            }
        });

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ];

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [{ text: prompt }] 
            }],
            safetySettings: safetySettings
        });

        const response = result.response;
        const text = response.text();
        
        console.log('✅ Gemini สรุปสำเร็จ');
        return text;
        
    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
        throw new Error(`Gemini Error: ${error.message}`);
    }
}

function sendBackupDepartments(res) {
    console.log('📦 Sending backup departments data');
    
    const backupDepartments = [];
    const departmentNames = [
        'แผนกเกษตรกรรม', 'แผนกประชาสัมพันธ์ตลาด', 'แผนกสิทธิประโยชน์',
        'แผนกเวชระเบียน', 'แผนกลูกค้าสัมพันธ์และลงทะเบียน', 'แผนกเทคโนโลยีสารสนเทศ',
        'แผนกอภิบาล', 'ศูนย์วางแผนและพัฒนา', 'แผนกโทรศัพท์', 'แผนกรักษาความปลอดภัย',
        'แผนกการเงิน', 'แผนกบัญชี-งานวิเคราะห์', 'แผนกจัดซื้อ', 'แผนกคลัง',
        'ศูนย์คุณภาพ', 'คลินิกทันตกรรม', 'แผนกอุบัติเหตุฉุกเฉินและศูนย์รถพยาบาล',
        'แผนกผ่าตัด', 'แผนกบริการเปล', 'แผนกผู้ป่วยในชั้น 4 มารีย์',
        'แผนกผู้ป่วยในชั้น 4 วังกาแวร์', 'แผนกผู้ป่วยในชั้น 5 มารีย์',
        'แผนกผู้ป่วยในชั้น 5 วังกาแวร์', 'แผนกผู้ป่วยในชั้น 6 มารีย์',
        'แผนกผู้ป่วยในชั้น 6 วังกาแวร์', 'แผนกผู้ป่วยในชั้น 7 วังกาแวร์',
        'แผนกผู้ป่วยในชั้น 8 วังกาแวร์', 'แผนกผู้ป่วยวิกฤต', 'แผนกเภสัชกรรม',
        'แผนกรังสีวิทยา', 'ผู้จัดการและรองผู้จัดการ', 'งานนิติกร', 'งานที่ดิน',
        'ฝ่ายการแพทย์', 'นักปฏิบัติการการแพทย์ฉุกเฉิน', 'เลขานุการฝ่ายการแพทย์',
        'ผู้ช่วยแพทย์แผนจีน', 'ศูนย์ตรวจสุขภาพ', 'ตรวจการ', 'ฝ่ายการพยาบาล',
        'คลินิกอายุรกรรม', 'คลินิกศัลยกรรม/กระดูกและข้อ', 'คลินิกสูตินรเวช-กุมารเวช',
        'คลินิกเฉพาะทาง(จักษุ หู จมูก คอ)', 'แผนกห้องปฏิบัติการ', 'แผนกกายภาพบำบัด',
        'แผนกจ่ายกลาง', 'แผนกวิศวกรรมการแพทย์', 'แผนกเคหะบริการ', 'บริการส่วนหน้า',
        'แผนกทรัพยากรบุคคล งานธุรการ และกองเลขานุการ', 'แผนกซ่อมบำรุงและก่อสร้าง',
        'แผนกยานพาหนะ'
    ];
    
    departmentNames.forEach((name, index) => {
        backupDepartments.push({
            department_id: index + 1,
            department_name: name,
            created_at: new Date().toISOString()
        });
    });
    
    res.json({ 
        success: true, 
        departments: backupDepartments,
        source: 'backup',
        message: 'Using backup data - database may not be connected'
    });
}

// 5. Get user's chat rooms (นับเฉพาะข้อความที่ยังไม่ได้อ่าน)
app.get('/api/chat-rooms', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const userId = req.user.user_id;

        console.log(`🔍 ดึงข้อมูลห้องสำหรับ user_id: ${userId}`);

        const roomsResult = await client.query(`
            SELECT 
                cr.room_id,
                cr.room_name,
                cr.room_type,
                cr.department_id,
                cr.created_at,
                d.department_name,
                (
                    SELECT COUNT(*) 
                    FROM messages m 
                    WHERE m.room_id = cr.room_id 
                    AND m.sender_id != $1
                    AND m.created_at > COALESCE(
                        (SELECT MAX(joined_at) FROM room_members rm2 
                         WHERE rm2.room_id = cr.room_id AND rm2.user_id = $2),
                        '2000-01-01'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM message_reads mr 
                        WHERE mr.message_id = m.message_id 
                        AND mr.user_id = $3
                    )
                ) as unread_count,
                (
                    SELECT message_text 
                    FROM messages 
                    WHERE room_id = cr.room_id 
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message
            FROM chat_rooms cr
            LEFT JOIN departments d ON cr.department_id = d.department_id
            WHERE cr.room_id IN (
                SELECT room_id FROM room_members WHERE user_id = $4
            )
            ORDER BY 
                unread_count DESC,
                cr.room_type, 
                cr.room_name
        `, [userId, userId, userId, userId]);

        console.log(`✅ พบ ${roomsResult.rows.length} ห้อง`);

        res.json({ 
            success: true, 
            rooms: roomsResult.rows,
            count: roomsResult.rows.length
        });

    } catch (error) {
        console.error('❌ Get chat rooms error:', error);
        res.status(500).json({ 
            success: false,
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องสนทนา'
        });
    } finally {
        if (client) client.release();
    }
});

// ✅ API สำหรับ mark ว่าอ่านข้อความทั้งหมดในห้องแล้ว
app.post('/api/chat-rooms/:roomId/read', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;
        const userId = req.user.user_id;

        // เพิ่มข้อความที่ยังไม่ได้อ่านทั้งหมดลงใน message_reads
        await client.query(
            `INSERT INTO message_reads (message_id, user_id, read_at)
             SELECT m.message_id, $1, NOW()
             FROM messages m
             WHERE m.room_id = $2
             AND m.sender_id != $3
             AND NOT EXISTS (
                 SELECT 1 FROM message_reads mr 
                 WHERE mr.message_id = m.message_id 
                 AND mr.user_id = $4
             )`,
            [userId, roomId, userId, userId]
        );

        res.json({ success: true, message: 'Marked as read' });

    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// 6. Create new chat room
app.post('/api/chat-rooms', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_name, room_type = 'group', member_ids = [] } = req.body;
        const creator_id = req.user.user_id;

        console.log('📝 Creating new chat room:');
        console.log('- Room name:', room_name);
        console.log('- Room type:', room_type);
        console.log('- Creator ID:', creator_id);
        console.log('- Member IDs:', member_ids);

        if (!room_name || room_name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณาระบุชื่อห้องสนทนา' 
            });
        }

        if (room_type === 'private' && member_ids.length !== 1) {
            return res.status(400).json({ 
                success: false, 
                error: 'ห้องส่วนตัวต้องมีสมาชิกเพียง 1 คน' 
            });
        }

        // สร้างห้อง
        const roomResult = await client.query(
            'INSERT INTO chat_rooms (room_name, room_type, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING room_id',
            [room_name.trim(), room_type, creator_id]
        );

        const roomId = roomResult.rows[0].room_id;
        console.log(`✅ Room created with ID: ${roomId}`);

        // เพิ่มสมาชิก (รวมตัวสร้างด้วย)
        const allMemberIds = [...new Set([...member_ids, creator_id])];
        
        if (allMemberIds.length > 0) {
            for (const memberId of allMemberIds) {
                await client.query(
                    'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
                    [roomId, memberId]
                );
            }
            console.log(`✅ Added ${allMemberIds.length} members to room`);
        }

        // ดึงข้อมูลห้องที่สร้าง
        const roomsResult = await client.query(`
            SELECT 
                cr.room_id,
                cr.room_name,
                cr.room_type,
                cr.created_at,
                cr.created_by,
                d.department_name
            FROM chat_rooms cr
            LEFT JOIN departments d ON cr.department_id = d.department_id
            WHERE cr.room_id = $1
        `, [roomId]);

        const newRoom = roomsResult.rows[0] || null;

        res.status(201).json({
            success: true,
            message: 'สร้างห้องสนทนาสำเร็จ',
            room: newRoom,
            member_ids: allMemberIds,
            room_id: roomId
        });

        // ส่ง Socket.IO event
        console.log(`📢 Broadcasting room_created event...`);
        
        const creatorSocket = onlineUsers.get(creator_id);
        if (creatorSocket) {
            io.to(creatorSocket).emit('room_created', {
                room_id: roomId,
                room_name: room_name,
                room: newRoom,
                message: `สร้างห้อง "${room_name}" สำเร็จ`
            });
        }
        
        allMemberIds.forEach(memberId => {
            if (memberId !== creator_id) {
                const memberSocket = onlineUsers.get(memberId);
                if (memberSocket) {
                    io.to(memberSocket).emit('added_to_room', {
                        room_id: roomId,
                        room_name: room_name,
                        room: newRoom,
                        added_by: creator_id
                    });
                }
            }
        });

    } catch (error) {
        console.error('❌ Create chat room error:', error);
        res.status(500).json({ 
            success: false,
            error: 'เกิดข้อผิดพลาดในการสร้างห้องสนทนา',
            details: error.message
        });
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

        const membershipResult = await client.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.user_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' });
        }

        const messagesResult = await client.query(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name,
             (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.message_id) as read_count
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE m.room_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2 OFFSET $3`,
            [roomId, parseInt(limit), parseInt(offset)]
        );

        await client.query(
            `INSERT INTO message_reads (message_id, user_id)
             SELECT m.message_id, $1 FROM messages m
             WHERE m.room_id = $2 AND m.sender_id != $3
             AND m.message_id NOT IN (
                 SELECT message_id FROM message_reads WHERE user_id = $4
             )`,
            [req.user.user_id, roomId, req.user.user_id, req.user.user_id]
        );

        res.json({
            success: true,
            messages: messagesResult.rows.reverse(),
            room_id: roomId
        });

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

        console.log(`📨 API: Sending message to room ${roomId}`);

        const membershipResult = await client.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.user_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้' });
        }

        let file_url = null;
        let file_name = null;
        let file_size = null;

        if (req.file) {
            file_url = `/uploads/${req.file.filename}`;
            file_name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            file_size = req.file.size;
            
            console.log('📎 File uploaded:');
            console.log('  - Original:', req.file.originalname);
            console.log('  - Decoded:', file_name);
            console.log('  - Size:', file_size);
            console.log('  - URL:', file_url);
        }

        const messageResult = await client.query(
            `INSERT INTO messages (room_id, sender_id, message_text, message_type, file_url, file_name, file_size) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING message_id`,
            [roomId, req.user.user_id, message_text, message_type, file_url, file_name, file_size]
        );

        const messageId = messageResult.rows[0].message_id;

        const messagesResult = await client.query(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE m.message_id = $1`,
            [messageId]
        );

        if (messagesResult.rows.length === 0) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
        }

        const newMessage = messagesResult.rows[0];
        console.log('✅ Message created:', newMessage);

        io.to(`room_${roomId}`).emit('new_message', newMessage);

        res.status(201).json({
            success: true,
            message: newMessage
        });

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

        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const usersResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, 
                    u.profile_image, u.is_online, d.department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE (u.username ILIKE $1 OR u.full_name ILIKE $2 OR u.employee_id ILIKE $3)
             AND u.user_id != $4
             ORDER BY u.full_name
             LIMIT 20`,
            [`%${q}%`, `%${q}%`, `%${q}%`, req.user.user_id]
        );

        res.json({ success: true, users: usersResult.rows });

    } catch (error) {
        console.error('Search users error:', error);
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

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (full_name) {
            updateFields.push(`full_name = $${paramIndex++}`);
            values.push(full_name);
        }

        if (email) {
            updateFields.push(`email = $${paramIndex++}`);
            values.push(email);
        }

        if (req.file) {
            updateFields.push(`profile_image = $${paramIndex++}`);
            values.push(`/uploads/${req.file.filename}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัพเดท' });
        }

        values.push(req.user.user_id);

        const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`;
        await client.query(query, values);

        const usersResult = await client.query(
            `SELECT u.*, d.department_name FROM users u 
             LEFT JOIN departments d ON u.department_id = d.department_id 
             WHERE u.user_id = $1`,
            [req.user.user_id]
        );

        res.json({
            success: true,
            message: 'อัพเดทโปรไฟล์สำเร็จ',
            user: usersResult.rows[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
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

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        const usersResult = await client.query(
            'SELECT password FROM users WHERE user_id = $1',
            [req.user.user_id]
        );

        if (usersResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        const validPassword = await bcrypt.compare(current_password, usersResult.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await client.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2',
            [hashedPassword, req.user.user_id]
        );

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

    } catch (error) {
        console.error('Change password error:', error);
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
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.profile_image, 
                    u.is_online, u.last_seen, d.department_name
             FROM room_members rm
             JOIN users u ON rm.user_id = u.user_id
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE rm.room_id = $1
             ORDER BY u.full_name`,
            [roomId]
        );

        res.json({ success: true, members: membersResult.rows });

    } catch (error) {
        console.error('Get room members error:', error);
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

        if (!user_id) {
            return res.status(400).json({ 
                success: false,
                error: 'กรุณาระบุผู้ใช้' 
            });
        }

        // ตรวจสอบว่าห้องเป็นแบบกลุ่มหรือไม่
        const roomsResult = await client.query(
            'SELECT room_type, room_name FROM chat_rooms WHERE room_id = $1',
            [roomId]
        );

        if (roomsResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'ไม่พบห้องสนทนา' 
            });
        }

        const room = roomsResult.rows[0];

        if (room.room_type !== 'group') {
            return res.status(400).json({ 
                success: false,
                error: 'สามารถเพิ่มสมาชิกได้เฉพาะห้องแบบกลุ่ม' 
            });
        }

        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกอยู่แล้วหรือไม่
        const existingResult = await client.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, user_id]
        );

        if (existingResult.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ผู้ใช้เป็นสมาชิกห้องนี้อยู่แล้ว' 
            });
        }

        // เพิ่มสมาชิก
        await client.query(
            'INSERT INTO room_members (room_id, user_id, joined_at) VALUES ($1, $2, NOW())',
            [roomId, user_id]
        );

        // ดึงข้อมูลสมาชิกที่เพิ่ม
        const newMemberResult = await client.query(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, 
                    u.profile_image, u.is_online, d.department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE u.user_id = $1`,
            [user_id]
        );

        console.log(`✅ Added user ${user_id} to room ${roomId}`);

        res.json({ 
            success: true, 
            message: 'เพิ่มสมาชิกสำเร็จ',
            member: newMemberResult.rows[0] || null
        });

        // ส่ง Socket.IO notification
        const memberSocket = onlineUsers.get(user_id);
        if (memberSocket) {
            io.to(memberSocket).emit('added_to_room', {
                room_id: roomId,
                room_name: room.room_name,
                added_by: req.user.user_id
            });
        }

        // แจ้งสมาชิกในห้อง
        const roomMembersResult = await client.query(
            'SELECT user_id FROM room_members WHERE room_id = $1',
            [roomId]
        );

        roomMembersResult.rows.forEach(member => {
            const socket = onlineUsers.get(member.user_id);
            if (socket && member.user_id !== user_id) {
                io.to(socket).emit('member_joined', {
                    room_id: roomId,
                    user_id: user_id,
                    member: newMemberResult.rows[0] || null
                });
            }
        });

    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ 
            success: false,
            error: 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก',
            details: error.message
        });
    } finally {
        if (client) client.release();
    }
});

// 16. Get online users
app.get('/api/users/online', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        console.log('📋 Fetching online users...');

        const usersResult = await client.query(
            `SELECT 
                u.user_id, 
                u.employee_id, 
                u.username, 
                u.full_name, 
                u.email,
                u.profile_image, 
                1 as is_online,
                d.department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE u.is_online = true
             AND u.user_id != $1
             ORDER BY u.full_name`,
            [req.user.user_id]
        );

        console.log(`✅ พบผู้ใช้ออนไลน์ ${usersResult.rows.length} คน`);
        
        if (usersResult.rows.length > 0) {
            console.log('👤 ตัวอย่างผู้ใช้คนแรก:', {
                user_id: usersResult.rows[0].user_id,
                full_name: usersResult.rows[0].full_name,
                is_online: usersResult.rows[0].is_online,
                department_name: usersResult.rows[0].department_name
            });
        }

        res.json({ 
            success: true, 
            users: usersResult.rows,
            count: usersResult.rows.length 
        });

    } catch (error) {
        console.error('❌ Get online users error:', error);
        res.status(500).json({ 
            success: false,
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ออนไลน์',
            details: error.message 
        });
    } finally {
        if (client) client.release();
    }
});

// 17. Leave room
app.delete('/api/chat-rooms/:roomId/leave', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { roomId } = req.params;

        const roomsResult = await client.query(
            'SELECT room_type, department_id FROM chat_rooms WHERE room_id = $1',
            [roomId]
        );

        if (roomsResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบห้องสนทนา' });
        }

        const room = roomsResult.rows[0];

        if (room.room_type === 'department') {
            return res.status(400).json({ error: 'ไม่สามารถออกจากห้องแผนกได้' });
        }

        await client.query(
            'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.user_id]
        );

        res.json({ success: true, message: 'ออกจากห้องสนทนาสำเร็จ' });

    } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// GET /api/users - สำหรับแสดงผู้ใช้ทั้งหมด
app.get('/api/users', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        console.log('📋 Fetching all users (optimized)...');
        
        // ดึงเฉพาะฟิลด์ที่จำเป็น และเพิ่ม indexing
        const usersResult = await client.query(
            `SELECT 
                u.user_id, 
                u.full_name, 
                u.employee_id,
                u.profile_image,
                u.is_online,
                d.department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE u.user_id != $1
             ORDER BY u.is_online DESC, u.full_name
             LIMIT 500`,  // จำกัดแค่ 500 คนก่อน ถ้ามีเยอะให้โหลดเพิ่มทีหลัง
            [req.user.user_id]
        );
        
        console.log(`✅ โหลดผู้ใช้ ${usersResult.rows.length} คน (optimized)`);
        
        res.json({ 
            success: true, 
            users: usersResult.rows
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
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
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, 
                    u.profile_image, u.is_online, u.last_seen, d.department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             WHERE u.user_id = $1`,
            [userId]
        );
        
        if (usersResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }
        
        res.json({ success: true, user: usersResult.rows[0] });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// AI Summary Routes (คงเดิม)
// ========================================

// 18. AI Chat Summary
app.post('/api/chat-summary', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_id, message_count = 100, custom_instruction, start_date, end_date } = req.body;
        
        console.log(`📊 ขอสรุปห้อง ${room_id}, ช่วงเวลา: ${start_date || 'ทั้งหมด'} ถึง ${end_date || 'ทั้งหมด'}`);
        
        if (!room_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณาระบุ room_id' 
            });
        }

        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องนี้หรือไม่
        const membershipResult = await client.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [room_id, req.user.user_id]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' 
            });
        }
        
        // ดึงข้อมูลห้อง
        const roomsResult = await client.query(
            'SELECT room_name, room_type FROM chat_rooms WHERE room_id = $1',
            [room_id]
        );
        
        if (roomsResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'ไม่พบห้องสนทนา' 
            });
        }
        
        const roomName = roomsResult.rows[0].room_name;
        
        // สร้าง query สำหรับดึงข้อความ
        let query = `
            SELECT 
                m.message_id,
                m.message_text,
                TO_CHAR(m.created_at, 'HH24:MI') as time,
                TO_CHAR(m.created_at, 'DD/MM/YYYY') as date,
                u.full_name,
                d.department_name
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE m.room_id = $1
            AND m.message_type = 'text'
            AND m.message_text IS NOT NULL
            AND LENGTH(TRIM(m.message_text)) > 0
        `;
        
        const queryParams = [room_id];
        let paramIndex = 2;
        
        if (start_date) {
            query += ` AND DATE(m.created_at) >= $${paramIndex}`;
            queryParams.push(start_date);
            paramIndex++;
        }
        
        if (end_date) {
            query += ` AND DATE(m.created_at) <= $${paramIndex}`;
            queryParams.push(end_date);
            paramIndex++;
        }
        
        query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
        queryParams.push(parseInt(message_count));
        
        const messagesResult = await client.query(query, queryParams);
        const messages = messagesResult.rows;
        
        if (messages.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'ไม่มีข้อความในช่วงเวลาที่เลือก' 
            });
        }
        
        console.log(`📨 พบ ${messages.length} ข้อความในห้อง "${roomName}"`);
        
        const sortedMessages = messages.reverse();
        
        // จัดรูปแบบข้อความ
        const formattedMessages = sortedMessages.map(msg => 
            `[${msg.date} ${msg.time}] ${msg.full_name} (${msg.department_name || 'ไม่มีแผนก'}): ${msg.message_text}`
        ).join('\n');
        
        // คำนวณช่วงเวลา
        const firstMsg = sortedMessages[0];
        const lastMsg = sortedMessages[sortedMessages.length - 1];
        const actualTimeframe = `${firstMsg.date} ${firstMsg.time} - ${lastMsg.date} ${lastMsg.time}`;
        
        // สร้าง Prompt
        const prompt = `คุณเป็นผู้ช่วยวิเคราะห์และสรุปการสนทนาสำหรับโรงพยาบาล

**โปรดวิเคราะห์และสรุปการสนทนาต่อไปนี้ โดยอิงจากเนื้อหาที่ให้มาเท่านั้น ห้ามเติมข้อมูลจากภายนอก**

**ข้อมูลห้อง:**
- ชื่อห้อง: ${roomName} (ID: ${room_id})
- จำนวนข้อความ: ${messages.length} ข้อความ
- ช่วงเวลา: ${actualTimeframe}

**เนื้อหาการสนทนาในห้องนี้:**
${formattedMessages}

${custom_instruction ? `\n**คำแนะนำเพิ่มเติม:** ${custom_instruction}` : ''}

**คำสั่ง:**
กรุณาสรุปเป็นภาษาไทย โดยมีโครงสร้างดังนี้:
1. ภาพรวมของการสนทนา (สรุปสั้นๆ ว่าคุยเรื่องอะไร)
2. ประเด็นสำคัญ (เรียงตามความสำคัญ ใช้ bullet points)
3. ข้อสรุปหรือแผนการดำเนินงาน (ถ้ามี)`;

        // เรียกใช้ Gemini AI
        let summary;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.log('⚠️ ไม่มี API Key, ใช้ fallback');
            summary = createFallbackSummary(messages, roomName);
        } else {
            try {
                console.log('🤖 เรียกใช้ Gemini AI...');
                
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: {
                        temperature: 0.3,
                        topP: 0.8,
                        topK: 64,
                        maxOutputTokens: 1500,
                    }
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                summary = response.text();
                
                console.log('✅ Gemini สรุปสำเร็จ');
                
            } catch (aiError) {
                console.error('❌ Gemini Error:', aiError.message);
                summary = createFallbackSummary(messages, roomName);
            }
        }
        
        // สร้าง summary_id
        const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // บันทึกลง database
        try {
            await client.query(
                `INSERT INTO chat_summary_new 
                 (summary_id, chat_content, summary, created_at) 
                 VALUES ($1, $2, $3, NOW())`,
                [summaryId, formattedMessages, summary]
            );
            
            console.log(`💾 บันทึกสรุป Summary ID: ${summaryId}`);
            
        } catch (dbError) {
            console.warn('⚠️ ไม่สามารถบันทึก:', dbError.message);
        }
        
        res.json({
            success: true,
            summary: summary,
            summary_id: summaryId,
            report_url: `/report?id=${summaryId}&room_id=${room_id}`,
            stats: {
                room_id: room_id,
                room_name: roomName,
                message_count: messages.length,
                timeframe: actualTimeframe,
                date: firstMsg.date
            }
        });

    } catch (error) {
        console.error('❌ Summary Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการสรุป',
            details: error.message
        });
    } finally {
        if (client) client.release();
    }
});

// 19. Get summary history
app.get('/api/chat-summary/history', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const summariesResult = await client.query(
            `SELECT 
                id,
                summary_id,
                LEFT(chat_content, 200) as chat_preview,
                LEFT(summary, 300) as summary_preview,
                created_at,
                saved_at
            FROM chat_summary_new
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2`,
            [parseInt(limit), parseInt(offset)]
        );
        
        const totalCountResult = await client.query(
            'SELECT COUNT(*) as total FROM chat_summary_new'
        );
        
        res.json({
            success: true,
            summaries: summariesResult.rows,
            count: summariesResult.rows.length,
            total: parseInt(totalCountResult.rows[0].total) || 0
        });
        
    } catch (error) {
        console.error('Get summary history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการดึงประวัติสรุป'
        });
    } finally {
        if (client) client.release();
    }
});

// 20. Save chat summary
app.post('/api/chat-summary/save', authenticateToken, async (req, res) => {
    const client = await getConnection();
    try {
        const { room_id, summary_text, summary_title } = req.body;
        
        if (!room_id || !summary_text) {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณาระบุ room_id และ summary_text' 
            });
        }
        
        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องหรือไม่
        const membershipResult = await client.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [room_id, req.user.user_id]
        );
        
        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' 
            });
        }
        
        // สร้าง summary_id
        const summaryId = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // ดึงชื่อห้องสำหรับใช้เป็น title
        const roomsResult = await client.query(
            'SELECT room_name FROM chat_rooms WHERE room_id = $1',
            [room_id]
        );
        const roomName = roomsResult.rows.length > 0 ? roomsResult.rows[0].room_name : `ห้อง ${room_id}`;
        
        // ใช้ตาราง chat_summary_new
        const result = await client.query(
            `INSERT INTO chat_summary_new 
             (summary_id, chat_content, summary, created_at, saved_at) 
             VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
            [summaryId, summary_text, summary_title || `สรุป: ${roomName}`]
        );
        
        console.log(`💾 Saved summary to chat_summary_new, ID: ${result.rows[0].id}, Summary ID: ${summaryId}`);
        
        res.status(201).json({
            success: true,
            message: 'บันทึกสรุปสำเร็จ',
            summary_id: summaryId,
            summary_title: summary_title || `สรุป: ${roomName}`,
            report_url: `/report?id=${summaryId}&room_id=${room_id}`
        });
        
    } catch (error) {
        console.error('❌ Save summary error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการบันทึกสรุป',
            details: error.message
        });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// Socket.IO handling
// ========================================
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('✅ New socket connection:', socket.id);

    socket.on('authenticate', async (token) => {
        try {
            console.log('🔑 Authenticating socket...');
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.user_id;

            socket.userId = userId;
            socket.username = decoded.username;
            onlineUsers.set(userId, socket.id);

            const client = await getConnection();
            await client.query(
                'UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = $1',
                [userId]
            );
            client.release();

            socket.emit('authenticated', { 
                user_id: userId,
                username: decoded.username 
            });
            
            console.log(`✅ User ${userId} (${decoded.username}) authenticated`);

            socket.broadcast.emit('user_online', { user_id: userId });

        } catch (error) {
            console.error('❌ Socket authentication error:', error);
            socket.emit('auth_error', { error: 'Authentication failed' });
        }
    });

    socket.on('member_added', (data) => {
        console.log(`👥 Member added to room ${data.room_id}`);
        
        const memberSocket = onlineUsers.get(data.user_id);
        if (memberSocket) {
            io.to(memberSocket).emit('added_to_room', {
                room_id: data.room_id,
                room_name: data.room_name,
                added_by: data.added_by
            });
        }
        
        socket.to(`room_${data.room_id}`).emit('member_joined', {
            room_id: data.room_id,
            user_id: data.user_id
        });
    });

    socket.on('room_created', (data) => {
        console.log(`🏠 Room created: ${data.room_name}`);
        if (data.member_ids && Array.isArray(data.member_ids)) {
            data.member_ids.forEach(memberId => {
                const memberSocket = onlineUsers.get(memberId.toString());
                if (memberSocket) {
                    io.to(memberSocket).emit('added_to_room', {
                        room_id: data.room_id,
                        room_name: data.room_name,
                        added_by: socket.userId
                    });
                }
            });
        }
    });
    
    socket.on('user_data', (data) => {
        console.log('📊 User data received:', data);
        if (data.user_id) {
            socket.userId = data.user_id;
            onlineUsers.set(data.user_id, socket.id);
        }
    });

    socket.on('join_room', (roomId) => {
        socket.join(`room_${roomId}`);
        console.log(`✅ User ${socket.userId} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
        socket.leave(`room_${roomId}`);
        console.log(`✅ User ${socket.userId} left room ${roomId}`);
    });

    socket.on('typing', (data) => {
        socket.to(`room_${data.room_id}`).emit('user_typing', {
            user_id: socket.userId,
            room_id: data.room_id
        });
    });

    socket.on('stop_typing', (data) => {
        socket.to(`room_${data.room_id}`).emit('user_stop_typing', {
            user_id: socket.userId,
            room_id: data.room_id
        });
    });

    socket.on('send_message', (message) => {
        console.log('📤 Message via socket:', message);
        
        io.to(`room_${message.room_id}`).emit('new_message', {
            ...message,
            sender_id: socket.userId,
            full_name: 'ผู้ใช้งาน',
            profile_image: null,
            department_name: 'แผนก'
        });
    });

    socket.on('disconnect', async () => {
        const userId = socket.userId;
        
        if (userId) {
            onlineUsers.delete(userId);

            const client = await getConnection();
            await client.query(
                'UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE user_id = $1',
                [userId]
            );
            client.release();

            socket.broadcast.emit('user_offline', { user_id: userId });
        }

        console.log('🔌 Socket disconnected:', socket.id);
    });
});

// ========================================
// Serve frontend pages
// ========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.get('/report/:summaryId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

// ========================================
// Error handling
// ========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'ไฟล์มีขนาดใหญ่เกิน 10MB' });
        }
    }
    
    res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในระบบ',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ================ ตั้งค่าระบบส่งอีเมล (Gmail SMTP + port 2525) ================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 2525,                    // ✅ พอร์ตที่ Render ฟรีเทียร์อนุญาต
    secure: false,                  // ✅ ต้องเป็น false เพราะ port 2525 ไม่ใช่ SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ✅ ฟังก์ชันส่งอีเมลพร้อมรหัส 6 หลัก (ใช้ Gmail SMTP)
async function sendResetCodeEmail(email, name, code) {
    console.log('📧 ===== SENDING VIA GMAIL SMTP (PORT 2525) =====');
    console.log('📧 To:', email);
    console.log('📧 Code:', code);
    
    try {
        const mailOptions = {
            from: `"ระบบแชท SMH Korat" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 รหัสยืนยันการตั้งรหัสผ่านใหม่',
            html: `
                <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #667eea; text-align: center;">🔐 รหัสยืนยันการตั้งรหัสผ่านใหม่</h2>
                    
                    <p style="font-size: 16px;">สวัสดี คุณ${name}</p>
                    
                    <p style="font-size: 16px;">เราได้รับคำขอให้ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
                    
                    <p style="font-size: 16px;">กรุณาใช้รหัส 6 หลักด้านล่าง:</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; font-weight: bold; letter-spacing: 10px; padding: 20px; border-radius: 10px; display: inline-block; font-family: monospace;">
                            ${code}
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #e74c3c; font-weight: bold;">
                            ⚠️ รหัสนี้หมดอายุใน 10 นาที
                        </p>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                        หากคุณไม่ได้ขอรับรหัสนี้ กรุณาละเว้นอีเมลนี้
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        © 2024 โรงพยาบาลเซนต์เมรี่ นครราชสีมา
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return true;
        
    } catch (error) {
        console.error('❌ Email error:', error);
        return false;
    }
}



// ================ API: ลืมรหัสผ่าน (ส่งรหัส 6 หลัก) ================
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log('📨 ===== FORGOT PASSWORD REQUEST =====');
    console.log('📨 Email received:', email);
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณากรอกอีเมล' 
        });
    }

    let client;
    try {
        client = await pool.connect();
        
        // ตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
        const userResult = await client.query(
            'SELECT user_id, username, full_name FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // เพื่อความปลอดภัย: ไม่บอกว่ามีอีเมลนี้หรือไม่
            return res.json({ 
                success: true, 
                message: 'หากอีเมลนี้มีในระบบ เราจะส่งรหัส 6 หลักให้คุณ' 
            });
        }

        const user = userResult.rows[0];
        
        // ✅ สร้างรหัส 6 หลัก
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // ✅ กำหนดอายุ 10 นาที
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // ✅ ลบรหัสเก่าของ user นี้ (ถ้ามี)
        await client.query(
            'DELETE FROM password_resets WHERE user_id = $1 AND used = FALSE',
            [user.user_id]
        );
        
        // ✅ บันทึกรหัสใหม่ลงฐานข้อมูล
        await client.query(
            `INSERT INTO password_resets (user_id, token, expires_at) 
             VALUES ($1, $2, $3)`,
            [user.user_id, resetCode, expiresAt]
        );

        // ✅ ส่งอีเมลพร้อมรหัส 6 หลัก
        const emailSent = await sendResetCodeEmail(email, user.full_name, resetCode);
        
        if (emailSent) {
            res.json({ 
                success: true, 
                message: 'ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล',
                expires_in: 10
            });
        } else {
            console.log(`🔑 รหัสสำรองสำหรับ ${email}: ${resetCode} (อายุ 10 นาที)`);
            res.json({ 
                success: true, 
                message: 'ส่งอีเมลไม่สำเร็จ แต่คุณสามารถใช้รหัสนี้ได้: ' + resetCode,
                debug_code: resetCode
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' 
        });
    } finally {
        if (client) client.release();
    }
});



// ✅ API: ตรวจสอบรหัส 6 หลัก
app.post('/api/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณากรอกอีเมลและรหัสยืนยัน' 
        });
    }

    let client;
    try {
        client = await pool.connect();
        
        // ตรวจสอบว่ามีผู้ใช้นี้หรือไม่
        const userResult = await client.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'ไม่พบผู้ใช้นี้ในระบบ' 
            });
        }

        const userId = userResult.rows[0].user_id;
        
        // ตรวจสอบรหัส
        const codeResult = await client.query(
            `SELECT * FROM password_resets 
             WHERE user_id = $1 
             AND token = $2 
             AND expires_at > NOW() 
             AND used = FALSE`,
            [userId, code]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'รหัสไม่ถูกต้องหรือหมดอายุแล้ว' 
            });
        }

        // สร้าง temporary token สำหรับตั้งรหัสผ่านใหม่ (อายุ 15 นาที)
        const tempToken = jwt.sign(
            { 
                user_id: userId,
                purpose: 'password_reset',
                email: email
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ 
            success: true, 
            message: 'รหัสถูกต้อง',
            temp_token: tempToken
        });

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' 
        });
    } finally {
        if (client) client.release();
    }
});

// ✅ API: ตั้งรหัสผ่านใหม่ (ใช้ temp token)
app.post('/api/reset-password-with-code', async (req, res) => {
    const { temp_token, password } = req.body;
    
    if (!temp_token || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' 
        });
    }

    let client;
    try {
        // ตรวจสอบ temp token
        const decoded = jwt.verify(temp_token, JWT_SECRET);
        
        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ 
                success: false, 
                message: 'Token ไม่ถูกต้อง' 
            });
        }

        client = await pool.connect();
        
        // เริ่ม transaction
        await client.query('BEGIN');
        
        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // อัพเดทรหัสผ่าน
        await client.query(
            `UPDATE users SET password = $1 WHERE user_id = $2`,
            [hashedPassword, decoded.user_id]
        );
        
        // ลบรหัสเก่าทั้งหมดของผู้ใช้นี้
        await client.query(
            `UPDATE password_resets SET used = TRUE 
             WHERE user_id = $1 AND used = FALSE`,
            [decoded.user_id]
        );
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'เปลี่ยนรหัสผ่านสำเร็จ' 
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ 
                success: false, 
                message: 'หมดเวลาดำเนินการ กรุณาขอรหัสใหม่' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ 
                success: false, 
                message: 'ข้อมูลไม่ถูกต้อง กรุณาลองใหม่' 
            });
        }
        
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' 
        });
    } finally {
        if (client) client.release();
    }
});
// ================ API: ตรวจสอบความถูกต้องของ token ================
app.get('/api/validate-reset-token', async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.json({ valid: false });
    }

    let client;
    try {
        client = await pool.connect();
        
        // ตรวจสอบ token ว่ามีในระบบและยังไม่หมดอายุ
        const result = await client.query(
            `SELECT * FROM password_resets 
             WHERE token = $1 
             AND expires_at > NOW() 
             AND used = FALSE`,
            [token]
        );

        res.json({ valid: result.rows.length > 0 });
    } catch (error) {
        console.error('Validate token error:', error);
        res.json({ valid: false });
    } finally {
        if (client) client.release();
    }
});

// ========================================
// Start server with database check
// ========================================
async function startServer() {
    try {
        // ทดสอบ database connection ก่อน
        console.log('🔄 Testing database connection...');
        const testClient = await pool.connect();
        console.log('✅ Database connection successful');
        testClient.release();

        // ค่อยสร้างตาราง summary (ไม่จำเป็นต้องรอ)
        createSummaryTable().catch(err => {
            console.warn('⚠️ Summary table creation skipped:', err.message);
        });

        // ค่อยสร้างห้องแผนก (ไม่จำเป็นต้องรอ)
        createDepartmentRooms().catch(err => {
            console.warn('⚠️ Department rooms creation skipped:', err.message);
        });

        // start server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📁 Database: PostgreSQL on Supabase`);
            console.log(`🌐 Access: http://localhost:${PORT}`);
            console.log(`🗣️  Language: Thai (UTF-8)`);
        });

    } catch (error) {
        console.error('❌ Cannot start server:', error.message);
        console.log('💡 Will retry in 5 seconds...');
        
        // ลองใหม่หลังจาก 5 วินาที
        setTimeout(startServer, 5000);
    }
}

// เริ่มต้น server
startServer();