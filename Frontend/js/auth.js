// ==========================================
// CẤU HÌNH MÁY CHỦ (CHỐNG SẬP KHI LÊN HOSTING)
// ==========================================
// Công tắc tự động: Tự nhận biết đang chạy ở nhà (localhost) hay đã lên mạng (Hosting)
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

// Nếu ở nhà -> Gọi cổng 5000. Nếu lên mạng -> Gọi tới đường dẫn Backend sau này của ông bạn
const API_BASE_URL = isLocal ? 'http://localhost:5000' : 'https://api.trithuccenter.com';
// (Chữ api.trithuccenter.com chỉ là ví dụ, sau này mua tên miền gì thì dán vào đó 1 lần là xong!)





// ==========================================
// 1. CHUYỂN ĐỔI GIỮA CÁC FORM
// ==========================================
function toggleForm(type) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.add('hidden');
    if (type === 'register') document.getElementById('registerForm').classList.remove('hidden');
    else if (type === 'forgot') document.getElementById('forgotForm').classList.remove('hidden');
    else document.getElementById('loginForm').classList.remove('hidden');
}

// =========================================================
// 2. BẬT TẮT & ĐỔI TÊN MÃ ĐỊNH DANH (MSHS/MSGV/MSAD)
// =========================================================
function checkRole(formType) {
    let role, idInput;

    // 1. Nhận diện form nào đang gọi để móc đúng ID
    if (formType === 'register') {
        role = document.getElementById('regRole').value;
        idInput = document.getElementById('regMSHS'); // Vẫn xài ID cũ cho nhẹ HTML
    } else if (formType === 'login') {
        role = document.getElementById('loginRole').value;
        idInput = document.getElementById('loginMSHS');
    } else if (formType === 'forgot') {
        role = document.getElementById('forgotRole').value;
        idInput = document.getElementById('forgotMSHS');
    }

    // 2. Xử lý logic ẩn/hiện và đổi Placeholder
    if (role === 'student' || role === 'teacher' || role === 'admin') {
        idInput.classList.remove('hidden');
        idInput.setAttribute('required', 'true'); // Ép buộc phải nhập

        // Đổi chữ mờ (placeholder) cho đúng ngữ cảnh
        if (role === 'student') {
            idInput.placeholder = "Mã số học sinh (MSHS)";
        } else if (role === 'teacher') {
            idInput.placeholder = "Mã số giáo viên (MSGV)";
        } else if (role === 'admin') {
            idInput.placeholder = "Mã quản trị viên (MSAD)";
        }
    } else {
        // Nếu chưa chọn vai trò gì (Trạng thái mặc định) -> Giấu đi
        idInput.classList.add('hidden');
        idInput.removeAttribute('required');
    }
}

// ==========================================
// 3. ẨN/HIỆN CON MẮT MẬT KHẨU
// ==========================================
function togglePassword(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconElement.innerHTML = "🙈";
    } else {
        input.type = "password";
        iconElement.innerHTML = "👁️";
    }
}



// ==========================================
// 5 & 6. KIỂM DUYỆT MẬT KHẨU ĐĂNG KÝ
// ==========================================
const regPassword = document.getElementById('regPassword');
if (regPassword) {
    regPassword.addEventListener('input', function () {
        const val = regPassword.value;
        updateRule('rule-length', val.length >= 8);
        updateRule('rule-upper', /[A-Z]/.test(val));
        updateRule('rule-number', /[0-9]/.test(val));
        updateRule('rule-special', /[@$!%*?&]/.test(val));
    });
}

function updateRule(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (regPassword.value === "") {
        el.className = "waiting"; el.innerHTML = el.innerHTML.replace(/✔️|❌|⚪/g, '⚪');
    } else if (isValid) {
        el.className = "valid"; el.innerHTML = el.innerHTML.replace(/⚪|❌/g, '✔️');
    } else {
        el.className = "invalid"; el.innerHTML = el.innerHTML.replace(/⚪|✔️/g, '❌');
    }
}

const regConfirm = document.getElementById('regConfirmPassword');
const matchMsg = document.getElementById('match-msg');
if (regConfirm && matchMsg) {
    regConfirm.addEventListener('input', function () {
        matchMsg.classList.remove('hidden');
        if (regConfirm.value === regPassword.value && regConfirm.value !== "") {
            matchMsg.textContent = "✔️ Mật khẩu khớp nhau!"; matchMsg.style.color = "#00b894";
        } else {
            matchMsg.textContent = "❌ Mật khẩu chưa khớp!"; matchMsg.style.color = "#d63031";
        }
    });
}

