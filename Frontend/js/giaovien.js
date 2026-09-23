const API_BASE_URL = 'http://localhost:5000';
let currentTeacher = null;
document.addEventListener('DOMContentLoaded', () => {
    // 1. ĐỌC DỮ LIỆU THẬT TỪ BƯỚC ĐĂNG NHẬP
    const localData = localStorage.getItem('currentUser');

    // 2. NẾU CHƯA ĐĂNG NHẬP -> Đá văng ra trang Login
    if (!localData || localData === "undefined") {
        window.location.href = '../auth.html'; // Đường dẫn tới file Đăng nhập
        return;
    }

    const currentTeacher = JSON.parse(localData);

    // 3. KIỂM TRA CHỨC VỤ: Chặn Admin không được vào trang của Giáo viên
    if (currentTeacher.role !== 'teacher') {
        alert("Tài khoản của bạn không có quyền truy cập trang Giáo viên!");
        window.location.href = '../auth.html';
        return;
    }

    // 4. HIỂN THỊ TÊN ĐỘNG: Đăng nhập cô nào, hiện tên cô đó
    const nameDisplay = document.getElementById('teacherNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = currentTeacher.fullname;
    }

    // 5. TẢI LỊCH DẠY: Gọi API lôi đúng lịch của mã GV đang đăng nhập
    if (typeof loadMySchedule === 'function') {
        loadMySchedule(currentTeacher.mshs);
    }
});

