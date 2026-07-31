// JS/modules/profile.js - จัดการรูปภาพและข้อมูลส่วนตัว

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.getElementById('profileAvatarPreview');
            if (avatar) avatar.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function syncLatestContactToProfile() {
    if (typeof contactsData !== 'undefined' && contactsData.length > 0) {
        const latest = contactsData[0];
        document.getElementById('profFullName').value = latest.name;
        document.getElementById('profPhone').value = latest.contact.split('/')[0].trim();
        Swal.fire('ซิงค์สำเร็จ', `ดึงข้อมูลของ ${latest.name} มาลงฟอร์มเรียบร้อย`, 'success');
    } else {
        Swal.fire('ไม่พบข้อมูล', 'ไม่มีรายการผู้ติดต่อสำหรับซิงค์', 'warning');
    }
}

function saveProfileData(event) {
    event.preventDefault();
    const name = document.getElementById('profFullName').value;
    const pos = document.getElementById('profPosition').value;
    const phone = document.getElementById('profPhone').value;
    const line = document.getElementById('profLineId').value;
    const email = document.getElementById('profEmail').value;

    if (name && document.getElementById('displayProfileName')) {
        document.getElementById('displayProfileName').innerText = name;
    }
    if (pos && document.getElementById('displayProfileRole')) {
        document.getElementById('displayProfileRole').innerText = pos;
    }
    if (phone && document.getElementById('displayProfilePhone')) {
        document.getElementById('displayProfilePhone').innerText = phone;
    }
    if (line && document.getElementById('displayProfileLine')) {
        document.getElementById('displayProfileLine').innerText = line;
    }
    if (email && document.getElementById('displayProfileEmail')) {
        document.getElementById('displayProfileEmail').innerText = email;
    }

    Swal.fire('บันทึกสำเร็จ', 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว', 'success');
}