class EnhancedChatApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentRoom = null;
        this.rooms = [];
        this.users = [];
        this.onlineUsers = [];
        this.typingUsers = new Map();
        this.selectedFiles = [];
        this.isTyping = false;
        this.typingTimeout = null;
        this.showingAllUsers = false;
        this.currentTab = 'rooms';
        this.allRooms = []; 
        this.filteredRooms = []; 
        this.setupModalCloseButtons();
        this.optimisticMessages = new Map();
        this.isScrolling = false;
        this.lastScrollTime = 0;
        this.selectedPreviewFiles = [];
         this.isLoggingOut = false;
        // ✅ TTS properties
        this.ttsEnabled = false;
        this.ttsSupported = 'speechSynthesis' in window;
        this.currentSpeech = null;
        this.availableVoices = [];
        this.thaiVoice = null;
        
        // ✅ Room creation properties
        this.allUsers = []; 
        this.selectedMemberIds = new Set(); 
        
         this.emojis = {
        smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱'],
        gestures: ['👋','🤚','🖐️','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'],
        animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔'],
        food: ['🍕','🍔','🍟','🌭','🍿','🧈','🥓','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤','🧋','🧃','🧉','🧊','🥢','🍽️','🍴','🥄','🔪','🏺'],
        travel: ['✈️','🚀','🛸','🚁','🛶','⛵','🚤','🛳️','⛴️','🚢','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏎️','🏍️','🛵','🦽','🦼','🛴','🚲','🛹','🛼','🚏','🛣️','🛤️','🛢️','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🛶','🚤','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸'],
        activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'],
        objects: ['💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🪜','🧰','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🪛','🔗','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🪒','🧼','🪥','🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🧸','🪆','🖼️','🪞','🪟','🛍️','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'],
        symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧']
         };
    
        this.currentEmojiCategory = 'smileys';

        this.initialize();
         window.addEventListener('userUpdated', (e) => {
        console.log('📡 Received userUpdated event:', e.detail);
        this.updateUserData(e.detail);
    });
    }
setupModalCloseButtons() {
    console.log('🔧 Setting up modal close buttons...');

    const modalIds = [
        'createRoomModal',
        'addMembersModal', 
        'roomMembersModal',
        'profileModal',
        'ttsSettingsModal',
        'dateRangeModal',
        'aiSummaryModal',
        'emojiPickerModal'
    ];
    
    modalIds.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.querySelectorAll('.close-modal, .close-emoji-modal, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.remove('active');
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // ปุ่ม cancel ใน create room modal
    const cancelBtn = document.getElementById('cancelCreateRoom');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            const modal = document.getElementById('createRoomModal');
            if (modal) modal.classList.remove('active');
        });
    }
    
    console.log('✅ Modal close buttons setup complete');
}
//  เปิด emoji picker
openEmojiPicker() {
    const modal = document.getElementById('emojiPickerModal');
    if (!modal) {
        console.error('❌ Emoji picker modal not found');
        return;
    }
    
    modal.classList.add('active');
    this.renderEmojis(this.currentEmojiCategory);
}

//  ปิด emoji picker
closeEmojiPicker() {
    const modal = document.getElementById('emojiPickerModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// แสดงอิโมจิตามหมวดหมู่
renderEmojis(category) {
    this.currentEmojiCategory = category;
    const grid = document.getElementById('emojiGrid');
    
    if (!grid || !this.emojis[category]) {
        console.error('❌ Emoji grid or category not found');
        return;
    }
    
    grid.innerHTML = '';
    
    this.emojis[category].forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-item';
        btn.textContent = emoji;
        btn.onclick = () => this.insertEmoji(emoji);
        grid.appendChild(btn);
    });
    
    // อัพเดทปุ่มหมวดหมู่
    document.querySelectorAll('.emoji-category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

insertEmoji(emoji) {
    console.log('📝 Inserting emoji:', emoji);
    
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
        console.error('❌ Message input not found');
        return;
    }
    // Focus input ก่อน
    messageInput.focus();
    
    const cursorPos = messageInput.selectionStart || 0;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(cursorPos);
    
    messageInput.value = textBefore + emoji + textAfter;
    
    // เลื่อน cursor ไปหลังอิโมจิ
    const newPos = cursorPos + emoji.length;
    messageInput.setSelectionRange(newPos, newPos);
    messageInput.focus();
    
    // อัพเดทตัวนับ
    const charCount = document.getElementById('characterCount');
    if (charCount) {
        charCount.textContent = `${messageInput.value.length}/1000`;
    }
    
    // Trigger input event สำหรับ auto-resize
    const event = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(event);
    
    console.log('✅ Emoji inserted successfully');
    
    // ไม่ปิด modal ให้เลือกต่อได้
    // Modal จะปิดเมื่อส่งข้อความแทน
}

//  ค้นหาอิโมจิ
searchEmoji(query) {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!query || query.trim() === '') {
        this.renderEmojis(this.currentEmojiCategory);
        return;
    }
    
    // ค้นหาจากทุกหมวดหมู่
    let found = [];
    Object.values(this.emojis).forEach(categoryEmojis => {
        found = [...found, ...categoryEmojis];
    });
    
    // แสดงผลลัพธ์ (จำกัด 64 ตัวแรก)
    found.slice(0, 64).forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-item';
        btn.textContent = emoji;
        btn.onclick = () => this.insertEmoji(emoji);
        grid.appendChild(btn);
    });
    
    if (found.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 20px; color: #95a5a6;">ไม่พบอิโมจิ</p>';
    }
}

// ตั้งค่า Event Listeners สำหรับ Emoji
setupEmojiPickerEvents() {
    // ปุ่มเปิด emoji picker
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openEmojiPicker();
        });
    }
    
    // ปุ่มปิด modal
    const closeBtn = document.querySelector('.close-emoji-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.closeEmojiPicker();
        });
    }
    
    // คลิกนอก modal ให้ปิด
    const modal = document.getElementById('emojiPickerModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEmojiPicker();
            }
        });
    }
    
    // ปุ่มเปลี่ยนหมวดหมู่
    document.querySelectorAll('.emoji-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            this.renderEmojis(category);
        });
    });
    
    // ช่องค้นหา
    const searchInput = document.getElementById('emojiSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchEmoji(e.target.value);
            }, 300);
        });
    }
}
    //  เพิ่มฟังก์ชันแสดง preview
showFilePreview(files) {
    const previewArea = document.getElementById('filePreviewArea');
    const previewList = document.getElementById('filePreviewList');
    
    if (!previewArea || !previewList) return;
    
    this.selectedPreviewFiles = Array.from(files);
    
    if (this.selectedPreviewFiles.length === 0) {
        previewArea.style.display = 'none';
        return;
    }
    
    previewArea.style.display = 'block';
    previewList.innerHTML = '';
    
    this.selectedPreviewFiles.forEach((file, index) => {
        const isImage = file.type.startsWith('image/');
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        if (isImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewItem.appendChild(img);
        } else {
            previewItem.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                </div>
            `;
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.removeFileFromPreview(index);
        };
        
        previewItem.appendChild(removeBtn);
        previewList.appendChild(previewItem);
    });
}

//  ลบไฟล์ออกจาก preview
removeFileFromPreview(index) {
    this.selectedPreviewFiles.splice(index, 1);
    
    // อัพเดท file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (this.selectedPreviewFiles.length === 0) {
        document.getElementById('filePreviewArea').style.display = 'none';
    } else {
        this.showFilePreview(this.selectedPreviewFiles);
    }
}

//  ล้าง preview ทั้งหมด
clearFilePreview() {
    this.selectedPreviewFiles = [];
    const previewArea = document.getElementById('filePreviewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
    }
    document.getElementById('filePreviewList').innerHTML = '';
    document.getElementById('fileInput').value = '';
}
scrollToBottom(force = false) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    if (!force && this.userIsReadingUp) return;
    
    messagesList.scrollTop = messagesList.scrollHeight;
    
    requestAnimationFrame(() => {
        messagesList.scrollTop = messagesList.scrollHeight;
    });
}
   

// ฟังก์ชันแสดง modal เพิ่มสมาชิก
async showAddMembersModal() {
    if (!this.currentRoom) {
        this.showNotification('แจ้งเตือน', 'กรุณาเลือกห้องสนทนาก่อน', 'info');
        return;
    }
    
    //  ตรวจสอบว่าเป็นห้องแบบกลุ่มหรือไม่
    if (this.currentRoom.room_type !== 'group') {
        this.showNotification('ไม่สามารถเชิญได้', 'สามารถเชิญสมาชิกได้เฉพาะห้องแบบกลุ่มเท่านั้น', 'error');
        return;
    }
    
    const modal = document.getElementById('addMembersModal');
    if (!modal) {
        console.error('❌ Add members modal not found');
        return;
    }
    
    modal.classList.add('active');
    
    //  โหลดรายชื่อผู้ใช้ที่ยังไม่ได้อยู่ในห้อง
    try {
        const token = localStorage.getItem('token');
        
        // โหลดสมาชิกในห้องปัจจุบัน
        const membersResponse = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const membersData = await membersResponse.json();
        const currentMembers = membersData.members || [];
        const currentMemberIds = currentMembers.map(m => m.user_id);
        
        // โหลดผู้ใช้ทั้งหมด
        const usersResponse = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const usersData = await usersResponse.json();
        const allUsers = usersData.users || [];
        
        // กรองเฉพาะคนที่ยังไม่ได้อยู่ในห้อง
        const availableUsers = allUsers.filter(user => 
            !currentMemberIds.includes(user.user_id)
        );
        
        console.log(`📊 พบผู้ใช้ที่สามารถเชิญได้: ${availableUsers.length} คน`);
        
        this.renderAddMembersList(availableUsers);
        
    } catch (error) {
        console.error('Error loading users for add members:', error);
        this.showNotification('โหลดข้อมูลล้มเหลว', 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้', 'error');
    }
}

// ฟังก์ชันแสดงรายชื่อสำหรับเพิ่มสมาชิก
renderAddMembersList(users) {
    const addMemberResults = document.getElementById('addMemberResults');
    const addMemberSearch = document.getElementById('addMemberSearch');
    
    if (!addMemberResults) {
        console.error('❌ Add member results element not found');
        return;
    }
    
    if (!users || users.length === 0) {
        addMemberResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-check"></i>
                <p>ไม่มีผู้ใช้ที่สามารถเชิญได้</p>
                <small>สมาชิกทุกคนอยู่ในห้องนี้แล้ว</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const isOnline = user.is_online === 1 || user.is_online === true || user.is_online === '1';
        const profileImage = user.profile_image || '/assets/images/default-avatar.png';
        
        html += `
            <div class="add-member-item" data-user-id="${user.user_id}">
                <div class="member-avatar">
                    <img src="${profileImage}" 
                         alt="${user.full_name}"
                         onerror="this.src='/assets/images/default-avatar.png'; this.onerror=null;">
                    <div class="member-online-indicator ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="member-details">
                    <div class="member-name">${user.full_name}</div>
                    <div class="member-info">
                        <span class="member-department">${user.department_name || 'ไม่ระบุแผนก'}</span>
                        <span class="member-employee-id">${user.employee_id || ''}</span>
                    </div>
                </div>
                <button class="btn-add-member" data-user-id="${user.user_id}">
                    <i class="fas fa-user-plus"></i> เชิญ
                </button>
            </div>
        `;
    });
    
    addMemberResults.innerHTML = html;
    
    // Event Listener สำหรับปุ่มเชิญ
    addMemberResults.querySelectorAll('.btn-add-member').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const userId = parseInt(btn.dataset.userId);
            await this.addMemberToRoom(userId);
        });
    });
    
    // ฟังก์ชันค้นหา
    if (addMemberSearch) {
        addMemberSearch.value = '';
        
        // ลบ event listener เก่าก่อน
        const newSearch = addMemberSearch.cloneNode(true);
        addMemberSearch.parentNode.replaceChild(newSearch, addMemberSearch);
        
        newSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const items = addMemberResults.querySelectorAll('.add-member-item');
            
            items.forEach(item => {
                const name = item.querySelector('.member-name').textContent.toLowerCase();
                const department = item.querySelector('.member-department').textContent.toLowerCase();
                const employeeId = item.querySelector('.member-employee-id').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || 
                    department.includes(searchTerm) || 
                    employeeId.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}
async addMemberToRoom(userId) {
    if (!this.currentRoom) {
        this.showNotification('ข้อผิดพลาด', 'ไม่พบข้อมูลห้อง', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            this.showNotification('สำเร็จ', 'เชิญสมาชิกเข้าห้องสำเร็จ', 'success');
            
            // ปิด modal
            const modal = document.getElementById('addMembersModal');
            if (modal) modal.classList.remove('active');
            
            // แจ้งเตือนผ่าน Socket (ถ้ามี)
            if (this.socket && this.socket.connected) {
                this.socket.emit('member_added', {
                    room_id: this.currentRoom.room_id,
                    room_name: this.currentRoom.room_name,
                    user_id: userId,
                    added_by: this.currentUser.user_id
                });
            }
            
        } else {
            throw new Error(data.error || 'เชิญสมาชิกล้มเหลว');
        }
        
    } catch (error) {
        console.error('Error adding member:', error);
        this.showNotification('เชิญสมาชิกล้มเหลว', error.message, 'error');
    }
}
// ฟังก์ชันออกจากห้อง
async leaveRoom() {
    if (!this.currentRoom) return;
    
    if (!confirm(`คุณแน่ใจต้องการออกจากกลุ่ม"${this.currentRoom.room_name}"?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/leave`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            this.showNotification('สำเร็จ', 'ออกจากห้องสำเร็จ', 'success');
            
            // อัพเดท UI
            this.currentRoom = null;
            this.clearChatArea();
            
            // โหลดห้องใหม่
            await this.loadChatRooms();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'ออกจากห้องล้มเหลว');
        }
    } catch (error) {
        console.error('Error leaving room:', error);
        this.showNotification('ออกจากห้องล้มเหลว', error.message, 'error');
    }
}
    setupSidebarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            this.switchTab(tabId);
        });
    });
    
    // ตั้งค่า status toggle buttons
    const showOnlineBtn = document.getElementById('showOnlineBtn');
    const showAllUsersBtn = document.getElementById('showAllUsersBtn');
    
    if (showOnlineBtn && showAllUsersBtn) {
        showOnlineBtn.addEventListener('click', () => {
            showOnlineBtn.classList.add('active');
            showAllUsersBtn.classList.remove('active');
            this.loadOnlineUsers();
        });
        
        showAllUsersBtn.addEventListener('click', () => {
            showAllUsersBtn.classList.add('active');
            showOnlineBtn.classList.remove('active');
            this.loadAllUsers();
        });
    }
}
// ฟังก์ชันสลับแท็บ
switchTab(tabId) {
    this.currentTab = tabId;
    
    // อัพเดทปุ่มแท็บ
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // อัพเดทเนื้อหาแท็บ
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `${tabId}Tab`) {
            pane.classList.add('active');
        }
    });
    
    // โหลดข้อมูลตามแท็บ
    if (tabId === 'users') {
        this.loadOnlineUsers();
    }
}
// โหลดผู้ใช้ออนไลน์
async loadOnlineUsers() {
    try {
        const token = localStorage.getItem('token');
        console.log('📡 Fetching online users from API...');
        
        const response = await fetch('/api/users/online', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('👥 Online users data from API:', data);
            
            //  ตรวจสอบโครงสร้างข้อมูล
            let onlineUsers = [];
            
            if (data.users && Array.isArray(data.users)) {
                onlineUsers = data.users;
            } else if (Array.isArray(data)) {
                onlineUsers = data;
            } else {
                console.warn('⚠️ Unexpected data structure:', data);
                onlineUsers = [];
            }
            
            //  บังคับให้ is_online เป็น 1 เสมอ
            onlineUsers = onlineUsers.map(user => ({
                ...user,
                is_online: 1
            }));
            
            console.log(`✅ Found ${onlineUsers.length} online users:`, onlineUsers);
            
            //  แสดงผลทันที
            this.renderUsersList(onlineUsers);
            
        } else {
            const errorText = await response.text();
            console.error('❌ API error:', response.status, errorText);
            throw new Error(`Failed to load online users: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error loading online users:', error);
        this.showNotification('โหลดข้อมูลล้มเหลว', 'ไม่สามารถโหลดข้อมูลผู้ใช้ออนไลน์ได้', 'error');
        
        //  แสดง empty state แทนการไม่แสดงอะไร
        this.renderUsersList([]);
    }
}
// โหลดผู้ใช้ทั้งหมด
async loadAllUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            this.renderUsersList(data.users || []);
        } else {
            throw new Error('Failed to load all users');
        }
    } catch (error) {
        console.error('Error loading all users:', error);
        this.showNotification('โหลดข้อมูลล้มเหลว', 'ไม่สามารถโหลดข้อมูลผู้ใช้ทั้งหมดได้', 'error');
        this.renderUsersList([]);
    }
}

