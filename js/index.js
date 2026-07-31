// ==========================================
// 1. ฟังก์ชัน Global (เปิดอ่านนโยบาย PDPA)
// ==========================================
function showPDPAModal(e) {
    if (e) e.preventDefault();
    Swal.fire({
        title: 'นโยบายความเป็นส่วนตัว (PDPA)',
        html: `
            <div style="text-align: left; font-size: 0.88rem; color: #475569; line-height: 1.6; max-height: 300px; overflow-y: auto; padding-right: 8px;">
                <p><b>1. วัตถุประสงค์การเก็บรวบรวมข้อมูล:</b><br>บริษัทจะเก็บรวบรวมข้อมูลส่วนบุคคลของท่าน (ชื่อ, เบอร์โทรศัพท์, LINE ID, ประวัติการทำงาน) เพื่อใช้ในการประเมินและคัดเลือกเข้าทำงานเท่านั้น</p>
                <p><b>2. การเก็บรักษาและระยะเวลา:</b><br>ข้อมูลของท่านจะถูกเก็บรักษาในระบบความปลอดภัยเป็นเวลาไม่เกิน 1 เดือน หลังจากนั้นจะถูกลบออกจากระบบอย่างปลอดภัย</p>
                <p><b>3. การคุ้มครองข้อมูล:</b><br>บริษัทไม่มีนโยบายนำข้อมูลของท่านไปจำหน่าย เผยแพร่ หรือใช้งานในวัตถุประสงค์อื่นนอกเหนือจากการสรรหาบุคลากร</p>
            </div>
        `,
        confirmButtonText: 'เข้าใจและรับทราบ',
        confirmButtonColor: '#4f46e5'
    });
}

// ==========================================
// 2. ทำงานเมื่อ DOM โหลดสมบูรณ์ (DOMContentLoaded)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // --- 2.1 จัดการ Modal รายละเอียดงาน (Details Modal) ---
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');
    const detailsModal = document.getElementById('detailsModal');

    function openModal() {
        if (detailsModal) detailsModal.classList.add('active');
    }

    function closeModal() {
        if (detailsModal) detailsModal.classList.remove('active');
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalFooterBtn) closeModalFooterBtn.addEventListener('click', closeModal);

    // ปิด Modal เมื่อคลิกพื้นที่ภายนอก
    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) closeModal();
    });

    // ปิด Modal เมื่อกดปุ่ม Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailsModal && detailsModal.classList.contains('active')) {
            closeModal();
        }
    });

    // --- 2.2 จัดการการส่งฟอร์มสมัครงาน (Form Submit) ---
    const dataForm = document.getElementById('dataForm') || document.getElementById('contactForm');
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwWsJt6oSmOdZhCqTRVyhJp0uYVSRHhdgmhiTVnKPrPcbg9yMPQG6iImqS-VoX0k_a_/exec';

    if (dataForm) {
        dataForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ดึง Element ต่างๆ
            const nameEl = document.getElementById('fullName') || document.getElementById('name');
            const lineEl = document.getElementById('LINEID') || document.getElementById('lineId');
            const phoneEl = document.getElementById('phone');
            const messageEl = document.getElementById('message');
            const pdpaCheck = document.getElementById('pdpaConsent');

            // 1. เช็คว่าติ๊กยอมรับ PDPA หรือยัง
            if (pdpaCheck && !pdpaCheck.checked) {
                Swal.fire({
                    title: 'กรุณายอมรับนโยบาย PDPA',
                    text: 'กรุณาทำเครื่องหมายยินยอมให้นำข้อมูลไปใช้ในการพิจารณาสมัครงานก่อนส่งข้อมูล',
                    icon: 'warning',
                    confirmButtonColor: '#4f46e5'
                });
                return;
            }

            const nameVal = nameEl ? nameEl.value.trim() : '';
            const lineVal = lineEl ? lineEl.value.trim() : '-';
            const phoneVal = phoneEl ? phoneEl.value.trim() : '';
            const messageVal = messageEl ? messageEl.value.trim() : '-';

            // 2. ตรวจสอบช่องบังคับกรอกข้อมูล
            if (!nameVal || !phoneVal) {
                Swal.fire({
                    title: 'กรอกข้อมูลไม่ครบ',
                    text: 'กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์ให้ครบถ้วน',
                    icon: 'warning',
                    confirmButtonColor: '#4f46e5'
                });
                return;
            }

            // 3. แสดงสถานะกำลังบันทึกข้อมูล
            Swal.fire({
                title: 'กำลังส่งข้อมูล...',
                text: 'กรุณารอสักครู่ระบบกำลังบันทึกข้อมูลสมัครงาน',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            // 4. จัดเตรียมโครงสร้างข้อมูล
            const formData = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                name: nameVal,
                LINEID: lineVal || '-',
                phone: phoneVal,
                message: messageVal || '-',
                status: '🆕 มาใหม่'
            };

            // 5. บันทึกลง LocalStorage
            let currentDB = JSON.parse(localStorage.getItem('myDatabase')) || [];
            currentDB.unshift(formData);
            localStorage.setItem('myDatabase', JSON.stringify(currentDB));

            // 6. ส่งข้อมูลไป Google Sheets
            try {
                await fetch(GOOGLE_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        action: 'insertRow',
                        data: formData
                    }),
                    mode: 'no-cors'
                });

                Swal.fire({
                    title: 'ส่งข้อมูลสมัครงานสำเร็จ!',
                    html: `
                        <div style="text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-top: 12px; font-size: 0.88rem; color: #334155; line-height: 1.6;">
                            <p style="margin-top: 0; font-weight: bold; color: #1e293b; font-size: 0.95rem;">📍 ขั้นตอนต่อไป (Next Steps):</p>
                            <ol style="margin: 0; padding-left: 20px;">
                                <li>ทีมงาน HR จะตรวจสอบคุณสมบัติภายใน <b>1-3 วันทำการ</b></li>
                                <li>หากคุณสมบัติเข้าเกณฑ์ เจ้าหน้าที่จะติดต่อกลับทาง <b>โทรศัพท์ หรือ Line ID</b> ที่ท่านระบุไว้</li>
                                <li>เวลาทำการของฝ่าย HR: จันทร์ - ศุกร์ (09:00 - 18:00 น.)</li>
                            </ol>
                            <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0;">
                            <p style="margin: 0; font-size: 0.8rem; color: #64748b; text-align: center;">
                                🛡️ <i>ข้อมูลของคุณถูกปกป้องตามมาตรฐาน PDPA ปลอดภัย 100%</i>
                            </p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'ตกลง / ปิดหน้านี้',
                    confirmButtonColor: '#4f46e5'
                }).then(() => {
                    dataForm.reset();
                });

            } catch (err) {
                console.error('Error submitting form:', err);
                Swal.fire({
                    title: 'บันทึกในเครื่องสำเร็จ',
                    text: 'บันทึกข้อมูลเรียบร้อยแล้ว (แต่การเชื่อมต่อ Google Sheets ติดขัด)',
                    icon: 'warning',
                    confirmButtonColor: '#4f46e5'
                }).then(() => {
                    dataForm.reset();
                });
            }
        });
    }
});