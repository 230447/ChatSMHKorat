// setup_database.js - สำหรับสร้าง database และตาราง
const mysql = require('mysql2');

// Connection สำหรับ XAMPP (ไม่มีรหัสผ่าน)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // ว่างเปล่า
    charset: 'utf8mb4'
});

console.log('🚀 Setting up database for XAMPP...');

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Connected to MySQL');
    
    // 1. สร้าง database
    connection.query('CREATE DATABASE IF NOT EXISTS ChatSMHKorat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', (err) => {
        if (err) {
            console.error('❌ Create database failed:', err.message);
            connection.end();
            return;
        }
        
        console.log('✅ Database created/verified');
        
        // 2. ใช้ database
        connection.changeUser({ database: 'ChatSMHKorat' }, (err) => {
            if (err) {
                console.error('❌ Use database failed:', err.message);
                connection.end();
                return;
            }
            
            console.log('✅ Using database ChatSMHKorat');
            
            // 3. สร้างตาราง department
            const createDepartmentTable = `
                CREATE TABLE IF NOT EXISTS department (
                    department_id INT AUTO_INCREMENT PRIMARY KEY,
                    department_name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;
            
            connection.query(createDepartmentTable, (err) => {
                if (err) {
                    console.error('❌ Create department table failed:', err.message);
                    connection.end();
                    return;
                }
                
                console.log('✅ Department table created');
                
                // 4. เพิ่มข้อมูลแผนก
                const departments = [
                    ['แผนกเกษตรกรรม'],
                    ['แผนกประชาสัมพันธ์ตลาด'],
                    ['แผนกสิทธิประโยชน์'],
                    ['แผนกเวชระเบียน'],
                    ['แผนกลูกค้าสัมพันธ์และลงทะเบียน'],
                    ['แผนกเทคโนโลยีสารสนเทศ'],
                    ['แผนกอภิบาล'],
                    ['ศูนย์วางแผนและพัฒนา'],
                    ['แผนกโทรศัพท์'],
                    ['แผนกรักษาความปลอดภัย'],
                    ['แผนกการเงิน'],
                    ['แผนกบัญชี-งานวิเคราะห์'],
                    ['แผนกจัดซื้อ'],
                    ['แผนกคลัง'],
                    ['ศูนย์คุณภาพ'],
                    ['คลินิกทันตกรรม'],
                    ['แผนกอุบัติเหตุฉุกเฉินและศูนย์รถพยาบาล'],
                    ['แผนกผ่าตัด'],
                    ['แผนกบริการเปล'],
                    ['แผนกผู้ป่วยในชั้น 4 มารีย์'],
                    ['แผนกผู้ป่วยในชั้น 4 วังกาแวร์'],
                    ['แผนกผู้ป่วยในชั้น 5 มารีย์'],
                    ['แผนกผู้ป่วยในชั้น 5 วังกาแวร์'],
                    ['แผนกผู้ป่วยในชั้น 6 มารีย์'],
                    ['แผนกผู้ป่วยในชั้น 6 วังกาแวร์'],
                    ['แผนกผู้ป่วยในชั้น 7 วังกาแวร์'],
                    ['แผนกผู้ป่วยในชั้น 8 วังกาแวร์'],
                    ['แผนกผู้ป่วยวิกฤต'],
                    ['แผนกเภสัชกรรม'],
                    ['แผนกรังสีวิทยา'],
                    ['ผู้จัดการและรองผู้จัดการ'],
                    ['งานนิติกร'],
                    ['งานที่ดิน'],
                    ['ฝ่ายการแพทย์'],
                    ['นักปฏิบัติการการแพทย์ฉุกเฉิน'],
                    ['เลขานุการฝ่ายการแพทย์'],
                    ['ผู้ช่วยแพทย์แผนจีน'],
                    ['ศูนย์ตรวจสุขภาพ'],
                    ['ตรวจการ'],
                    ['ฝ่ายการพยาบาล'],
                    ['คลินิกอายุรกรรม'],
                    ['คลินิกศัลยกรรม/กระดูกและข้อ'],
                    ['คลินิกสูตินรเวช-กุมารเวช'],
                    ['คลินิกเฉพาะทาง(จักษุ หู จมูก คอ)'],
                    ['แผนกห้องปฏิบัติการ'],
                    ['แผนกกายภาพบำบัด'],
                    ['แผนกจ่ายกลาง'],
                    ['แผนกวิศวกรรมการแพทย์'],
                    ['แผนกเคหะบริการ'],
                    ['บริการส่วนหน้า'],
                    ['แผนกทรัพยากรบุคคล งานธุรการ และกองเลขานุการ'],
                    ['แผนกซ่อมบำรุงและก่อสร้าง'],
                    ['แผนกยานพาหนะ']
                ];
                
                // ลบข้อมูลเก่า (ถ้ามี)
                connection.query('DELETE FROM department', (err) => {
                    if (err) {
                        console.error('❌ Clear department table failed:', err.message);
                        connection.end();
                        return;
                    }
                    
                    console.log('✅ Cleared department table');
                    
                    // เพิ่มข้อมูลใหม่
                    const insertQuery = 'INSERT INTO department (department_name) VALUES ?';
                    connection.query(insertQuery, [departments], (err, result) => {
                        if (err) {
                            console.error('❌ Insert departments failed:', err.message);
                            connection.end();
                            return;
                        }
                        
                        console.log(`✅ Added ${result.affectedRows} departments`);
                        
                        // 5. ตรวจสอบข้อมูล
                        connection.query('SELECT COUNT(*) as count FROM department', (err, results) => {
                            if (err) {
                                console.error('❌ Count departments failed:', err.message);
                            } else {
                                console.log(`📊 Total departments in database: ${results[0].count}`);
                            }
                            
                            connection.end();
                            console.log('🎉 Database setup completed!');
                            console.log('👉 Now run: npm start');
                        });
                    });
                });
            });
        });
    });
});