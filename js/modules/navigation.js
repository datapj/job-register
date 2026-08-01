// JS/modules/navigation.js - จัดการการสลับ Tab, ย่อ Sidebar และ Modal

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function switchTab(tabName) {
    const contactsSec = document.getElementById('contactsSection');
    const profileSec = document.getElementById('profileSection');

    if (contactsSec) contactsSec.style.display = 'none';
    if (profileSec) profileSec.style.display = 'none';

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    if (tabName === 'contacts') {
        if (contactsSec) contactsSec.style.display = 'block';
        document.getElementById('menuContacts')?.classList.add('active');
        document.getElementById('pageTitle').innerText = 'รายการผู้ติดต่อ';
    } else if (tabName === 'profile') {
        if (profileSec) profileSec.style.display = 'block';
        document.getElementById('menuProfile')?.classList.add('active');
        document.getElementById('pageTitle').innerText = 'จัดการข้อมูลส่วนตัว';
    }
}

// --- Management Modal: Settings ---
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('หา element id="settingsModal" ไม่พบ');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ฟังก์ชันคลิกพื้นที่ภายนอก (Backdrop) เพื่อปิด Modal
function closeModalOnBackdrop(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// ----------------------------------------------------
// ผูกฟังก์ชันทั้งหมดไว้กับ window เพื่อให้ HTML เรียกใช้ผ่าน onclick ได้แน่นอน
// ----------------------------------------------------
window.toggleSidebar = toggleSidebar;
window.switchTab = switchTab;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.closeModalOnBackdrop = closeModalOnBackdrop;