// ==========================================
// TẢI LỊCH DẠY CỦA CÁ NHÂN GIÁO VIÊN
// ==========================================
function loadMySchedule(mshs) {
    // Tái sử dụng chính API lọc dữ liệu của Admin
    fetch(`http://localhost:5000/api/teacher-schedules?mshs=${mshs}`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('myScheduleBody');
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="padding: 30px; color: #7f8c8d;">Tuần này bạn chưa có lịch dạy nào.</td></tr>`;
                return;
            }

            // Đổ dữ liệu vào bảng
            data.forEach(item => {
                const d = new Date(item.work_date);
                const dayStr = "Thứ " + (d.getDay() === 0 ? "Chủ Nhật" : d.getDay() + 1);
                const dateStr = d.toLocaleDateString('vi-VN');

                // Bên trong data.forEach(item => { ... })

                // Xử lý huy hiệu Trạng thái & Nút Thao tác (Khóa lại nếu đã báo cáo)
                let actionBtn = '';
                let statusBadge = '';

                // 1. Tạo form CSS chuẩn chung cho tất cả các Badge (Chống méo, bo tròn 20px, ép thành khối)
                const badgeStyle = 'padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';

                if (!item.status || item.status === 'upcoming' || item.status === 'Sắp tới') {
                    statusBadge = `<span class="badge badge-upcoming" style="background:#3498db; color:white; ${badgeStyle}">Sắp tới</span>`;
                    // Bút chì xanh để sửa
                    actionBtn = `<button class="btn-edit" onclick="openUpdateModal(${item.id})"><i class="fas fa-pencil-alt"></i></button>`;
                }
                else if (item.status === 'done') {
                    statusBadge = `<span class="badge badge-done" style="background:#2ecc71; color:white; ${badgeStyle}">Đã đi dạy</span>`;
                    // Đổi thành nút Check xám (Khóa)
                    actionBtn = `<button class="btn-disabled" disabled title="Chỉ được cập nhật 1 lần"><i class="fas fa-check"></i></button>`;
                }
                else if (item.status === 'absent') {
                    // Tách riêng lý do vắng xuống dòng dưới để viên thuốc (badge) luôn giữ được form thon gọn
                    const reasonHtml = item.reason ? `<div style="margin-top: 5px;"><small style="color:#e74c3c; font-weight: 500;">(${item.reason})</small></div>` : '';
                    statusBadge = `<span class="badge badge-absent" style="background:#e74c3c; color:white; ${badgeStyle}">Vắng mặt</span>${reasonHtml}`;

                    // Sửa lại class icon chuẩn: fas fa-ban
                    actionBtn = `<button class="btn-disabled" disabled title="Chỉ được cập nhật 1 lần"><i class="fas fa-ban"></i></button>`;
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>
                <strong>${dayStr}</strong><br>
                <small style="color: #7f8c8d;">${dateStr}</small>
            </td>
            <td class="subject-name">${item.class_name}</td>
            <td><strong>${item.room}</strong></td>
            <td>${item.time_range}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td> <!-- Nhét nút thao tác vào đây -->
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Lỗi lấy lịch dạy cá nhân:", err));
}

// ==========================================
// XỬ LÝ ĐĂNG XUẤT
// ==========================================
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. LẤY DỮ LIỆU TÀI KHOẢN (Và fix lỗi chữ undefined)
    const localData = localStorage.getItem('currentUser');
    let currentTeacher = null;

    if (localData && localData !== "undefined") {
        currentTeacher = JSON.parse(localData);
    } else {
        // Nếu chưa đăng nhập thật, giả lập để code hiển thị đẹp
        currentTeacher = { mshs: 'GV001', fullname: 'Cô Đan Châu', role: 'teacher' };
    }

    if (currentTeacher.role !== 'teacher') {
        window.location.href = '../auth.html';
        return;
    }

    // Hiển thị tên (Chắc chắn không còn undefined)
    document.getElementById('teacherNameDisplay').innerText = currentTeacher.fullname;

    // Tải lịch dạy
    loadMySchedule(currentTeacher.mshs);
});

// ==========================================
// XỬ LÝ CLICK MỞ MENU DROPDOWN
// ==========================================
window.toggleDropdown = function () {
    document.getElementById('userDropdown').classList.toggle('show');
}

// Bấm ra ngoài khoảng trắng thì tự đóng Menu lại
window.onclick = function (event) {
    if (!event.target.closest('.user-profile')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
}







// ==========================================
// MA THUẬT ĐÓNG/MỞ MENU TRÊN ĐIỆN THOẠI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        // Khi bấm vào nút 3 gạch
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            console.log('🟢 ĐÃ ÉP MỞ: Cả Menu và Thảm đen đã trồi ra!');
        });

        // Khi bấm ra ngoài vùng thảm đen
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            console.log('🔴 ĐÃ ÉP ĐÓNG: Cả Menu và Thảm đen đã thu lại!');
        });
    }
});







// ==========================================
// HÀM MỞ POPUP CẬP NHẬT (PHIÊN BẢN GIAO DIỆN CHUYÊN NGHIỆP)
// ==========================================
function openUpdateModal(scheduleId) {
    Swal.fire({
        title: '<h3 style="color: #2c3e50; font-weight: bold; margin-bottom: 0;">BÁO CÁO CA DẠY</h3>',
        width: '450px',
        html: `
            <style>
                /* Ẩn dấu chấm radio mặc định xấu xí */
                .status-option input[type="radio"] { display: none; }
                
                /* Tạo khối box cho các lựa chọn */
                .status-option {
                    display: flex; align-items: center; padding: 15px; margin-top: 15px;
                    border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer;
                    transition: all 0.2s ease; background: #fff;
                }
                .status-option:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                
                /* CSS khi được chọn (Màu Xanh cho Đi Dạy) */
                .status-option.selected-done { border-color: #2ecc71; background-color: #f0fdf4; }
                /* CSS khi được chọn (Màu Đỏ cho Vắng Mặt) */
                .status-option.selected-absent { border-color: #e74c3c; background-color: #fef2f2; }
                
                /* Định dạng icon và chữ */
                .status-icon { font-size: 28px; margin-right: 15px; }
                .icon-done { color: #2ecc71; }
                .icon-absent { color: #e74c3c; }
                .status-text { font-weight: 600; font-size: 16px; color: #334155; }
                
                /* Ô nhập lý do */
                .reason-input {
                    width: 100%; padding: 12px 15px; margin-top: 15px;
                    border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;
                    outline: none; transition: border-color 0.3s; box-sizing: border-box;
                }
                .reason-input:focus { border-color: #e74c3c; box-shadow: 0 0 0 3px rgba(231,76,60,0.1); }
            </style>

            <div style="text-align: left;">
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: -10px;">Vui lòng xác nhận trạng thái để lưu vào hệ thống</p>
                
                <!-- Box 1: Đã đi dạy -->
                <label class="status-option selected-done" id="lblDone">
                    <input type="radio" name="sttOption" value="done" checked>
                    <i class="fas fa-check-circle status-icon icon-done"></i>
                    <span class="status-text">Đã đi dạy đầy đủ</span>
                </label>

                <!-- Box 2: Vắng mặt -->
                <label class="status-option" id="lblAbsent">
                    <input type="radio" name="sttOption" value="absent">
                    <i class="fas fa-times-circle status-icon icon-absent"></i>
                    <span class="status-text">Xin vắng mặt ca này</span>
                </label>

                <!-- Ô nhập lý do (Mặc định ẩn) -->
                <div id="reasonBox" style="display: none;">
                    <input type="text" id="absentReason" class="reason-input" placeholder="✍️ Nhập lý do xin vắng (Bắt buộc)..." autocomplete="off">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Lưu Báo Cáo',
        cancelButtonText: 'Hủy Bỏ',
        confirmButtonColor: '#ff8c00', // Màu cam hợp tone trung tâm
        cancelButtonColor: '#94a3b8',
        didOpen: () => {
            // Hiệu ứng bấm chuyển đổi qua lại giữa 2 thẻ
            const lblDone = document.getElementById('lblDone');
            const lblAbsent = document.getElementById('lblAbsent');
            const reasonBox = document.getElementById('reasonBox');
            const absentInput = document.getElementById('absentReason');
            const radios = document.querySelectorAll('input[name="sttOption"]');

            radios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'done') {
                        lblDone.classList.add('selected-done');
                        lblAbsent.classList.remove('selected-absent');
                        reasonBox.style.display = 'none';
                    } else {
                        lblAbsent.classList.add('selected-absent');
                        lblDone.classList.remove('selected-done');
                        reasonBox.style.display = 'block';
                        absentInput.focus(); // Tự động trỏ chuột vào ô nhập lý do
                    }
                });
            });
        },
        preConfirm: () => {
            const status = document.querySelector('input[name="sttOption"]:checked').value;
            const reason = document.getElementById('absentReason').value;
            if (status === 'absent' && !reason.trim()) {
                Swal.showValidationMessage('⚠️ Bạn phải ghi rõ lý do xin vắng mặt!');
                return false;
            }
            return { status, reason };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            submitScheduleStatus(scheduleId, result.value.status, result.value.reason);
        }
    });
}
// Hàm gửi dữ liệu lên Server (Bản nâng cấp báo lỗi chi tiết)
function submitScheduleStatus(id, status, reason) {
    fetch(`http://localhost:5000/api/teacher-schedules/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                // Ném lỗi ra để khối catch bên dưới bắt được
                throw new Error(data.message || 'Lỗi hệ thống!');
            }
            return data;
        })
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Tuyệt vời!',
                    text: 'Đã cập nhật trạng thái lên hệ thống!'
                }).then(() => window.location.reload()); // F5 lại trang để đổi nút
            }
        })
        .catch(err => {
            console.error("Chi tiết lỗi:", err);
            Swal.fire({
                icon: 'error',
                title: 'Chưa lưu được!',
                text: err.message // Sẽ in thẳng lý do lỗi ra màn hình cho bạn xem
            });
        });
}






// ==========================================
// 1. HÀM CHUYỂN TAB MƯỢT MÀ (CẬP NHẬT GIAO DIỆN MENU BỔ SUNG XEM ĐƠN)
// ==========================================
function switchTeacherTab(tabName) {
    // 1. Ẩn TẤT CẢ các tab nội dung bên phải 
    document.getElementById('section-my-schedule').style.display = 'none';
    document.getElementById('section-attendance').style.display = 'none';
    document.getElementById('section-scores').style.display = 'none';
    if (document.getElementById('requestsContainer')) {
        document.getElementById('requestsContainer').style.display = 'none';
    }

    // 2. Tắt vạch cam (xóa class active) ở TẤT CẢ các mục menu bên trái
    document.getElementById('menu-schedule').classList.remove('active');
    document.getElementById('menu-attendance').classList.remove('active');
    document.getElementById('menu-scores').classList.remove('active');
    if (document.getElementById('menuRequests')) {
        document.getElementById('menuRequests').classList.remove('active');
    }

    // 3. Bật tab nội dung tương ứng & Bật vạch cam cho đúng menu được click
    if (tabName === 'schedule') {
        document.getElementById('section-my-schedule').style.display = 'block';
        document.getElementById('menu-schedule').classList.add('active'); // Bật vạch cam
    }
    else if (tabName === 'attendance') {
        document.getElementById('section-attendance').style.display = 'block';
        document.getElementById('menu-attendance').classList.add('active');

        // Tự động tải dữ liệu vào ô Dropdown khi vừa chuyển sang tab Điểm danh
        if (typeof loadClassesForDropdown === 'function') loadClassesForDropdown();
    }
    else if (tabName === 'scores') {
        document.getElementById('section-scores').style.display = 'block';
        document.getElementById('menu-scores').classList.add('active');

        // Tự động tải danh sách lớp vào Dropdown khi mở tab Nhập điểm
        if (typeof loadClassesForScore === 'function') loadClassesForScore();
    }
    // 👉 ĐÂY LÀ PHẦN MỚI THÊM CHO TAB XEM ĐƠN
    else if (tabName === 'requests') {
        if (document.getElementById('requestsContainer')) {
            document.getElementById('requestsContainer').style.display = 'block';
        }
        if (document.getElementById('menuRequests')) {
            document.getElementById('menuRequests').classList.add('active');
        }

        // Tự động tải danh sách đơn học sinh xin nghỉ khi mở tab
        if (typeof loadTeacherRequests === 'function') loadTeacherRequests();
    }
}

// ==========================================
// 2. TẢI DANH SÁCH CA DẠY VÀO DROPDOWN ĐIỂM DANH
// ==========================================
function loadClassesForDropdown() {
    const localData = localStorage.getItem('currentUser');
    if (!localData || localData === "undefined") return;
    const currentTeacher = JSON.parse(localData);

    // Gọi API lấy lịch dạy của đúng cô giáo này
    fetch(`http://localhost:5000/api/teacher-schedules?mshs=${currentTeacher.mshs}`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('selectClassToAttend');
            if (!select) return; // Phòng hờ lỗi chưa load HTML

            // Xóa dòng "-- Đang tải..." và thay bằng dòng mặc định
            select.innerHTML = '<option value="">-- Chọn ca dạy để điểm danh --</option>';

            // Đổ từng ca dạy vào danh sách
            data.forEach(item => {
                const d = new Date(item.work_date);
                const dateStr = d.toLocaleDateString('vi-VN');

                const option = document.createElement('option');
                option.value = item.id; // Lấy ID ca dạy làm gốc
                option.dataset.classname = item.class_name; // Lưu ngầm tên lớp để lát đi tìm học sinh
                option.textContent = `${dateStr} | ${item.class_name} | Phòng ${item.room} (${item.time_range})`;

                select.appendChild(option);
            });
        })
        .catch(err => console.error("Lỗi tải dropdown:", err));
}