// แสดงรายชื่อผู้ใช้
renderUsersList(users) {
    const usersList = document.getElementById('usersList');
    
    if (!usersList) {
        console.error('❌ Users list element not found');
        return;
    }
    
    console.log('📋 Rendering users list:', users.length, 'users');
    
    if (!users || users.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>ไม่พบผู้ใช้งาน</p>
                <small>ไม่มีผู้ใช้งานออนไลน์ในขณะนี้</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        // ใช้ค่าจริงจาก API ไม่บังคับ
        const isOnline = user.is_online === 1 || user.is_online === true || user.is_online === '1';
        
        //  ตรวจสอบว่ามีรูปโปรไฟล์หรือไม่
        const hasProfileImage = user.profile_image && 
                                user.profile_image !== '/assets/images/default-avatar.png' && 
                                !user.profile_image.includes('default-avatar');
        
        if (hasProfileImage) {
            html += `
                <div class="user-item" data-user-id="${user.user_id}">
                    <div class="user-avatar">
                        <img src="${user.profile_image}" alt="${user.full_name}" 
                             onerror="this.src='/assets/images/default-avatar.png'; this.onerror=null;">
                        <div class="online-indicator ${isOnline ? 'online' : 'offline'}"></div>
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-department">${user.department_name || 'ไม่ระบุแผนก'}</div>
                        <div class="user-employee-id">${user.employee_id || ''}</div>
                    </div>
                    <div class="user-status">
                        <span class="status-text ${isOnline ? 'online' : 'offline'}">
                            ${isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                        </span>
                    </div>
                </div>
            `;
        } else {
            const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : '?';
            
            html += `
                <div class="user-item" data-user-id="${user.user_id}">
                    <div class="user-avatar avatar-placeholder">
                        <span>${initial}</span>
                        <div class="online-indicator ${isOnline ? 'online' : 'offline'}"></div>
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-department">${user.department_name || 'ไม่ระบุแผนก'}</div>
                        <div class="user-employee-id">${user.employee_id || ''}</div>
                    </div>
                    <div class="user-status">
                        <span class="status-text ${isOnline ? 'online' : 'offline'}">
                            ${isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                        </span>
                    </div>
                </div>
            `;
        }
    });
    
    usersList.innerHTML = html;
    console.log('✅ Users list rendered');
}
async initialize() {
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            this.currentUser = JSON.parse(storedUser);
            this.updateUserProfile(); 
            console.log('👤 โหลด user จาก localStorage:', this.currentUser);
        } catch (e) {
            console.error('❌ parse localStorage user error:', e);
        }
    }

    await this.checkAuth(); 
    this.initSocket();
    this.initTextToSpeech();
    this.addTTSStyles();
    this.addCreateRoomStyles();
    this.addEmojiPickerStyles(); 
    await this.loadInitialData();
    
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('chatApp').style.display = 'grid';
    
    this.showMessageInput(false);
    this.addCreateRoomButton();
    
    // ตรวจสอบว่า profileBtn มีใน DOM
    console.log('🔍 Checking profileBtn in DOM...');
    const profileBtn = document.getElementById('profileBtn');
    console.log('✅ profileBtn found:', !!profileBtn);
    if (profileBtn) {
        console.log('📋 profileBtn HTML:', profileBtn.outerHTML);
        console.log('📍 profileBtn parent:', profileBtn.parentElement?.tagName);
    }
    
    // ตรวจสอบว่า profileModal มีใน DOM
    const profileModal = document.getElementById('profileModal');
    console.log('✅ profileModal found:', !!profileModal);
    if (profileModal) {
        console.log('📋 profileModal HTML:', profileModal.outerHTML.substring(0, 200) + '...');
    }
    
    //  เรียก setupEventListeners
    this.setupEventListeners();
    
    this.setupCreateRoomModalEvents();
    this.setupSidebarTabs();
    
    //  เพิ่มการตั้งค่าการค้นหา
    this.setupSearchFunctionality();
    
    //  เพิ่มการตั้งค่า scroll behavior
    this.setupScrollBehavior();
    this.setupEmojiPickerEvents();
}

setupScrollBehavior() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    messagesList.style.scrollBehavior = 'auto';
    messagesList.style.overflowY = 'scroll';
    
    // flag ว่าผู้ใช้กำลังเลื่อนขึ้นอ่านอยู่
    this.userIsReadingUp = false;
    
    messagesList.addEventListener('scroll', () => {
        const distanceFromBottom = messagesList.scrollHeight - messagesList.scrollTop - messagesList.clientHeight;
        
        // ถ้าห่างจากล่างเกิน 150px = กำลังเลื่อนขึ้นอ่าน
        this.userIsReadingUp = distanceFromBottom > 150;
        
        // ถ้า scroll กลับลงมาล่างสุดแล้ว → ซ่อน badge และ reset flag
        if (distanceFromBottom < 10) {
            this.userIsReadingUp = false;
            const badge = document.getElementById('newMsgBadge');
            if (badge) badge.remove();
        }
    });
    
    console.log('✅ Scroll behavior setup complete');
}

isAtBottom(element, threshold = 50) {
    if (!element) return false;
    
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const distance = scrollHeight - scrollTop - clientHeight;
    
    const atBottom = distance <= threshold;
    
    // console.log('📏 Scroll check:', { scrollTop, scrollHeight, clientHeight, distance, atBottom });
    
    return atBottom;
}
    async checkAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
        }

        
        this.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        this.updateUserProfile();
        
        console.log('✅ อัปเดต user จาก API และบันทึกลง localStorage');
        
    } catch (error) {
        console.error('Auth check failed:', error);
       
        if (this.currentUser) {
            console.log('⚠️ ใช้ข้อมูล user จาก localStorage แทน');
        } else {
            window.location.href = '/login';
        }
    }
}

   initSocket() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('❌ No token found for socket authentication');
        return;
    }

    this.socket = io();

    this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
       
        console.log('🔑 Token for auth:', token.substring(0, 20) + '...');
        
        
        this.socket.emit('authenticate', token);
    });

    this.socket.on('authenticated', (data) => {
        console.log('✅ Socket authenticated successfully:', data);
        this.updateUserStatus(true);
        
     
        if (this.currentUser) {
            this.socket.emit('user_data', {
                user_id: this.currentUser.user_id,
                username: this.currentUser.username,
                full_name: this.currentUser.full_name
            });
        }
    });

    this.socket.on('auth_error', (data) => {
        console.error('❌ Socket authentication error:', data);
        this.showNotification('การเชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    });

   
    this.socket.on('room_created', (data) => {
        console.log('🎉 Room created notification:', data);
        this.showNotification('สร้างห้องสำเร็จ', data.message || 'สร้างห้องใหม่สำเร็จ', 'success');
        
      
        this.loadChatRooms();
    });

    this.socket.on('new_message', (message) => {
        console.log('📨 New message via socket:', message);
        this.handleNewMessage(message);
    });

    this.socket.on('user_online', (data) => {
        this.handleUserOnline(data.user_id);
    });

    this.socket.on('user_offline', (data) => {
        this.handleUserOffline(data.user_id);
    });

    this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
    });

    this.socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        this.updateUserStatus(false);
    });
}

initTextToSpeech() {
    if (!this.ttsSupported) {
        console.warn('⚠️ Text-to-Speech ไม่รองรับในเบราว์เซอร์นี้');
        this.showTTSNotification('เบราว์เซอร์นี้ไม่รองรับการอ่านข้อความ', 'error');
        return;
    }
    
    console.log('✅ Text-to-Speech พร้อมใช้งาน');
    

    this.loadTTSPreferences();
    
  
    if (localStorage.getItem('ttsEnabled') === null) {
        this.ttsEnabled = true;
        localStorage.setItem('ttsEnabled', 'true');
        console.log('🔊 ตั้งค่าเริ่มต้น: เปิดใช้งาน TTS');
    }
    
    speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = speechSynthesis.getVoices();
        console.log(`✅ พบ ${this.availableVoices.length} เสียง`);
        
        this.thaiVoice = this.availableVoices.find(voice => 
            voice.lang.includes('th') || voice.name.includes('Thai')
        );
        
        if (this.thaiVoice) {
            console.log('✅ พบเสียงภาษาไทย:', this.thaiVoice.name);
        } else {
            console.log('⚠️ ไม่พบเสียงภาษาไทย');
        }
    };
    
    this.availableVoices = speechSynthesis.getVoices();
    if (this.availableVoices.length > 0) {
        this.thaiVoice = this.availableVoices.find(voice => 
            voice.lang.includes('th') || voice.name.includes('Thai')
        );
    }
    
 
    const ttsToggleBtn = document.getElementById('ttsToggleBtn');
    if (ttsToggleBtn) {
        if (this.ttsEnabled) {
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            ttsToggleBtn.title = 'ปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '#2ecc71';
        } else {
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            ttsToggleBtn.title = 'เปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '';
        }
    }
    
 
    if (this.ttsEnabled) {
        setTimeout(() => {
            this.showTTSNotification('อ่านข้อความได้โดยคลิกไอคอนลำโพงข้างข้อความ', 'info');
        }, 2000);
    }
}

    async loadInitialData() {
        try {
            console.log('📦 กำลังโหลดข้อมูลเริ่มต้น...');
            await this.loadChatRooms();
            console.log('✅ โหลดข้อมูลเริ่มต้นสำเร็จ');
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            setTimeout(() => {
                console.log('🔄 พยายามโหลดข้อมูลใหม่...');
                this.loadInitialData();
            }, 3000);
        }
    }

    async loadChatRooms() {
        try {
            console.log('🔍 กำลังโหลดห้องสนทนา...');
            const token = localStorage.getItem('token');
            if (!token) throw new Error('ไม่พบ token');
            
            const response = await fetch('/api/chat-rooms', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            console.log('📦 ข้อมูลห้องที่ได้รับ:', data);
            
            if (data.success && Array.isArray(data.rooms)) {
                this.rooms = data.rooms;
            } else if (Array.isArray(data)) {
                this.rooms = data;
            } else {
                this.rooms = [];
            }
            
            console.log(`✅ โหลดสำเร็จ: ${this.rooms.length} ห้อง`);
            this.renderChatRooms();
            
        } catch (error) {
            console.error('❌ โหลดห้องผิดพลาด:', error);
            this.rooms = [];
            this.renderChatRooms();
        }
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        const userFullName = document.getElementById('userFullName');
        const userDepartment = document.getElementById('userDepartment');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userFullName) userFullName.textContent = this.currentUser.full_name;
        if (userDepartment) userDepartment.textContent = this.currentUser.department_name || 'ไม่ระบุแผนก';
        if (userAvatar) userAvatar.src = this.currentUser.profile_image || '/assets/images/default-avatar.png';
    }

    updateUserStatus(isOnline) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = isOnline ? 'ออนไลน์' : 'ออฟไลน์';
        }
    }

  renderChatRooms(rooms = this.rooms, searchTerm = '') {
    const roomsList = document.getElementById('roomsList');
    const roomCount = document.getElementById('roomCount');
    
    if (!roomsList) {
        console.error('❌ ไม่พบ element roomsList');
        return;
    }
    
   
    if (rooms === this.rooms) {
        this.allRooms = [...rooms];
    }
    
  
    if (roomCount) {
        roomCount.textContent = rooms.length;
    }
    
    if (!rooms || rooms.length === 0) {
        roomsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <p>ไม่พบห้องสนทนา</p>
                <small>ลองค้นหาด้วยคำอื่นหรือสร้างห้องใหม่</small>
            </div>
        `;
        return;
    }
    
    // แยกห้องตามประเภท
    const departmentRooms = rooms.filter(room => room.room_type === 'department');
    const groupRooms = rooms.filter(room => room.room_type === 'group');
    const privateRooms = rooms.filter(room => room.room_type === 'private');
    
    let html = '';
    
    // ห้องแผนก
    if (departmentRooms.length > 0) {
        html += '<div class="room-category">ห้องแผนก</div>';
        departmentRooms.forEach(room => {
            html += this.createRoomItemHTML(room, 'department', searchTerm);
        });
    }
    
    // ห้องกลุ่ม
    if (groupRooms.length > 0) {
        html += '<div class="room-category">กลุ่มสนทนา</div>';
        groupRooms.forEach(room => {
            html += this.createRoomItemHTML(room, 'group', searchTerm);
        });
    }
    
    // ห้องส่วนตัว
    if (privateRooms.length > 0) {
        html += '<div class="room-category">สนทนาส่วนตัว</div>';
        privateRooms.forEach(room => {
            html += this.createRoomItemHTML(room, 'private', searchTerm);
        });
    }
    
    roomsList.innerHTML = html;

    roomsList.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', () => {
            const roomId = parseInt(item.dataset.roomId);
            const room = rooms.find(r => r.room_id === roomId);
            if (room) {
                this.selectRoom(room);
            }
        });
    });
}
// ฟังก์ชันค้นหาห้อง
searchChatRooms(searchTerm) {
    const searchInput = document.getElementById('searchChat');
    if (searchInput) {
        searchInput.value = searchTerm;
    }
    
    if (!searchTerm || searchTerm.trim() === '') {
        this.renderChatRooms(this.allRooms, '');
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filteredRooms = this.allRooms.filter(room => {
        if (room.room_name && room.room_name.toLowerCase().includes(term)) return true;
        if (room.department_name && room.department_name.toLowerCase().includes(term)) return true;
        if (room.room_type && room.room_type.toLowerCase().includes(term)) return true;
        return false;
    });
    
    this.filteredRooms = filteredRooms;
    this.renderChatRooms(filteredRooms, term);
}
// ฟังก์ชันตั้งค่าการค้นหา
setupSearchFunctionality() {
    const searchInput = document.getElementById('searchChat');
    
    if (!searchInput) {
        console.warn('⚠️ ไม่พบช่องค้นหาห้องสนทนา');
        return;
    }
    
    // Event listener สำหรับการพิมพ์
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        
       
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            this.searchChatRooms(searchTerm);
        }, 300); 
    });
    
  
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            this.searchChatRooms('');
            searchInput.blur();
        }
    });
    
    
    this.addClearSearchButton(searchInput);
}


addClearSearchButton(searchInput) {
    // สร้างปุ่มล้าง
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-search-btn';
    clearBtn.innerHTML = '<i class="fas fa-times"></i>';
    clearBtn.title = 'ล้างการค้นหา';
    clearBtn.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: 50%;
        display: none;
    `;
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchChatRooms('');
        searchInput.focus();
    });
    
    // แสดง/ซ่อนปุ่มตามที่มีข้อความ
    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });
    
    // ปุ่มใน container
    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.appendChild(clearBtn);
}

