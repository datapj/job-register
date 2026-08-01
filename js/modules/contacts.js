// JS/modules/contacts.js

// ⚠️ นำ URL ที่ได้จากการ Deploy ใน Google Apps Script มาวางแทนที่ข้อความข้างล่างนี้
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxmWb-UG5YV5jEIHS34xQii4MYEIjCgNcNZyCi9zqK6J4N4LlZGTzm2gUXFisqroDM4/exec';

let contactsData = []; 
let contactChartInstance = null;

// ดึงประวัติการลงชื่อจาก localStorage (หรือตั้งเป็น [] ถ้ายังไม่มี)
let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');

// --- 1. ฟังก์ชันช่วยและ Utility ---

// แปลงข้อความป้องกัน XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ฟังก์ชันดึงวันที่ปัจจุบันรูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// แจ้งเตือน Toast
function showToast(title, icon = 'success') {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({ icon, title });
    }
}

// --- 2. การแสดงผลตาราง และ Dropdown ---

function renderTable() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const tbody = document.getElementById('tableBody');

    if (!tbody) return;

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const status = statusFilter ? statusFilter.value : '';

    const filtered = contactsData.filter(item => {
        const name = (item.name || item.fullname || '').toLowerCase();
        const contact = (item.contact || item.phone || '').toLowerCase();
        const matchSearch = name.includes(search) || contact.includes(search);
        const matchStatus = !status || item.status === status;
        return matchSearch && matchStatus;
    });

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHtml(item.datetime || '-')}</td>
            <td>${escapeHtml(item.name || item.fullname || 'ไม่ระบุชื่อ')}</td>
            <td>${escapeHtml(item.contact || item.phone || '-')}</td>
            <td>
                <select onchange="updateContactStatus('${escapeHtml(item.id)}', this.value)" class="filter-input" style="padding: 4px 8px; font-size: 0.85rem; width: 100%; cursor: pointer;">
                    <option value="🆕 มาใหม่" ${item.status === '🆕 มาใหม่' ? 'selected' : ''}>🆕 มาใหม่</option>
                    <option value="⏳ กำลังติดต่อ" ${item.status === '⏳ กำลังติดต่อ' ? 'selected' : ''}>⏳ กำลังติดต่อ</option>
                    <option value="✅ ดำเนินการแล้ว" ${item.status === '✅ ดำเนินการแล้ว' ? 'selected' : ''}>✅ ดำเนินการแล้ว</option>
                </select>
            </td>
            <td>
                <!-- ปุ่มดูข้อมูล -->
                <button type="button" class="btn-info" onclick="viewContact('${escapeHtml(item.id)}')" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 4px;">
                    <i class="fa-solid fa-eye"></i> ดู
                </button>
                <!-- ปุ่มแก้ไขข้อมูล -->
                <button type="button" class="btn-warning" onclick="editContact('${escapeHtml(item.id)}')" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 4px;">
                    <i class="fa-solid fa-pen"></i> แก้ไข
                </button>
                <!-- ปุ่มลบ -->
                <button type="button" class="btn-cancel" onclick="deleteContact('${escapeHtml(item.id)}')" style="padding: 4px 8px; font-size: 0.8rem;">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        </tr>
    `).join('');

    updateContactStats();
    populateAttendanceDropdown(); // เรียกเติมข้อมูลลง Dropdown อัตโนมัติ
}

// ดึงรายชื่อไปใส่ใน Dropdown ตารางงาน/เช็กชื่อ (พร้อมระบบกันเลือกซ้ำ)
function populateAttendanceDropdown(targetDate = null) {
    const selectElem = document.getElementById('attendanceUserSelect');
    if (!selectElem) return;

    // อ่านวันที่จาก Input #attendanceDate หรือใช้ค่าวันที่ส่งมา
    const dateInput = document.getElementById('attendanceDate');
    const selectedDate = targetDate || (dateInput && dateInput.value) || getTodayDateString();

    // 1. ตรวจสอบข้อมูล contactsData
    if (!Array.isArray(contactsData) || contactsData.length === 0) {
        selectElem.innerHTML = '<option value="">-- ไม่พบข้อมูลรายชื่อ --</option>';
        return;
    }

    const currentValue = selectElem.value;
    selectElem.innerHTML = '<option value="">-- เลือกผู้ติดต่อ/พนักงาน --</option>';

    // 2. โหลดรายการที่เคยลงชื่อแล้วตามวันที่เลือก
    const currentRecords = Array.isArray(window.attendanceRecords) 
        ? window.attendanceRecords 
        : (typeof attendanceRecords !== 'undefined' ? attendanceRecords : JSON.parse(localStorage.getItem('attendanceRecords') || '[]'));

    const checkedInUserIds = currentRecords
        .filter(record => String(record.date) === String(selectedDate))
        .map(record => String(record.userId || record.id));

    // 3. วนลูปสร้าง Option รายชื่อ
    contactsData.forEach(item => {
        const option = document.createElement('option');
        const userId = String(item.id || '');
        
        // ป้องกันเรื่องชื่อไม่แสดง โดยครอบคลุมโครงสร้างคีย์หลายรูปแบบ
        const userName = item.name || item.fullname || item.displayName || (typeof item === 'string' ? item : 'ไม่ระบุชื่อ');
        const userContact = item.contact || item.phone || '';
        const contactText = userContact ? ` (${userContact})` : '';

        option.value = userId;

        // เช็กว่าคนนี้เคยลงชื่อในวันที่เลือกแล้วหรือยัง
        const isAlreadyCheckedIn = userId && checkedInUserIds.includes(userId);

        if (isAlreadyCheckedIn) {
            option.textContent = `${userName}${contactText} [ลงชื่อแล้ว]`;
            option.disabled = true; // ปิดการเลือกรายการที่ลงชื่อไปแล้ว
        } else {
            option.textContent = `${userName}${contactText}`;
        }

        selectElem.appendChild(option);
    });

    // คืนค่าที่เลือกไว้เดิม (หากไม่ได้ถูก disabled)
    if (currentValue && !checkedInUserIds.includes(String(currentValue))) {
        selectElem.value = currentValue;
    } else {
        selectElem.value = '';
    }
}

// ฟังก์ชันสำหรับบันทึกการเช็กชื่อ
function saveAttendance() {
    const userId = document.getElementById('attendanceUserSelect')?.value;
    const dateInput = document.getElementById('attendanceDate');
    const selectedDate = (dateInput && dateInput.value) ? dateInput.value : getTodayDateString();

    if (!userId) {
        alert('กรุณาเลือกรายชื่อ');
        return;
    }

    // อ่านข้อมูลล่าสุด
    const currentRecords = Array.isArray(window.attendanceRecords) 
        ? window.attendanceRecords 
        : (typeof attendanceRecords !== 'undefined' ? attendanceRecords : JSON.parse(localStorage.getItem('attendanceRecords') || '[]'));

    // ตรวจสอบข้อมูลซ้ำ
    const isDuplicate = currentRecords.some(
        record => String(record.userId || record.id) === String(userId) && String(record.date) === String(selectedDate)
    );

    if (isDuplicate) {
        alert('รายชื่อนี้ได้ลงชื่อสำหรับวันที่เลือกไปเรียบร้อยแล้ว!');
        return;
    }

    // บันทึกรายการใหม่
    const newRecord = {
        userId: userId,
        date: selectedDate,
        timestamp: new Date().toISOString()
    };

    currentRecords.push(newRecord);
    attendanceRecords = currentRecords;
    window.attendanceRecords = currentRecords;
    localStorage.setItem('attendanceRecords', JSON.stringify(currentRecords));

    showToast('ลงชื่อเรียบร้อยแล้ว');
    populateAttendanceDropdown(selectedDate); // อัปเดต Dropdown ทันที
}

// --- 3. การจัดการข้อมูลส่วนตัว (ดู / แก้ไข / อัปเดตสถานะ / ลบ) ---

// ดูข้อมูลส่วนตัว
function viewContact(id) {
    const item = contactsData.find(i => i.id === id);
    if (!item) return;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '📄 รายละเอียดข้อมูลส่วนตัว',
            html: `
                <div style="text-align: left; line-height: 1.8;">
                    <p><b>ID:</b> ${escapeHtml(item.id)}</p>
                    <p><b>วันที่บันทึก:</b> ${escapeHtml(item.datetime)}</p>
                    <p><b>ชื่อ-นามสกุล:</b> ${escapeHtml(item.name || item.fullname)}</p>
                    <p><b>ช่องทางการติดต่อ:</b> ${escapeHtml(item.contact || item.phone)}</p>
                    <p><b>สถานะ:</b> ${escapeHtml(item.status)}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'ปิด'
        });
    }
}