// ==========================================
// TẢI DANH SÁCH CA DẠY VÀO DROPDOWN ĐIỂM DANH
// ==========================================
function loadClassesForDropdown() {
    const localData = localStorage.getItem('currentUser');
    if (!localData || localData === "undefined") return;
    const currentTeacher = JSON.parse(localData);

    // Gọi lại API lấy lịch dạy của đúng cô giáo này
    fetch(`http://localhost:5000/api/teacher-schedules?mshs=${currentTeacher.mshs}`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('selectClassToAttend');

            // Xóa dòng "-- Đang tải..." và thay bằng dòng mặc định
            select.innerHTML = '<option value="">-- Chọn ca dạy để điểm danh --</option>';

            // Đổ từng ca dạy vào danh sách
            data.forEach(item => {
                const d = new Date(item.work_date);
                const dateStr = d.toLocaleDateString('vi-VN');

                const option = document.createElement('option');
                option.value = item.id; // Lấy ID ca dạy làm gốc
                option.dataset.classname = item.class_name; // Lưu ngầm tên lớp để lát đi tìm học sinh
                option.textContent = `${dateStr} | ${item.class_name} | Phòng ${item.room} (${item.time_range})`;

                select.appendChild(option);
            });
        })
        .catch(err => console.error("Lỗi tải dropdown:", err));
}




