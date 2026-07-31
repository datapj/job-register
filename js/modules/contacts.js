// JS/modules/contacts.js

// ⚠️ นำ URL ที่ได้จากการ Deploy ใน Google Apps Script มาวางแทนที่ข้อความข้างล่างนี้
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxmWb-UG5YV5jEIHS34xQii4MYEIjCgNcNZyCi9zqK6J4N4LlZGTzm2gUXFisqroDM4/exec';

let contactsData = []; 
let contactChartInstance = null;

// ฟังก์ชันช่วยแปลงข้อความป้องกัน XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ฟังก์ชันแสดงผลตาราง
function renderTable() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const tbody = document.getElementById('tableBody');

    if (!tbody) return;

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const status = statusFilter ? statusFilter.value : '';

    const filtered = contactsData.filter(item => {
        const name = (item.name || '').toLowerCase();
        const contact = (item.contact || '').toLowerCase();
        const message = (item.message || '').toLowerCase();

        const matchSearch =
            name.includes(search) ||
            contact.includes(search) ||
            message.includes(search);

        const matchStatus = !status || item.status === status;

        return matchSearch && matchStatus;
    });

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHtml(item.datetime)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.contact)}</td>
            <td>${escapeHtml(item.message)}</td>
            <td>
                <select onchange="updateContactStatus('${escapeHtml(item.id)}', this.value)" class="filter-input" style="padding: 4px 8px; font-size: 0.85rem; width: 100%; cursor: pointer;">
                    <option value="🆕 มาใหม่" ${item.status === '🆕 มาใหม่' ? 'selected' : ''}>🆕 มาใหม่</option>
                    <option value="⏳ กำลังติดต่อ" ${item.status === '⏳ กำลังติดต่อ' ? 'selected' : ''}>⏳ กำลังติดต่อ</option>
                    <option value="✅ ดำเนินการแล้ว" ${item.status === '✅ ดำเนินการแล้ว' ? 'selected' : ''}>✅ ดำเนินการแล้ว</option>
                </select>
            </td>
            <td>
                <button type="button" class="btn-cancel" onclick="deleteContact('${escapeHtml(item.id)}')" style="padding: 4px 8px; font-size: 0.8rem;">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        </tr>
    `).join('');

    updateContactStats();
}

// ฟังก์ชันอัปเดตสถานะ + ส่งข้อมูลไป Google Sheets
function updateContactStatus(id, newStatus) {
    const contact = contactsData.find(i => i.id === id);
    if (!contact) return;

    contact.status = newStatus;
    renderTable();

    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
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

// ฟังก์ชันลบข้อมูลผู้ติดต่อ + ส่งคำสั่งลบไป Google Sheets
function deleteContact(id) {
    const doDelete = () => {
        fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
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

    // แสดงป๊อปอัปยืนยันก่อนลบ
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

// ฟังก์ชันดึงข้อมูลจาก Google Sheets มาแสดงในตาราง Admin
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

// เรียกดึงข้อมูลทันทีเมื่อเปิดหน้า Admin
document.addEventListener("DOMContentLoaded", () => {
    fetchContactsFromSheet();

    document
        .getElementById("searchInput")
        ?.addEventListener("input", renderTable);

    document
        .getElementById("statusFilter")
        ?.addEventListener("change", renderTable);
});

// ผูกเข้ากับ window
window.fetchContactsFromSheet = fetchContactsFromSheet;
window.renderTable = renderTable;
window.updateContactStatus = updateContactStatus;
window.deleteContact = deleteContact;
window.initContactChart = initContactChart;