// แก้ไขข้อมูลส่วนตัว
function editContact(id) {
    const item = contactsData.find(i => i.id === id);
    if (!item) return;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '✏️ แก้ไขข้อมูลส่วนตัว',
            html: `
                <div style="text-align: left;">
                    <label style="font-size: 0.9rem;">ชื่อ-นามสกุล:</label>
                    <input id="swal-edit-name" class="swal2-input" value="${escapeHtml(item.name || item.fullname)}" placeholder="ชื่อ-นามสกุล">
                    
                    <label style="font-size: 0.9rem; margin-top: 10px; display:block;">ช่องทางติดต่อ (เบอร์ / Line):</label>
                    <input id="swal-edit-contact" class="swal2-input" value="${escapeHtml(item.contact || item.phone)}" placeholder="เบอร์โทร / Line">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'บันทึกการแก้ไข',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const newName = document.getElementById('swal-edit-name').value.trim();
                const newContact = document.getElementById('swal-edit-contact').value.trim();
                if (!newName) {
                    Swal.showValidationMessage('กรุณากรอกชื่อ-นามสกุล');
                    return false;
                }
                return { name: newName, contact: newContact };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                saveEditToSheet(id, result.value.name, result.value.contact);
            }
        });
    }
}

// ส่งคำสั่งแก้ไขข้อมูลไปยัง Google Sheets
function saveEditToSheet(id, name, contact) {
    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "editPerson",
            id: id,
            name: name,
            contact: contact
        })
    })
    .then(() => {
        showToast("แก้ไขข้อมูลเรียบร้อย");
        fetchContactsFromSheet(); 
    })
    .catch(err => {
        console.error(err);
        showToast("แก้ไขข้อมูลไม่สำเร็จ", "error");
    });
}

// อัปเดตสถานะ
function updateContactStatus(id, newStatus) {
    const contact = contactsData.find(i => i.id === id);
    if (!contact) return;

    contact.status = newStatus;
    renderTable();

    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "updateStatus",
            id: id,
            status: newStatus
        })
    })
    .then(() => {
        fetchContactsFromSheet();
        showToast("อัปเดตสถานะเรียบร้อย");
    })
    .catch(err => {
        console.error(err);
        showToast("ไม่สามารถอัปเดต Google Sheets ได้", "error");
    });
}

// ลบข้อมูลผู้ติดต่อ
function deleteContact(id) {
    const doDelete = () => {
        fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "delete",
                id: id
            })
        })
        .then(() => {
            contactsData = contactsData.filter(i => i.id !== id);
            renderTable();
            fetchContactsFromSheet();
            showToast("ลบข้อมูลเรียบร้อย");
        })
        .catch(err => {
            console.error(err);
            showToast("ลบข้อมูลไม่สำเร็จ", "error");
        });
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ลบข้อมูลผู้ติดต่อ?',
            text: "รายการนี้จะถูกลบออกจากทั้งหน้าเว็บและ Google Sheets",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ยืนยันลบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                doDelete();
            }
        });
    } else {
        if (confirm('ยืนยันการลบรายการนี้ออกจาก Google Sheets?')) {
            doDelete();
        }
    }
}

// --- 4. สถิติและกราฟ ---

function updateContactStats() {
    const total = contactsData.length;
    const countNew = contactsData.filter(i => i.status === '🆕 มาใหม่').length;
    const countPending = contactsData.filter(i => i.status === '⏳ กำลังติดต่อ').length;
    const countDone = contactsData.filter(i => i.status === '✅ ดำเนินการแล้ว').length;

    if (document.getElementById('statTotal')) document.getElementById('statTotal').innerText = total;
    if (document.getElementById('statNew')) document.getElementById('statNew').innerText = countNew;
    if (document.getElementById('statPending')) document.getElementById('statPending').innerText = countPending;
    if (document.getElementById('statDone')) document.getElementById('statDone').innerText = countDone;
}

function initContactChart() {
    const ctx = document.getElementById('contactChart');
    if (!ctx) return;

    if (contactChartInstance) {
        contactChartInstance.destroy();
    }

    contactChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.'],
            datasets: [{
                label: 'จำนวนผู้ติดต่อ (ราย)',
                data: [12, 19, 15, 25, 22, 30, 45],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// --- 5. การดึงข้อมูล API และ Event Listeners ---

function fetchContactsFromSheet() {
    if (!GOOGLE_SHEET_URL || !GOOGLE_SHEET_URL.startsWith('http')) return;

    fetch(GOOGLE_SHEET_URL)
        .then(response => response.json())
        .then(data => {
            contactsData = Array.isArray(data) ? [...data].reverse() : [];
            renderTable();
        })
        .catch(error => {
            console.error('Error fetching contacts:', error);
            contactsData = [];
            renderTable();
        });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchContactsFromSheet();

    document
        .getElementById("searchInput")
        ?.addEventListener("input", renderTable);

    document
        .getElementById("statusFilter")
        ?.addEventListener("change", renderTable);

    // เมื่อมีการเปลี่ยนวันที่ลงชื่อ ให้รีเฟรชสถานะใน Dropdown ตามวันที่นั้นๆ ทันที
    document
        .getElementById("attendanceDate")
        ?.addEventListener("change", (e) => {
            populateAttendanceDropdown(e.target.value);
        });
});

// --- 6. Expose ฟังก์ชันขึ้น Global Window ---
window.fetchContactsFromSheet = fetchContactsFromSheet;
window.renderTable = renderTable;
window.viewContact = viewContact;
window.editContact = editContact;
window.updateContactStatus = updateContactStatus;
window.deleteContact = deleteContact;
window.populateAttendanceDropdown = populateAttendanceDropdown;
window.saveAttendance = saveAttendance;
window.attendanceRecords = attendanceRecords;
window.initContactChart = initContactChart;