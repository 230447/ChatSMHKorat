// =====================================================================
// Chat Summary AI Module (ฉบับปรับปรุง)
// เปลี่ยนจากสรุปด้วย keyword matching เป็นส่งให้ Gemini ผ่าน /api/chat-summary
// =====================================================================
// =====================================================================
// Chat Summary AI Module (ฉบับปรับปรุง)
// เปลี่ยนจากสรุปด้วย keyword matching เป็นส่งให้ Gemini ผ่าน /api/chat-summary
// =====================================================================
class ChatSummaryAI {
    constructor() {
        this.isSummarizing = false;
        console.log('🤖 Chat Summary AI initialized (Server-side Gemini mode)');
    }

    /**
     * ฟังก์ชันหลัก: ส่งข้อมูลไปให้ Gemini สรุปผ่าน backend API
     */
    async summarizeConversation(messages, roomInfo) {
        if (this.isSummarizing) {
            return { success: false, error: 'กำลังสรุปอยู่ กรุณารอสักครู่' };
        }

        // ตรวจสอบขั้นต้น
        if (!messages || !Array.isArray(messages) || messages.length < 3) {
            return { success: false, error: 'ข้อความไม่เพียงพอสำหรับการสรุป (ต้องการอย่างน้อย 3 ข้อความ)' };
        }

        const validMessages = messages.filter(m =>
            m.message_text && m.message_text.trim().length > 0 && m.message_type === 'text'
        );

        if (validMessages.length < 3) {
            return { success: false, error: 'ข้อความที่เป็นข้อความ (text) ไม่เพียงพอ' };
        }

        this.isSummarizing = true;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) throw new Error('ไม่พบ Token กรุณาเข้าสู่ระบบใหม่');

            const roomId = roomInfo?.room_id;
            if (!roomId) throw new Error('ไม่พบ room_id');

            console.log(`📤 ส่ง ${validMessages.length} ข้อความไปสรุปที่ server...`);

            const response = await fetch('/api/chat-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    room_id: roomId,
                    message_count: Math.min(validMessages.length, 200)
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'สรุปไม่สำเร็จ');
            }

            console.log('✅ ได้รับผลสรุปจาก Gemini แล้ว');

            // ✅ ปรับโครงสร้างให้ตรงกับที่ chat.js ใช้
            return {
                success: true,
                summary: data.summary, // raw text จาก Gemini
                summary_id: data.summary_id,
                report_url: data.report_url,
                stats: data.stats || {
                    message_count: validMessages.length,
                    timeframe: this.calculateTimeRange(messages)
                }
            };

        } catch (error) {
            console.error('❌ summarizeConversation error:', error.message);
            return { success: false, error: error.message };
        } finally {
            this.isSummarizing = false;
        }
    }

    // =====================================================================
    // Helper functions (ไว้ใช้ในกรณี fallback)
    // =====================================================================
    
    validateMessages(messages) {
        if (!messages || !Array.isArray(messages) || messages.length < 3) return false;
        const valid = messages.filter(m => m.message_text?.trim() && m.message_type === 'text');
        return valid.length >= 3;
    }

    extractParticipants(messages) {
        const map = new Map();
        messages.forEach(msg => {
            const name = msg.full_name || msg.sender || 'ไม่ทราบชื่อ';
            if (!map.has(name)) map.set(name, { name, message_count: 0 });
            map.get(name).message_count++;
        });
        return Array.from(map.values()).sort((a, b) => b.message_count - a.message_count);
    }

    calculateTimeRange(messages) {
        if (messages.length < 2) return 'ไม่ระบุ';
        const times = messages.map(m => new Date(m.created_at)).filter(d => !isNaN(d));
        if (times.length < 2) return 'ไม่ระบุ';
        const diff = (Math.max(...times) - Math.min(...times)) / 60000; // นาที
        if (diff < 60) return `${Math.round(diff)} นาที`;
        if (diff < 1440) return `${Math.round(diff / 60)} ชั่วโมง`;
        return `${Math.round(diff / 1440)} วัน`;
    }

    generateCacheKey(messages, roomInfo) {
        return `${roomInfo?.room_id}-${messages.length}`;
    }

    // ✅ ฟังก์ชันสำหรับ fallback เมื่อ API ล้มเหลว
    createFallbackSummary(messages, roomName) {
        const uniqueUsers = [...new Set(messages.map(m => m.full_name))];
        const timeRange = this.calculateTimeRange(messages);
        
        const now = new Date();
        const thaiDate = now.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        return `📋 สรุปการสนทนา (ระบบสำรอง) - ${roomName}

**1. ข้อมูลทั่วไป**
- ห้องสนทนา: ${roomName}
- วันที่สรุป: ${thaiDate}
- ระยะเวลาสนทนา: ${timeRange}
- จำนวนข้อความ: ${messages.length} ข้อความ
- ผู้เข้าร่วม: ${uniqueUsers.length} คน

**2. สรุปภาพรวม**
ไม่สามารถเชื่อมต่อกับระบบ AI ได้ในขณะนี้

**3. ข้อสรุป**
⚠️ *หมายเหตุ: นี่คือสรุปโดยระบบสำรอง กรุณาลองใหม่อีกครั้งภายหลัง*`;
    }
}

window.ChatSummaryAI = ChatSummaryAI;