createRoomItemHTML(room, type, searchTerm = '') {
    const isActive = this.currentRoom && room.room_id === this.currentRoom.room_id;
    const activeClass = isActive ? 'active' : '';
    
    let icon = 'fas fa-users';
    let badgeClass = 'badge-group';
    let badgeText = 'กลุ่ม';
    
    if (type === 'department') {
        icon = 'fas fa-hospital';
        badgeClass = 'badge-department';
        badgeText = 'แผนก';
    } else if (type === 'private') {
        icon = 'fas fa-user-friends';
        badgeClass = 'badge-private';
        badgeText = 'ส่วนตัว';
    }
    
    // ฟังก์ชันเน้นคำค้นหา
    const highlightText = (text) => {
        if (!searchTerm || !text || typeof text !== 'string') return text;
        const term = searchTerm.toLowerCase();
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(term);
        
        if (index === -1) return text;
        
        const before = text.substring(0, index);
        const match = text.substring(index, index + term.length);
        const after = text.substring(index + term.length);
        
        return `${before}<span class="highlight">${match}</span>${after}`;
    };
    
    const roomName = highlightText(room.room_name || 'ไม่มีชื่อ');
    const lastMessage = highlightText(room.last_message || 'ยังไม่มีข้อความ');
   const unreadCount = room.unread || room.unread_count || 0;
    
    return `
        <div class="room-item ${activeClass}" data-room-id="${room.room_id}">
            <div class="room-avatar">
                <i class="${icon}"></i>
            </div>
            <div class="room-details">
                <div class="room-name">
                    ${roomName}
                    <span class="room-type-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="room-last-message">
                    ${lastMessage}
                </div>
                <div class="room-meta">
                    <span class="room-time">${room.last_message_time || ''}</span>
                </div>
            </div>
            ${unreadCount > 0 ? `
                <div class="room-unread">${unreadCount}</div>
            ` : ''}
        </div>
    `;
}

    async loadRoomMessages(roomId) {
        if (!roomId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chat-rooms/${roomId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                console.log(`📜 โหลดข้อความสำเร็จ: ${data.messages.length} ข้อความ`);
                this.renderMessages(data.messages);
                
                if (this.socket && this.socket.connected) {
                    this.socket.emit('join_room', roomId);
                    console.log(`✅ Joined socket room: ${roomId}`);
                }
            }
        } catch (error) {
            console.error('Load messages error:', error);
        }
    }

   renderMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-comment-dots"></i>
                <p>เริ่มต้นการสนทนา</p>
                <p>ส่งข้อความแรกเพื่อเริ่มการสนทนาในห้องนี้</p>
            </div>
        `;
        return;
    }

   
    const fragment = document.createDocumentFragment();
    messages.forEach(message => {
        const messageElement = this.createMessageElement(message);
        fragment.appendChild(messageElement);
    });
    
    messagesList.appendChild(fragment);

   
    setTimeout(() => {
        this.scrollToBottom(true);
    }, 150);
    
   
    setTimeout(() => {
        this.scrollToBottom(true);
    }, 300);
}

createMessageElement(message) {
    const isSent = message.sender_id === this.currentUser.user_id;
    const messageClass = isSent ? 'message sent' : 'message received';
    
    let content = '';
    
    if (message.message_type === 'text') {
        const escapedText = this.escapeHtml(message.message_text);
        content = `
            <div class="message-text-with-tts">
                <div class="message-text">${escapedText}</div>
                <button class="mini-tts-btn" 
                        onclick="event.stopPropagation(); chatApp.speakTextImmediately('${escapedText.replace(/'/g, "\\'")}')" 
                        title="อ่านข้อความนี้">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        `;
    } else if (message.file_url) {
       const isImage = message.message_type === 'image' || 
               (message.file_name && message.file_name.match(/\.(jpeg|jpg|png|gif|webp)$/i)) ||
               (message.file_url && message.file_url.includes('cloudinary.com') && message.file_url.includes('/image/upload/'));
        
       
        const displayName = message.file_name || 'ไฟล์';
        const fileSize = message.file_size ? `(${(message.file_size/1024).toFixed(1)} KB)` : '';
        
        if (isImage) {
            content = `
                <div class="file-message image-message">
                    <img src="${message.file_url}" 
                         alt="${displayName}" 
                         onclick="window.open('${message.file_url}', '_blank')"
                         style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i> รูปภาพโหลดไม่ได้'">
                    <div class="file-name" style="margin-top: 8px; font-size: 12px; color: #7f8c8d;">
                        📷 ${displayName} ${fileSize}
                    </div>
                </div>
            `;
        } else {
            // กำหนด icon ตามประเภทไฟล์
            let icon = 'fa-file';
            if (displayName.match(/\.pdf$/i)) icon = 'fa-file-pdf';
            else if (displayName.match(/\.(doc|docx)$/i)) icon = 'fa-file-word';
            else if (displayName.match(/\.(xls|xlsx)$/i)) icon = 'fa-file-excel';
            else if (displayName.match(/\.(zip|rar|7z)$/i)) icon = 'fa-file-archive';
            else if (displayName.match(/\.(mp3|wav|ogg)$/i)) icon = 'fa-file-audio';
            else if (displayName.match(/\.(mp4|avi|mov)$/i)) icon = 'fa-file-video';
            
           const fileHref = (message.file_url && message.file_url.includes('cloudinary.com'))
                ? message.file_url.replace('/upload/', '/upload/fl_attachment/')
                : message.file_url;

            content = `
                <div class="file-message">
                    <i class="fas ${icon}" ...></i>
                    <a href="${fileHref}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="file-link">
                        📎 ${displayName}
                    </a>
                    ...
                </div>
            `;
        }
    }
    
   
    const time = new Date(message.created_at).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const div = document.createElement('div');
    div.className = messageClass;
    div.dataset.messageId = message.message_id;
    
    if (isSent) {
        div.innerHTML = `
            <div class="message-content">
                ${content}
                <div class="message-info">
                    <span class="message-time">${time}</span>
                    <span class="message-read"><i class="fas fa-check-double"></i></span>
                </div>
            </div>
        `;
    } else {
        const hasProfileImage = message.profile_image && 
                                message.profile_image !== '/assets/images/default-avatar.png' && 
                                !message.profile_image.includes('default-avatar');
        
        if (hasProfileImage) {
            div.innerHTML = `
                <img src="${message.profile_image}" 
                     alt="${message.full_name}" 
                     class="message-avatar"
                     onerror="this.src='/assets/images/default-avatar.png'; this.onerror=null;">
                <div class="message-content">
                    <div class="message-sender">${message.full_name}</div>
                    ${content}
                    <div class="message-info">
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            `;
        } else {
            const initial = message.full_name ? message.full_name.charAt(0).toUpperCase() : '?';
            
            div.innerHTML = `
                <div class="message-avatar avatar-placeholder">
                    <span>${initial}</span>
                </div>
                <div class="message-content">
                    <div class="message-sender">${message.full_name}</div>
                    ${content}
                    <div class="message-info">
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            `;
        }
    }
    
    return div;
}
    speakSelectedMessage(message) {
        if (message.message_text) {
            this.speakTextImmediately(message.message_text);
        } else {
            this.speakMessage(message.message_id);
        }
    }

    showTTSNotification(text, type = 'info') {
        const oldNotification = document.getElementById('tts-notification');
        if (oldNotification) oldNotification.remove();
        
        let backgroundColor = '#3498db';
        let icon = 'fas fa-volume-up';
        
        if (type === 'success') {
            backgroundColor = '#2ecc71';
            icon = 'fas fa-check-circle';
        } else if (type === 'error') {
            backgroundColor = '#e74c3c';
            icon = 'fas fa-exclamation-circle';
        } else if (type === 'info') {
            backgroundColor = '#3498db';
            icon = 'fas fa-info-circle';
        }
        
        const notification = document.createElement('div');
        notification.id = 'tts-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            font-family: 'Prompt', sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            animation: slideUp 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="${icon}" style="font-size: 16px;"></i>
            <span>${text}</span>
            <button onclick="this.parentElement.remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 3000);
    }

   async selectRoom(room) {
    try {
         console.log(`🎯 กำลังเลือกห้อง: ${room.room_name} (ID: ${room.room_id})`);
        this.currentRoom = room;
        
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const roomElement = document.querySelector(`[data-room-id="${room.room_id}"]`);
        if (roomElement) roomElement.classList.add('active');
        
        document.getElementById('currentRoomName').textContent = room.room_name;
        document.getElementById('currentRoomInfo').textContent = room.department_name || 'ห้องสนทนา';
        
        const badgeElement = document.getElementById('roomTypeBadge');
        if (badgeElement) {
            let badgeClass = '';
            let badgeText = '';
            
            switch(room.room_type) {
                case 'department':
                    badgeClass = 'badge-department';
                    badgeText = 'แผนก';
                    break;
                case 'group':
                    badgeClass = 'badge-group';
                    badgeText = 'กลุ่ม';
                    break;
                case 'private':
                    badgeClass = 'badge-private';
                    badgeText = 'ส่วนตัว';
                    break;
            }
            
            badgeElement.className = `room-type-badge ${badgeClass}`;
            badgeElement.textContent = badgeText;
            badgeElement.style.display = 'inline-block';
        }

        // แสดงปุ่มสรุป AI
        const aiSummaryBtn = document.getElementById('aiSummaryBtn');
        if (aiSummaryBtn) {
            aiSummaryBtn.style.display = 'flex';
           
            const newBtn = aiSummaryBtn.cloneNode(true);
            aiSummaryBtn.parentNode.replaceChild(newBtn, aiSummaryBtn);
            
            newBtn.addEventListener('click', () => this.showAISummary());
        }

        //  แสดง/ซ่อนปุ่มตามประเภทห้อง
        const addToRoomBtn = document.getElementById('addToRoomBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        const roomMembersBtn = document.getElementById('roomMembersBtn');
        
        //  แสดงปุ่มเชิญเพื่อนเฉพาะห้องแบบกลุ่ม
        if (addToRoomBtn) {
            if (room.room_type === 'group') {
                addToRoomBtn.style.display = 'flex';
            } else {
                addToRoomBtn.style.display = 'none';
            }
        }
        
        //  แสดงปุ่มออกจากห้องเฉพาะกลุ่มและส่วนตัว (ไม่ใช่แผนก)
        if (leaveRoomBtn) {
            if (room.room_type === 'group' || room.room_type === 'private') {
                leaveRoomBtn.style.display = 'flex';
            } else {
                leaveRoomBtn.style.display = 'none';
            }
        }
        
        //  แสดงปุ่มดูสมาชิกทุกห้อง
        if (roomMembersBtn) {
            roomMembersBtn.style.display = 'flex';
        }
        
        const ttsToggleBtn = document.getElementById('ttsToggleBtn');
        if (ttsToggleBtn) ttsToggleBtn.style.display = 'flex';
        
        await this.loadRoomMessages(room.room_id);
        this.showMessageInput(true);
        
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.focus();
                messageInput.value = '';
            }
            
            const sendButton = document.getElementById('sendMessageBtn');
            if (sendButton) sendButton.disabled = false;
        }, 100);
        
    } catch (error) {
        console.error('❌ Error selecting room:', error);
        this.showNotification('เลือกห้องผิดพลาด', error.message, 'error');
    }
}

    showMessageInput(show) {
        const inputTools = document.getElementById('inputTools');
        const inputContainer = document.getElementById('inputContainer');
        const inputStatus = document.getElementById('inputStatus');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessageBtn');
        
        if (show) {
            if (inputTools) inputTools.style.display = 'flex';
            if (inputContainer) inputContainer.style.display = 'flex';
            if (inputStatus) inputStatus.style.display = 'flex';
            
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.placeholder = "พิมพ์ข้อความที่นี่... (กด Enter เพื่อส่ง)";
            }
            if (sendButton) sendButton.disabled = false;
        } else {
            if (inputTools) inputTools.style.display = 'none';
            if (inputContainer) inputContainer.style.display = 'none';
            if (inputStatus) inputStatus.style.display = 'none';
            
            if (messageInput) {
                messageInput.value = '';
                messageInput.disabled = true;
                messageInput.style.height = 'auto';
                messageInput.placeholder = "เลือกห้องสนทนาก่อนพิมพ์...";
            }
            if (sendButton) sendButton.disabled = true;
            
            const ttsToggleBtn = document.getElementById('ttsToggleBtn');
            if (ttsToggleBtn) ttsToggleBtn.style.display = 'none';
        }
    }

 async sendMessage() {
    try {
        const messageInput = document.getElementById('messageInput');
        const messageText = messageInput.value.trim();
        
        if (!messageText || !this.currentRoom) {
            console.warn('⚠️ ไม่มีข้อความหรือไม่ได้เลือกห้อง');
            return;
        }
        
        console.log(`📤 กำลังส่งข้อความ: "${messageText}"`);
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        //  OPTIMISTIC UI: สร้างข้อความชั่วคราว
        const tempId = 'temp_' + Date.now();
        const tempMessage = {
            message_id: tempId,
            message_text: messageText,
            sender_id: this.currentUser.user_id,
            full_name: this.currentUser.full_name,
            profile_image: this.currentUser.profile_image,
            message_type: 'text',
            created_at: new Date().toISOString()
        };
        
        // เพิ่มข้อความชั่วคราว
        this.addOptimisticMessage(tempMessage);
        
        // ล้าง input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        document.getElementById('characterCount').textContent = '0/1000';
        
        const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_text: messageText,
                message_type: 'text'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ ส่งข้อความสำเร็จ (API):', data);
            
            
            this.replaceTempMessage(tempId, data.message || data);
            
            if (this.socket) {
                this.socket.emit('stop_typing', { room_id: this.currentRoom.room_id });
                this.isTyping = false;
            }
        } else {
            this.removeTempMessage(tempId);
            const errorData = await response.json();
            console.error('❌ ส่งข้อความล้มเหลว:', errorData);
            this.showNotification('ส่งข้อความล้มเหลว', errorData.error || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('❌ Send message error:', error);
        this.showNotification('ส่งข้อความล้มเหลว', 'เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด', 'error');
    }
}
async handleSendMessage() {
    console.log('📤 handleSendMessage called');
    
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput ? messageInput.value.trim() : '';
    
    const hasMessage = messageText.length > 0;
    const hasFiles = this.selectedPreviewFiles && this.selectedPreviewFiles.length > 0;
    
    if (!hasMessage && !hasFiles) {
        this.showNotification('แจ้งเตือน', 'กรุณาพิมพ์ข้อความหรือเลือกไฟล์', 'info');
        return;
    }
    
    this.closeEmojiPicker();
    
    if (hasFiles) {
        console.log('📤 Uploading files first...');
        await this.uploadFiles(this.selectedPreviewFiles);
        this.clearFilePreview();
    }
    
    if (hasMessage) {
        console.log('📤 Sending text message...');
        
        const tempId = 'temp_' + Date.now();
        const tempMessage = {
            message_id: tempId,
            message_text: messageText,
            sender_id: this.currentUser.user_id,
            full_name: this.currentUser.full_name,
            profile_image: this.currentUser.profile_image,
            message_type: 'text',
            created_at: new Date().toISOString()
        };
        
        this.addOptimisticMessage(tempMessage);
        
        
        messageInput.value = '';
        messageInput.style.height = 'auto';
        const charCount = document.getElementById('characterCount');
        if (charCount) charCount.textContent = '0/1000';
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_text: messageText,
                    message_type: 'text'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ ส่งข้อความสำเร็จ:', data);
                
              
                this.replaceTempMessage(tempId, data.message || data);
                
                if (this.socket) {
                    this.socket.emit('stop_typing', { room_id: this.currentRoom.room_id });
                }
            } else {
                this.removeTempMessage(tempId);
                
                let errorMessage = 'ส่งข้อความล้มเหลว';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (e) {}
                
                this.showNotification('ส่งข้อความล้มเหลว', errorMessage, 'error');
            }
        } catch (error) {
            console.error('❌ Send error:', error);
            this.removeTempMessage(tempId);
            this.showNotification('ส่งข้อความล้มเหลว', 'เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด', 'error');
        }
    }
}

clearFilePreview() {
    this.selectedPreviewFiles = [];
    const previewArea = document.getElementById('filePreviewArea');
    const previewList = document.getElementById('filePreviewList');
    
    if (previewArea) {
        previewArea.style.display = 'none';
    }
    
    if (previewList) {
        previewList.innerHTML = '';
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

addOptimisticMessage(message) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    console.log('➕ Adding optimistic message:', message.message_id);
    
    
    const emptyChat = messagesList.querySelector('.empty-chat');
    const welcomeMessage = messagesList.querySelector('.welcome-message');
    if (emptyChat) emptyChat.remove();
    if (welcomeMessage) welcomeMessage.remove();
    
   
    const messageElement = this.createMessageElement(message);
    messageElement.classList.add('temp-message');
    messageElement.style.opacity = '0.8';
    
   
    messagesList.appendChild(messageElement);
    
    const isMyMessage = message.sender_id === this.currentUser?.user_id;
        
        if (isMyMessage) {
           
            this.scrollToBottom(true);
        } else if (this.userIsReadingUp) {
            
            this.showNewMessageBadge(message.full_name);
        } else {
           
            this.scrollToBottom(false);
        }
}
showNewMessageBadge(senderName = '') {
  
    let badge = document.getElementById('newMsgBadge');
    
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'newMsgBadge';
        badge.style.cssText = `
            position: absolute; bottom: 80px; left: 50%;
            transform: translateX(-50%);
            background: #667eea; color: white;
            padding: 8px 18px; border-radius: 20px;
            cursor: pointer; font-size: 13px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            z-index: 100; white-space: nowrap;
            font-family: 'Prompt', sans-serif;
        `;
        badge.onclick = () => {
            this.userIsReadingUp = false;
            this.scrollToBottom(true);
            badge.remove();
        };
        
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.parentElement.style.position = 'relative';
            messagesList.parentElement.appendChild(badge);
        }
    }
    
    badge.innerHTML = `⬇ ${senderName ? senderName + ' ส่งข้อความใหม่' : 'มีข้อความใหม่'}`;
}
replaceTempMessage(tempId, realMessage) {
    const tempElement = document.querySelector(`[data-message-id="${tempId}"]`);
    if (tempElement) {
        console.log('🔄 Replacing temp message:', tempId, '→', realMessage.message_id);
        
        
        const existingReal = document.querySelector(`[data-message-id="${realMessage.message_id}"]`);
        if (existingReal && existingReal !== tempElement) {
            console.log('⚠️ ข้อความจริงมีอยู่แล้ว, ลบ optimistic เท่านั้น');
            tempElement.remove();
            return;
        }
        
        const newElement = this.createMessageElement(realMessage);
        tempElement.parentNode.replaceChild(newElement, tempElement);
        
        console.log('✅ Message replaced, scrolling...');
        
        
        const messagesList = document.getElementById('messagesList');
        messagesList.scrollTop = messagesList.scrollHeight;
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        }, 10);
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        }, 50);
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
            console.log('✅ Replace scroll done:', messagesList.scrollTop);
        }, 100);
    }
}

removeTempMessage(tempId) {
    const tempElement = document.querySelector(`[data-message-id="${tempId}"]`);
    if (tempElement) {
        tempElement.remove();
    }
}
handleNewMessage(message) {
    console.log('📨 รับข้อความใหม่ (handle):', message);
    
    if (this.currentRoom && message.room_id === this.currentRoom.room_id) {
        console.log('✅ ข้อความสำหรับห้องปัจจุบัน');
        
        const messagesList = document.getElementById('messagesList');
        
      
        const existingMessage = document.querySelector(`[data-message-id="${message.message_id}"]`);
        if (existingMessage) {
            console.log('⏭️ ข้อความนี้มีอยู่แล้ว, ข้ามการเพิ่ม');
            return;
        }
        
        
        const tempMessage = messagesList.querySelector('[data-message-id^="temp_"]');
        if (tempMessage) {
            console.log('⏭️ มี optimistic message อยู่, รอการแทนที่');
            return;
        }
        
        const emptyChat = messagesList.querySelector('.empty-chat');
        const welcomeMessage = messagesList.querySelector('.welcome-message');
        if (emptyChat) emptyChat.remove();
        if (welcomeMessage) welcomeMessage.remove();
        
        const messageElement = this.createMessageElement(message);
        messagesList.appendChild(messageElement);
        
        console.log('📜 New message added, scrolling...');
        
     
        messagesList.scrollTop = messagesList.scrollHeight;
        
        requestAnimationFrame(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        });
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        }, 10);
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        }, 50);
        
        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
            console.log('✅ New message scroll done:', messagesList.scrollTop);
        }, 100);
    }
}
 toggleTTS() {
    // สลับสถานะ
    this.ttsEnabled = !this.ttsEnabled;
    
    // บันทึกลง localStorage
    localStorage.setItem('ttsEnabled', this.ttsEnabled.toString());
    
    const ttsToggleBtn = document.getElementById('ttsToggleBtn');
    if (ttsToggleBtn) {
        if (this.ttsEnabled) {
            // ถ้าเปิดใช้งาน
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';  
            ttsToggleBtn.title = 'ปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '#2ecc71';  
            console.log('🔊 เปิดการอ่านข้อความ');
            this.showTTSNotification('เปิดการอ่านข้อความแล้ว', 'success');
        } else {
            // ถ้าปิดใช้งาน
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>'; 
            ttsToggleBtn.title = 'เปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '';  
            this.stopSpeaking();
            console.log('🔇 ปิดการอ่านข้อความ');
            this.showTTSNotification('ปิดการอ่านข้อความแล้ว', 'info');
        }
    }
    
    // แสดงข้อความแนะนำ (เฉพาะตอนเปิด)
    if (this.ttsEnabled) {
        setTimeout(() => {
            this.showTTSNotification('อ่านข้อความได้โดยคลิกไอคอนลำโพงข้างข้อความ', 'info');
        }, 1500);
    }
}

    speakText(text, isTest = false) {
        if (!this.ttsSupported) {
            this.showTTSNotification('เบราว์เซอร์นี้ไม่รองรับการอ่านข้อความ', 'error');
            return;
        }
        
        if (!this.ttsEnabled && !isTest) {
            this.showTTSNotification('กรุณาเปิดการอ่านข้อความก่อน', 'info');
            return;
        }
        
        this.stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = parseFloat(localStorage.getItem('ttsSpeed') || '1.0');
        utterance.volume = parseFloat(localStorage.getItem('ttsVolume') || '1.0');
        utterance.pitch = 1.0;
        
        const voices = speechSynthesis.getVoices();
        let selectedVoice = voices.find(voice => 
            voice.lang.includes('th') || voice.name.includes('Thai')
        );
        
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang === 'th-TH' || voice.lang.startsWith('th-')
            );
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.default) || voices[0];
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
            console.log('🔊 ใช้เสียง:', selectedVoice.name);
        } else {
            utterance.lang = 'th-TH';
            console.log('⚠️ ใช้เสียง default');
        }
        
        utterance.onstart = () => {
            console.log('🔊 เริ่มอ่านข้อความ:', text.substring(0, 50));
            this.currentSpeech = utterance;
            this.showTTSNotification('กำลังอ่านข้อความ...', 'info');
        };
        
        utterance.onend = () => {
            console.log('✅ อ่านข้อความเสร็จสิ้น');
            this.currentSpeech = null;
            this.showTTSNotification('อ่านข้อความเสร็จสิ้น', 'success');
        };
        
        utterance.onerror = (event) => {
            console.error('❌ ข้อผิดพลาดในการอ่าน:', event);
            this.currentSpeech = null;
            this.showTTSNotification('เกิดข้อผิดพลาดในการอ่าน', 'error');
        };
        
        speechSynthesis.speak(utterance);
    }
addEmojiPickerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .emoji-modal {
            display: none;
            position: fixed;
            bottom: 120px;  
            left: 280px;    
            z-index: 9999;
            animation: slideUpEmoji 0.3s ease;
        }
        
        .emoji-modal.active {
            display: block;
        }
        
        @keyframes slideUpEmoji {
            from {
                opacity: 0;
                transform: translateY(20px) translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0) translateX(0);
            }
        }
        
        .emoji-modal-content {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            width: 380px;
            max-height: 450px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .emoji-header {
            padding: 16px 20px;
            border-bottom: 2px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .emoji-header h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .emoji-header h4::before {
            content: '😀';
            font-size: 20px;
        }
        
        .close-emoji-modal {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 20px;
            color: white;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .close-emoji-modal:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }
        
        .emoji-categories {
            display: flex;
            gap: 4px;
            padding: 12px 12px 8px 12px;
            border-bottom: 1px solid #f0f0f0;
            overflow-x: auto;
            background: #fafafa;
        }
        
        .emoji-categories::-webkit-scrollbar {
            height: 4px;
        }
        
        .emoji-categories::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        
        .emoji-categories::-webkit-scrollbar-thumb {
            background: #bdc3c7;
            border-radius: 2px;
        }
        
        .emoji-category-btn {
            background: white;
            border: 2px solid transparent;
            border-radius: 10px;
            padding: 8px;
            font-size: 22px;
            cursor: pointer;
            transition: all 0.3s;
            flex-shrink: 0;
            min-width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .emoji-category-btn:hover {
            background: #f8f9fa;
            transform: scale(1.1);
        }
        
        .emoji-category-btn.active {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border-color: #667eea;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }
        
        .emoji-search {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            background: white;
        }
        
        .emoji-search input {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 14px;
            font-family: 'Prompt', sans-serif;
            transition: all 0.3s;
        }
        
        .emoji-search input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .emoji-search input::placeholder {
            color: #adb5bd;
        }
        
        .emoji-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 4px;
            padding: 12px;
            max-height: 280px;
            overflow-y: auto;
            background: white;
        }
        
        .emoji-grid::-webkit-scrollbar {
            width: 8px;
        }
        
        .emoji-grid::-webkit-scrollbar-track {
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .emoji-grid::-webkit-scrollbar-thumb {
            background: #bdc3c7;
            border-radius: 4px;
        }
        
        .emoji-grid::-webkit-scrollbar-thumb:hover {
            background: #95a5a6;
        }
        
        .emoji-item {
            background: none;
            border: none;
            font-size: 28px;
            padding: 8px;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .emoji-item:hover {
            background: #f8f9fa;
            transform: scale(1.3);
            z-index: 10;
        }
        
        .emoji-item:active {
            transform: scale(1.2);
        }
        
        /* Emoji button in input */
        #emojiBtn {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #emojiBtn:hover {
            background: #667eea;
            color: white;
            transform: scale(1.1);
        }
        
        #emojiBtn.active {
            background: #667eea;
            color: white;
        }
        
        /*  Responsive สำหรับจอเล็ก */
        @media (max-width: 768px) {
            .emoji-modal {
                left: 50%;
                transform: translateX(-50%);
                bottom: 100px;
            }
            
            .emoji-modal-content {
                width: 90vw;
                max-width: 380px;
            }
        }
        
        /*  Loading state */
        .emoji-grid.loading::after {
            content: 'กำลังโหลด...';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #95a5a6;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
    const scrollStyles = document.createElement('style');
scrollStyles.textContent = `
    #messagesList {
        scroll-behavior: auto !important;  
        overflow-y: scroll !important;
        overflow-x: hidden !important;
        height: 100%;
        position: relative;
    }
    
    .message {
        margin-bottom: 4px;
        will-change: auto;
    }
    
  
    .temp-message {
        animation: none !important;
    }
    
   
    .temp-message * {
        transition: none !important;
    }
