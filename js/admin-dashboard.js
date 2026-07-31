// JS/admin-dashboard.js - ไฟล์หลักสำหรับสั่งรันระบบทันทีที่โหลดหน้าเว็บเสร็จ

document.addEventListener('DOMContentLoaded', () => {
    // 1. โหลดข้อมูลตารางและกราฟผู้ติดต่อ
    if (typeof renderTable === 'function') renderTable();
    if (typeof initContactChart === 'function') initContactChart();

    // 2. โหลดข้อมูลตารางงาน / เช็กชื่อ
    if (typeof renderAttendanceTable === 'function') renderAttendanceTable();

    // 3. ผูก Event Listener ให้กับ Form ต่างๆ
    const changePwdForm = document.getElementById('changePasswordForm');
    if (changePwdForm && typeof handleChangePassword === 'function') {
        changePwdForm.addEventListener('submit', handleChangePassword);
    }

    const attForm = document.getElementById('attendanceForm');
    if (attForm && typeof handleAttendanceSubmit === 'function') {
        attForm.addEventListener('submit', handleAttendanceSubmit);
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm && typeof saveProfileData === 'function') {
        profileForm.addEventListener('submit', saveProfileData);
    }
});