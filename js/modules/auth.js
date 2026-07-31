// JS/modules/auth.js - ระบบออกจากระบบ

function logoutAdmin(event) {
    // 1. ดักจับไม่ให้ปุ่มทำงานตามค่าเริ่มต้น (แก้ปัญหาหน้าเว็บรีเฟรชกลับมาที่เดิม)
    if (event) {
        event.preventDefault();
    }

    const doLogout = () => {
        // 2. ลบข้อมูลการเข้าสู่ระบบออกจาก Browser ให้หมด (แก้ปัญหาเด้งกลับ)
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userToken');
        localStorage.clear();
        sessionStorage.clear();

        // 3. ย้ายไปหน้า login.html โดยไม่เก็บ History
        window.location.replace('login.html');
    };

    // แสดงป๊อปอัปยืนยันก่อนออกจากระบบ
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ยืนยันการออกจากระบบ?',
            text: "คุณต้องการออกจากระบบ Admin Portal หรือไม่",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                doLogout();
            }
        });
    } else {
        if (confirm('ยืนยันการออกจากระบบ?')) {
            doLogout();
        }
    }
}

// ผูกฟังก์ชันเข้ากับ window
window.logoutAdmin = logoutAdmin;