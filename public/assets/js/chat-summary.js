// Chat Summary AI Module
class ChatSummaryAI {
    constructor() {
        this.isSummarizing = false;
        this.summaryCache = new Map();
        console.log('🤖 Chat Summary AI initialized');
    }

    /**
     * ฟังก์ชันหลักสำหรับสรุปการสนทนา
     * @param {Array} messages - ข้อความทั้งหมดในห้อง
     * @param {Object} roomInfo - ข้อมูลห้อง
     * @returns {Promise<Object>} - ผลลัพธ์การสรุป
     */
    async summarizeConversation(messages, roomInfo) {
        try {
            console.log('📊 Starting chat summary...');
            
            // 1. ตรวจสอบข้อมูลเบื้องต้น
            if (!this.validateMessages(messages)) {
                return {
                    success: false,
                    error: 'ข้อมูลไม่เพียงพอสำหรับการสรุป'
                };
            }

            // 2. ตรวจสอบ cache
            const cacheKey = this.generateCacheKey(messages, roomInfo);
            if (this.summaryCache.has(cacheKey)) {
                console.log('📦 Using cached summary');
                return this.summaryCache.get(cacheKey);
            }

            // 3. เริ่มกระบวนการสรุป
            this.isSummarizing = true;
            
            // 4. กรองและเตรียมข้อมูล
            const processedData = this.prepareData(messages, roomInfo);
            
            // 5. สรุปการสนทนา
            const summary = await this.generateSummary(processedData);
            
            // 6. บันทึกใน cache
            this.summaryCache.set(cacheKey, summary);
            
            this.isSummarizing = false;
            return summary;

        } catch (error) {
            console.error('❌ Summary error:', error);
            this.isSummarizing = false;
            return {
                success: false,
                error: 'เกิดข้อผิดพลาดในการสรุป',
                details: error.message
            };
        }
    }

    /**
     * ขั้นตอนที่ 1: ตรวจสอบความถูกต้องของข้อมูล
     */
    validateMessages(messages) {
        if (!messages || !Array.isArray(messages)) {
            console.log('❌ No messages array');
            return false;
        }

        if (messages.length < 3) {
            console.log(`❌ Not enough messages: ${messages.length}`);
            return false;
        }

        // ตรวจสอบว่ามีข้อความจริงๆ
        const validMessages = messages.filter(msg => 
            msg.message_text && 
            msg.message_text.trim().length > 0 &&
            msg.message_type === 'text'
        );

        if (validMessages.length < 3) {
            console.log(`❌ Not enough valid text messages: ${validMessages.length}`);
            return false;
        }

        console.log(`✅ Validated: ${validMessages.length} messages`);
        return true;
    }

    /**
     * ขั้นตอนที่ 2: เตรียมข้อมูลสำหรับการสรุป
     */
    prepareData(messages, roomInfo) {
        console.log('📝 Preparing data...');
        
        // เรียงข้อความตามเวลา
        const sortedMessages = [...messages].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        );

        // แปลงวันที่
        const formattedMessages = sortedMessages.map(msg => ({
            id: msg.message_id,
            text: msg.message_text || '',
            sender: msg.full_name || 'ไม่ทราบชื่อ',
            time: new Date(msg.created_at),
            isCurrentUser: msg.sender_id === window.chatApp?.currentUser?.user_id
        }));

        // ดึงข้อมูลพื้นฐาน
        const participants = this.extractParticipants(formattedMessages);
        const timeRange = this.calculateTimeRange(formattedMessages);