// ==========================================
// 3. NÚT: LẤY DANH SÁCH HỌC SINH TỪ SERVER
// ==========================================
function loadStudentListForAttendance() {
    const select = document.getElementById('selectClassToAttend');
    const selectedOption = select.options[select.selectedIndex];

    // Cảnh báo nếu giáo viên chưa chọn lớp mà đã bấm nút
    if (!selectedOption.value) {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn ca dạy', text: 'Vui lòng chọn một ca dạy trước!' });
        return;
    }

    const className = selectedOption.dataset.classname; // Lấy tên lớp (VD: Anh văn - ĐC)
    const tbody = document.getElementById('attendanceListBody');

    // Hiệu ứng chờ
    tbody.innerHTML = '<tr><td colspan="4" style="color: #f39c12;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu học sinh...</td></tr>';

    // Gọi API lôi học sinh về
    fetch(`http://localhost:5000/api/students-by-class?className=${encodeURIComponent(className)}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="color: #e74c3c;">Lớp này hiện chưa có học sinh nào đăng ký.</td></tr>';
                return;
            }

            tbody.innerHTML = ''; // Xóa dòng chờ

            // Vẽ danh sách học sinh kèm nút check điểm danh
            data.forEach(student => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: bold; color: #2c3e50; vertical-align: middle;">${student.mshs}</td>
                    <td style="vertical-align: middle;">${student.student_name}</td>
                    <td style="vertical-align: middle;">
                        <!-- Nút Có mặt -->
                        <input type="radio" id="present_${student.mshs}" name="status_${student.mshs}" value="present" class="attend-radio present" checked>
                        <label for="present_${student.mshs}" class="attend-label"><i class="fas fa-check"></i> Có mặt</label>
                        
                        <!-- Nút Vắng mặt -->
                        <input type="radio" id="absent_${student.mshs}" name="status_${student.mshs}" value="absent" class="attend-radio absent">
                        <label for="absent_${student.mshs}" class="attend-label"><i class="fas fa-times"></i> Vắng mặt</label>
                    </td>
                    <td style="vertical-align: middle;">
                        <input type="text" class="attend-note" id="note_${student.mshs}" placeholder="Ghi chú (nếu vắng)...">
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Lỗi:", err);
            tbody.innerHTML = '<tr><td colspan="4" style="color: red;">Không thể kết nối với máy chủ!</td></tr>';
        });
}













// ==========================================
// 4. HÀM LƯU ĐIỂM DANH (GỬI LÊN SERVER)
// ==========================================
function saveAttendance() {
    const select = document.getElementById('selectClassToAttend');
    const scheduleId = select.value;

    if (!scheduleId) {
        Swal.fire({ icon: 'warning', title: 'Khoan đã!', text: 'Bạn chưa chọn ca dạy nào để lưu.' });
        return;
    }

    const tbody = document.getElementById('attendanceListBody');
    const rows = tbody.querySelectorAll('tr');

    // Nếu bảng đang trống hoặc báo lỗi thì không làm gì cả
    if (rows.length === 0 || rows[0].querySelector('td').colSpan == 4) return;

    // Gom dữ liệu từ giao diện
    const attendanceData = [];
    rows.forEach(tr => {
        const mshs = tr.querySelector('td:nth-child(1)').innerText.trim();
        const studentName = tr.querySelector('td:nth-child(2)').innerText.trim();

        // Lấy nút radio đang được check (present hoặc absent)
        const status = tr.querySelector(`input[name="status_${mshs}"]:checked`).value;
        const note = tr.querySelector(`#note_${mshs}`).value.trim();

        attendanceData.push({ mshs, student_name: studentName, status, note });
    });

    // Bật xác nhận trước khi chốt sổ
    Swal.fire({
        title: 'Xác nhận chốt sổ?',
        text: "Lưu ý: Sau khi lưu, bạn sẽ không thể tự sửa lại dữ liệu này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Đồng ý, Lưu ngay!',
        cancelButtonText: 'Hủy, để tôi xem lại'
    }).then((result) => {
        if (result.isConfirmed) {

            // Gửi dữ liệu lên API
            fetch('http://localhost:5000/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule_id: scheduleId, attendance_data: attendanceData })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire('Thành công!', data.message, 'success').then(() => {
                            // Reset lại giao diện sau khi lưu xong
                            document.getElementById('selectClassToAttend').value = '';
                            tbody.innerHTML = '<tr><td colspan="4" style="color: #7f8c8d; padding: 20px;">Vui lòng chọn ca dạy để hiển thị danh sách học sinh.</td></tr>';
                        });
                    } else {
                        // Nếu lỗi (như lỗi báo Đã điểm danh rồi)
                        Swal.fire('Thất bại', data.message, 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire('Lỗi', 'Không thể kết nối với máy chủ!', 'error');
                });
        }
    });
}





