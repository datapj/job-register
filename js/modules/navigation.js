// JS/modules/navigation.js - จัดการการสลับ Tab, ย่อ Sidebar และ Modal

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function switchTab(tabName) {
    const contactsSec = document.getElementById('contactsSection');
    const attendanceSec = document.getElementById('attendanceSection');
    const profileSec = document.getElementById('profileSection');

    if (contactsSec) contactsSec.style.display = 'none';
    if (attendanceSec) attendanceSec.style.display = 'none';
    if (profileSec) profileSec.style.display = 'none';

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    if (tabName === 'contacts') {
        if (contactsSec) contactsSec.style.display = 'block';
        document.getElementById('menuContacts')?.classList.add('active');
        document.getElementById('pageTitle').innerText = 'รายการผู้ติดต่อ';
    } else if (tabName === 'attendance') {
        if (attendanceSec) attendanceSec.style.display = 'block';
        document.getElementById('menuAttendance')?.classList.add('active');
        document.getElementById('pageTitle').innerText = 'ตารางงาน / เช็กชื่อ';
    } else if (tabName === 'profile') {
        if (profileSec) profileSec.style.display = 'block';
        document.getElementById('menuProfile')?.classList.add('active');
        document.getElementById('pageTitle').innerText = 'จัดการข้อมูลส่วนตัว';
    }
}

// JS/modules/navigation.js

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

// ผูกฟังก์ชันไว้กับ window ให้ HTML เรียกใช้ได้เสมอ
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;

function openAttendanceModal() {
    document.getElementById('attendanceModal')?.classList.add('show');
}

function closeAttendanceModal() {
    document.getElementById('attendanceModal')?.classList.remove('show');
}

function closeModalOnBackdrop(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}