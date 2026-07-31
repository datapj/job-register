// ==========================================
// 1. ฟังก์ชันจัดการข้อมูลบัญชีผู้ใช้ (localStorage)
// ==========================================

// ดึงรายชื่อผู้ใช้ทั้งหมด (หากไม่มีใน localStorage จะคืนค่า Default)
function getAdminUsers() {
    const defaultUsers = [
        { username: 'honging957', password: '5871289', role: 'superadmin' },
        { username: 'admin', password: '1234', role: 'admin' }
    ];
    return JSON.parse(localStorage.getItem('adminUsers')) || defaultUsers;
}

// ฟังก์ชันเช็คว่าผู้ใช้ปัจจุบันเป็น Superadmin หรือไม่
function isSuperAdmin() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return currentUser && currentUser.role === 'superadmin';
}

// ==========================================
// 2. ทำงานเมื่อโหลดหน้าเว็บเสร็จ (DOM Loaded)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const forgotPasswordBtn = document.getElementById('forgotPassword');

    // 2.1 เช็คเฉพาะถ้ามีฟอร์ม Login และล็อกอินค้างไว้แล้ว ถึงจะส่งไปหน้า Dashboard
    if (loginForm && sessionStorage.getItem('currentUser')) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // 2.2 ระบบ ซ่อน/แสดง รหัสผ่าน
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            togglePasswordBtn.classList.toggle('fa-eye', !isPassword);
            togglePasswordBtn.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    // 2.3 จัดการการ Submit ฟอร์มล็อกอิน
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                Swal.fire({
                    title: 'กรอกข้อมูลไม่ครบ',
                    text: 'กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน',
                    icon: 'warning',
                    confirmButtonColor: '#4f46e5'
                });
                return;
            }

            const adminUsers = getAdminUsers();
            const user = adminUsers.find(u => u.username === username && u.password === password);

            if (user) {
                sessionStorage.setItem('currentUser', JSON.stringify({
                    username: user.username,
                    role: user.role,
                    loginTime: Date.now()
                }));

                Swal.fire({
                    title: 'เข้าสู่ระบบสำเร็จ!',
                    text: `ยินดีต้อนรับคุณ ${user.username} (ระดับ: ${user.role})`,
                    icon: 'success',
                    timer: 1200,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'admin-dashboard.html';
                });
            } else {
                Swal.fire({
                    title: 'เข้าสู่ระบบไม่สำเร็จ',
                    text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
                passwordInput.value = '';
            }
        });
    }

    // 2.4 จัดการปุ่ม "ลืมรหัสผ่าน?"
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const MASTER_PIN = localStorage.getItem('masterPin') || '5871289';

            Swal.fire({
                title: 'ยืนยันตัวตนเพื่อรีเซ็ตรหัสผ่าน',
                text: 'กรุณากรอกรหัสความปลอดภัยหลัก (Master PIN) เพื่อดำเนินการ',
                input: 'password',
                inputPlaceholder: 'กรอกรหัส PIN',
                inputAttributes: {
                    maxlength: '10',
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'ยืนยันรีเซ็ต',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#64748b',
                inputValidator: (value) => {
                    if (!value) {
                        return 'กรุณากรอกรหัสความปลอดภัย!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (result.value === MASTER_PIN) {
                        localStorage.removeItem('adminUsers');

                        Swal.fire({
                            title: 'รีเซ็ตสำเร็จ!',
                            text: 'ระบบถูกคืนค่าบัญชีเป็น honging957 / 5871289 และ admin / 1234 เรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonColor: '#4f46e5'
                        });
                    } else {
                        Swal.fire({
                            title: 'รหัสไม่ถูกต้อง!',
                            text: 'ไม่อนุญาตให้รีเซ็ตรหัสผ่าน',
                            icon: 'error',
                            confirmButtonColor: '#ef4444'
                        });
                    }
                }
            });
        });
    }
});

// ==========================================
// 3. ฟังก์ชันสำหรับเรียกใช้งาน ( Dashboard / Admin )
// ==========================================

// ฟังก์ชันสร้างบัญชี Admin ใหม่ (เฉพาะ Superadmin)
function createNewAdmin() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser || currentUser.role !== 'superadmin') {
        Swal.fire('ปฏิเสธการเข้าถึง', 'เฉพาะ Superadmin เท่านั้นที่สามารถเพิ่มบัญชีได้', 'error');
        return;
    }

    Swal.fire({
        title: 'เพิ่มบัญชีผู้ใช้งานใหม่',
        html: `
            <input id="newUsername" class="swal2-input" placeholder="ชื่อผู้ใช้ (Username)">
            <input id="newPassword" type="password" class="swal2-input" placeholder="รหัสผ่าน (Password)">
            <select id="newRole" class="swal2-select" style="display: flex; width: 70%; margin: 1em auto;">
                <option value="admin">Admin (ผู้ดูแลทั่วไป)</option>
                <option value="superadmin">Superadmin (ผู้ดูแลสูงสุด)</option>
            </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#4f46e5',
        preConfirm: () => {
            const username = document.getElementById('newUsername').value.trim();
            const password = document.getElementById('newPassword').value.trim();
            const role = document.getElementById('newRole').value;

            if (!username || !password) {
                Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน!');
                return false;
            }
            return { username, password, role };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { username, password, role } = result.value;
            let adminUsers = getAdminUsers();

            // เช็คชื่อซ้ำ
            if (adminUsers.some(u => u.username === username)) {
                Swal.fire('ซ้ำซ้อน!', 'มีชื่อผู้ใช้นี้อยู่ในระบบแล้ว', 'error');
                return;
            }

            adminUsers.push({ username, password, role });
            localStorage.setItem('adminUsers', JSON.stringify(adminUsers));

            Swal.fire('สำเร็จ!', `เพิ่มบัญชี ${username} (${role}) เรียบร้อยแล้ว`, 'success');
        }
    });
}

// ตัวอย่างฟังก์ชันสำหรับปุ่มลบข้อมูลที่ต้องใช้สิทธิ์ Superadmin
function deleteImportantData() {
    if (!isSuperAdmin()) {
        Swal.fire('ไม่มีสิทธิ์!', 'สิทธิ์ Admin ธรรมดาไม่สามารถลบข้อมูลนี้ได้', 'warning');
        return;
    }
    // โค้ดการลบข้อมูล...
}