// ==========================================
// TÍNH NĂNG NHẬP ĐIỂM & XUẤT EXCEL (CHUẨN CHỈ)
// ==========================================



window.loadStudentsForScore = function () {
    const className = document.getElementById('selectScoreClass').value;
    const tbody = document.getElementById('scoreTableContainer');

    if (!className) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #888;">Vui lòng chọn lớp học ở trên để tải danh sách học sinh.</td></tr>`;
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #f39c12;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Đang tải dữ liệu...</p></td></tr>';

    fetch(`${API_BASE_URL}/api/students-by-class?className=${encodeURIComponent(className)}`)
        .then(res => res.json())
        .then(students => {
            if (!students || students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #e74c3c;">Lớp này hiện chưa có học sinh nào.</td></tr>';
                return;
            }

            let rowsHTML = '';
            students.forEach(student => {
                const currentScore = student.score !== null && student.score !== undefined ? student.score : '';
                const currentNote = student.note || '';

                rowsHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px 20px; font-weight: bold; color: #172b4d; border-right: 1px solid #f0f0f0;">${student.mshs}</td>
                        <td style="padding: 15px 20px; font-weight: bold; border-right: 1px solid #f0f0f0;">${student.student_name}</td>
                        <td style="padding: 15px 20px; text-align: center; border-right: 1px solid #f0f0f0;">
                            <input type="number" class="score-input" data-mshs="${student.mshs}" value="${currentScore}" min="0" max="10" step="0.5" 
                                   style="width: 80px; padding: 10px; border-radius: 6px; border: 1px solid #ced4da; text-align: center; font-weight: bold; color: #e67e22; outline: none;">
                        </td>
                        <td style="padding: 15px 20px;">
                            <input type="text" class="note-input" value="${currentNote}" placeholder="Nhập nhận xét..." 
                                   style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ced4da; outline: none;">
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = rowsHTML;
        })
        .catch(err => {
            console.error("Lỗi:", err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: red;">Lỗi kết nối máy chủ!</td></tr>';
        });
}

window.exportExcelScores = function () {
    const className = document.getElementById('selectScoreClass').value;
    if (!className) {
        Swal.fire('Chú ý', 'Vui lòng chọn lớp học để xuất bảng điểm!', 'warning');
        return;
    }

    const rows = document.querySelectorAll('#scoreTableContainer tr');
    let excelData = [];

    rows.forEach(tr => {
        const scoreInput = tr.querySelector('.score-input');
        const noteInput = tr.querySelector('.note-input');
        if (scoreInput && noteInput) {
            excelData.push({
                "Mã HS": tr.cells[0].innerText.trim(),
                "Tên Học Sinh": tr.cells[1].innerText.trim(),
                "Điểm Số (10)": scoreInput.value.trim(),
                "Nhận Xét": noteInput.value.trim()
            });
        }
    });

    if (excelData.length === 0) {
        Swal.fire('Thông báo', 'Bảng điểm trống!', 'warning');
        return;
    }

    if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bảng Điểm");
        XLSX.writeFile(wb, `Bang_Diem_${className.replace(/\s+/g, '_')}.xlsx`);
    } else {
        Swal.fire('Lỗi', 'Chưa tải được thư viện Excel', 'error');
    }
}

// =========================================================
// 3. NỘP BẢNG ĐIỂM VỀ CHO ADMIN QUẢN LÝ (BẢN CHUẨN DÙNG MÃ GV)
// =========================================================
window.saveClassScores = function () {
    const className = document.getElementById('selectScoreClass').value;

    if (!className) {
        Swal.fire('Chú ý', 'Bạn chưa chọn lớp học nào để nộp điểm!', 'warning');
        return;
    }

    // 1. MÓC TRỰC TIẾP TỪ LOCAL STORAGE ĐỂ KHÔNG BAO GIỜ BỊ NULL
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        Swal.fire('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng F5 lại trang!', 'error');
        return;
    }

    // 2. TÚM NGAY LẤY MÃ GIÁO VIÊN ĐỂ GỬI VỀ BACKEND
    // (Đã xóa bỏ hoàn toàn đoạn if-else phiên dịch tên rườm rà cũ)
    const maGV = user.mshs || user.msgv || user.username || user.id;
    if (!maGV) {
        Swal.fire('Lỗi', 'Không tìm thấy thông tin mã giáo viên!', 'error');
        return;
    }

    // 3. THU THẬP ĐIỂM TỪ BẢNG
    const scoreInputs = document.querySelectorAll('.score-input');
    const noteInputs = document.querySelectorAll('.note-input');

    let scoresData = [];
    let hasError = false;

    scoreInputs.forEach((input, index) => {
        const mshs = input.getAttribute('data-mshs');
        const studentName = input.closest('tr').querySelectorAll('td')[1].innerText;
        const score = input.value;
        const note = noteInputs[index].value;

        if (score !== '' && (score < 0 || score > 10)) {
            hasError = true;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '#ced4da';
        }

        if (score !== '') {
            scoresData.push({ mshs, studentName, score, note });
        }
    });

    if (hasError) {
        Swal.fire('Lỗi Nhập Liệu', 'Điểm số phải từ 0 đến 10. Vui lòng kiểm tra các ô màu đỏ!', 'error');
        return;
    }

    if (scoresData.length === 0) {
        Swal.fire('Chú ý', 'Chưa có điểm nào được nhập để gửi về Trung tâm!', 'info');
        return;
    }

    // 4. HIỂN THỊ XÁC NHẬN VÀ GỬI API
    Swal.fire({
        title: `Nộp bảng điểm lớp ${className}?`,
        text: "Dữ liệu sẽ được gửi thẳng về hệ thống cho Admin Trung tâm quản lý và xét duyệt.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#1abc9c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-paper-plane"></i> Gửi cho Admin'
    }).then((result) => {
        if (result.isConfirmed) {

            // Gửi API với biến maGV (Ví dụ: GV005) thay vì teacherName
            fetch('http://localhost:5000/api/scores/submit-to-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    className: className,
                    magv: maGV, // <--- Điểm mấu chốt giải quyết lỗi "Loipham123"
                    scores: scoresData
                })
            })
                // ... (phía trên là lệnh fetch)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Thành công bình thường
                        Swal.fire('Hoàn tất!', 'Bảng điểm đã được nộp thành công cho Admin.', 'success');
                    }
                    else if (data.status === 'locked') {
                        // Hứng trạng thái CHỐT SỔ từ Backend
                        Swal.fire({
                            title: 'Đã Chốt Sổ!',
                            text: data.message, // Lấy nguyên câu thông báo từ Backend
                            icon: 'warning',
                            confirmButtonColor: '#f39c12',
                            confirmButtonText: 'Đã hiểu'
                        });
                    }
                    else {
                        // Các lỗi khác (lỗi mạng, database...)
                        Swal.fire('Lỗi', data.message || 'Gửi thất bại', 'error');
                    }
                })
                .catch(err => {
                    console.error("Lỗi nộp điểm:", err);
                    Swal.fire('Lỗi mạng', 'Không thể kết nối đến Máy chủ', 'error');
                });
            // ... (phía dưới là dấu đóng ngoặc)
        }
    });
};