`;
document.head.appendChild(scrollStyles);
}

    addTTSStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .message-text-with-tts {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                width: 100%;
            }
            
            .message-text-with-tts .message-text {
                flex: 1;
                line-height: 1.5;
            }
            
            .mini-tts-btn {
                background: rgba(52, 152, 219, 0.2);
                border: 1px solid rgba(52, 152, 219, 0.3);
                width: 24px;
                height: 24px;
                border-radius: 50%;
                color: #3498db;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                transition: all 0.3s ease;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .mini-tts-btn:hover {
                background: #3498db;
                color: white;
                transform: scale(1.1);
            }
            
            .message.sent .mini-tts-btn {
                background: rgba(149, 165, 166, 0.2);
                border-color: rgba(149, 165, 166, 0.3);
                color: #95a5a6;
            }
            
            .message.sent .mini-tts-btn:hover {
                background: #95a5a6;
                color: white;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .message {
                cursor: pointer;
                transition: background-color 0.2s ease;
                padding: 8px 12px;
                border-radius: 8px;
            }
            
            .message:hover {
                background-color: rgba(52, 152, 219, 0.05);
            }
                .message-text-with-tts {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            width: 100%;
        }
        
        .message-text-with-tts .message-text {
            flex: 1;
            line-height: 1.5;
        }
        
        .mini-tts-btn {
            background: rgba(52, 152, 219, 0.2);
            border: 1px solid rgba(52, 152, 219, 0.3);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            color: #3498db;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            transition: all 0.3s ease;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .mini-tts-btn:hover {
            background: #3498db;
            color: white;
            transform: scale(1.1);
        }
        
        .message.sent .mini-tts-btn {
            background: rgba(149, 165, 166, 0.2);
            border-color: rgba(149, 165, 166, 0.3);
            color: #95a5a6;
        }
        
        .message.sent .mini-tts-btn:hover {
            background: #95a5a6;
            color: white;
        }
        
        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .message {
            cursor: pointer;
            transition: background-color 0.2s ease;
            padding: 8px 12px;
            border-radius: 8px;
        }
        
        .message:hover {
            background-color: rgba(52, 152, 219, 0.05);
        }
        
        .mini-tts-btn {
            opacity: 1 !important;
            display: inline-flex !important;
            background: #3498db !important;
            color: white !important;
        }
        
        .message.sent .mini-tts-btn {
            background: #95a5a6 !important;
            color: white !important;
        }
        
        .message-text-with-tts {
            display: flex !important;
            align-items: flex-start !important;
            gap: 8px !important;
        }
        
        /* ป้องกันการซ่อน */
        .message .mini-tts-btn {
            opacity: 1 !important;
            visibility: visible !important;
        }
        `;
        document.head.appendChild(style);
    }

    speakMessage(messageId) {
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            const textElement = messageEl.querySelector('.message-text');
            if (textElement) {
                const text = textElement.textContent || '';
                this.speakTextImmediately(text);
            }
        }
    }

   speakTextImmediately(text, force = false) {
    if (!this.ttsSupported) {
        this.showTTSNotification('เบราว์เซอร์นี้ไม่รองรับการอ่านข้อความ', 'error');
        return;
    }
    
   
    if (!this.ttsEnabled && !force) {
        this.showTTSNotification('กรุณาเปิดการอ่านข้อความก่อน', 'info');
        return;
    }
    
    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = parseFloat(localStorage.getItem('ttsSpeed') || '1.0');
    utterance.volume = parseFloat(localStorage.getItem('ttsVolume') || '1.0');
    utterance.pitch = 1.0;
    
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => 
        voice.lang.includes('th') || voice.name.includes('Thai')
    );
    
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.default) || voices[0];
    }
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
    }
    
    utterance.onstart = () => {
        console.log('🔊 เริ่มอ่านข้อความทันที:', text.substring(0, 50));
        this.currentSpeech = utterance;
        
       
        if (!force) {
            this.showTTSNotification('กำลังอ่านข้อความ...', 'info');
        }
    };
    
    utterance.onend = () => {
        console.log('✅ อ่านข้อความเสร็จสิ้น');
        this.currentSpeech = null;
        
       
        if (!force) {
            this.showTTSNotification('อ่านข้อความเสร็จสิ้น', 'success');
        }
    };
    
    utterance.onerror = (event) => {
        console.error('❌ ข้อผิดพลาดในการอ่าน:', event);
        this.currentSpeech = null;
        
       
        if (!force) {
            this.showTTSNotification('เกิดข้อผิดพลาดในการอ่าน', 'error');
        }
    };
    
    speechSynthesis.speak(utterance);
}

    testTTS() {
        const testText = 'สวัสดีครับ นี่คือการทดสอบเสียงอ่านภาษาไทย';
        console.log('🔊 ทดสอบเสียง:', testText);
        
        if (!this.ttsSupported) {
            alert('เบราว์เซอร์นี้ไม่รองรับการอ่านข้อความ');
            return;
        }
        
        if (!this.ttsEnabled) {
            this.toggleTTS();
            setTimeout(() => {
                this.speakText(testText, true);
            }, 500);
        } else {
            this.speakText(testText, true);
        }
    }

    stopSpeaking() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            this.currentSpeech = null;
            console.log('⏹️ หยุดการอ่านข้อความ');
        }
    }

   loadTTSPreferences() {
    this.ttsEnabled = localStorage.getItem('ttsEnabled') === 'true';
    
    const ttsToggleBtn = document.getElementById('ttsToggleBtn');
    if (ttsToggleBtn) {
        if (this.ttsEnabled) {
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            ttsToggleBtn.title = 'ปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '#2ecc71';
        } else {
            ttsToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            ttsToggleBtn.title = 'เปิดการอ่านข้อความ';
            ttsToggleBtn.style.color = '';
        }
    }
}

    saveTTSPreferences() {
        const speed = document.getElementById('ttsSpeed')?.value || '1.0';
        const volume = document.getElementById('ttsVolume')?.value || '0.8';
        
        localStorage.setItem('ttsSpeed', speed);
        localStorage.setItem('ttsVolume', volume);
        
        console.log('💾 บันทึกการตั้งค่า TTS:', { autoRead, speed, volume });
    }

    // ========================================
    // ROOM CREATION FUNCTIONS
    // ========================================

    addCreateRoomButton() {
        const newGroupBtn = document.getElementById('newGroupBtn');
        if (newGroupBtn) {
            newGroupBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            newGroupBtn.title = 'สร้างห้องใหม่';
            newGroupBtn.id = 'createRoomBtn';
        }
        
        const searchBar = document.querySelector('.search-bar');
        if (searchBar && !document.getElementById('createRoomBtn')) {
            const createBtn = document.createElement('button');
            createBtn.id = 'createRoomBtn';
            createBtn.className = 'btn-icon';
            createBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            createBtn.title = 'สร้างห้องใหม่';
            searchBar.appendChild(createBtn);
        }
    }

    addCreateRoomStyles() {
        const filePreviewStyles = document.createElement('style');
filePreviewStyles.textContent = `
    #filePreviewArea {
        display: none;
        padding: 12px;
        background: rgba(52, 152, 219, 0.1);
        border-radius: 8px;
        margin-bottom: 8px;
    }
    
    #filePreviewList {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .preview-item {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .preview-item .file-icon {
        font-size: 32px;
        color: #95a5a6;
    }
    
    .remove-file {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(231, 76, 60, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.3s ease;
    }
    
    .remove-file:hover {
        background: #c0392b;
        transform: scale(1.1);
    }
`;
document.head.appendChild(filePreviewStyles);
        
const dateRangeStyles = document.createElement('style');
dateRangeStyles.textContent = `
    .btn-quick-date {
        flex: 1;
        padding: 8px 12px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-quick-date:hover {
        background: #e9ecef;
        border-color: #3498db;
    }
    
    .btn-quick-date:active {
        transform: scale(0.98);
    }
    
    .form-control {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-family: 'Prompt', sans-serif;
    }
    
    .form-control:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
`;
document.head.appendChild(dateRangeStyles);
        
const optimisticStyles = document.createElement('style');
optimisticStyles.textContent = `
    /* Optimistic UI สำหรับข้อความที่กำลังส่ง */
    .temp-message {
        opacity: 0.7;
        position: relative;
        animation: fadeInUp 0.3s ease-out;
    }
    
    .temp-message .message-text {
        font-style: italic;
    }
    
    .temp-message .message-info {
        color: rgba(0, 0, 0, 0.5);
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 0.7;
            transform: translateY(0);
        }
    }
    
    /* ป้องกันการกระตุกของ scroll */
    .messages-list {
        scroll-behavior: smooth;
        will-change: transform;
        overflow-anchor: none;
    }
    
    /* ปรับปรุงการแสดงผลข้อความ */
    .message {
        contain: content;
        margin-bottom: 8px;
        transform: translateZ(0);
        backface-visibility: hidden;
    }
    
    /* ปรับปรุงการ scroll */
    .messages-container {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
    
    /* ป้องกันการขยับของ layout */
    .chat-header, .message-input-area {
        flex-shrink: 0;
    }
    
    /* ปรับปรุง textarea */
    textarea#messageInput {
        min-height: 44px;
        max-height: 120px;
        transition: height 0.2s ease;
        resize: none;
    }
`;
document.head.appendChild(optimisticStyles);
       
const reportButtonStyles = document.createElement('style');
reportButtonStyles.textContent = `
    /* ปุ่มสรุปผลรายงาน */
    .btn-view-report {
        background: #27ae60;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 20px auto;
        width: 100%;
        transition: all 0.3s ease;
    }
    
    .btn-view-report:hover {
        background: #219653;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .btn-view-report:active {
        transform: translateY(0);
    }
    
    .summary-actions {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px solid #eee;
    }
    
    .summary-actions .text-muted {
        display: block;
        margin-top: 10px;
        font-size: 12px;
        color: #7f8c8d;
    }
    
    /* ปุ่มใน modal footer */
    #aiSummaryModal .btn-success {
        background: #27ae60;
        border-color: #27ae60;
    }
    
    #aiSummaryModal .btn-success:hover {
        background: #219653;
        border-color: #219653;
    }
    
    /* Loading summary */
    .loading-summary {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
    }
    
    .loading-summary i {
        font-size: 48px;
        margin-bottom: 20px;
        color: #3498db;
    }
    
    .loading-summary p {
        font-size: 16px;
        margin-bottom: 10px;
    }
    
    .loading-summary small {
        font-size: 14px;
        color: #95a5a6;
    }
    
    /* Error summary */
    .error-summary {
        text-align: center;
        padding: 40px;
        color: #e74c3c;
    }
    
    .error-summary i {
        font-size: 48px;
        margin-bottom: 20px;
    }
    
    .error-summary p {
        font-size: 16px;
        margin-bottom: 10px;
    }
    
    .error-summary small {
        font-size: 14px;
        color: #c0392b;
    }
`;
document.head.appendChild(reportButtonStyles);
         const summaryButtonStyles = document.createElement('style');
    summaryButtonStyles.textContent = `
        /* Summary Modal Footer */
        #aiSummaryModal .modal-footer {
            display: flex;
            gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid #eee;
        }
        
        #aiSummaryModal .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        #aiSummaryModal .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        #aiSummaryModal .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        
        #aiSummaryModal .btn-secondary:hover:not(:disabled) {
            background: #7f8c8d;
        }
        
        #aiSummaryModal .btn-primary {
            background: #3498db;
            color: white;
        }
        
        #aiSummaryModal .btn-primary:hover:not(:disabled) {
            background: #2980b9;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        #aiSummaryModal .btn-primary:active:not(:disabled) {
            transform: translateY(0);
        }
        
        #aiSummaryModal .btn i {
            font-size: 14px;
        }
        
        #aiSummaryModal .btn i.fa-spinner {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(summaryButtonStyles);
        
        const addMembersStyles = document.createElement('style');
addMembersStyles.textContent = `
    /* Add Members Modal Styles */
    #addMembersModal .modal-content {
        max-width: 600px;
        max-height: 80vh;
    }
    
    .add-member-search {
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .add-member-search input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
    }
    
    .add-member-search i {
        position: absolute;
        left: 28px;
        top: 50%;
        transform: translateY(-50%);
        color: #7f8c8d;
    }
    
    #addMemberResults {
        max-height: 50vh;
        overflow-y: auto;
        padding: 16px;
    }
    
    .add-member-item {
        display: flex;
        align-items: center;
        padding: 12px;
        gap: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        background: var(--light-bg);
        transition: all 0.3s ease;
    }
    
    .add-member-item:hover {
        background: rgba(52, 152, 219, 0.05);
        transform: translateX(2px);
    }
    
    .btn-add-member {
        background: #3498db;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        white-space: nowrap;
    }
    
    .btn-add-member:hover {
        background: #2980b9;
        transform: scale(1.05);
    }
    
    .btn-add-member:active {
        transform: scale(0.95);
    }
    
    .btn-add-member i {
        font-size: 12px;
    }