        return {
            messages: formattedMessages,
            room: {
                name: roomInfo?.room_name || 'ไม่ทราบชื่อห้อง',
                type: roomInfo?.room_type || 'ทั่วไป'
            },
            participants: participants,
            timeRange: timeRange,
            totalMessages: formattedMessages.length
        };
    }

    /**
     * ขั้นตอนที่ 3: สรุปการสนทนาจริง
     */
    async generateSummary(data) {
        console.log('🧠 Generating summary...');
        
        try {
            // 1. สรุปภาพรวม
            const overview = this.generateOverview(data);
            
            // 2. หาประเด็นสำคัญ
            const keyPoints = this.extractKeyPoints(data.messages);
            
            // 3. หาการดำเนินการ/ข้อสรุป
            const actions = this.extractActions(data.messages);
            
            // 4. สรุปย่อ
            const summaryText = this.generateSummaryText(data.messages, keyPoints);
            
            // 5. คำนวณสถิติ
            const statistics = this.calculateStatistics(data);

            const result = {
                success: true,
                summary: {
                    overview: overview,
                    key_points: keyPoints,
                    actions: actions,
                    summary_text: summaryText,
                    statistics: statistics
                },
                metadata: {
                    generated_at: new Date().toISOString(),
                    message_count: data.totalMessages,
                    participant_count: data.participants.length,
                    time_range: data.timeRange
                }
            };

            console.log('✅ Summary generated successfully');
            return result;

        } catch (error) {
            console.error('Generate summary error:', error);
            throw error;
        }
    }

    /**
     * 3.1 สรุปภาพรวม
     */
    generateOverview(data) {
        const { room, participants, timeRange, totalMessages } = data;
        
        let overview = `การสนทนาใน${room.type === 'department' ? 'ห้องแผนก' : room.type === 'group' ? 'กลุ่มสนทนา' : 'ห้องสนทนา'} "${room.name}" `;
        overview += `ระหว่างผู้เข้าร่วม ${participants.length} คน `;
        overview += `ในช่วงเวลา ${timeRange} `;
        overview += `ด้วยข้อความทั้งหมด ${totalMessages} ข้อความ`;
        
        return overview;
    }

    /**
     * 3.2 ดึงประเด็นสำคัญ
     */
    extractKeyPoints(messages) {
        console.log('🔍 Extracting key points...');
        
        const keyPoints = new Set();
        
        // คำสำคัญที่บ่งบอกถึงประเด็นสำคัญ
        const importantKeywords = [
            // การทำงาน
            'ประชุม', 'โครงการ', 'งาน', 'task', 'assignment',
            'นัดหมาย', 'appointment', 'schedule',
            
            // ปัญหาและแนวทางแก้ไข
            'ปัญหา', 'problem', 'issue', 'error', 'bug',
            'แก้ไข', 'fix', 'แก้', 'resolve',
            'อุปสรรค', 'obstacle', 'difficulty',
            
            // การตัดสินใจ
            'ตัดสินใจ', 'decide', 'decision',
            'อนุมัติ', 'approve', 'approval',
            'เห็นชอบ', 'agree', 'agreement',
            
            // ความสำคัญ
            'สำคัญ', 'important', 'urgent', 'critical',
            'ด่วน', 'urgent', 'emergency',
            'priority', 'prioritize',
            
            // การรายงาน
            'รายงาน', 'report',
            'สรุป', 'summary', 'conclusion',
            'ผล', 'result', 'outcome',
            
            // การประสานงาน
            'ติดต่อ', 'contact',
            'ประสานงาน', 'coordinate', 'coordination',
            'แจ้ง', 'inform', 'notify'
        ];
        
        // กรองข้อความที่ยาวพอและมีเนื้อหา
        const meaningfulMessages = messages.filter(msg => 
            msg.text.length > 20 && 
            !this.isGreetingOrCasual(msg.text)
        );
        
        if (meaningfulMessages.length === 0) {
            return ['การสนทนาเน้นไปที่การทักทายและการพูดคุยทั่วไป'];
        }
        
        // ตรวจสอบแต่ละข้อความ
        meaningfulMessages.forEach(message => {
            const text = message.text.toLowerCase();
            
            // ตรวจสอบคำสำคัญ
            importantKeywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    // หาประโยคที่มีคำสำคัญ
                    const sentences = this.splitIntoSentences(message.text);
                    sentences.forEach(sentence => {
                        if (sentence.toLowerCase().includes(keyword.toLowerCase()) && 
                            sentence.length > 15 && 
                            sentence.length < 150) {
                            
                            // ทำความสะอาดประโยค
                            const cleanSentence = this.cleanSentence(sentence);
                            keyPoints.add(cleanSentence);
                        }
                    });
                }
            });
            
            // ตรวจสอบคำถามสำคัญ
            if (this.isImportantQuestion(message.text)) {
                keyPoints.add(`มีคำถามเกี่ยวกับ: ${this.extractQuestionTopic(message.text)}`);
            }
            
            // ตรวจสอบข้อสรุป
            if (this.isConclusion(message.text)) {
                keyPoints.add(`สรุปได้ว่า: ${this.extractConclusion(message.text)}`);
            }
        });
        
        // ถ้าไม่พบประเด็นสำคัญ ให้ใช้ข้อความที่สำคัญที่สุด
        if (keyPoints.size === 0 && meaningfulMessages.length > 0) {
            const mostImportant = this.findMostImportantMessage(meaningfulMessages);
            if (mostImportant) {
                keyPoints.add(this.summarizeMessage(mostImportant.text));
            }
        }
        
        // จำกัดจำนวนประเด็น
        const pointsArray = Array.from(keyPoints).slice(0, 5);
        
        console.log(`📌 Found ${pointsArray.length} key points`);
        return pointsArray;
    }

    /**
     * 3.3 ดึงการดำเนินการ
     */
    extractActions(messages) {
        const actions = new Set();
        
        // คำกริยาที่บ่งบอกถึงการดำเนินการ
        const actionVerbs = [
            'จะ', 'ต้อง', 'ควร', 'ให้', 'โปรด',
            'กรุณา', 'รบกวน', 'ช่วย',
            'ส่ง', 'จัด', 'เตรียม', 'ทำ', 'ดำเนินการ',
            'ตรวจ', 'ตรวจสอบ', 'review', 'ตรวจทาน',
            'อนุมัติ', 'ยืนยัน', 'confirm',
            'รายงาน', 'แจ้ง', 'inform', 'report',
            'แก้ไข', 'ปรับปรุง', 'improve',
            'ติดตาม', 'follow up', 'monitor'
        ];
        
        messages.forEach(message => {
            const text = message.text.toLowerCase();
            
            actionVerbs.forEach(verb => {
                if (text.includes(verb)) {
                    // หาประโยคที่มีคำกริยา
                    const sentences = this.splitIntoSentences(message.text);
                    sentences.forEach(sentence => {
                        if (sentence.toLowerCase().includes(verb) && 
                            this.isActionSentence(sentence)) {
                            
                            const cleanAction = this.formatAction(sentence);
                            actions.add(cleanAction);
                        }
                    });
                }
            });
        });
        
        return Array.from(actions).slice(0, 3);
    }

    /**
     * 3.4 สรุปย่อ
     */
    generateSummaryText(messages, keyPoints) {
        if (messages.length < 5) {
            return 'การสนทนายังไม่ยาวนานพอที่จะสรุปประเด็นสำคัญได้';
        }
        
        if (keyPoints.length > 0) {
            if (keyPoints.length === 1) {
                return `การสนทนาครอบคลุมประเด็นสำคัญเกี่ยวกับ ${keyPoints[0].toLowerCase()}`;
            } else {
                const firstPoints = keyPoints.slice(0, 2);
                return `การสนทนาครอบคลุมหลายประเด็น โดยเน้นที่ ${firstPoints.join(' และ ').toLowerCase()}`;
            }
        }
        
        return 'การสนทนาเป็นการแลกเปลี่ยนความคิดเห็นทั่วไประหว่างผู้เข้าร่วม';
    }

    /**
     * 3.5 คำนวณสถิติ
     */
    calculateStatistics(data) {
        const { messages, participants, timeRange } = data;
        
        // ความถี่ของข้อความ
        const messageFrequency = this.calculateMessageFrequency(messages);
        
        // กิจกรรมในช่วงเวลา
        const peakHours = this.findPeakHours(messages);
        
        return {
            total_messages: messages.length,
            total_participants: participants.length,
            time_period: timeRange,
            message_frequency: messageFrequency,
            active_participants: participants.filter(p => p.message_count > 1).length,
            average_message_length: this.calculateAverageMessageLength(messages),
            peak_activity: peakHours
        };
    }

    /**
     * ฟังก์ชันช่วยเหลือ
     */
    
    // แยกผู้เข้าร่วม
    extractParticipants(messages) {
        const participantMap = new Map();
        
        messages.forEach(msg => {
            if (!participantMap.has(msg.sender)) {
                participantMap.set(msg.sender, {
                    name: msg.sender,
                    message_count: 0,
                    is_current_user: msg.isCurrentUser
                });
            }
            const participant = participantMap.get(msg.sender);
            participant.message_count++;
        });
        
        return Array.from(participantMap.values())
            .sort((a, b) => b.message_count - a.message_count);
    }

    // คำนวณช่วงเวลา
    calculateTimeRange(messages) {
        if (messages.length < 2) return 'ไม่ระบุ';
        
        const first = messages[0].time;
        const last = messages[messages.length - 1].time;
        
        const diffMs = last - first;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours < 1) {
            const minutes = Math.round(diffHours * 60);
            return `${minutes} นาที`;
        } else if (diffHours < 24) {
            return `${Math.round(diffHours)} ชั่วโมง`;
        } else {
            return `${Math.round(diffHours / 24)} วัน`;
        }
    }

    // แยกประโยค
    splitIntoSentences(text) {
        return text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    // ทำความสะอาดประโยค
    cleanSentence(sentence) {
        return sentence
            .replace(/^\s*[-•*]\s*/, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 120);
    }

    // ตรวจสอบว่าคือการทักทายหรือไม่
    isGreetingOrCasual(text) {
        const casualWords = [
            'สวัสดี', 'hello', 'hi', 'hey',
            'บาย', 'bye', 'goodbye',
            'ขอบคุณ', 'thank', 'thanks',
            'ครับ', 'ค่ะ', 'จ้า', 'นะคะ', 'นะครับ',
            'ฮ่า', '555', 'haha', 'lol'
        ];
        
        return casualWords.some(word => 
            text.toLowerCase().includes(word.toLowerCase())
        ) || text.length < 15;
    }

    // ตรวจสอบว่าคือคำถามสำคัญหรือไม่
    isImportantQuestion(text) {
        const questionWords = ['ใคร', 'อะไร', 'เมื่อไร', 'ที่ไหน', 'ทำไม', 'อย่างไร'];
        return questionWords.some(word => text.startsWith(word));
    }

    // ดึงหัวข้อคำถาม
    extractQuestionTopic(text) {
        const sentences = this.splitIntoSentences(text);
        const question = sentences.find(s => this.isImportantQuestion(s));
        return question ? this.cleanSentence(question) : 'ไม่ทราบหัวข้อ';
    }

    // ตรวจสอบว่าคือข้อสรุปหรือไม่
    isConclusion(text) {
        const conclusionWords = ['สรุป', 'ดังนั้น', 'จึง', 'เพราะฉะนั้น', 'โดยสรุป'];
        return conclusionWords.some(word => text.includes(word));
    }

    // ดึงข้อสรุป
    extractConclusion(text) {
        const sentences = this.splitIntoSentences(text);
        const conclusion = sentences.find(s => this.isConclusion(s));
        return conclusion ? this.cleanSentence(conclusion) : 'ไม่พบข้อสรุปที่ชัดเจน';
    }

    // หาข้อความที่สำคัญที่สุด
    findMostImportantMessage(messages) {
        // ให้คะแนนความสำคัญ
        const scoredMessages = messages.map(msg => {
            let score = 0;
            
            // ยาว = สำคัญ
            score += Math.min(msg.text.length / 50, 5);
            
            // มีคำถาม = สำคัญ
            if (this.isImportantQuestion(msg.text)) score += 3;
            
            // มีตัวเลขหรือวันที่ = สำคัญ
            if (/\d+/.test(msg.text)) score += 2;
            
            return { message: msg, score };
        });
        
        scoredMessages.sort((a, b) => b.score - a.score);
        return scoredMessages[0]?.message || null;
    }

    // สรุปข้อความ
    summarizeMessage(text) {
        const sentences = this.splitIntoSentences(text);
        if (sentences.length === 0) return 'ไม่มีเนื้อหาที่สรุปได้';
        
        // ใช้ประโยคแรก
        const firstSentence = sentences[0];
        return firstSentence.length > 100 
            ? firstSentence.substring(0, 100) + '...'
            : firstSentence;
    }

    // ตรวจสอบว่าคือประโยคการดำเนินการ
    isActionSentence(sentence) {
        const text = sentence.toLowerCase();
        const actionIndicators = ['จะ', 'ต้อง', 'ให้', 'โปรด', 'กรุณา'];
        return actionIndicators.some(indicator => 
            text.startsWith(indicator) || text.includes(` ${indicator} `)
        );
    }

    // จัดรูปแบบการดำเนินการ
    formatAction(sentence) {
        return this.cleanSentence(sentence)
            .replace(/^จะ/, 'ต้อง')
            .replace(/^ต้อง/, 'ดำเนินการ');
    }

    // คำนวณความถี่ของข้อความ
    calculateMessageFrequency(messages) {
        if (messages.length < 2) return 'ปกติ';
        
        const first = messages[0].time;
        const last = messages[messages.length - 1].time;
        const totalHours = (last - first) / (1000 * 60 * 60);
        
        if (totalHours === 0) return 'สูงมาก';
        const messagesPerHour = messages.length / totalHours;
        
        if (messagesPerHour > 20) return 'สูงมาก';
        if (messagesPerHour > 10) return 'สูง';
        if (messagesPerHour > 5) return 'ปานกลาง';
        return 'ต่ำ';
    }

    // หาชั่วโมงที่มีกิจกรรมสูงสุด
    findPeakHours(messages) {
        if (messages.length < 5) return 'ไม่สามารถวิเคราะห์ได้';
        
        const hourCounts = new Array(24).fill(0);
        
        messages.forEach(msg => {
            const hour = msg.time.getHours();
            hourCounts[hour]++;
        });
        
        const maxCount = Math.max(...hourCounts);
        const peakHour = hourCounts.indexOf(maxCount);
        
        return `${peakHour}:00 - ${peakHour + 1}:00 น.`;
    }

    // คำนวณความยาวเฉลี่ยของข้อความ
    calculateAverageMessageLength(messages) {
        if (messages.length === 0) return 0;
        
        const totalLength = messages.reduce((sum, msg) => 
            sum + (msg.text.length || 0), 0
        );
        
        return Math.round(totalLength / messages.length);
    }

    // สร้าง cache key
    generateCacheKey(messages, roomInfo) {
        const messageIds = messages.map(m => m.message_id).join(',');
        const roomId = roomInfo?.room_id || 'unknown';
        const count = messages.length;
        
        return `${roomId}-${count}-${messageIds.substring(0, 50)}`;
    }
}

// Export สำหรับใช้ในไฟล์อื่น
window.ChatSummaryAI = ChatSummaryAI;