// ==========================================
// 1. TẢI LỊCH DẠY VÀO DROPDOWN NHẬP ĐIỂM (LỌC THEO MÃ GV)
// ==========================================
window.loadClassesForScore = function () {
    const selectClass = document.getElementById('selectScoreClass');
    if (!selectClass) return;

    // 1. Lấy thông tin user đăng nhập
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        Swal.fire('Lỗi', 'Không tìm thấy thông tin đăng nhập!', 'error');
        return;
    }

    // 2. Lấy thẳng Mã Giáo Viên (Cột mshs trong DB đang chứa GV001, GV005...)
    const maGV = user.mshs || user.msgv || user.username || user.id;

    if (!maGV) {
        console.error("Không tìm thấy mã giáo viên trong tài khoản!");
        return;
    }

    console.log("👉 ĐÃ LẤY MÃ GV ĐỂ GỌI API:", maGV);
    selectClass.innerHTML = '<option value="">-- Đang kết nối máy chủ... --</option>';

    // 3. Gọi API lấy danh sách lớp dựa trên mã GV (Khớp với API bên server.js)
    fetch(`http://localhost:5000/api/teacher-classes/${encodeURIComponent(maGV)}`)
        .then(res => res.json())
        .then(data => {
            console.log("👉 KẾT QUẢ DB TRẢ VỀ:", data);
            selectClass.innerHTML = '<option value="">-- Chọn lớp để nhập điểm --</option>';

            if (data && data.length > 0) {
                data.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class_name;
                    option.innerText = cls.class_name;
                    selectClass.appendChild(option);
                });

                // Hiển thị thông báo góc màn hình y như code cũ của bạn
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Đã tải xong danh sách lớp',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                selectClass.innerHTML = '<option value="">-- Không có lịch dạy nào --</option>';
            }
        })
        .catch(err => {
            console.error("Lỗi Fetch API:", err);
            selectClass.innerHTML = '<option value="">-- Lỗi kết nối --</option>';
        });
};