`;
document.head.appendChild(addMembersStyles);
const roomMembersStyles = document.createElement('style');
roomMembersStyles.textContent = `
    /* Room Members Modal */
    #roomMembersModal .modal-content {
        max-width: 500px;
        max-height: 80vh;
    }
    
    .members-header {
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 16px;
    }
    
    .members-stats {
        display: flex;
        gap: 16px;
        justify-content: center;
    }
    
    .total-members, .online-members {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .total-members i {
        color: #3498db;
    }
    
    .online-members i {
        color: #2ecc71;
        font-size: 10px;
    }
    
    /* Room Member Item */
    .room-member-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        border-radius: 8px;
        transition: all 0.3s ease;
        margin-bottom: 8px;
    }
    
    .room-member-item:hover {
        background: var(--light-bg);
    }
    
    .room-member-item.current-user {
        background: rgba(52, 152, 219, 0.05);
    }
    
    .member-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
    }
    
    .member-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(52, 152, 219, 0.3);
    }
    
    .member-online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
    }
    
    .member-online-indicator.online {
        background: #2ecc71;
    }
    
    .member-online-indicator.offline {
        background: #95a5a6;
    }
    
    .member-details {
        flex: 1;
        min-width: 0;
    }
    
    .member-name {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .you-badge {
        background: #3498db;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 600;
    }
    
    .member-info {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--text-muted);
    }
    
    .member-department {
        color: var(--text-secondary);
    }
    
    .member-employee-id {
        color: #7f8c8d;
    }
    
    .member-status-text {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
        white-space: nowrap;
    }
    
    .member-status-text.online {
        background: rgba(46, 204, 113, 0.1);
        color: #27ae60;
    }
    
    .member-status-text.offline {
        background: rgba(149, 165, 166, 0.1);
        color: #7f8c8d;
    }
    
    /* Empty state */
    .empty-members {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
    }
    
    .empty-members i {
        font-size: 48px;
        color: #bdc3c7;
        margin-bottom: 16px;
    }
    
    .empty-members p {
        font-size: 14px;
    }
    
    /* Add Members Modal */
    .add-member-item {
        display: flex;
        align-items: center;
        padding: 12px;
        gap: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        background: var(--light-bg);
    }
    
    .btn-add-member {
        background: #3498db;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
    }
    
    .btn-add-member:hover {
        background: #2980b9;
    }
    
    /* Modal content scroll */
    #roomMembersList {
        max-height: 60vh;
        overflow-y: auto;
        padding: 0 16px;
    }
    
    #roomMembersList::-webkit-scrollbar {
        width: 6px;
    }
    
    #roomMembersList::-webkit-scrollbar-track {
        background: var(--light-bg);
        border-radius: 3px;
    }
    
    #roomMembersList::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 3px;
    }
    
    #roomMembersList::-webkit-scrollbar-thumb:hover {
        background: #95a5a6;
    }
`;
document.head.appendChild(roomMembersStyles);
        const style = document.createElement('style');
        style.textContent = `
            /* Modal สร้างห้อง */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            }
            
            .modal.active {
                display: flex;
            }
            
            .modal-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
                color: #2c3e50;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #7f8c8d;
            }
            
            .close-modal:hover {
                color: #e74c3c;
            }
            
            .modal-body {
                padding: 24px;
                flex: 1;
                overflow-y: auto;
            }
            
           .modal-footer {
                display: flex;
                gap: 12px;
                padding: 20px 24px;
                border-top: 1px solid #e2e8f0;
                justify-content: flex-end;
                background: #f8fafc;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #2c3e50;
            }
            
            .form-group input[type="text"] {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            
            .form-group input[type="text"]:focus {
                border-color: #3498db;
                outline: none;
            }
            
            .char-counter {
                text-align: right;
                font-size: 12px;
                color: #7f8c8d;
                margin-top: 4px;
            }
            
            .room-type-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-top: 8px;
            }
            
            .room-type-option {
                border: 2px solid #eee;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .room-type-option:hover {
                border-color: #3498db;
                background: rgba(52, 152, 219, 0.05);
            }
            
            .room-type-option input {
                display: none;
            }
            
            .room-type-option input:checked + .option-content {
                color: #3498db;
            }
            
            .room-type-option input:checked + .option-content i {
                color: #3498db;
            }
            
            .option-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 8px;
            }
            
            .option-content i {
                font-size: 24px;
                color: #7f8c8d;
            }
            
            .option-content span {
                font-weight: 600;
                font-size: 14px;
            }
            
            .option-content small {
                font-size: 12px;
                color: #95a5a6;
            }
            
            .search-box {
                position: relative;
            }
            
            .search-box i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #7f8c8d;
            }
            
            .search-box input {
                padding-left: 40px !important;
            }
            
            .member-selection {
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
                margin-top: 8px;
            }
            
            @media (min-width: 768px) {
                .member-selection {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            .members-list {
                border: 1px solid #ddd;
                border-radius: 8px;
                max-height: 300px;
                overflow-y: auto;
                padding: 12px;
            }
            
            .member-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .member-item:hover {
                background: #f8f9fa;
            }
            
            .member-item.selected {
                background: rgba(52, 152, 219, 0.1);
                border-left: 3px solid #3498db;
            }
            
            .member-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 12px;
                object-fit: cover;
                background: #eee;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #7f8c8d;
            }
            
            .member-info {
                flex: 1;
            }
            
            .member-name {
                font-weight: 600;
                font-size: 14px;
                color: #2c3e50;
            }
            
            .member-email {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .member-checkbox {
                width: 20px;
                height: 20px;
                border: 2px solid #ddd;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                background: white;
                transition: all 0.3s;
            }
            
            .member-item.selected .member-checkbox {
                background: #3498db;
                border-color: #3498db;
            }
            
            .selected-members {
                border: 1px dashed #ddd;
                border-radius: 8px;
                padding: 12px;
                min-height: 100px;
            }
            
            .selected-member-tag {
                display: inline-flex;
                align-items: center;
                background: rgba(52, 152, 219, 0.1);
                padding: 6px 12px;
                border-radius: 20px;
                margin: 4px;
                font-size: 13px;
            }
            
            .selected-member-tag .remove-member {
                background: none;
                border: none;
                margin-left: 8px;
                color: #e74c3c;
                cursor: pointer;
                font-size: 12px;
            }
            
            .loading-members {
                text-align: center;
                padding: 40px;
                color: #7f8c8d;
            }
            
            .loading-members i {
                margin-right: 8px;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
                color: #95a5a6;
            }
            
            .empty-state i {
                font-size: 48px;
                margin-bottom: 16px;
                color: #bdc3c7;
            }
            
            .btn {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #3498db;
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #2980b9;
            }
            
            .btn-primary:disabled {
                background: #bdc3c7;
                cursor: not-allowed;
            }
            
            .btn-secondary {
                background: #f8f9fa;
                color: #2c3e50;
            }
            
            .btn-secondary:hover {
                background: #e9ecef;
            }
        `;
        document.head.appendChild(style);
       
const userStyles = document.createElement('style');
userStyles.textContent = `
    /* User item styles */
    .user-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 8px;
        margin: 4px 8px;
        background: rgba(255, 255, 255, 0.05);
    }
    
    .user-item:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(2px);
    }
    
    .user-avatar {
        position: relative;
        width: 42px;
        height: 42px;
        flex-shrink: 0;
    }
    
    .user-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(74, 144, 226, 0.3);
    }
    
    .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid rgba(30, 58, 95, 0.8);
    }
    
    .online-indicator.online {
        background: #5cb85c;
    }
    
    .online-indicator.offline {
        background: #95a5a6;
    }
    
    .user-details {
        flex: 1;
        min-width: 0;
    }
    
    .user-name {
        font-size: 14px;
        font-weight: 500;
        color: white;
        margin-bottom: 2px;
    }
    
    .user-department {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2px;
    }
    
    .user-employee-id {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
    }
    
    .user-status {
        flex-shrink: 0;
    }
    
    .status-text {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 500;
        white-space: nowrap;
    }
    
    .status-text.online {
        background: rgba(46, 204, 113, 0.15);
        color: #5cb85c;
    }
    
    .status-text.offline {
        background: rgba(149, 165, 166, 0.15);
        color: #95a5a6;
    }
    
    /* Users list container */
    .users-list-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 8px 0;
    }
    
    .users-list {
        flex: 1;
        overflow-y: auto;
        padding: 0 8px;
    }
    
    .users-list::-webkit-scrollbar {
        width: 6px;
    }
    
    .users-list::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .users-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    
    .users-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Status toggle */
    .status-toggle {
        display: flex;
        gap: 4px;
        background: rgba(0, 0, 0, 0.2);
        padding: 4px;
        border-radius: 12px;
        margin: 0 8px 12px 8px;
    }
    
    .status-btn {
        flex: 1;
        padding: 6px 12px;
        font-size: 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .status-btn.active {
        background: #4a90e2;
        color: white;
    }
    
    .status-btn:hover:not(.active) {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
    }
`;
document.head.appendChild(userStyles);

const searchStyles = document.createElement('style');
searchStyles.textContent = `
    /* Search bar styles */
    .search-bar {
        position: relative;
    }
    
    .search-bar input {
        width: 100%;
        padding: 10px 16px 10px 36px;
        border: none;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 13px;
        transition: all 0.3s ease;
    }
    
    .search-bar input:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
    }
    
    .search-bar input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
    
    /* Search icon */
    .search-bar i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
    }
    
    /* Clear search button */
    .clear-search-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: 50%;
        transition: all 0.3s ease;
        display: none;
    }
    
    .clear-search-btn:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.1);
    }
    
    /* Search results highlighting */
    .room-item .highlight {
        background-color: rgba(255, 255, 0, 0.2);
        color: #ffeb3b;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: bold;
    }
    
    /* No results message */
    .no-results {
        text-align: center;
        padding: 40px 20px;
        color: rgba(255, 255, 255, 0.5);
    }
    
    .no-results i {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.3;
    }
    
    .no-results p {
        margin-bottom: 8px;
        font-size: 14px;
    }
    
    .no-results small {
        font-size: 12px;
        opacity: 0.7;
    }
    
    /* Search statistics */
    .search-stats {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        padding: 8px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(searchStyles);
    }

 async openCreateRoomModal() {
    console.log('🚀 เปิด Modal สร้างห้อง...');

    // ---- รีเซ็ตค่าทั้งหมดก่อนเปิดใหม่ทุกครั้ง ----
    this.selectedMemberIds.clear(); 

    const roomNameInput  = document.getElementById('roomNameInput');
    const memberSearch   = document.getElementById('memberSearch');
    const roomNameCount  = document.getElementById('roomNameCount');

    if (roomNameInput) {
        roomNameInput.value = '';                         
        if (roomNameCount) roomNameCount.textContent = '0'; 
    }
    if (memberSearch) memberSearch.value = ''; 

  
    const groupRadio = document.querySelector('input[name="roomType"][value="group"]');
    if (groupRadio) groupRadio.checked = true;

    const modal = document.getElementById('createRoomModal');
    if (!modal) {
        console.error('❌ ไม่พบ element createRoomModal ใน HTML');
        return;
    }
    modal.classList.add('active'); 
    console.log('✅ Modal เปิดแล้ว');

    
    setTimeout(() => {
        if (roomNameInput) roomNameInput.focus();
    }, 300);

   
    await this.loadUsersForModal();
}
async loadUsersForModal() {
    console.log('📥 loadUsersForModal: กำลังโหลดรายชื่อสมาชิกเข้า Modal...');

    // ดึง element #membersList ซึ่งอยู่ใน Modal สร้างห้อง
    const membersList = document.getElementById('membersList');
    if (!membersList) {
        console.error('❌ ไม่พบ element #membersList ใน Modal');
        return;
    }

    // แสดง Loading spinner ขณะรอโหลดข้อมูล
    membersList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            <p style="margin: 0; font-size: 14px;">กำลังโหลดรายชื่อสมาชิก...</p>
        </div>
    `;

    try {
        // ดึง Token จาก localStorage เพื่อยืนยันตัวตน
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ Token กรุณาเข้าสู่ระบบใหม่');
        }

        console.log('📡 กำลังเรียก API /api/users...');

        // เรียก API เพื่อดึงรายชื่อผู้ใช้ทั้งหมด
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // ตรวจสอบว่า API ตอบกลับสำเร็จหรือไม่
        if (!response.ok) {
            throw new Error(`API ตอบกลับ Error: ${response.status} ${response.statusText}`);
        }

        // แปลงข้อมูลจาก JSON
        const data = await response.json();

        // เก็บรายชื่อผู้ใช้ทั้งหมดใน this.allUsers
        // เพื่อให้ฟังก์ชันอื่นๆ (เช่น renderMembersList, toggleMemberSelection) ใช้งานได้
        this.allUsers = data.users || [];

        console.log(`✅ โหลดสำเร็จ: พบผู้ใช้ ${this.allUsers.length} คน`);

        // ถ้าไม่มีผู้ใช้เลย
        if (this.allUsers.length === 0) {
            membersList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 30px; color: #95a5a6;">
                    <i class="fas fa-users" style="font-size: 36px; margin-bottom: 12px; display: block; color: #bdc3c7;"></i>
                    <p style="margin: 0 0 8px; font-weight: 600;">ไม่พบผู้ใช้งาน</p>
                    <small>ยังไม่มีผู้ใช้งานในระบบ</small>
                </div>
            `;
            return;
        }

        // แสดงรายชื่อผู้ใช้ใน Modal โดยเรียก renderMembersList()
        this.renderMembersList('');

    } catch (error) {
        // กรณีเกิดข้อผิดพลาด แสดงข้อความ Error และปุ่มลองใหม่
        console.error('❌ loadUsersForModal Error:', error.message);

        membersList.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 36px; margin-bottom: 12px; display: block;"></i>
                <p style="margin: 0 0 8px; font-weight: 600;">โหลดรายชื่อไม่สำเร็จ</p>
                <small style="color: #c0392b; display: block; margin-bottom: 16px;">
                    ${error.message}
                </small>
                <button
                    onclick="window.chatApp.loadUsersForModal()"
                    style="padding: 8px 20px; background: #3498db; color: white;
                           border: none; border-radius: 6px; cursor: pointer;
                           font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-redo"></i> ลองใหม่
                </button>
            </div>
        `;

        this.showNotification('โหลดข้อมูลล้มเหลว', error.message, 'error');
    }
}
// ฟังก์ชันแสดงสมาชิกในห้อง
async showRoomMembers() {
    if (!this.currentRoom) {
        this.showNotification('แจ้งเตือน', 'กรุณาเลือกห้องสนทนาก่อน', 'info');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/members`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            this.renderRoomMembersModal(data.members || []);
        } else {
            throw new Error('Failed to load room members');
        }
    } catch (error) {
        console.error('Error loading room members:', error);
        this.showNotification('โหลดข้อมูลล้มเหลว', 'ไม่สามารถโหลดข้อมูลสมาชิกในห้องได้', 'error');
    }
}

