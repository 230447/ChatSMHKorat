// fix_existing_users.js - สำหรับผู้ใช้ที่สมัครไว้แล้วแต่ยังไม่ได้อยู่ในห้องแผนก
const mysql = require('mysql2');
require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🛠️ Fixing existing users department rooms...');

connection.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    
    console.log('✅ Connected to database');
    
    try {
        // 1. ตรวจสอบว่ามีตาราง department หรือไม่
        const [deptCheck] = await connection.promise().execute("SHOW TABLES LIKE 'department'");
        if (deptCheck.length === 0) {
            console.log('❌ Table "department" does not exist');
            connection.end();
            return;
        }
        
        // 2. ตรวจสอบว่ามีตาราง chat_rooms หรือไม่
        const [roomCheck] = await connection.promise().execute("SHOW TABLES LIKE 'chat_rooms'");
        if (roomCheck.length === 0) {
            console.log('❌ Table "chat_rooms" does not exist');
            connection.end();
            return;
        }
        
        // 3. สร้างห้องแผนกถ้ายังไม่มี
        console.log('🔍 Checking department rooms...');
        const [departments] = await connection.promise().execute(
            'SELECT department_id, department_name FROM department'
        );
        
        console.log(`Found ${departments.length} departments`);
        
        for (const dept of departments) {
            const [existingRoom] = await connection.promise().execute(
                'SELECT room_id FROM chat_rooms WHERE department_id = ? AND room_type = "department"',
                [dept.department_id]
            );
            
            if (existingRoom.length === 0) {
                await connection.promise().execute(
                    'INSERT INTO chat_rooms (room_name, room_type, department_id) VALUES (?, "department", ?)',
                    [`ห้องแชท - ${dept.department_name}`, dept.department_id]
                );
                console.log(`✅ Created room for: ${dept.department_name}`);
            }
        }
        
        // 4. เพิ่มผู้ใช้ทุกคนเข้าไปในห้องแผนกของตนเอง
        console.log('🔍 Adding users to their department rooms...');
        const [users] = await connection.promise().execute(`
            SELECT u.user_id, u.username, u.department_id, d.department_name 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
        `);
        
        console.log(`Found ${users.length} users`);
        
        let addedCount = 0;
        let alreadyCount = 0;
        
        for (const user of users) {
            if (!user.department_id) {
                console.log(`⚠️ User ${user.username} has no department`);
                continue;
            }
            
            // หาห้องแผนก
            const [deptRoom] = await connection.promise().execute(
                'SELECT room_id FROM chat_rooms WHERE department_id = ? AND room_type = "department"',
                [user.department_id]
            );
            
            if (deptRoom.length === 0) {
                console.log(`❌ No department room for ${user.department_name}`);
                continue;
            }
            
            // ตรวจสอบว่าอยู่ในห้องแล้วหรือยัง
            const [existingMember] = await connection.promise().execute(
                'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
                [deptRoom[0].room_id, user.user_id]
            );
            
            if (existingMember.length === 0) {
                await connection.promise().execute(
                    'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
                    [deptRoom[0].room_id, user.user_id]
                );
                addedCount++;
                console.log(`✅ Added ${user.username} to ${user.department_name}`);
            } else {
                alreadyCount++;
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`✅ Added ${addedCount} users to department rooms`);
        console.log(`✅ ${alreadyCount} users already in their department rooms`);
        console.log(`✅ Total users processed: ${users.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.end();
        console.log('\n🎉 Fix completed!');
    }
});