// ==========================================
// TÍNH NĂNG GIÁO VIÊN: XEM ĐƠN HỌC SINH NGHỈ (FIX LỖI ÁM TÊN)
// ==========================================
window.loadTeacherRequests = function () {
    let teacherName = '';

    // 1. TUYỆT ĐỐI KHÔNG DÙNG localStorage NỮA. 
    // Quét thẳng vào giao diện tìm tên bắt đầu bằng "Cô " hoặc "Thầy "
    const allSpans = document.querySelectorAll('span, strong, b, div');
    for (let el of allSpans) {
        const text = el.innerText.trim();
        // Bắt chuẩn xác "Cô Đan Châu" đang hiện trên màn hình
        if (text.startsWith('Cô ') || text.startsWith('Thầy ')) {
            teacherName = text;
            break;
        }
    }

    // 2. Dự phòng: Lấy từ biến của riêng trang Giáo viên
    if (!teacherName && typeof currentTeacher !== 'undefined' && currentTeacher) {
        teacherName = currentTeacher.fullname || currentTeacher.username;
    }

    const tbody = document.getElementById('teacherRequestsBody');
    if (!tbody) return;

    if (!teacherName || teacherName === 'Dat') {
        tbody.innerHTML = `<tr><td colspan="4" style="color: red; padding: 20px;">Lỗi: Vẫn bị ám tên cũ, vui lòng Ctrl + F5 lại web!</td></tr>`;
        return;
    }

    // Bật F12 lên check lại xem đã đúng "Cô Đan Châu" chưa nhé
    console.log("👉 Tên giáo viên đẩy lên Server chuẩn:", teacherName);

    tbody.innerHTML = `<tr><td colspan="4" style="padding: 30px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin"></i> Đang kéo dữ liệu...</td></tr>`;

    // 3. Gọi API với tên chuẩn
    fetch(`${API_BASE_URL}/api/teacher-requests?name=${encodeURIComponent(teacherName)}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; color: #2ecc71; font-style: italic; font-weight: bold;">Tuyệt vời! Không có học sinh nào xin nghỉ.</td></tr>`;
                return;
            }

            data.forEach(req => {
                const dateObj = new Date(req.created_at);
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN');
                const timeHtml = `<span style="color:#e74c3c; font-weight:bold;">${timeStr}</span><br><small style="color:#7f8c8d;">${dateStr}</small>`;

                let statusBadge = '';
                if (req.status === 'Đã duyệt') {
                    statusBadge = `<span style="background: #2ecc71; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Đã duyệt nghỉ</span>`;
                } else if (req.status === 'Từ chối') {
                    statusBadge = `<span style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Không cho nghỉ</span>`;
                } else {
                    statusBadge = `<span style="background: #f1c40f; color: #2c3e50; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Admin đang xét duyệt</span>`;
                }

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                tr.innerHTML = `
                    <td style="vertical-align: middle; text-align: center; padding: 12px; border-right: 1px dashed #eee;">${timeHtml}</td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px; border-right: 1px dashed #eee;"><strong style="color: #3498db;">${req.student_name}</strong><br><small>(${req.mshs})</small></td>
                    <td style="vertical-align: middle; text-align: left; padding: 10px; font-size: 13px; color: #34495e; white-space: pre-line; border-right: 1px dashed #eee;">${req.content}</td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px;">${statusBadge}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Lỗi:", err);
            tbody.innerHTML = `<tr><td colspan="4" style="color: red; padding: 20px;">Lỗi kết nối máy chủ!</td></tr>`;
        });
}