// ฟังก์ชันแสดง modal สมาชิกในห้อง
renderRoomMembersModal(members) {
    const modal = document.getElementById('roomMembersModal');
    const membersList = document.getElementById('roomMembersList');
    
    if (!modal || !membersList) {
        console.error('Room members modal elements not found');
        return;
    }
    
    if (!members || members.length === 0) {
        membersList.innerHTML = `
            <div class="empty-members">
                <i class="fas fa-user-slash"></i>
                <p>ไม่มีสมาชิกในห้องนี้</p>
            </div>
        `;
        modal.classList.add('active');
        return;
    }
    
    let html = '';
    
    // นับสมาชิกออนไลน์
    const onlineCount = members.filter(member => member.is_online).length;
    
    // Header with stats
    html += `
        <div class="members-header">
            <div class="members-stats">
                <span class="total-members">
                    <i class="fas fa-users"></i> ${members.length} สมาชิก
                </span>
                <span class="online-members">
                    <i class="fas fa-circle"></i> ${onlineCount} ออนไลน์
                </span>
            </div>
        </div>
    `;
    
    // Sort members: online first, then by name
    const sortedMembers = [...members].sort((a, b) => {
        // Online first
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        
        // Then by name
        return a.full_name.localeCompare(b.full_name);
    });
    
    // Member list
    sortedMembers.forEach(member => {
        const isCurrentUser = member.user_id === this.currentUser?.user_id;
        const profileImage = member.profile_image || '/assets/images/default-avatar.png';
        const isOnline = member.is_online === true || member.is_online === 1;
        
        html += `
            <div class="room-member-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="member-avatar">
                    <img src="${profileImage}" alt="${member.full_name}"
                         onerror="this.src='/assets/images/default-avatar.png'; this.onerror=null;">
                    <div class="member-online-indicator ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="member-details">
                    <div class="member-name">
                        ${member.full_name}
                        ${isCurrentUser ? '<span class="you-badge">คุณ</span>' : ''}
                    </div>
                    <div class="member-info">
                        <span class="member-department">${member.department_name || 'ไม่ระบุแผนก'}</span>
                        <span class="member-employee-id">${member.employee_id || ''}</span>
                    </div>
                </div>
                <div class="member-status">
                    <span class="member-status-text ${isOnline ? 'online' : 'offline'}">
                        ${isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                </div>
            </div>
        `;
    });
    
    membersList.innerHTML = html;
    
    // แสดง modal
    modal.classList.add('active');
}

  renderMembersList(searchQuery = '') {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;

    if (!this.allUsers || this.allUsers.length === 0) {
        membersList.innerHTML = `
            <div style="text-align:center; padding:30px; color:#95a5a6;">
                <i class="fas fa-user-slash" style="font-size:36px; display:block; margin-bottom:10px;"></i>
                <p>ไม่พบรายชื่อสมาชิก</p>
            </div>
        `;
        return;
    }

    // กรองตาม searchQuery
    const filteredUsers = this.allUsers.filter(user => {
        if (!searchQuery || searchQuery.trim() === '') return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            (user.full_name       || '').toLowerCase().includes(q) ||
            (user.email           || '').toLowerCase().includes(q) ||  
            (user.employee_id     || '').toLowerCase().includes(q) ||
            (user.department_name || '').toLowerCase().includes(q)
        );
    });

    if (filteredUsers.length === 0) {
        membersList.innerHTML = `
            <div style="text-align:center; padding:30px; color:#95a5a6;">
                <i class="fas fa-search" style="font-size:36px; display:block; margin-bottom:10px;"></i>
                <p>ไม่พบสมาชิกที่ค้นหา</p>
            </div>
        `;
        this.renderSelectedMembers();
        return;
    }

    let membersHTML = '';
    filteredUsers.forEach(user => {
        const isSelected = this.selectedMemberIds.has(user.user_id);
        const isOnline   = user.is_online === 1 || user.is_online === true;
        const initial    = user.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

        membersHTML += `
            <div class="member-item ${isSelected ? 'selected' : ''}"
                 data-user-id="${user.user_id}">

                <div class="member-avatar" style="position:relative; flex-shrink:0;">
                    ${user.profile_image
                        ? `<img src="${user.profile_image}" alt="${user.full_name}"
                                onerror="this.style.display='none';">`
                        : `<div style="width:40px;height:40px;border-radius:50%;background:#3498db;
                                       color:white;display:flex;align-items:center;justify-content:center;
                                       font-weight:bold;">${initial}</div>`
                    }
                    <div style="position:absolute;bottom:0;right:0;width:12px;height:12px;
                                border-radius:50%;border:2px solid white;
                                background:${isOnline ? '#2ecc71' : '#95a5a6'};"></div>
                </div>

                <div class="member-info">
                    <div class="member-name">${user.full_name || 'ไม่ระบุชื่อ'}</div>
                    <div class="member-email">
                        ${user.department_name || 'ไม่ระบุแผนก'}
                        ${user.employee_id ? ` · ${user.employee_id}` : ''}
                    </div>
                </div>

                <div class="member-checkbox">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;
    });

    membersList.innerHTML = membersHTML;
    this.renderSelectedMembers();

    membersList.querySelectorAll('.member-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = parseInt(item.dataset.userId);
            this.toggleMemberSelection(userId);
        });
    });
}

    renderSelectedMembers() {
        const selectedMembers = document.getElementById('selectedMembers');
        if (!selectedMembers) return;
        
        if (this.selectedMemberIds.size === 0) {
            selectedMembers.innerHTML = '<p class="hint">ยังไม่ได้เลือกสมาชิก</p>';
            return;
        }
        
        let selectedHTML = '';
        this.allUsers.forEach(user => {
            if (this.selectedMemberIds.has(user.user_id)) {
                selectedHTML += `
                    <div class="selected-member-tag">
                        ${user.full_name}
                        <button class="remove-member" data-user-id="${user.user_id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }
        });
        
        selectedMembers.innerHTML = selectedHTML;
        
        selectedMembers.querySelectorAll('.remove-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = parseInt(btn.dataset.userId);
                this.toggleMemberSelection(userId);
            });
        });
    }

    toggleMemberSelection(userId) {
        if (this.selectedMemberIds.has(userId)) {
            this.selectedMemberIds.delete(userId);
        } else {
            this.selectedMemberIds.add(userId);
        }
        
        this.renderMembersList(document.getElementById('memberSearch').value);
        this.validateCreateRoomForm();
    }

    validateCreateRoomForm() {
    const roomNameInput = document.getElementById('roomNameInput');
    const roomTypeRadio = document.querySelector('input[name="roomType"]:checked');
    const createButton = document.getElementById('confirmCreateRoom');
    
    if (!roomNameInput || !roomTypeRadio || !createButton) {
        console.warn('⚠️ Form elements not found');
        return false;
    }
    
    const roomName = roomNameInput.value.trim();
    const roomType = roomTypeRadio.value;
    
    let isValid = true;
    let errorMessage = '';
    
    //  ตรวจสอบชื่อห้อง
    if (roomName.length < 1) {
        isValid = false;
        errorMessage = 'กรุณาใส่ชื่อห้อง';
    } else if (roomName.length > 100) {
        isValid = false;
        errorMessage = 'ชื่อห้องยาวเกิน 100 ตัวอักษร';
    }
    
    //  ตรวจสอบสมาชิก
    if (isValid) {
        if (roomType === 'private' && this.selectedMemberIds.size !== 1) {
            isValid = false;
            errorMessage = 'ห้องส่วนตัวต้องเลือกสมาชิก 1 คน';
        } else if (roomType === 'group' && this.selectedMemberIds.size < 1) {
            isValid = false;
            errorMessage = 'กรุณาเลือกสมาชิกอย่างน้อย 1 คน';
        }
    }
    
    createButton.disabled = !isValid;
    
    //  แสดงข้อความ error (ถ้ามี element)
    const errorElement = document.getElementById('createRoomError');
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = errorMessage ? 'block' : 'none';
    }
    
    console.log(`✅ Form validation: ${isValid ? 'VALID' : 'INVALID'}`, {
        roomName: roomName.length,
        roomType,
        members: this.selectedMemberIds.size
    });
    
    return isValid;
}
async showAISummary() {
    if (!this.currentRoom) {
        this.showNotification('แจ้งเตือน', 'กรุณาเลือกห้องสนทนาก่อน', 'info');
        return;
    }
    
    // ตรวจสอบจำนวนข้อความในห้อง
    const messagesList = document.getElementById('messagesList');
    const messageCount = messagesList.querySelectorAll('.message').length;
    
    if (messageCount === 0) {
        this.showNotification('แจ้งเตือน', 'ยังไม่มีข้อความในห้องนี้', 'info');
        return;
    }
    
    //  แสดงตัวเลือกช่วงเวลา
    this.showDateRangePicker();
}
showDateRangePicker() {
    // ลบ modal เก่าถ้ามี
    const oldModal = document.getElementById('dateRangeModal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'dateRangeModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-alt"></i> เลือกช่วงเวลาสรุป</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div class="form-group">
                    <label>ห้อง: <strong>${this.currentRoom.room_name}</strong></label>
                    <p style="font-size: 13px; color: #7f8c8d; margin-top: 5px;">
                        <i class="fas fa-info-circle"></i> ข้อความในห้อง: ${document.getElementById('messagesList').querySelectorAll('.message').length} ข้อความ
                    </p>
                </div>
                
                <div class="form-group">
                    <label>ตัวเลือกช่วงเวลาด่วน</label>
                    <div style="display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap;">
                        <button class="btn-quick-date" data-days="1" style="flex:1; padding:8px;">วันนี้</button>
                        <button class="btn-quick-date" data-days="7" style="flex:1; padding:8px;">7 วัน</button>
                        <button class="btn-quick-date" data-days="30" style="flex:1; padding:8px;">30 วัน</button>
                        <button class="btn-quick-date" data-days="all" style="flex:1; padding:8px;">ทั้งหมด</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>วันที่เริ่มต้น</label>
                    <input type="date" id="startDate" class="form-control" 
                           style="width:100%; padding:10px; border:2px solid #e3e6f0; border-radius:8px;">
                </div>
                
                <div class="form-group">
                    <label>วันที่สิ้นสุด</label>
                    <input type="date" id="endDate" class="form-control"
                           style="width:100%; padding:10px; border:2px solid #e3e6f0; border-radius:8px;">
                </div>
                
                <div class="form-group">
                    <label>จำนวนข้อความสูงสุด</label>
                    <select id="messageCount" class="form-control" style="width:100%; padding:10px; border:2px solid #e3e6f0; border-radius:8px;">
                        <option value="50">50 ข้อความล่าสุด</option>
                        <option value="100" selected>100 ข้อความล่าสุด</option>
                        <option value="200">200 ข้อความล่าสุด</option>
                        <option value="500">500 ข้อความล่าสุด</option>
                    </select>
                </div>
                
                <div class="info-box" style="background:#f8f9fa; padding:15px; border-radius:8px; margin-top:15px;">
                    <p style="margin:5px 0; color:#6c757d; font-size:13px;">
                        <i class="fas fa-clock"></i> การสรุปอาจใช้เวลา 10-30 วินาที
                    </p>
                </div>
            </div>
            <div class="modal-footer" style="padding:15px 20px; border-top:1px solid #eee; display:flex; gap:10px; justify-content:flex-end;">
               <button class="btn btn-secondary close-modal" style="
                    padding: 10px 20px; 
                    background: #6c757d; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
                    font-weight: 500;
                    line-height: 1;
                ">
                    <i class="fas fa-times" style="font-size: 13px;"></i> ยกเลิก
                </button>
                <button id="confirmDateRange" class="btn btn-primary" style="padding:10px 20px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; border:none; border-radius:6px; cursor:pointer;">
                    <i class="fas fa-brain"></i> สรุปการสนทนา
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    document.getElementById('startDate').value = formatDate(sevenDaysAgo);
    document.getElementById('endDate').value = formatDate(today);
    

    modal.querySelectorAll('.btn-quick-date').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const days = e.target.dataset.days;
            const endDate = new Date();
            const startDate = new Date();
            
            if (days === 'all') {
                
                document.getElementById('startDate').value = '';
                document.getElementById('endDate').value = '';
            } else {
                startDate.setDate(endDate.getDate() - parseInt(days));
                document.getElementById('startDate').value = formatDate(startDate);
                document.getElementById('endDate').value = formatDate(endDate);
            }
        });
    });
    
   
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    

    document.getElementById('confirmDateRange').addEventListener('click', async () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const messageCount = document.getElementById('messageCount').value;
        
       
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            this.showNotification('ข้อผิดพลาด', 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', 'error');
            return;
        }
        
        modal.remove();
        
       
        this.showLoadingModal('กำลังสร้างสรุปการสนทนา...');
        
      
        await this.callSummaryAPI(startDate, endDate, messageCount);
    });
}
showSummaryResult(data) {

    const oldModal = document.getElementById('aiSummaryModal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'aiSummaryModal';
    
    const isFallback = data.used_fallback || false;
    const stats = data.stats || {};
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; width: 95%;">
            <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
                <h3 style="margin:0; display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-brain"></i> 
                    สรุปการสนทนาด้วย AI
                    ${isFallback ? '<span style="background:#ff6b6b; color:white; padding:4px 10px; border-radius:20px; font-size:12px; margin-left:10px;">ระบบสำรอง</span>' : ''}
                </h3>
                <button class="close-modal" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 25px; max-height: 70vh; overflow-y: auto;">
                ${isFallback ? `
                <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>หมายเหตุ:</strong> ระบบ AI หลักไม่พร้อมใช้งาน ใช้ข้อมูลสำรองแทน
                </div>
                ` : ''}
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 20px;">
                    <div><strong>📌 ห้อง:</strong> ${stats.room_name || this.currentRoom.room_name}</div>
                    <div><strong>💬 ข้อความ:</strong> ${stats.message_count || 0} ข้อความ</div>
                   
                    <div><strong>📅 ช่วงเวลา:</strong> ${stats.timeframe || 'ไม่ระบุ'}</div>
                </div>
                
                <div class="summary-content" style="white-space: pre-line; line-height: 1.8; font-size: 15px; background: white; padding: 20px; border-radius: 8px; border: 1px solid #e3e6f0;">
                    ${this.formatSummary(data.summary)}
                </div>
            </div>
            
            <div class="modal-footer" style="padding: 15px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; background: #f8fafc;">
                <button class="btn btn-secondary close-modal" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-times"></i> ปิด
                </button>
                
                <button id="copySummaryBtn" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-copy"></i> คัดลอก
                </button>
                
                <button id="saveSummaryBtn" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-save"></i> บันทึก
                </button>
                
                
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // ปุ่มคัดลอก
    document.getElementById('copySummaryBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(data.summary).then(() => {
            this.showNotification('สำเร็จ', 'คัดลอกสรุปแล้ว', 'success');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = data.summary;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('สำเร็จ', 'คัดลอกสรุปแล้ว', 'success');
        });
    });
    
    // ปุ่มบันทึก
    document.getElementById('saveSummaryBtn').addEventListener('click', async () => {
        await this.saveSummary(data.summary);
    });
    
    // ปุ่มดูรายงาน
    document.getElementById('openReportBtn').addEventListener('click', () => {
        this.openReportPage(data.summary, this.currentRoom);
    });
}


async callSummaryAPI(startDate, endDate, messageCount) {
    try {
        const aiSummarizer = new ChatSummaryAI();
        
        const result = await aiSummarizer.summarize({
            room_id: this.currentRoom.room_id,
            message_count: parseInt(messageCount),
            start_date: startDate || null,
            end_date: endDate || null
        });
        
        // ปิด loading modal
        this.closeLoadingModal();
        
        if (result.success) {
            // แสดงผลสรุป
            this.showSummaryResult({
                summary: result.summary,
                summary_id: result.summary_id,
                report_url: result.report_url,
                used_fallback: result.used_fallback,
                stats: result.stats
            });
        } else {
            // แสดง error
            this.showNotification('เกิดข้อผิดพลาด', result.error, 'error');
            
            // ถ้าเป็น rate limit ให้แจ้งเตือนพิเศษ
            if (result.rateLimited) {
                this.showNotification('จำกัดการใช้งาน', result.error, 'warning');
            }
        }
    } catch (error) {
        this.closeLoadingModal();
        console.error('AI Summary error:', error);
        this.showNotification('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
}
showMockAISummary() {
    const mockSummary = `# สรุปการสนทนา - ${this.currentRoom.room_name}
    
**วันที่:** ${new Date().toLocaleDateString('th-TH')}
**เวลา:** ${new Date().toLocaleTimeString('th-TH')}

## 📊 ข้อมูลการสนทนา
- **ห้อง:** ${this.currentRoom.room_name}
- **ประเภท:** ${this.currentRoom.room_type}
- **เวลาสนทนา:** ประมาณ 30 นาที
- **จำนวนข้อความ:** ประมาณ 20 ข้อความ

## 🎯 ประเด็นสำคัญ
1. การอัพเดตสถานะผู้ป่วย
2. การประสานงานระหว่างแผนก
3. การวางแผนการรักษาต่อไป
4. การสั่งซื้อวัสดุและอุปกรณ์

## 📋 ข้อตกลงและมติ
- นัดหมายผู้ป่วยรายสำคัญในสัปดาห์หน้า
- ส่งรายงานสรุปให้หัวหน้าแผนก
- อัพเดตระบบบันทึกข้อมูลผู้ป่วย

## 🚀 แผนการดำเนินงาน
1. ติดตามผลการรักษา
2. เตรียมเอกสารสำหรับการประชุมครั้งหน้า
3. อัพเดตข้อมูลในระบบให้ครบถ้วน

---
*สรุปโดยระบบ AI - รุ่นทดสอบ*`;

    this.createAndShowSummaryModal(mockSummary);
}

createSummaryModal() {
    
    const oldModal = document.getElementById('aiSummaryModal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'aiSummaryModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-brain"></i> สรุปการสนทนาด้วย AI</h3>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body" id="summaryContent" style="max-height: 60vh; overflow-y: auto; padding: 20px;">
                <!-- Summary will be displayed here -->
                <div class="loading-summary" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3498db;"></i>
                    <p style="margin-top: 20px;">กำลังโหลดสรุป...</p>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #eee;">
                <button class="btn btn-secondary close-modal">ปิด</button>
                <button class="btn btn-primary" id="copySummaryBtn" style="background: #3498db;">
                    <i class="fas fa-copy"></i> คัดลอก
                </button>
                <button class="btn btn-success" id="saveSummaryBtn" style="background: #27ae60;">
                    <i class="fas fa-save"></i> บันทึก
                </button>
                <button class="btn btn-purple" id="viewReportBtn" style="background: #9b59b6;">
                    <i class="fas fa-file-alt"></i> ดูรายงาน
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // แสดง modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Event listeners
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

displaySummary(summary, stats, summaryId = null, reportUrl = null) {
    const summaryContent = document.getElementById('summaryContent');
    
   
    if (!reportUrl && summaryId && stats.room_id) {
        reportUrl = `/report?id=${summaryId}&room_id=${stats.room_id}`;
    }
    
    summaryContent.innerHTML = `
        <div class="summary-result">
            <div class="summary-stats">
                <div class="stat-item">
                    <i class="fas fa-comments"></i>
                    <span>${stats.message_count} ข้อความ</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-clock"></i>
                    <span>${stats.timeframe}</span>
                </div>
                ${stats.date ? `
                <div class="stat-item">
                    <i class="fas fa-calendar"></i>
                    <span>${stats.date}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="summary-text">
                ${this.formatSummary(summary)}
            </div>
            
            ${reportUrl ? `
            <div class="summary-actions">
                <button class="btn-view-report" onclick="window.open('${reportUrl}', '_blank', 'width=1200,height=800')">
                    <i class="fas fa-file-alt"></i> สรุปผลรายงาน
                </button>
                <small class="text-muted">
                    <i class="fas fa-info-circle"></i> รายงานจะแสดงในรูปแบบมืออาชีพ พร้อมพิมพ์เป็นเอกสาร A4
                </small>
            </div>
            ` : ''}
        </div>
    `;
    
    this.setupSummaryModalButtons(summaryId, stats.room_id, summary, reportUrl);
    
}

setupSummaryModalButtons(summaryId, roomId, summary, reportUrl = null) {
    
    if (!reportUrl && summaryId && roomId) {
        reportUrl = `/report?id=${summaryId}&room_id=${roomId}`;
    }
    

    const copyBtn = document.getElementById('copySummaryBtn');
    if (copyBtn) {
        
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        
      
        newCopyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(summary);
                
                // แสดงสถานะสำเร็จ
                const originalHTML = newCopyBtn.innerHTML;
                newCopyBtn.innerHTML = '<i class="fas fa-check"></i> คัดลอกแล้ว';
                newCopyBtn.style.background = '#2ecc71';
                newCopyBtn.disabled = true;
                
                setTimeout(() => {
                    newCopyBtn.innerHTML = originalHTML;
                    newCopyBtn.style.background = '';
                    newCopyBtn.disabled = false;
                }, 2000);
                
                this.showNotification('สำเร็จ', 'คัดลอกสรุปแล้ว', 'success');
            } catch (error) {
                console.error('Copy error:', error);
                
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = summary;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    this.showNotification('สำเร็จ', 'คัดลอกสรุปแล้ว', 'success');
                } catch (err) {
                    this.showNotification('ผิดพลาด', 'ไม่สามารถคัดลอกได้', 'error');
                }
                
                document.body.removeChild(textarea);
            }
        });
    }
    
    // ปุ่มบันทึก
    const saveBtn = document.getElementById('saveSummaryBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', async () => {
            // แสดง loading
            const originalHTML = newSaveBtn.innerHTML;
            newSaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
            newSaveBtn.disabled = true;
            
            try {
                const result = await this.saveSummary(summary);
                if (result) {
                    // แสดงสถานะสำเร็จ
                    newSaveBtn.innerHTML = '<i class="fas fa-check"></i> บันทึกแล้ว';
                    newSaveBtn.style.background = '#2ecc71';
                    
                    setTimeout(() => {
                        newSaveBtn.innerHTML = originalHTML;
                        newSaveBtn.style.background = '';
                        newSaveBtn.disabled = false;
                    }, 2000);
                }
            } catch (error) {
                // แสดงสถานะผิดพลาด
                newSaveBtn.innerHTML = '<i class="fas fa-times"></i> ล้มเหลว';
                newSaveBtn.style.background = '#e74c3c';
                
                setTimeout(() => {
                    newSaveBtn.innerHTML = originalHTML;
                    newSaveBtn.style.background = '';
                    newSaveBtn.disabled = false;
                }, 2000);
            }
        });
    }
    
    // ปุ่มดูรายงาน
    const viewReportBtn = document.getElementById('viewReportBtn');
    if (viewReportBtn && reportUrl) {
        const newViewReportBtn = viewReportBtn.cloneNode(true);
        viewReportBtn.parentNode.replaceChild(newViewReportBtn, viewReportBtn);
        
        newViewReportBtn.addEventListener('click', () => {
 this.openReportPage(summary, { room_id: roomId, room_name: stats.room_name });            window.open(reportUrl, '_blank', 'width=1200,height=800');
        });
        
        // เปลี่ยนสีปุ่มเป็นเขียว
        newViewReportBtn.style.background = '#27ae60';
        newViewReportBtn.style.borderColor = '#27ae60';
    }
}
    // ฟังก์ชันเปิดหน้ารายงาน
    openReportPage(summaryText, roomData) {
        try {
            const room = roomData || this.currentRoom;
            
            if (!room) {
                this.showNotification('แจ้งเตือน', 'ไม่พบข้อมูลห้อง', 'error');
                return;
            }
            
            // เตรียมข้อมูลที่จะส่งไปยังหน้า report
            const reportData = {
                summary: summaryText,
                room_name: room.room_name || 'ไม่ระบุห้อง',
                room_id: room.room_id || null,
                date: new Date().toLocaleDateString('th-TH'),
                time: new Date().toLocaleTimeString('th-TH')
            };
            
            console.log('📋 Opening report page with data:', reportData);
            
            // เก็บข้อมูลใน sessionStorage
            sessionStorage.setItem('reportData', JSON.stringify(reportData));
            
            // เปิดหน้า report ในแท็บใหม่
            window.open('/report', '_blank');
            
            this.showNotification('เปิดรายงาน', 'กำลังเปิดหน้ารายงาน...', 'success');
        } catch (error) {
            console.error('❌ เปิดหน้ารายงานผิดพลาด:', error);
            this.showNotification('ผิดพลาด', 'ไม่สามารถเปิดหน้ารายงานได้', 'error');
        }
    }
