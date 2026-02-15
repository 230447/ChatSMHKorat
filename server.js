const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ตั้งค่า Google Gemini AI (หรือเปลี่ยนเป็น OpenAI ถ้าคุณใช้)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "your-api-key-here");

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

// Database connection for XAMPP (no password)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  
    database: process.env.DB_NAME || 'ChatSMHKorat',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('💡 Solution for XAMPP:');
        console.log('1. Make sure MySQL is running in XAMPP');
        console.log('2. Username: root, Password: (empty)');
        console.log('3. Check if database exists');
    } else {
        console.log('✅ Database connected successfully!');
        
        connection.release();
    }
});

// Function to create department chat rooms if they don't exist
async function createDepartmentRooms() {
    let connection;
    try {
        connection = await getConnection();
        
        console.log('🔍 Checking department chat rooms...');
        
        const [departments] = await connection.execute(
            'SELECT department_id, department_name FROM department'
        );
        
        console.log(`Found ${departments.length} departments`);
        
        let createdCount = 0;
        
        for (const dept of departments) {
            const [existingRoom] = await connection.execute(
                'SELECT room_id FROM chat_rooms WHERE department_id = ? AND room_type = "department"',
                [dept.department_id]
            );
            
            if (existingRoom.length === 0) {
                await connection.execute(
                    'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES (?, "department", ?)',
                    [`ห้องแชท - ${dept.department_name}`, dept.department_id]
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
        
        // ✅ ตรวจสอบและเพิ่มสมาชิกที่ยังไม่ได้อยู่ในห้องแผนกของตนเอง
        console.log('🔍 Checking department room memberships...');
        
        const [usersWithoutRooms] = await connection.execute(`
            SELECT u.user_id, u.department_id, d.department_name 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE NOT EXISTS (
                SELECT 1 FROM room_members rm
                INNER JOIN chat_rooms cr ON rm.room_id = cr.room_id
                WHERE rm.user_id = u.user_id 
                AND cr.department_id = u.department_id 
                AND cr.room_type = 'department'
            )
        `);
        
        let addedCount = 0;
        for (const user of usersWithoutRooms) {
            const [deptRoom] = await connection.execute(
                'SELECT room_id FROM chat_rooms WHERE department_id = ? AND room_type = "department"',
                [user.department_id]
            );
            
            if (deptRoom.length > 0) {
                await connection.execute(
                    'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
                    [deptRoom[0].room_id, user.user_id]
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
        if (connection) connection.release();
    }
}

// เรียกใช้ฟังก์ชันเมื่อ server start
createDepartmentRooms();
// เพิ่มฟังก์ชันสร้าง table (เรียกใช้ใน createDepartmentRooms())
async function createSummaryTable() {
    let connection;
    try {
        connection = await getConnection();
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS chat_summary_new (
                id INT PRIMARY KEY AUTO_INCREMENT,
                summary_id VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                chat_content TEXT COLLATE utf8mb4_unicode_ci,
                summary TEXT COLLATE utf8mb4_unicode_ci,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                saved_at DATETIME NULL,
                UNIQUE KEY summary_id (summary_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Created/Checked chat_summary_new table (same as phpMyAdmin)');
        
    } catch (error) {
        console.error('Error creating summary table:', error);
    } finally {
        if (connection) connection.release();
    }
}
// เรียกใช้ใน createDepartmentRooms() หรือแยกเรียก
createSummaryTable();

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
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

// Helper function to get database connection
const getConnection = async () => {
    return await pool.getConnection();
};

// API Routes

// 1. Register
app.post('/api/register', async (req, res) => {
    let connection;
    try {
        const { employee_id, username, password, full_name, email, department_id } = req.body;
        
        if (!employee_id || !username || !password || !full_name || !department_id) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        connection = await getConnection();
        
        // Check existing user
        const [existing] = await connection.execute(
            'SELECT user_id FROM users WHERE employee_id = ? OR username = ?',
            [employee_id, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'รหัสพนักงานหรือชื่อผู้ใช้มีอยู่แล้ว' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await connection.execute(
            `INSERT INTO users (employee_id, username, password, full_name, email, department_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [employee_id, username, hashedPassword, full_name, email, department_id]
        );

        const userId = result.insertId;

        // ✅ 1. ตรวจสอบว่ามีห้องแผนกนี้หรือไม่
        let [departmentRoom] = await connection.execute(
            'SELECT room_id FROM chat_rooms WHERE department_id = ? AND room_type = "department"',
            [department_id]
        );

        // ✅ 2. ถ้าไม่มีห้องแผนก ให้สร้างห้องใหม่
        if (departmentRoom.length === 0) {
            let departmentName = 'แผนกไม่ทราบชื่อ';
            const [deptInfo] = await connection.execute(
                'SELECT department_name FROM department WHERE department_id = ?',
                [department_id]
            );
            
            if (deptInfo.length > 0) {
                departmentName = deptInfo[0].department_name;
            }
            
            const [roomResult] = await connection.execute(
                'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES (?, "department", ?)',
                [`ห้องแชท - ${departmentName}`, department_id]
            );
            
            departmentRoom = [{ room_id: roomResult.insertId }];
        }

        // ✅ 3. เพิ่มผู้ใช้เข้าไปในห้องแผนกของตนเอง
        if (departmentRoom.length > 0) {
            await connection.execute(
                'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
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

        // ✅ 4. ดึงข้อมูลแผนกสำหรับ response
        const [deptData] = await connection.execute(
            'SELECT department_name FROM department WHERE department_id = ?',
            [department_id]
        );

        const department_name = deptData.length > 0 ? deptData[0].department_name : 'ไม่ทราบแผนก';

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
        if (connection) connection.release();
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
        }

        connection = await getConnection();

        const [users] = await connection.execute(
            `SELECT u.*, d.department_name 
             FROM users u 
             LEFT JOIN department d ON u.department_id = d.department_id 
             WHERE u.username = ? OR u.employee_id = ?`,
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Update online status
        await connection.execute(
            'UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = ?',
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
        if (connection) connection.release();
    }
});

// 3. Get current user
app.get('/api/me', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const [users] = await connection.execute(
            `SELECT u.*, d.department_name 
             FROM users u 
             LEFT JOIN department d ON u.department_id = d.department_id 
             WHERE u.user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        const user = users[0];
        res.json({ success: true, user });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 4. Get all departments
app.get('/api/departments', async (req, res) => {
    console.log('📋 Requesting departments...');
    
    try {
        const connection = await pool.getConnection();
        
        try {
            const [departments] = await connection.execute(
                'SELECT * FROM department ORDER BY department_name'
            );
            
            connection.release();
            
            if (departments.length > 0) {
                console.log(`✅ Found ${departments.length} departments in database`);
                return res.json({ 
                    success: true, 
                    departments: departments,
                    source: 'database'
                });
            } else {
                console.log('ℹ️ Database connected but no departments found');
                return sendBackupDepartments(res);
            }
            
        } catch (queryError) {
            connection.release();
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
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1000,
            }
        });

        // Safety settings ที่ยืดหยุ่น
        const safetySettings = [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
            }
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

// 5. Get user's chat rooms
app.get('/api/chat-rooms', authenticateToken, async (req, res) => {
    let connection;
    try {
        const userId = req.user.user_id;
        connection = await getConnection();

        console.log(`🔍 ดึงข้อมูลห้องสำหรับ user_id: ${userId}`);

        const [rooms] = await connection.execute(
            `SELECT 
                cr.room_id,
                cr.room_name,
                cr.room_type,
                cr.department_id,
                cr.created_at,
                d.department_name
            FROM chat_rooms cr
            LEFT JOIN department d ON cr.department_id = d.department_id
            WHERE cr.room_id IN (
                SELECT room_id FROM room_members WHERE user_id = ?
            )
            ORDER BY cr.room_type, cr.room_name`,
            [userId]
        );

        console.log(`✅ พบ ${rooms.length} ห้องสำหรับ user ${userId}`);

        res.json({ 
            success: true, 
            rooms: rooms,
            count: rooms.length
        });

    } catch (error) {
        console.error('❌ Get chat rooms error:', error);
        res.status(500).json({ 
            success: false,
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องสนทนา'
        });
    } finally {
        if (connection) connection.release();
    }
});

// 6. Create new chat room
// บรรทัดที่ ~420: แก้ไขฟังก์ชัน create chat room
app.post('/api/chat-rooms', authenticateToken, async (req, res) => {
    let connection;
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

        connection = await getConnection();

        // สร้างห้อง
        const [roomResult] = await connection.execute(
            'INSERT INTO chat_rooms (room_name, room_type, created_by, created_at) VALUES (?, ?, ?, NOW())',
            [room_name.trim(), room_type, creator_id]
        );

        const roomId = roomResult.insertId;
        console.log(`✅ Room created with ID: ${roomId}`);

        // เพิ่มสมาชิก (รวมตัวสร้างด้วย)
        const allMemberIds = [...new Set([...member_ids, creator_id])];
        
        if (allMemberIds.length > 0) {
            const values = allMemberIds.map(user_id => [roomId, user_id]);
            await connection.query(
                'INSERT INTO room_members (room_id, user_id) VALUES ?',
                [values]
            );
            console.log(`✅ Added ${allMemberIds.length} members to room`);
        }

        // ดึงข้อมูลห้องที่สร้าง
        const [rooms] = await connection.execute(`
            SELECT 
                cr.room_id,
                cr.room_name,
                cr.room_type,
                cr.created_at,
                cr.created_by,
                d.department_name
            FROM chat_rooms cr
            LEFT JOIN department d ON cr.department_id = d.department_id
            WHERE cr.room_id = ?
        `, [roomId]);

        const newRoom = rooms[0] || null;

        // ✅ ส่ง response กลับไป
        res.status(201).json({
            success: true,
            message: 'สร้างห้องสนทนาสำเร็จ',
            room: newRoom,
            member_ids: allMemberIds,
            room_id: roomId
        });

        // ✅ ส่ง Socket.IO event หลังจาก response แล้ว
        console.log(`📢 Broadcasting room_created event...`);
        
        // ส่งไปยังผู้สร้าง
        const creatorSocket = onlineUsers.get(creator_id);
        if (creatorSocket) {
            io.to(creatorSocket).emit('room_created', {
                room_id: roomId,
                room_name: room_name,
                room: newRoom,
                message: `สร้างห้อง "${room_name}" สำเร็จ`
            });
        }
        
        // ส่งไปยังสมาชิกที่ถูกเพิ่ม
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
        if (connection) connection.release();
    }
});
// 7. Get room messages
app.get('/api/chat-rooms/:roomId/messages', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { roomId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        connection = await getConnection();

        const [membership] = await connection.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, req.user.user_id]
        );

        if (membership.length === 0) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' });
        }

        const [messages] = await connection.execute(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name,
             (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.message_id) as read_count
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE m.room_id = ?
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?`,
            [roomId, parseInt(limit), parseInt(offset)]
        );

        await connection.execute(
            `INSERT INTO message_reads (message_id, user_id)
             SELECT m.message_id, ? FROM messages m
             WHERE m.room_id = ? AND m.sender_id != ?
             AND m.message_id NOT IN (
                 SELECT message_id FROM message_reads WHERE user_id = ?
             )`,
            [req.user.user_id, roomId, req.user.user_id, req.user.user_id]
        );

        res.json({
            success: true,
            messages: messages.reverse(),
            room_id: roomId
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 8. Send message - สำคัญที่สุด! แก้ไขให้ emit ไปยัง socket room
app.post('/api/chat-rooms/:roomId/messages', authenticateToken, upload.single('file'), async (req, res) => {
    let connection;
    try {
        const { roomId } = req.params;
        const { message_text, message_type = 'text' } = req.body;

        console.log(`📨 API: Sending message to room ${roomId}`);
        console.log(`📝 Message: ${message_text}`);
        console.log(`👤 User: ${req.user.user_id}`);

        connection = await getConnection();

        const [membership] = await connection.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, req.user.user_id]
        );

        if (membership.length === 0) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้' });
        }

        let file_url = null;
        let file_name = null;
        let file_size = null;

        if (req.file) {
            file_url = `/uploads/${req.file.filename}`;
            file_name = req.file.originalname;
            file_size = req.file.size;
        }

        const [messageResult] = await connection.execute(
            `INSERT INTO messages (room_id, sender_id, message_text, message_type, file_url, file_name, file_size) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [roomId, req.user.user_id, message_text, message_type, file_url, file_name, file_size]
        );

        const messageId = messageResult.insertId;

        const [messages] = await connection.execute(
            `SELECT m.*, u.username, u.full_name, u.profile_image, d.department_name
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE m.message_id = ?`,
            [messageId]
        );

        if (messages.length === 0) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
        }

        const newMessage = messages[0];
        console.log('✅ Message created in DB:', newMessage);

        // ✅ สำคัญ: Broadcast ไปยัง socket room ทุกคน
        console.log(`📢 Broadcasting to room_${roomId}`);
        io.to(`room_${roomId}`).emit('new_message', newMessage);

        res.status(201).json({
            success: true,
            message: newMessage
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    } finally {
        if (connection) connection.release();
    }
});

// 9. Search users
app.get('/api/users/search', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        connection = await getConnection();

        const [users] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, 
                    u.profile_image, u.is_online, d.department_name
             FROM users u
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE (u.username LIKE ? OR u.full_name LIKE ? OR u.employee_id LIKE ?)
             AND u.user_id != ?
             ORDER BY u.full_name
             LIMIT 20`,
            [`%${q}%`, `%${q}%`, `%${q}%`, req.user.user_id]
        );

        res.json({ success: true, users });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 10. Update profile
app.put('/api/profile', authenticateToken, upload.single('profile_image'), async (req, res) => {
    let connection;
    try {
        const { full_name, email } = req.body;

        connection = await getConnection();

        const updateFields = [];
        const values = [];

        if (full_name) {
            updateFields.push('full_name = ?');
            values.push(full_name);
        }

        if (email) {
            updateFields.push('email = ?');
            values.push(email);
        }

        if (req.file) {
            updateFields.push('profile_image = ?');
            values.push(`/uploads/${req.file.filename}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัพเดท' });
        }

        values.push(req.user.user_id);

        const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`;
        await connection.execute(query, values);

        const [users] = await connection.execute(
            `SELECT u.*, d.department_name FROM users u 
             LEFT JOIN department d ON u.department_id = d.department_id 
             WHERE u.user_id = ?`,
            [req.user.user_id]
        );

        res.json({
            success: true,
            message: 'อัพเดทโปรไฟล์สำเร็จ',
            user: users[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์' });
    } finally {
        if (connection) connection.release();
    }
});

// 11. Change password
app.post('/api/change-password', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        connection = await getConnection();

        const [users] = await connection.execute(
            'SELECT password FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }

        const validPassword = await bcrypt.compare(current_password, users[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await connection.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
            [hashedPassword, req.user.user_id]
        );

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    } finally {
        if (connection) connection.release();
    }
});

// 12. Forgot password request
app.post('/api/forgot-password', async (req, res) => {
    let connection;
    try {
        const { employee_id, email } = req.body;

        if (!employee_id || !email) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและอีเมล' });
        }

        connection = await getConnection();

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE employee_id = ? AND email = ?',
            [employee_id, email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ตรงกับข้อมูล' });
        }

        const user = users[0];

        const resetToken = jwt.sign(
            { 
                user_id: user.user_id, 
                type: 'password_reset',
                employee_id: user.employee_id 
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log(`Reset token for ${user.email}: ${resetToken}`);

        res.json({
            success: true,
            message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว',
            reset_token: resetToken
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 13. Reset password
app.post('/api/reset-password', async (req, res) => {
    let connection;
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
        }

        if (decoded.type !== 'password_reset') {
            return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
        }

        connection = await getConnection();

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await connection.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
            [hashedPassword, decoded.user_id]
        );

        res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
    } finally {
        if (connection) connection.release();
    }
});

// 14. Get room members
app.get('/api/chat-rooms/:roomId/members', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { roomId } = req.params;

        connection = await getConnection();

        const [members] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.profile_image, 
                    u.is_online, u.last_seen, d.department_name
             FROM room_members rm
             JOIN users u ON rm.user_id = u.user_id
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE rm.room_id = ?
             ORDER BY u.full_name`,
            [roomId]
        );

        res.json({ success: true, members });

    } catch (error) {
        console.error('Get room members error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 15. Add member to room
// 15. Add member to room - ปรับปรุงใหม่
app.post('/api/chat-rooms/:roomId/members', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { roomId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ 
                success: false,
                error: 'กรุณาระบุผู้ใช้' 
            });
        }

        connection = await getConnection();

        // ✅ ตรวจสอบว่าห้องเป็นแบบกลุ่มหรือไม่
        const [rooms] = await connection.execute(
            'SELECT room_type, room_name FROM chat_rooms WHERE room_id = ?',
            [roomId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'ไม่พบห้องสนทนา' 
            });
        }

        const room = rooms[0];

        if (room.room_type !== 'group') {
            return res.status(400).json({ 
                success: false,
                error: 'สามารถเพิ่มสมาชิกได้เฉพาะห้องแบบกลุ่ม' 
            });
        }

        // ✅ ตรวจสอบว่าผู้ใช้เป็นสมาชิกอยู่แล้วหรือไม่
        const [existing] = await connection.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ผู้ใช้เป็นสมาชิกห้องนี้อยู่แล้ว' 
            });
        }

        // ✅ เพิ่มสมาชิก
        await connection.execute(
            'INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, NOW())',
            [roomId, user_id]
        );

        // ✅ ดึงข้อมูลสมาชิกที่เพิ่ม
        const [newMember] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, 
                    u.profile_image, u.is_online, d.department_name
             FROM users u
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE u.user_id = ?`,
            [user_id]
        );

        console.log(`✅ Added user ${user_id} to room ${roomId}`);

        res.json({ 
            success: true, 
            message: 'เพิ่มสมาชิกสำเร็จ',
            member: newMember[0] || null
        });

        // ✅ ส่ง Socket.IO notification
        const memberSocket = onlineUsers.get(user_id);
        if (memberSocket) {
            io.to(memberSocket).emit('added_to_room', {
                room_id: roomId,
                room_name: room.room_name,
                added_by: req.user.user_id
            });
        }

        // ✅ แจ้งสมาชิกในห้อง
        const [roomMembers] = await connection.execute(
            'SELECT user_id FROM room_members WHERE room_id = ?',
            [roomId]
        );

        roomMembers.forEach(member => {
            const socket = onlineUsers.get(member.user_id);
            if (socket && member.user_id !== user_id) {
                io.to(socket).emit('member_joined', {
                    room_id: roomId,
                    user_id: user_id,
                    member: newMember[0] || null
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
        if (connection) connection.release();
    }
});
// 18. AI Chat Summary - สรุปการสนทนา
// 18. AI Chat Summary - สรุปการสนทนา
// ✅ API Chat Summary - เวอร์ชันสมบูรณ์
app.post('/api/chat-summary', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { room_id, message_count = 100, custom_instruction } = req.body;
        
        console.log(`📊 ขอสรุปห้อง ${room_id}, ${message_count} ข้อความ`);
        
        if (!room_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณาระบุ room_id' 
            });
        }

        connection = await getConnection();
        
        // 1. ดึงข้อมูลห้อง
        const [rooms] = await connection.execute(
            'SELECT room_name, room_type FROM chat_rooms WHERE room_id = ?',
            [room_id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'ไม่พบห้องสนทนา' 
            });
        }
        
        const roomName = rooms[0].room_name;
        
        // 2. ดึงข้อความล่าสุด
        const [messages] = await connection.execute(
            `SELECT 
                m.message_text,
                DATE_FORMAT(m.created_at, '%H:%i') as time,
                DATE_FORMAT(m.created_at, '%d/%m/%Y') as date,
                u.full_name,
                d.department_name
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE m.room_id = ?
            AND m.message_type = 'text'
            AND m.message_text IS NOT NULL
            AND LENGTH(TRIM(m.message_text)) > 0
            ORDER BY m.created_at DESC
            LIMIT ?`,
            [room_id, parseInt(message_count)]
        );
        
        const sortedMessages = messages.reverse();
        
        if (sortedMessages.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'ไม่มีข้อความสำหรับสรุป' 
            });
        }
        
        console.log(`📨 พบ ${sortedMessages.length} ข้อความในห้อง "${roomName}"`);
        
        // 3. จัดรูปแบบข้อความ
        const formattedMessages = sortedMessages.map(msg => 
            `[${msg.time}] ${msg.full_name} (${msg.department_name || 'ไม่มีแผนก'}): ${msg.message_text}`
        ).join('\n');
        
        // 4. สร้าง Prompt
        const prompt = `
คุณเป็นผู้ช่วยวิเคราะห์และสรุปการสนทนาสำหรับโรงพยาบาล
กรุณาสรุปการสนทนาด้านล่างให้กระชับ เป็นทางการ และเข้าใจง่าย

**ข้อมูลห้อง:**
- ชื่อห้อง: ${roomName}
- จำนวนข้อความ: ${sortedMessages.length} ข้อความ
- ช่วงเวลา: ${sortedMessages[0].date} ${sortedMessages[0].time} ถึง ${sortedMessages[sortedMessages.length-1].time}

**ประวัติการสนทนา:**
${formattedMessages}

${custom_instruction ? `\n**คำแนะนำเพิ่มเติม:** ${custom_instruction}` : ''}

กรุณาสรุปเป็นภาษาไทยโดยมีโครงสร้าง:
1. ภาพรวมของการสนทนา
2. ประเด็นสำคัญ
3. คำแนะนำหรือข้อสรุป`;

        // 5. เรียกใช้ Gemini AI หรือใช้ fallback
        let summary;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey || apiKey === 'your-api-key-here') {
            console.log('⚠️  ไม่มี API Key, ใช้ fallback');
            summary = createFallbackSummary(sortedMessages, roomName);
        } else {
            try {
                console.log('🤖 เรียกใช้ Gemini AI...');
                
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-pro",
                    generationConfig: {
                        temperature: 0.3,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 1500,
                    }
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                summary = response.text();
                
                console.log('✅ Gemini สรุปสำเร็จ');
                
            } catch (aiError) {
                console.error('❌ Gemini Error:', aiError.message);
                summary = createFallbackSummary(sortedMessages, roomName);
            }
        }
        
        // 6. สร้าง summary_id
        const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 7. บันทึกลง database (ตารางใหม่)
        try {
            const [result] = await connection.execute(
                `INSERT INTO chat_summary_new 
                 (summary_id, chat_content, summary, created_at) 
                 VALUES (?, ?, ?, NOW())`,
                [summaryId, formattedMessages, summary]
            );
            
            console.log(`💾 บันทึกสรุป ID: ${result.insertId}, Summary ID: ${summaryId}`);
            
        } catch (dbError) {
            console.warn('⚠️  ไม่สามารถบันทึก:', dbError.message);
        }
        
        // 8. ✅ แก้ไขตรงนี้: ส่ง Response พร้อม report_url
        res.json({
            success: true,
            summary: summary,
            summary_id: summaryId,
            report_url: `/report?id=${summaryId}&room_id=${room_id}`,  // ✅ เพิ่มบรรทัดนี้
            stats: {
                room_id: room_id,
                room_name: roomName,
                message_count: sortedMessages.length,
                timeframe: `${sortedMessages[0].time} - ${sortedMessages[sortedMessages.length-1].time}`,
                date: sortedMessages[0].date
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
        if (connection) connection.release();
    }
});
// ✅ Fallback Summary Function
function createFallbackSummary(messages, roomName) {
    const userCount = new Set(messages.map(m => m.full_name)).size;
    const deptCount = new Set(messages.map(m => m.department_name).filter(Boolean)).size;
    
    // หาคำสำคัญ
    const keywords = ['ด่วน', 'สำคัญ', 'ประชุม', 'ส่ง', 'ตรวจ', 'ปัญหา', 'แก้ไข', 'อนุมัติ'];
    const found = keywords.filter(kw => 
        messages.some(m => m.message_text.includes(kw))
    );
    
    return `**สรุปการสนทนาในห้อง: ${roomName}**

**1. ภาพรวม**
การสนทนาระหว่างผู้ใช้งาน ${userCount} คน จาก ${deptCount} แผนก ประกอบด้วยข้อความทั้งหมด ${messages.length} ข้อความ

**2. ประเด็นสำคัญ**
${found.length > 0 ? found.map(kw => `- พบการกล่าวถึง: ${kw}`).join('\n') : '- มีการแลกเปลี่ยนข้อมูลและประสานงาน'}
${deptCount > 1 ? '- มีการประสานงานข้ามแผนก' : ''}

**3. หมายเหตุ**
สรุปนี้สร้างโดยระบบพื้นฐาน (ไม่ใช้ AI) เนื่องจาก Gemini API ไม่สามารถใช้งานได้ในขณะนี้

*หมายเหตุ: เพื่อให้ได้สรุปที่ละเอียดและแม่นยำ กรุณาตรวจสอบการตั้งค่า GEMINI_API_KEY*`;
}

// 19. Get summary history (เก็บประวัติการสรุป)
app.get('/api/chat-summary/history', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        connection = await getConnection();
        
        // ✅ ดึงข้อมูลจากตาราง chat_summary_new
        const [summaries] = await connection.execute(
            `SELECT 
                id,
                summary_id,
                LEFT(chat_content, 200) as chat_preview,
                LEFT(summary, 300) as summary_preview,
                created_at,
                saved_at
            FROM chat_summary_new
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );
        
        // นับจำนวนทั้งหมด
        const [totalCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM chat_summary_new'
        );
        
        res.json({
            success: true,
            summaries: summaries,
            count: summaries.length,
            total: totalCount[0].total || 0
        });
        
    } catch (error) {
        console.error('Get summary history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการดึงประวัติสรุป'
        });
    } finally {
        if (connection) connection.release();
    }
});

// 20. Save chat summary
// ✅ เพิ่ม endpoint ที่ขาดไป
app.post('/api/chat-summary/save', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { room_id, summary_text, summary_title } = req.body;
        
        if (!room_id || !summary_text) {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณาระบุ room_id และ summary_text' 
            });
        }
        
        connection = await getConnection();
        
        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องหรือไม่
        const [membership] = await connection.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [room_id, req.user.user_id]
        );
        
        if (membership.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'คุณไม่มีสิทธิ์เข้าถึงห้องนี้' 
            });
        }
        
        // สร้าง summary_id
        const summaryId = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // ดึงชื่อห้องสำหรับใช้เป็น title
        const [rooms] = await connection.execute(
            'SELECT room_name FROM chat_rooms WHERE room_id = ?',
            [room_id]
        );
        const roomName = rooms.length > 0 ? rooms[0].room_name : `ห้อง ${room_id}`;
        
        // ✅ ใช้ตาราง chat_summary_new
        const [result] = await connection.execute(
            `INSERT INTO chat_summary_new 
             (summary_id, chat_content, summary, created_at, saved_at) 
             VALUES (?, ?, ?, NOW(), NOW())`,
            [summaryId, summary_text, summary_title || `สรุป: ${roomName}`]
        );
        
        console.log(`💾 Saved summary to chat_summary_new, ID: ${result.insertId}, Summary ID: ${summaryId}`);
        
        res.status(201).json({
            success: true,
            message: 'บันทึกสรุปสำเร็จ',
            summary_id: summaryId,
            summary_title: summary_title || `สรุป: ${roomName}`,
            report_url: `/report?id=${summaryId}&room_id=${room_id}`  // ✅ เพิ่มบรรทัดนี้
        });
        
    } catch (error) {
        console.error('❌ Save summary error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการบันทึกสรุป',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});
