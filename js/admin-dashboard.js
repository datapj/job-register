// ==========================================
// 1. ความปลอดภัย & Authentication
// ==========================================
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 นาที
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzxp4gOuD8NM3JGImHctC2Vi6Ms-GW20ZED0sHIPn74L4tZ_WD-sRRM39J_SRq9CJTo/exec';

let dbData = JSON.parse(localStorage.getItem('myDatabase')) || [];
let contactChart = null;

function escapeHTML(str) {
    if (str === null || str === undefined) return '-';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser || !currentUser.loginTime) {
        showAccessDenied('กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้');
        return false;
    }

    const currentTime = Date.now();
    if (currentTime - currentUser.loginTime > SESSION_TIMEOUT) {
        sessionStorage.clear();
        showAccessDenied('เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        return false;
    }
    return true;
}

function updateSessionTime() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        currentUser.loginTime = Date.now();
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function showAccessDenied(message) {
    document.body.style.display = 'none';
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'แจ้งเตือนระบบ',
            text: message,
            icon: 'warning',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#4f46e5',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            window.location.href = 'index.html';
        });
    } else {
        alert(message);
        window.location.href = 'index.html';
    }
}

function logoutAdmin() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ยืนยันการออกจากระบบ?',
            text: 'คุณต้องการออกจากระบบใช่หรือไม่',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b'
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });
    } else {
        if (confirm('คุณต้องการออกจากระบบ Dashboard ใช่หรือไม่')) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

async function hashSHA256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 2. การจัดการข้อมูล Dashboard & Table
// ==========================================
function updateStatsAndChart() {
    const total = dbData.length;
    const newCount = dbData.filter(d => d.status === '🆕 มาใหม่' || !d.status).length;
    const pendingCount = dbData.filter(d => d.status === '⏳ กำลังติดต่อ').length;
    const doneCount = dbData.filter(d => d.status === '✅ ดำเนินการแล้ว').length;

    const statTotalEl = document.getElementById('statTotal');
    const statNewEl = document.getElementById('statNew');
    const statPendingEl = document.getElementById('statPending');
    const statDoneEl = document.getElementById('statDone');

    if (statTotalEl) statTotalEl.innerText = total;
    if (statNewEl) statNewEl.innerText = newCount;
    if (statPendingEl) statPendingEl.innerText = pendingCount;
    if (statDoneEl) statDoneEl.innerText = doneCount;

    const chartCanvas = document.getElementById('contactChart');
    if (chartCanvas && typeof Chart !== 'undefined') {
        const ctx = chartCanvas.getContext('2d');
        if (contactChart) contactChart.destroy();

        contactChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['🆕 มาใหม่', '⏳ กำลังติดต่อ', '✅ ดำเนินการแล้ว'],
                datasets: [{
                    label: 'จำนวนรายการ (รายการ)',
                    data: [newCount, pendingCount, doneCount],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }
}

function renderTable() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const tbody = document.getElementById('tableBody');

    if (!tbody) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusTerm = statusFilter ? statusFilter.value : '';
    tbody.innerHTML = '';

    const filtered = dbData.filter(item => {
        const nameMatch = (item.name || '').toLowerCase().includes(searchTerm);
        const lineMatch = (item.LINEID || '').toLowerCase().includes(searchTerm);
        const phoneMatch = (item.phone || '').includes(searchTerm);
        const emailMatch = (item.email || '').toLowerCase().includes(searchTerm);

        const matchesSearch = nameMatch || lineMatch || phoneMatch || emailMatch;
        const matchesStatus = statusTerm ? (item.status || '🆕 มาใหม่') === statusTerm : true;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">ไม่พบข้อมูลรายการที่ตรงกัน</td></tr>`;
        updateStatsAndChart();
        return;
    }

    filtered.forEach(item => {
        const currentStatus = item.status || '🆕 มาใหม่';
        const safeId = escapeHTML(String(item.id));
        const row = document.createElement('tr');
        row.id = `row-${safeId}`;

        row.innerHTML = `
            <td>${escapeHTML(item.date)}</td>
            <td><b>${escapeHTML(item.name)}</b></td>
            <td>${escapeHTML(item.LINEID)}<br><small style="color:#64748b">${escapeHTML(item.phone)}</small></td>
            <td>${escapeHTML(item.message)}</td>
            <td>
                <select class="status-select" onchange="changeStatus('${safeId}', this.value)">
                    <option value="🆕 มาใหม่" ${currentStatus === '🆕 มาใหม่' ? 'selected' : ''}>🆕 มาใหม่</option>
                    <option value="⏳ กำลังติดต่อ" ${currentStatus === '⏳ กำลังติดต่อ' ? 'selected' : ''}>⏳ กำลังติดต่อ</option>
                    <option value="✅ ดำเนินการแล้ว" ${currentStatus === '✅ ดำเนินการแล้ว' ? 'selected' : ''}>✅ ดำเนินการแล้ว</option>
                </select>
            </td>
            <td>
                <button onclick="deleteItem('${safeId}')" class="btn-delete">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateStatsAndChart();
}

async function changeStatus(id, newStatus) {
    const previousData = [...dbData];

    dbData = dbData.map(item => String(item.id) === String(id) ? { ...item, status: newStatus } : item);
    localStorage.setItem('myDatabase', JSON.stringify(dbData));
    renderTable();

    if (!GOOGLE_SHEET_WEB_APP_URL) return;

    try {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'กำลังอัปเดตไปยัง Google Sheet...',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                didOpen: () => { Swal.showLoading(); }
            });
        }

        const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'updateStatus',
                id: id,
                status: newStatus
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'อัปเดตลง Google Sheet เรียบร้อยแล้ว',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        } else {
            throw new Error(result.message || 'ไม่สามารถอัปเดตสถานะใน Sheet ได้');
        }
    } catch (error) {
        console.error('Error updating Google Sheet:', error);

        dbData = previousData;
        localStorage.setItem('myDatabase', JSON.stringify(dbData));
        renderTable();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'การอัปเดตล้มเหลว',
                text: 'ไม่สามารถอัปเดตข้อมูลไปยัง Google Sheet ได้'
            });
        }
    }
}

function deleteItem(id) {
    const executeDelete = async () => {
        const previousData = [...dbData];

        const targetRow = document.getElementById(`row-${id}`);
        if (targetRow) {
            targetRow.classList.add('row-deleting');
        }

        await new Promise(resolve => setTimeout(resolve, 350));

        dbData = dbData.filter(item => String(item.id) !== String(id));
        localStorage.setItem('myDatabase', JSON.stringify(dbData));
        renderTable();

        if (!GOOGLE_SHEET_WEB_APP_URL) return;

        try {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'กำลังลบจาก Google Sheet...',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    didOpen: () => { Swal.showLoading(); }
                });
            }

            const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'deleteRow',
                    id: id
                })
            });

            const resResult = await response.json();
            if (resResult.status !== 'success') {
                throw new Error(resResult.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'ลบข้อมูลเรียบร้อยแล้ว',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }

        } catch (err) {
            console.error('Error deleting row in Google Sheet:', err);
            dbData = previousData;
            localStorage.setItem('myDatabase', JSON.stringify(dbData));
            renderTable();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'ลบข้อมูลล้มเหลว',
                    text: 'ไม่สามารถลบข้อมูลใน Google Sheet ได้ ข้อมูลถูกดึงกลับมาเรียบร้อยแล้ว'
                });
            }
        }
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลนี้จะถูกลบออกจากระบบและ Google Sheet ถาวร!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                executeDelete();
            }
        });
    } else {
        if (confirm("ยืนยันการลบข้อมูลนี้ถาวร?")) {
            executeDelete();
        }
    }
}

async function loadDataFromSheet() {
    if (!GOOGLE_SHEET_WEB_APP_URL) return;

    try {
        const response = await fetch(GOOGLE_SHEET_WEB_APP_URL + '?action=getData');
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            dbData = result.data;
            localStorage.setItem('myDatabase', JSON.stringify(dbData));
            renderTable();
        }
    } catch (error) {
        console.error('ไม่สามารถดึงข้อมูลจาก Google Sheets ได้:', error);
    }
}

// ==========================================
// 3. ระบบเปลี่ยนรหัสผ่าน (Modal Settings)
// ==========================================
function openSettingsModal() {
    const userEl = document.getElementById('newUsername');
    const passEl = document.getElementById('newPassword');
    const modal = document.getElementById('settingsModal');

    if (userEl) userEl.value = localStorage.getItem('adminUsername') || 'Admin';
    if (passEl) passEl.value = '';
    if (modal) modal.style.display = 'flex';
}

function closeSettingsModal() { 
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none'; 
}

function closeModalOnBackdrop(e) {
    if (e.target.id === 'settingsModal') {
        closeSettingsModal();
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal && modal.style.display === 'flex') {
            closeSettingsModal();
        }
    }
});

const changePassForm = document.getElementById('changePasswordForm');
if (changePassForm) {
    changePassForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const newU = document.getElementById('newUsername').value.trim();
        const newP = document.getElementById('newPassword').value;

        if (newU && newP) {
            const passHash = await hashSHA256(newP);
            localStorage.setItem('adminUsername', newU);
            localStorage.setItem('adminPasswordHash', passHash);

            if (typeof Swal !== 'undefined') {
                Swal.fire('สำเร็จ!', 'เปลี่ยน Username และ Password เรียบร้อยแล้ว', 'success');
            } else {
                alert('เปลี่ยน Username และ Password เรียบร้อยแล้ว');
            }
            closeSettingsModal();
        }
    });
}

// ==========================================
// 4. เริ่มทำงานเมื่อโหลดหน้าเว็บ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
            window.addEventListener(evt, updateSessionTime, { passive: true });
        });

        setInterval(checkAuth, 60 * 1000);
        
        renderTable();        // แสดงข้อมูลใน localStorage ก่อน
        loadDataFromSheet();  // ดึงข้อมูลล่าสุดจาก Google Sheets มาอัปเดตทันที
    }
});