// =========================================================
// 7. XÁC MINH QUÊN MẬT KHẨU (BƯỚC 1)
// =========================================================
async function verifyAccount() {
    const role = document.getElementById('forgotRole').value;
    const username = document.getElementById('forgotUsername').value;
    const idCode = document.getElementById('forgotMSHS').value; // Mã đa năng

    // ÉP BUỘC: Phải có đủ 3 món (Vai trò, Tài khoản, Mã định danh) mới cho qua
    if (!role || !username || !idCode) {
        Swal.fire({
            icon: 'warning',
            title: 'Thiếu thông tin!',
            text: 'Vui lòng điền đầy đủ Vai trò, Tên tài khoản và Mã định danh (MSHS/MSGV/MSAD)!',
            confirmButtonColor: '#ff7b00'
        });
        return;
    }

    // ... (Phần logic giả lập ở dưới ông bạn giữ nguyên nhé) ...
}



// ==========================================
// 8. ĐẶT LẠI MẬT KHẨU MỚI (KỶ LUẬT THÉP + KẾT NỐI NODE.JS)
// ==========================================
const forgotPwdForm = document.getElementById('forgotPwdForm');
if (forgotPwdForm) {
    forgotPwdForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Khóa mõm mọi sự kiện ngầm

        const verifySection = document.getElementById('verifySection');
        const resetSection = document.getElementById('resetSection');

        if (!verifySection.classList.contains('hidden')) {
            verifyAccount();
            return;
        }

        if (!resetSection.classList.contains('hidden')) {
            // Lấy thêm thông tin Role và Username để gửi qua Database
            const role = document.getElementById('forgotRole').value;
            const username = document.getElementById('forgotUsername').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            // 🛑 ẢI 1 & 2: KỶ LUẬT THÉP (Chống rỗng + Đủ 4 quy tắc)
            const isLengthValid = newPassword.length >= 8;
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasNumber = /[0-9]/.test(newPassword);
            const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);

            if (!newPassword || !isLengthValid || !hasUpper || !hasNumber || !hasSpecial) {
                Swal.fire({ icon: 'error', title: 'Mật khẩu quá yếu!', text: 'Vui lòng nhập đầy đủ và thỏa mãn 4 quy tắc!', confirmButtonColor: '#d63031' });
                return;
            }

            // 🛑 ẢI 3: KHỚP NHAU
            if (newPassword !== confirmNewPassword) {
                Swal.fire({ icon: 'error', title: 'Sai lệch!', text: 'Mật khẩu xác nhận không khớp!', confirmButtonColor: '#d63031' });
                return;
            }

            // 🚀 QUA 3 ẢI -> GỌI API NODE.JS (Code tịch thu từ mục 12)
            fetch(`${API_BASE_URL}/api/users/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, username, newPassword })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: 'Mật khẩu đã được đặt lại an toàn. Vui lòng đăng nhập!',
                            confirmButtonColor: '#00b894'
                        }).then(() => {
                            // Reset form và quay về trang Đăng nhập
                            document.getElementById('forgotPwdForm').reset();
                            document.getElementById('verifySection').classList.remove('hidden');
                            document.getElementById('resetSection').classList.add('hidden');
                            toggleForm('login');
                        });
                    } else {
                        // Báo lỗi từ phía Server (ví dụ: Không tìm thấy user)
                        Swal.fire({ icon: 'error', title: 'Lỗi Database', text: data.message || 'Không thể đổi mật khẩu!', confirmButtonColor: '#d63031' });
                    }
                })
                .catch(err => {
                    // Lỗi khi chưa bật Node.js
                    Swal.fire({ icon: 'info', title: 'Chưa bật Node.js!', text: 'Giao diện đã chuẩn 100%. Vui lòng bật Server Node.js để kết nối MySQL!', confirmButtonColor: '#ff6b00' });
                });
        }
    });
}

// 9. SUBMIT ĐĂNG KÝ (KẾT NỐI VỚI NODE.JS CỔNG 5000 - CÓ KỶ LUẬT THÉP)
document.getElementById('regForm').addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // Diệt luồng chạy ngầm

    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
    const submitBtn = this.querySelector('button[type="submit"]');

    // 🛑 ẢI 1: KIỂM TRA SỐ ĐIỆN THOẠI (Bắt buộc đầu 0 + đúng 10 số)
    // Giải thích: ^0 (Bắt buộc bắt đầu bằng số 0), [0-9]{9}$ (Theo sau là đúng 9 chữ số nữa)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Số điện thoại của bạn không phù hợp',
            confirmButtonColor: '#d63031'
        });
        return; // Cấm đi tiếp!
    }
    // 🛑 ẢI 2: KỶ LUẬT THÉP MẬT KHẨU (4 QUY TẮC)
    const isLengthValid = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

    if (!isLengthValid || !hasUpper || !hasNumber || !hasSpecial) {
        Swal.fire({ icon: 'error', title: 'Mật khẩu quá yếu!', text: 'Vui lòng thỏa mãn cả 4 quy tắc mật khẩu bên dưới!', confirmButtonColor: '#d63031' });
        return;
    }

    // 🛑 ẢI 3: KHỚP MẬT KHẨU
    if (pass !== confirmPass) {
        Swal.fire({ icon: 'warning', title: 'Khoan đã!', text: 'Mật khẩu xác nhận chưa khớp!', confirmButtonColor: '#f26a21' });
        return;
    }

    // 🚀 QUA ĐƯỢC 3 ẢI TRÊN -> TIẾN HÀNH ĐÓNG GÓI GỬI SANG NODE.JS
    submitBtn.innerText = "Đang xử lý...";
    submitBtn.disabled = true;

    const formData = new FormData(this);
    const dataObj = Object.fromEntries(formData);

    fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObj)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Tuyệt vời!',
                    text: 'Đăng ký tài khoản thành công!',
                    confirmButtonColor: '#00b894'
                }).then(() => {
                    document.getElementById('regForm').reset();
                    submitBtn.innerText = "Đăng Ký";
                    submitBtn.disabled = false;
                    toggleForm('login'); // Chuyển về trang đăng nhập
                });
            } else {
                // Node.js báo lỗi (Vd: Trùng tên tài khoản)
                Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: data.message, confirmButtonColor: '#d63031' });
                submitBtn.innerText = "Đăng Ký";
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Lỗi khi server Node.js chưa bật
            Swal.fire({ icon: 'info', title: 'Chưa bật Server!', text: 'Form đã chuẩn 100%. Vui lòng bật Node.js để hoàn tất Đăng Ký!', confirmButtonColor: '#ff6b00' });
            submitBtn.innerText = "Đăng Ký";
            submitBtn.disabled = false;
        });
});

// ==========================================
// 10. SUBMIT ĐĂNG NHẬP (KẾT NỐI API 5000)
// ==========================================
const logForm = document.getElementById('logForm');
if (logForm) {
    logForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Khóa chặt các luồng chạy ngầm

        const role = document.getElementById('loginRole').value;
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 👉 THÊM DÒNG NÀY: Bắt buộc phải lấy mã định danh từ ô input
        const mshs = document.getElementById('loginMSHS').value;

        const errorMsg = document.getElementById('loginError');

        fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },

            // 👉 THÊM mshs VÀO ĐÂY: Gói nó lại để gửi lên cho Node.js
            body: JSON.stringify({ role, username, password, mshs, rememberMe })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    errorMsg.classList.add('hidden');

                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công!',
                        text: data.message,
                        confirmButtonColor: '#f26a21'
                    }).then(() => {
                        // CHÌA KHÓA ĐỂ GOOGLE HIỆN BẢNG LƯU MẬT KHẨU LÀ ĐÂY:
                        // Trình duyệt phải nhận diện có sự "Chuyển trang" hoặc "Tải lại trang" 
                        // Tạm thời mình dùng reload, sau này có trang dashboard thì đổi thành: window.location.href = "dashboard.html"
                        // Thay thế cho dòng window.location.reload();
                        // 1. Lưu toàn bộ thông tin tài khoản vào ví của trình duyệt
                        localStorage.setItem('currentUser', JSON.stringify(data.user));

                        // 2. Lấy role từ data.user để chia ngã rẽ
                        const userRole = data.user.role;

                        if (userRole === 'admin') {
                            window.location.href = '/Frontend/html/admin/admin.html';
                        }
                        else if (userRole === 'teacher') {
                            window.location.href = '/Frontend/html/teacher/giaovien.html';
                        }
                        else if (userRole === 'student') {
                            window.location.href = '/Frontend/html/students/hocsinh.html';
                        }
                        else {
                            window.location.href = '/Frontend/index.html';
                        }
                    }); // Đóng của .then( () => { ... } ) của SweetAlert2

                } else {
                    errorMsg.innerText = "❌ " + data.message;
                    errorMsg.classList.remove('hidden');

                    errorMsg.style.animation = 'none';
                    setTimeout(() => errorMsg.style.animation = '', 10);
                }
            })
            .catch(error => {
                console.error('Lỗi kết nối Backend:', error);
                Swal.fire({ icon: 'warning', title: 'Mất kết nối!', text: 'Không thể kết nối đến Máy chủ (Server 5000).', confirmButtonColor: '#ff6b00' });
            });
    });
}







// 11. XÁC MINH TÀI KHOẢN (QUÊN MẬT KHẨU)
window.verifyAccount = function () {
    const role = document.getElementById('forgotRole').value;
    const username = document.getElementById('forgotUsername').value;
    const mshs = document.getElementById('forgotMSHS').value;

    if (!role || !username || (role === 'student' && !mshs)) {
        Swal.fire({ icon: 'warning', title: 'Thiếu thông tin!', text: 'Vui lòng chọn vai trò, nhập tên tài khoản và mã số học sinh (nếu có)!', confirmButtonColor: '#f26a21' });
        return;
    }

    fetch('http://localhost:5000/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, mshs })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                // Đổi giao diện: Ẩn khu vực xác minh, hiện khu vực nhập mật khẩu mới
                document.getElementById('verifySection').classList.add('hidden');
                document.getElementById('resetSection').classList.remove('hidden');
                document.getElementById('forgotInstruction').innerText = "✅ Tài khoản hợp lệ! Vui lòng thiết lập mật khẩu mới.";
                document.getElementById('forgotInstruction').style.color = "#00b894";
            } else {
                Swal.fire({ icon: 'error', title: 'Không tìm thấy!', text: data.message, confirmButtonColor: '#f26a21' });
            }
        })
        .catch(err => console.error(err));
};




// HIỆU ỨNG KIỂM DUYỆT MẬT KHẨU MỚI (REAL-TIME)
const resetPasswordField = document.getElementById('newPassword');
if (resetPasswordField) {
    resetPasswordField.addEventListener('input', function () {
        const val = resetPasswordField.value;
        updateResetRule('reset-rule-length', val.length >= 8);
        updateResetRule('reset-rule-upper', /[A-Z]/.test(val));
        updateResetRule('reset-rule-number', /[0-9]/.test(val));
        updateResetRule('reset-rule-special', /[@$!%*?&]/.test(val));
    });
}

function updateResetRule(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const passValue = document.getElementById('newPassword').value;

    if (passValue === "") {
        el.className = "waiting";
        el.innerHTML = el.innerHTML.replace(/✔️|❌|⚪/g, '⚪');
    } else if (isValid) {
        el.className = "valid";
        el.innerHTML = el.innerHTML.replace(/⚪|❌/g, '✔️');
    } else {
        el.className = "invalid";
        el.innerHTML = el.innerHTML.replace(/⚪|✔️/g, '❌');
    }
}









document.addEventListener("DOMContentLoaded", function () {
    // ==========================================
    // 1. TỪ ĐIỂN CHUYỂN TAB (BẤT TỬ HÓA)
    // ==========================================
    // Chỉ cần điền đúng ID của nút menu và ID của thẻ section nội dung
    const tabDictionary = [
        { menuId: 'menu-schedule', sectionId: 'section-schedule' },
        { menuId: 'menu-courses', sectionId: 'section-courses' },
        { menuId: 'menu-teacher-schedule', sectionId: 'section-teacher-schedule' } // Khúc này cho lịch giáo viên nè
    ];

    tabDictionary.forEach(item => {
        const menuBtn = document.getElementById(item.menuId);
        const sectionContent = document.getElementById(item.sectionId);

        if (menuBtn && sectionContent) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Bước 1: Ẩn tất cả các khung nội dung
                tabDictionary.forEach(t => {
                    const content = document.getElementById(t.sectionId);
                    if (content) content.style.display = 'none';
                });

                // Bước 2: Xóa màu cam (active) ở tất cả các nút menu
                document.querySelectorAll('.sidebar-menu li').forEach(li => {
                    li.classList.remove('active');
                });

                // Bước 3: Bật khung nội dung vừa bấm và tô màu cam cho nút đó
                sectionContent.style.display = 'block';
                menuBtn.classList.add('active'); // Giả sử menuBtn chính là thẻ <li>

                // Nếu là tab Khóa học thì gọi thêm hàm load dữ liệu
                if (item.menuId === 'menu-courses' && typeof loadRegistrationData === 'function') {
                    loadRegistrationData();
                }
            });
        }
    });

    // ... Các đoạn code xử lý Modal, Popup của ông bạn cứ để nguyên ở dưới
});