formatSummary(summary) {
    if (!summary) return '<p class="text-muted">ไม่มีข้อมูล</p>';
    
    // แปลง markdown เป็น HTML อย่างง่าย
    let html = summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\n/g, '<br>');
    
    // จัดการกับ bullet points
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return html;
}
// ฟังก์ชันแสดง Loading Modal
showLoadingModal(message) {
    // ลบ modal เก่าถ้ามี
    const oldModal = document.getElementById('loadingModal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'loadingModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center;">
            <div class="modal-body" style="padding: 40px;">
                <div class="loading-spinner" style="margin: 0 auto 20px; width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h3 style="margin-bottom: 10px; color: #2c3e50;">${message || 'กำลังดำเนินการ...'}</h3>
                <p style="color: #7f8c8d;">กรุณารอสักครู่</p>
                <p style="color: #95a5a6; font-size: 12px; margin-top: 20px;">
                    <i class="fas fa-clock"></i> อาจใช้เวลา 10-30 วินาที
                </p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(modal);
}

// ฟังก์ชันปิด Loading Modal
closeLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.remove();
}
async saveSummary(summary) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chat-summary/save', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_id: this.currentRoom.room_id,
                summary_text: summary,
                summary_title: `สรุป: ${this.currentRoom.room_name}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showNotification('สำเร็จ', 'บันทึกสรุปแล้ว', 'success');
            
            
            const viewReportBtn = document.getElementById('viewReportBtn');
            if (viewReportBtn && data.report_url) {
                viewReportBtn.onclick = () => {
                    window.open(data.report_url, '_blank', 'width=1200,height=800');
                };
            }
            
            return data; 
        } else {
            throw new Error(data.error || 'บันทึกล้มเหลว');
        }
    } catch (error) {
        console.error('Save summary error:', error);
        this.showNotification('ผิดพลาด', error.message, 'error');
        throw error;
    }
}

   async createRoom() {
    try {
        console.log('🚀 Starting createRoom function...');
        
        if (!this.validateCreateRoomForm()) {
            this.showNotification('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
            return;
        }
        
        const roomName = document.getElementById('roomNameInput').value.trim();
        const roomType = document.querySelector('input[name="roomType"]:checked').value;
        const memberIds = Array.from(this.selectedMemberIds);
        
        console.log('📋 Room creation data:', { 
            roomName, 
            roomType, 
            memberIds,
            memberCount: memberIds.length 
        });
        
        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('ล้มเหลว', 'กรุณาเข้าสู่ระบบใหม่', 'error');
            window.location.href = '/login';
            return;
        }
        
        console.log('📤 Sending request to API...');
        
        const response = await fetch('/api/chat-rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_name: roomName,
                room_type: roomType,
                member_ids: memberIds
            })
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Room created successfully:', data);
            
            this.closeCreateRoomModal();
            this.showNotification('สร้างห้องสำเร็จ', `สร้างห้อง "${roomName}" สำเร็จ`, 'success');
            
            
            await this.loadChatRooms();
            
            
            if (this.socket && this.socket.connected) {
                this.socket.emit('room_created', {
                    room_id: data.room.room_id,
                    room_name: roomName,
                    member_ids: data.member_ids || memberIds,
                    message: `สร้างห้อง "${roomName}" สำเร็จ`
                });
            }
            
           
            if (data.room) {
                setTimeout(() => {
                    console.log('🎯 Selecting newly created room:', data.room.room_id);
                    this.selectRoom(data.room);
                }, 1000);
            }
            
        } else {
            const errorData = await response.json();
            console.error('❌ Create room failed:', errorData);
            
            let errorMessage = 'สร้างห้องล้มเหลว';
            if (errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData.details) {
                errorMessage = errorData.details;
            }
            
            this.showNotification('สร้างห้องล้มเหลว', errorMessage, 'error');
        }
    } catch (error) {
        console.error('❌ Create room error:', error);
        this.showNotification('สร้างห้องล้มเหลว', error.message, 'error');
    }
}

    closeCreateRoomModal() {
        document.getElementById('createRoomModal').classList.remove('active');
    }

   setupCreateRoomModalEvents() {
   
    const createRoomBtn = document.getElementById('createRoomBtn');
    const newGroupBtn = document.getElementById('newGroupBtn');
    
   
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔘 Create Room button clicked');
            this.openCreateRoomModal();
        });
    }
    
    if (newGroupBtn) {
        newGroupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔘 New Group button clicked');
            this.openCreateRoomModal();
        });
    }
    
    // ปุ่มปิด modal
    document.querySelectorAll('#createRoomModal .close-modal, #cancelCreateRoom').forEach(btn => {
        btn.addEventListener('click', () => this.closeCreateRoomModal());
    });
    
    // ปุ่มยืนยันสร้างห้อง
    const confirmBtn = document.getElementById('confirmCreateRoom');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔘 Confirm Create button clicked');
            this.createRoom();
        });
    }
    
    // ช่องพิมพ์ชื่อห้อง
    const roomNameInput = document.getElementById('roomNameInput');
    if (roomNameInput) {
        roomNameInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const counter = document.getElementById('roomNameCount');
            if (counter) counter.textContent = count;
            this.validateCreateRoomForm();
        });
    }
    
    // ช่องค้นหาสมาชิก
    const memberSearch = document.getElementById('memberSearch');
if (memberSearch) {
    memberSearch.addEventListener('input', (e) => {
        
        this.renderMembersList(e.target.value);
    });
}
    
    // Radio button ประเภทห้อง
    document.querySelectorAll('input[name="roomType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            console.log('📻 Room type changed:', radio.value);
            this.validateCreateRoomForm();
        });
    });
    
    
    const modal = document.getElementById('createRoomModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'createRoomModal') {
                this.closeCreateRoomModal();
            }
        });
    }
    
    console.log('✅ Create room modal events setup complete');
}
    // ========================================
    // SETUP EVENT LISTENERS
    // ========================================

  async uploadFiles(files) {
    if (!this.currentRoom || !this.currentRoom.room_id) {
        console.error('❌ No room selected');
        this.showNotification('แจ้งเตือน', 'กรุณาเลือกห้องสนทนาก่อน', 'info');
        return;
    }
    
    console.log('📤 Uploading files to room:', this.currentRoom.room_id);
    console.log('📤 Files count:', files.length);
    
    for (const file of files) {
        console.log('📄 Processing file:', file.name, 'size:', file.size, 'type:', file.type);
        
       
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('ไฟล์ใหญ่เกิน', `${file.name} มีขนาดเกิน 10MB`, 'error');
            continue;
        }
        
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message_type', file.type.startsWith('image/') ? 'image' : 'file');
        formData.append('message_text', `ส่งไฟล์: ${file.name}`);
        
        //  Optimistic UI
        const tempId = 'temp_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const isImage = file.type.startsWith('image/');
        
        const tempMessage = {
            message_id: tempId,
            message_text: `ส่งไฟล์: ${file.name}`,
            message_type: isImage ? 'image' : 'file',
            file_url: isImage ? URL.createObjectURL(file) : null,
            file_name: file.name,
            file_size: file.size,
            sender_id: this.currentUser.user_id,
            full_name: this.currentUser.full_name,
            profile_image: this.currentUser.profile_image,
            created_at: new Date().toISOString()
        };
        
        this.addOptimisticMessage(tempMessage);
        
        try {
            const token = localStorage.getItem('token');
            
            console.log('📤 Sending file to API...');
            const response = await fetch(`/api/chat-rooms/${this.currentRoom.room_id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    
                },
                body: formData
            });
            
            console.log('📥 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Upload success:', data);
                
                
                this.replaceTempMessage(tempId, data.message || data);
                
                this.showNotification('สำเร็จ', `ส่งไฟล์ ${file.name} แล้ว`, 'success');
            } else {
                this.removeTempMessage(tempId);
                
                let errorMessage = 'อัปโหลดไฟล์ไม่สำเร็จ';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                    console.error('❌ Upload failed:', error);
                } catch (e) {
                    console.error('❌ Upload failed with status:', response.status);
                }
                
                this.showNotification('ล้มเหลว', errorMessage, 'error');
            }
        } catch (error) {
            this.removeTempMessage(tempId);
            console.error('❌ Upload error:', error);
            this.showNotification('ผิดพลาด', `เกิดข้อผิดพลาดในการอัปโหลด ${file.name}`, 'error');
        }
    }
}
  setupTTSEventListeners() {
    const ttsToggleBtn = document.getElementById('ttsToggleBtn');
    if (ttsToggleBtn) {
        ttsToggleBtn.addEventListener('click', () => this.toggleTTS());
    }

    const ttsSettingsBtn = document.getElementById('ttsSettingsBtn');
    if (ttsSettingsBtn) {
        ttsSettingsBtn.addEventListener('click', () => {
            document.getElementById('ttsSettingsModal').classList.add('active');
            
            // โหลดค่าปัจจุบัน
            const speed = localStorage.getItem('ttsSpeed') || '1.0';
            const volume = localStorage.getItem('ttsVolume') || '0.8';
            
            const speedInput = document.getElementById('ttsSpeed');
            const volumeInput = document.getElementById('ttsVolume');
            const speedValue = document.getElementById('ttsSpeedValue');
            const volumeValue = document.getElementById('ttsVolumeValue');
            
            if (speedInput) {
                speedInput.value = speed;
                if (speedValue) speedValue.textContent = parseFloat(speed).toFixed(1) + 'x';
            }
            
            if (volumeInput) {
                volumeInput.value = volume;
                if (volumeValue) volumeValue.textContent = Math.round(parseFloat(volume) * 100) + '%';
            }
        });
    }

    const testTTSBtn = document.getElementById('testTTSBtn');
    if (testTTSBtn) {
        testTTSBtn.addEventListener('click', () => {
            const testText = document.getElementById('ttsTestText')?.value || 'สวัสดีครับ';
            this.speakText(testText, true);
        });
    }

    const saveTTSSettings = document.getElementById('saveTTSSettings');
    if (saveTTSSettings) {
        saveTTSSettings.addEventListener('click', () => {
            this.saveTTSPreferences();
            document.getElementById('ttsSettingsModal').classList.remove('active');
        });
    }

    document.querySelectorAll('#ttsSettingsModal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('ttsSettingsModal').classList.remove('active');
        });
    });

    const ttsSpeed = document.getElementById('ttsSpeed');
    if (ttsSpeed) {
        ttsSpeed.addEventListener('input', function() {
            const value = parseFloat(this.value).toFixed(1);
            document.getElementById('ttsSpeedValue').textContent = value + 'x';
        });
    }

    const ttsVolume = document.getElementById('ttsVolume');
    if (ttsVolume) {
        ttsVolume.addEventListener('input', function() {
            const value = Math.round(parseFloat(this.value) * 100);
            document.getElementById('ttsVolumeValue').textContent = value + '%';
        });
    }
}
// ========================================
// SETUP EVENT LISTENERS
// ========================================

setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    //  Room members button
    const roomMembersBtn = document.getElementById('roomMembersBtn');
    if (roomMembersBtn) {
        roomMembersBtn.addEventListener('click', () => {
            this.showRoomMembers();
        });
    }

    //  AI Summary button
    const aiSummaryBtn = document.getElementById('aiSummaryBtn');
    if (aiSummaryBtn) {
        aiSummaryBtn.addEventListener('click', () => this.showAISummary());
    }

    // ✅ Add to room button
    const addToRoomBtn = document.getElementById('addToRoomBtn');
    if (addToRoomBtn) {
        addToRoomBtn.addEventListener('click', () => {
            this.showAddMembersModal();
        });
    }
    
    // Leave room button
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            this.leaveRoom();
        });
    }
    
    //  Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/profile.html';
        });
    }
    
    //  Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('🚪 Setting up logout button...');
        
        
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Logout button clicked - ONCE');
            this.logout();
        });
        
        console.log('✅ Logout button setup complete');
    }
 //  File attachment
const attachFileBtn = document.getElementById('attachFileBtn');
const fileInput = document.getElementById('fileInput');

if (attachFileBtn && fileInput) {
   
    const newAttachBtn = attachFileBtn.cloneNode(true);
    attachFileBtn.parentNode.replaceChild(newAttachBtn, attachFileBtn);
    
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    newAttachBtn.addEventListener('click', () => {
        console.log('📎 Attach button clicked, currentRoom:', this.currentRoom);
        
        if (!this.currentRoom || !this.currentRoom.room_id) {
            console.log('❌ No room selected');
            
            return;
        }
        
        console.log('✅ Room OK, opening file chooser');
        newFileInput.click();
    });
   newFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    console.log('📎 Files selected:', files);
    
   
    if (files.length > 0) {
        console.log('📎 Showing preview for', files.length, 'files');
        this.showFilePreview(files);
    }
});
}
    //  Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        
        const newMessageInput = messageInput.cloneNode(true);
        messageInput.parentNode.replaceChild(newMessageInput, messageInput);
        
       
        newMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (window.chatApp) {
                    window.chatApp.handleSendMessage();
                }
            }
        });
        
        newMessageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            document.getElementById('characterCount').textContent = `${this.value.length}/1000`;
        });
    }
    
   // Send message button - ต้องใช้ handleSendMessage
const sendMessageBtn = document.getElementById('sendMessageBtn');
if (sendMessageBtn) {
    
    const newSendBtn = sendMessageBtn.cloneNode(true);
    sendMessageBtn.parentNode.replaceChild(newSendBtn, sendMessageBtn);
    
    
    newSendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔘 Send button clicked');
        if (this.currentRoom) {
            this.handleSendMessage();  
        } else {
            this.showNotification('แจ้งเตือน', 'กรุณาเลือกห้องสนทนาก่อน', 'info');
        }
    });
}
}
    clearChatArea() {
        document.getElementById('currentRoomName').textContent = 'เลือกห้องสนทนา';
        document.getElementById('currentRoomInfo').textContent = 'เลือกห้องสนทนาด้านซ้ายเพื่อเริ่มสนทนา';
        
        const badgeElement = document.getElementById('roomTypeBadge');
        if (badgeElement) badgeElement.style.display = 'none';
        
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comment-dots"></i>
                <h3>ยินดีต้อนรับสู่ระบบสื่อสารภายในโรงพยาบาล</h3>
                <p>เลือกห้องสนทนาด้านซ้ายเพื่อเริ่มการสนทนา</p>
            </div>
        `;
        
        this.showMessageInput(false);
        document.getElementById('addToRoomBtn').style.display = 'none';
        document.getElementById('leaveRoomBtn').style.display = 'none';
        document.getElementById('roomSettingsBtn').style.display = 'none';
    }

    debugChatData() {
        console.log('🔍 === DEBUG CHAT DATA ===');
        console.log('Current User:', this.currentUser);
        console.log('Current Room:', this.currentRoom);
        console.log('Rooms:', this.rooms);
        console.log('Socket connected:', this.socket?.connected);
        console.log('Socket ID:', this.socket?.id);
        console.log('TTS Enabled:', this.ttsEnabled);
        console.log('TTS Supported:', this.ttsSupported);
        console.log('All Users:', this.allUsers);
        console.log('Selected Members:', this.selectedMemberIds);
        console.log('================================');
    }

    addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🔧';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #f39c12;
            color: white;
            border: none;
            cursor: pointer;
            z-index: 9999;
            font-size: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        debugBtn.onclick = () => {
            this.debugChatData();
            alert('ตรวจสอบ Console (F12)');
        };
        document.body.appendChild(debugBtn);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(title, message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        if (!toast) return;
        
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        
        if (toastTitle) toastTitle.innerHTML = `<i class="${icon}"></i> ${title}`;
        if (toastMessage) toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
        
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = () => toast.classList.remove('show');
        }
    }
    
   showProfileModal() {
    console.log('🔍 Checking profile modal...');
    
    
    const modal = document.getElementById('profileModal');
    
    if (!modal) {
        console.error('❌ profileModal not found in DOM');
        this.showNotification('ข้อผิดพลาด', 'ไม่พบหน้าตั้งค่าโปรไฟล์', 'error');
        return;
    }
    
    console.log('✅ Found profile modal');
    
    
    if (this.currentUser) {
        // อัพเดทรูปโปรไฟล์
        const profileImg = modal.querySelector('.profile-img');
        if (profileImg) {
            profileImg.src = this.currentUser.profile_image || '/assets/images/default-avatar.png';
            profileImg.onerror = function() {
                this.src = '/assets/images/default-avatar.png';
                this.onerror = null;
            };
        }
        
        // อัพเดทข้อมูลต่างๆ
        const employeeIdEl = modal.querySelector('#employeeId');
        const usernameEl = modal.querySelector('#username');
        const fullNameEl = modal.querySelector('#fullName');
        const emailEl = modal.querySelector('#email');
        const departmentEl = modal.querySelector('#department');
        
        if (employeeIdEl) employeeIdEl.value = this.currentUser.employee_id || '';
        if (usernameEl) usernameEl.value = this.currentUser.username || '';
        if (fullNameEl) fullNameEl.value = this.currentUser.full_name || '';
        if (emailEl) emailEl.value = this.currentUser.email || '';
        if (departmentEl) departmentEl.value = this.currentUser.department_name || 'ไม่ระบุแผนก';
        
        // แสดงชื่อในหัวข้อ modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `โปรไฟล์ของ ${this.currentUser.full_name || 'ผู้ใช้'}`;
        }
    }
    
 
    modal.classList.add('active');
    console.log('📱 Profile modal opened successfully');
}


editProfile() {
    alert('หน้าต่างแก้ไขโปรไฟล์จะเปิดที่นี่');
    
}


changePassword() {
    alert('หน้าต่างเปลี่ยนรหัสผ่านจะเปิดที่นี่');
    
}
  logout() {
   
    if (this.isLoggingOut) {
        console.log('⚠️ Already logging out, skip...');
        return;
    }
    
    this.isLoggingOut = true;
    console.log('🚪 Logout function called');
    
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
        console.log('✅ User confirmed logout');
        
       
        if (this.ttsSupported && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
       
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
        }
        
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        
        window.location.href = '/login';
    } else {
        console.log('❌ User cancelled logout');
        this.isLoggingOut = false;
    }
}
    
    handleUserOnline(userId) {
        console.log(`User ${userId} is online`);
    }
    
    handleUserOffline(userId) {
        console.log(`User ${userId} is offline`);
    }
    
    createFileMessageContent(message) {
        return `<div class="file-message">ไฟล์: ${message.file_url}</div>`;
    }
    updateUserData(updatedUser) {
    this.currentUser = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    this.updateUserProfile();
    console.log('✅ อัปเดต user data แล้ว:', updatedUser);
}
}
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

           
            if (response.status === 429) {
                return {
                    success: false,
                    error: data.error || 'สรุปข้อความได้ 10 ครั้งต่อชั่วโมง กรุณารอ 1 ชั่วโมงแล้วลองใหม่',
                    rateLimited: true
                };
            }

            
            if (!response.ok) {
                throw new Error(data.error || `เกิดข้อผิดพลาด (${response.status})`);
            }

            if (!data.success) {
                throw new Error(data.error || 'สรุปไม่สำเร็จ');
            }

            console.log('✅ Summary received from server');

          
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

    
    isActive() {
        return this.isSummarizing;
    }

    
    cancel() {
        this.isSummarizing = false;
        console.log('🛑 Summary cancelled');
    }
}

// =====================================================================
// END of Chat Summary AI Module
// =====================================================================
// Initialize the chat app
window.chatApp = new EnhancedChatApp();