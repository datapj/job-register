// JS/modules/attendance.js - จัดการตารางงานและการเช็กชื่อพนักงาน

// ประกาศตัวแปรเก็บข้อมูล (ปรับเปลี่ยนแหล่งข้อมูลได้ตามโครงสร้างโปรเจกต์ของคุณ)
let attendanceData = [];

// ฟังก์ชันป้องกัน XSS เบื้องต้น
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderAttendanceTable() {
    const searchInput = document.getElementById('attendanceSearchInput');
    const statusFilter = document.getElementById('attendanceStatusFilter');
    const tbody = document.getElementById('attendanceTableBody');

    if (!tbody) return;

    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : '';

    const filtered = attendanceData.filter(item => {
        const matchSearch = item.employeeName.toLowerCase().includes(search) || 
                            item.date.includes(search);
        const matchStatus = !status || item.status === status;
        return matchSearch && matchStatus;
    });

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHTML(item.date)}</td>
            <td>${escapeHTML(item.employeeName)}</td>
            <td><span class="badge">${escapeHTML(item.status)}</span></td>
            <td>${escapeHTML(item.note) || '-'}</td>
            <td>
                <button type="button" class="btn-cancel" onclick="deleteAttendance('${item.id}')" style="padding: 4px 8px; font-size: 0.8rem;">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        </tr>
    `).join('');

    updateAttendanceStats();
}

function updateAttendanceStats() {
    const total = attendanceData.length;
    const present = attendanceData.filter(i => i.status === '✅ มาทำงาน').length;
    const late = attendanceData.filter(i => i.status === '⏰ มาสาย').length;
    const leave = attendanceData.filter(i => i.status === '📝 ลา').length;
    const absent = attendanceData.filter(i => i.status === '❌ ขาดงาน').length;

    if (document.getElementById('attStatTotal')) document.getElementById('attStatTotal').innerText = total;
    if (document.getElementById('attStatPresent')) document.getElementById('attStatPresent').innerText = present;
    if (document.getElementById('attStatLate')) document.getElementById('attStatLate').innerText = late;
    if (document.getElementById('attStatLeave')) document.getElementById('attStatLeave').innerText = leave;
    if (document.getElementById('attStatAbsent')) document.getElementById('attStatAbsent').innerText = absent;
}

function handleAttendanceSubmit(event) {
    event.preventDefault();
    const date = document.getElementById('attDate').value;
    const employeeName = document.getElementById('attEmployeeName').value;
    const status = document.getElementById('attStatus').value;
    const note = document.getElementById('attNote').value;

    attendanceData.unshift({
        id: Date.now().toString(),
        date,
        employeeName,
        status,
        note
    });

    renderAttendanceTable();
    if (typeof closeAttendanceModal === 'function') closeAttendanceModal();
    document.getElementById('attendanceForm').reset();

    Swal.fire('สำเร็จ', 'บันทึกข้อมูลตารางงานเรียบร้อย', 'success');
}

function deleteAttendance(id) {
    Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: "ต้องการลบข้อมูลการเช็กชื่อนี้ใช่ไหม",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            attendanceData = attendanceData.filter(item => item.id !== id);
            renderAttendanceTable();
            Swal.fire('ลบสำเร็จ', 'ข้อมูลถูกลบเรียบร้อยแล้ว', 'success');
        }
    });
}