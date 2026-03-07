// =====================================================================
// Chat Summary AI Module - Client Side
// ทำงานร่วมกับ server API /api/chat-summary
// =====================================================================
class ChatSummaryAI {
    constructor() {
        this.isSummarizing = false;
        console.log('🤖 Chat Summary AI initialized');
    }

    /**
     * เรียก API /api/chat-summary เพื่อสรุปข้อความ
     * @param {Object} options - { room_id, message_count, start_date, end_date, custom_instruction }
     */
    async summarize(options) {
        // ป้องกันการเรียกซ้ำ
        if (this.isSummarizing) {
            return { 
                success: false, 
                error: 'กำลังสรุปอยู่ กรุณารอสักครู่',
                isProcessing: true 
            };
        }

        // ตรวจสอบ options
        if (!options || !options.room_id) {
            return { 
                success: false, 
                error: 'กรุณาระบุ room_id' 
            };
        }

        this.isSummarizing = true;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('ไม่พบ Token กรุณาเข้าสู่ระบบใหม่');
            }

            console.log('📤 Calling /api/chat-summary with:', options);

            const response = await fetch('/api/chat-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    room_id: options.room_id,
                    message_count: options.message_count || 100,
                    start_date: options.start_date || null,
                    end_date: options.end_date || null,
                    custom_instruction: options.custom_instruction || null
                })
            });

            const data = await response.json();

            // กรณี Rate Limit (429)
            if (response.status === 429) {
                return {
                    success: false,
                    error: data.error || 'สรุปข้อความได้ 10 ครั้งต่อชั่วโมง กรุณารอ 1 ชั่วโมงแล้วลองใหม่',
                    rateLimited: true
                };
            }

            // กรณี error อื่นๆ
            if (!response.ok) {
                throw new Error(data.error || `เกิดข้อผิดพลาด (${response.status})`);
            }

            if (!data.success) {
                throw new Error(data.error || 'สรุปไม่สำเร็จ');
            }

            console.log('✅ Summary received from server');

            // ส่งข้อมูลตรงจาก API กลับไป
            return {
                success: true,
                summary: data.summary,
                summary_id: data.summary_id,
                report_url: data.report_url,
                used_fallback: data.used_fallback || false,
                from_cache: data.from_cache || false,
                stats: data.stats || null
            };

        } catch (error) {
            console.error('❌ Summary error:', error.message);
            
            return {
                success: false,
                error: error.message,
                used_fallback: false
            };
        } finally {
            this.isSummarizing = false;
        }
    }

    /**
     * ตรวจสอบสถานะการสรุป
     */
    isActive() {
        return this.isSummarizing;
    }

    /**
     * ยกเลิกการสรุป (ถ้ามี)
     */
    cancel() {
        this.isSummarizing = false;
        console.log('🛑 Summary cancelled');
    }
}

// Export
window.ChatSummaryAI = ChatSummaryAI;