// 16. Get online users
app.get('/api/users/online', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const [users] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, 
                    u.profile_image, d.department_name
             FROM users u
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE u.is_online = TRUE
             AND u.user_id != ?
             ORDER BY u.full_name`,
            [req.user.user_id]
        );

        res.json({ success: true, users });

    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// 17. Leave room
app.delete('/api/chat-rooms/:roomId/leave', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { roomId } = req.params;

        connection = await getConnection();

        const [rooms] = await connection.execute(
            'SELECT room_type, department_id FROM chat_rooms WHERE room_id = ?',
            [roomId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ error: 'ไม่พบห้องสนทนา' });
        }

        const room = rooms[0];

        if (room.room_type === 'department') {
            return res.status(400).json({ error: 'ไม่สามารถออกจากห้องแผนกได้' });
        }

        await connection.execute(
            'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, req.user.user_id]
        );

        res.json({ success: true, message: 'ออกจากห้องสนทนาสำเร็จ' });

    } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// Get all users
// บรรทัดที่ ~1100: มีอยู่แล้ว
app.get('/api/users', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const [users] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, 
                    u.profile_image, u.is_online, u.last_seen, d.department_name
             FROM users u
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE u.user_id != ?
             ORDER BY u.is_online DESC, u.full_name`,
            [req.user.user_id]
        );
        
        res.json({ success: true, users });
        
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// Get user by ID
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await getConnection();
        
        const [users] = await connection.execute(
            `SELECT u.user_id, u.employee_id, u.username, u.full_name, u.email, 
                    u.profile_image, u.is_online, u.last_seen, d.department_name
             FROM users u
             LEFT JOIN department d ON u.department_id = d.department_id
             WHERE u.user_id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }
        
        res.json({ success: true, user: users[0] });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    } finally {
        if (connection) connection.release();
    }
});

// Socket.IO handling - แก้ไขใหม่
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

            const connection = await getConnection();
            await connection.execute(
                'UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE user_id = ?',
                [userId]
            );
            connection.release();

            // ✅ ส่ง authenticated event กลับไปยัง client
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
    
    // แจ้งสมาชิกที่ถูกเพิ่ม
    const memberSocket = onlineUsers.get(data.user_id);
    if (memberSocket) {
        io.to(memberSocket).emit('added_to_room', {
            room_id: data.room_id,
            room_name: data.room_name,
            added_by: data.added_by
        });
    }
    
    // แจ้งสมาชิกคนอื่นๆ ในห้อง
    socket.to(`room_${data.room_id}`).emit('member_joined', {
        room_id: data.room_id,
        user_id: data.user_id
    });
});

socket.on('room_created', (data) => {
    console.log(`🏠 Room created: ${data.room_name}`);
    // แจ้งเตือนสมาชิกที่ถูกเพิ่ม
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
        console.log(`⌨️ User ${socket.userId} typing in room ${data.room_id}`);
        socket.to(`room_${data.room_id}`).emit('user_typing', {
            user_id: socket.userId,
            room_id: data.room_id
        });
    });

    socket.on('stop_typing', (data) => {
        console.log(`⏹️ User ${socket.userId} stopped typing in room ${data.room_id}`);
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

            const connection = await getConnection();
            await connection.execute(
                'UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE user_id = ?',
                [userId]
            );
            connection.release();

            socket.broadcast.emit('user_offline', { user_id: userId });
        }

        console.log('🔌 Socket disconnected:', socket.id);
    });
});

// Serve frontend pages
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

// Error handling
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
// เพิ่ม API สำหรับดึงข้อมูลรายละเอียดสรุป
app.get('/api/chat-summary/details', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { id, room_id } = req.query;
        
        connection = await getConnection();
        
        let summaryData = null;
        let roomData = null;
        
        // 1. ดึงข้อมูลจากตาราง chat_summary_new
        if (id) {
            console.log(`🔍 กำลังดึงสรุป ID: ${id}`);
            
            const [summaries] = await connection.execute(
                `SELECT * FROM chat_summary_new 
                 WHERE summary_id = ? OR id = ?
                 ORDER BY created_at DESC LIMIT 1`,
                [id, id]
            );
            
            if (summaries.length > 0) {
                summaryData = summaries[0];
                console.log(`✅ พบข้อมูลสรุป: ${summaryData.summary_id}`);
            }
        }
        
        // 2. ดึงข้อมูลห้อง
        let roomId = room_id;
        if (summaryData && summaryData.room_id) {
            roomId = summaryData.room_id;
        }
        
        if (roomId) {
            const [rooms] = await connection.execute(
                'SELECT room_id, room_name FROM chat_rooms WHERE room_id = ?',
                [roomId]
            );
            
            if (rooms.length > 0) {
                roomData = rooms[0];
                console.log(`✅ พบข้อมูลห้อง: ${roomData.room_name}`);
            }
        }
        
        // 3. ถ้าไม่มีข้อมูลแต่มี room_id ให้ดึงสรุปล่าสุด
        if (!summaryData && roomId) {
            console.log(`🔍 หาสรุปล่าสุดจากห้อง ${roomId}`);
            
            const [latestSummaries] = await connection.execute(
                `SELECT * FROM chat_summary_new 
                 WHERE room_id = ?
                 ORDER BY created_at DESC LIMIT 1`,
                [roomId]
            );
            
            if (latestSummaries.length > 0) {
                summaryData = latestSummaries[0];
                console.log(`✅ พบสรุปล่าสุด: ${summaryData.summary_id}`);
            }
        }
        
        // 4. ถ้าไม่มีข้อมูลอะไรเลย
        if (!summaryData) {
            return res.status(404).json({ 
                success: false, 
                error: 'ไม่พบข้อมูลสรุป' 
            });
        }
        
        // 5. ดึงข้อมูลสถิติห้อง
        let messageCount = 0;
        let dateRange = '';
        let lastMessageTime = '';
        
        if (roomId) {
            const [stats] = await connection.execute(
                `SELECT 
                    COUNT(*) as message_count,
                    MIN(DATE(created_at)) as min_date,
                    MAX(DATE(created_at)) as max_date,
                    MIN(TIME(created_at)) as min_time,
                    MAX(TIME(created_at)) as max_time
                FROM messages 
                WHERE room_id = ?`,
                [roomId]
            );
            
            if (stats.length > 0) {
                messageCount = stats[0].message_count;
                
                if (stats[0].min_date && stats[0].max_date) {
                    const minDate = new Date(stats[0].min_date).toLocaleDateString('th-TH');
                    const maxDate = new Date(stats[0].max_date).toLocaleDateString('th-TH');
                    
                    if (minDate === maxDate) {
                        dateRange = `${minDate} ${stats[0].min_time || '00:00'} - ${stats[0].max_time || '23:59'}`;
                    } else {
                        dateRange = `${minDate} - ${maxDate}`;
                    }
                    
                    lastMessageTime = stats[0].max_time || '';
                }
            }
        }
        
        res.json({
            success: true,
            summary: summaryData.summary || '',
            chat_content: summaryData.chat_content || '',
            summary_id: summaryData.summary_id,
            summary_title: summaryData.summary_title || `สรุป: ${roomData?.room_name || 'ห้องไม่ทราบ'}`,
            room_name: roomData ? roomData.room_name : 'ไม่ทราบห้อง',
            room_id: roomId,
            created_at: summaryData.created_at,
            saved_at: summaryData.saved_at,
            message_count: messageCount,
            date_range: dateRange,
            last_message_time: lastMessageTime,
            stats: {
                total_messages: messageCount,
                summary_length: (summaryData.summary || '').length,
                created_date: summaryData.created_at ? 
                    new Date(summaryData.created_at).toLocaleDateString('th-TH') : 
                    new Date().toLocaleDateString('th-TH')
            }
        });
        
    } catch (error) {
        console.error('Get summary details error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});
// เพิ่ม route สำหรับหน้ารายงาน
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

// หรือถ้าต้องการแบบดึงข้อมูลจากสรุปที่บันทึกไว้
app.get('/report/:summaryId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});
// Helper function สำหรับสร้าง prompt
function createSummaryPrompt(messages, customInstruction = null) {
    const basePrompt = `
คุณเป็นผู้ช่วยสรุปการสนทนาของโรงพยาบาล กรุณาสรุปการสนทนาต่อไปนี้ให้กระชับและเป็นทางการ เหมาะสำหรับการรายงาน:

**คำแนะนำในการสรุป:**
1. ให้ภาพรวมของการสนทนาอย่างสั้นๆ
2. ดึงเฉพาะประเด็นสำคัญ (ใช้ bullet points)
3. ไม่ต้องใส่รายละเอียดซ้ำซ้อน
4. ใช้ภาษาทางการ อ่านง่าย
5. ถ้ามีการดำเนินการหรือข้อสรุป ให้ระบุชัดเจน

**รูปแบบการสรุปที่ต้องการ:**
1. ภาพรวมของการสนทนา
2. ประเด็นสำคัญ (Bullet points)
3. การดำเนินการหรือข้อสรุป (ถ้ามี)

**ประวัติการสนทนา:**
${messages}

${customInstruction ? `\n**คำแนะนำเพิ่มเติม:** ${customInstruction}\n` : ''}

กรุณาสรุปตามรูปแบบด้านบนโดยใช้ภาษาไทยเท่านั้น:`;

    return basePrompt;
}



// Fallback function ถ้า AI ไม่ทำงาน
// แก้ไขฟังก์ชัน createFallbackSummary
function createFallbackSummary(messages, roomName = 'ไม่ทราบห้อง') {
    try {
        if (!messages || messages.length === 0) {
            return "ไม่พบข้อความสำหรับสรุป";
        }
        
        const messageCount = messages.length;
        const users = new Set(messages.map(m => m.full_name).filter(Boolean));
        const dates = new Set(messages.map(m => m.date).filter(Boolean));
        const times = messages.map(m => m.time).filter(Boolean);
        
        // เรียงลำดับเวลา
        times.sort();
        const timeRange = times.length > 0 ? `${times[0]} - ${times[times.length-1]}` : 'ไม่ทราบเวลา';
        const firstDate = Array.from(dates)[0] || new Date().toLocaleDateString('th-TH');
        
        // สรุปตามรูปแบบตัวอย่างที่ให้มา
        return `# สรุปการสนทนา

${messageCount} ข้อความ  
${timeRange}  
${firstDate}

**สรุปการสนทนาในห้อง: ${roomName} (สรุปแบบฟื้นฐาน)**

## 1. ภาพรวม
- ${firstDate} - ผู้ร่วมสนทนา ${users.size} คน - ${firstDate} - ช่วงเวลา ${timeRange}

## 2. ประเด็นสำคัญ
- ไม่พบคำสั่งคัดเลือก - การสนทนานี้ไม่เคยมีด้วย

## 3. คำแนะนำ
- สรุปนี้สร้างโดยระบบพื้นฐาน
- ตรวจสอบการตั้งค่า **GEMINI_API_KEY** ในไฟล์ .env สำหรับสรุปละเอียด
- API Key ฟรีได้ที่: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

*localhost:3000/chat*`;
        
    } catch (error) {
        console.error('Fallback summary error:', error);
        return `**ไม่สามารถสรุปการสนทนาได้ในขณะนี้**\n\nข้อผิดพลาด: ${error.message}`;
    }
}
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Database: ${process.env.DB_NAME || 'ChatSMHKorat'}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`🗣️  Language: Thai (UTF-8)`);
});