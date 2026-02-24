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

            // ส่งผลกลับในรูปแบบที่ chat app ใช้งาน
            return {
                success: true,
                summary: {
                    // raw text จาก Gemini (มี markdown **หัวข้อ** และ - bullet)
                    raw: data.summary,

                    // ข้อมูลสำหรับแสดงใน UI
                    overview:    this._extractSection(data.summary, '1.', '2.'),
                    key_points:  this._extractBullets(data.summary, '2.', '3.'),
                    appointments: this._extractBullets(data.summary, '3.', '4.'),
                    action_items: this._extractBullets(data.summary, '4.', '5.'),
                    pending:     this._extractBullets(data.summary, '5.', '6.'),
                    medical:     this._extractBullets(data.summary, '6.', '7.'),
                    stats:       this._extractSection(data.summary, '7.', null),

                    // ใช้สำหรับแสดงใน summary modal (เดิม)
                    summary_text: data.summary,
                    actions:      []
                },
                metadata: {
                    generated_at:    new Date().toISOString(),
                    message_count:   data.stats?.message_count || validMessages.length,
                    summary_id:      data.summary_id,
                    report_url:      data.report_url,
                    timeframe:       data.stats?.timeframe || ''
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
    // Helper: ดึง section จาก markdown text
    // =====================================================================
    _extractSection(text, startMarker, endMarker) {
        if (!text) return '';
        const lines = text.split('\n');
        let capturing = false;
        const result = [];

        for (const line of lines) {
            const isStart = startMarker && line.includes(startMarker);
            const isEnd   = endMarker   && line.includes(endMarker);

            if (isStart) { capturing = true; continue; }
            if (isEnd && capturing) break;
            if (capturing) result.push(line);
        }

        return result
            .join('\n')
            .replace(/\*\*(.*?)\*\*/g, '$1')  // ลบ bold markdown
            .trim();
    }

    // =====================================================================
    // Helper: ดึง bullet list จาก section
    // =====================================================================
    _extractBullets(text, startMarker, endMarker) {
        const section = this._extractSection(text, startMarker, endMarker);
        if (!section) return [];

        return section
            .split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim())
            .filter(line => line.length > 0);
    }

    // =====================================================================
    // ฟังก์ชันเหล่านี้คงไว้เพื่อ backward compatibility
    // (บางส่วนของ chat app อาจยังเรียกใช้)
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
}

window.ChatSummaryAI = ChatSummaryAI;