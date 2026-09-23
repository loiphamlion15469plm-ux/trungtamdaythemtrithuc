const API_BASE_URL = 'http://localhost:5000'; // Chú ý: Đổi số 5000 thành đúng cái Port mà Node.js của ông bạn đang chạy nhé



document.addEventListener("DOMContentLoaded", function () {
    // 1. Check quyền truy cập
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../../index.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }
    document.getElementById('adminName').innerText = user.username;

    // 2. Nút menu và Đăng xuất
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });
    document.getElementById('btnLogout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    });

    // 3. Tải danh sách lịch từ Server
    loadSchedules();

    // 4. Bắt sự kiện nút "Phân Lịch Mới"
    document.getElementById('btnAddSchedule').addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Phân Lịch Trực Mới',
            html: `
                <input type="date" id="swal-date" class="swal2-input" style="width:85%">
                <input type="text" id="swal-shift" class="swal2-input" placeholder="Ca trực (VD: Slot 1 - Sáng)" style="width:85%">
                <input type="text" id="swal-task" class="swal2-input" placeholder="Nhiệm vụ" style="width:85%">
                <input type="text" id="swal-time" class="swal2-input" placeholder="Thời gian (VD: 08:00 - 11:30)" style="width:85%">
            `,
            focusConfirm: false,
            confirmButtonColor: '#ff7b00',
            confirmButtonText: 'Tạo Lịch',
            preConfirm: () => {
                const date = document.getElementById('swal-date').value;
                const shift = document.getElementById('swal-shift').value;
                const task = document.getElementById('swal-task').value;
                const time = document.getElementById('swal-time').value;
                if (!date || !shift || !task || !time) {
                    Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin!');
                    return false;
                }
                return { date, shift, task, time };
            }
        });

        if (formValues) {
            // Gửi dữ liệu xuống API
            fetch('http://localhost:5000/api/admin/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            }).then(res => res.json()).then(data => {
                Swal.fire({ icon: 'success', title: 'Thành công', text: data.message, confirmButtonColor: '#ff7b00' });
                loadSchedules(); // Tải lại bảng
            });
        }
    });
});

// ==========================================
// CÁC HÀM XỬ LÝ DỮ LIỆU
// ==========================================

// Hàm lấy dữ liệu từ Backend và vẽ ra bảng
function loadSchedules() {
    fetch('http://localhost:5000/api/admin/schedules')
        .then(res => res.json())
        .then(schedules => {
            const tbody = document.getElementById('scheduleBody');
            let html = '';

            // Render từng dòng dữ liệu
            schedules.forEach(s => {
                // Xác định màu sắc theo trạng thái
                let badgeClass = s.status === 'done' ? 'bg-success' : (s.status === 'upcoming' ? 'bg-info' : 'bg-danger');
                let statusText = s.status === 'done' ? 'Đã trực' : (s.status === 'upcoming' ? 'Sắp tới' : 'Vắng');

                // Nếu vắng, thêm note lý do nhỏ dưới chữ Vắng
                let reasonHtml = s.status === 'absent' && s.reason ? `<br><span style="font-size:10px; opacity:0.8;">(${s.reason})</span>` : '';

                // Xử lý Ngày hiển thị (VD: Thứ 2 - 14/09)
                const d = new Date(s.work_date);
                const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                const dateStr = `${days[d.getDay()]}<br><span style="font-size:12px; font-weight:normal; color:#666">${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}</span>`;

                // 1. TẠO NÚT SỬA (Khóa lại nếu đã trực hoặc vắng)
                let lockEditHtml = (s.status === 'done' || s.status === 'absent')
                    ? `<button class="btn-edit" style="color: #ccc; cursor: not-allowed;" onclick="Swal.fire({icon: 'error', title: 'Đã chốt sổ!', text: 'Ca trực này đã kết thúc, không thể thay đổi.', confirmButtonColor: '#ff7b00'})" title="Không thể sửa"><i class="fas fa-edit"></i></button>`
                    : `<button class="btn-edit" onclick="editStatus(${s.id}, '${s.status}', '${s.reason || ''}')" title="Cập nhật trạng thái"><i class="fas fa-edit"></i></button>`;

                // 2. TẠO NÚT XÓA (Gọi hàm deleteSchedule)
                let deleteHtml = `<button class="btn-delete" onclick="deleteSchedule(${s.id})" title="Xóa lịch"><i class="fas fa-trash-alt"></i></button>`;

                // 3. RÁP VÀO BẢNG
                html += `
            <tr>
                <td class="date-col">${dateStr}</td>
                <td>${s.shift}</td>
                <td class="task-col">${s.task}</td>
                <td>${s.time_range}</td>
                <td><span class="status-badge ${badgeClass}">${statusText}${reasonHtml}</span></td>
                <td class="action-btns">
                    ${lockEditHtml}
                    ${deleteHtml}
                </td>
            </tr>
        `;
            });
            tbody.innerHTML = html;
        });
}

// Hàm cập nhật trạng thái (Bắt lỗi vụ điền lý do)
window.editStatus = async function (id, currentStatus, currentReason) {
    const { value: formValues } = await Swal.fire({
        title: 'Cập nhật điểm danh',
        html: `
            <select id="swal-status" class="swal2-input" style="width:85%">
                <option value="done" ${currentStatus === 'done' ? 'selected' : ''}>Đã trực</option>
                <option value="upcoming" ${currentStatus === 'upcoming' ? 'selected' : ''}>Sắp tới</option>
                <option value="absent" ${currentStatus === 'absent' ? 'selected' : ''}>Vắng / Nghỉ</option>
            </select>
            <textarea id="swal-reason" class="swal2-textarea" placeholder="Nhập lý do vắng mặt (Bắt buộc)..." style="display: ${currentStatus === 'absent' ? 'block' : 'none'}; width:85%; margin-top:15px;">${currentReason}</textarea>
        `,
        confirmButtonColor: '#ff7b00',
        didOpen: () => {
            const statusSelect = document.getElementById('swal-status');
            const reasonInput = document.getElementById('swal-reason');
            // Nếu đổi sang Vắng thì hiện ô nhập lý do ra
            statusSelect.addEventListener('change', (e) => {
                reasonInput.style.display = e.target.value === 'absent' ? 'block' : 'none';
            });
        },
        preConfirm: () => {
            const status = document.getElementById('swal-status').value;
            const reason = document.getElementById('swal-reason').value;
            // CHẶN: Nếu chọn vắng mà không ghi lý do
            if (status === 'absent' && reason.trim() === '') {
                Swal.showValidationMessage('Vui lòng nhập lý do vắng mặt!');
                return false;
            }
            return { status, reason };
        }
    });

    if (formValues) {
        // Gửi API cập nhật
        fetch(`http://localhost:5000/api/admin/schedules/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues)
        }).then(res => res.json()).then(data => {
            Swal.fire({ icon: 'success', title: 'Cập nhật xong!', showConfirmButton: false, timer: 1500 });
            loadSchedules(); // Tải lại bảng để thấy kết quả
        });
    }
}



// ==========================================
// HÀM XÓA LỊCH TRỰC
// ==========================================
window.deleteSchedule = function (id) {
    Swal.fire({
        title: 'Bạn có chắc chắn muốn xóa?',
        text: "Dữ liệu ca trực này sẽ biến mất vĩnh viễn!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#888',
        confirmButtonText: 'Xóa luôn!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://localhost:5000/api/admin/schedules/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({ icon: 'success', title: 'Đã xóa!', text: data.message, timer: 1500, showConfirmButton: false });
                        loadSchedules(); // Tải lại bảng ngay lập tức
                    }
                })
                .catch(err => console.error("Lỗi xóa:", err));
        }
    });
}




document.addEventListener("DOMContentLoaded", function () {
    // ==========================================
    // XỬ LÝ MENU MOBILE (BẢN QUÂN LUẬT - BẮT BUỘC NGHE LỆNH)
    // ==========================================
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    console.log("🚀 Hệ thống Menu Mobile đã sẵn sàng! (Bản Ép Buộc)");

    if (menuToggle && sidebar && sidebarOverlay) {

        // 1. KHI BẤM NÚT 3 GẠCH -> ÉP BUỘC MỞ 100%
        menuToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation(); // Cúp cầu dao

            // Dùng thẳng lệnh add() - Chưa có thì thêm, có rồi thì thôi, không bị lệch pha!
            sidebar.classList.add('show');
            sidebarOverlay.classList.add('show');

            console.log("🟢 ĐÃ ÉP MỞ: Cả Menu và Thảm đen đã trồi ra!");
        });

        // 2. KHI CHẠM THẢM ĐEN -> ÉP BUỘC ĐÓNG 100%
        sidebarOverlay.addEventListener('click', function (e) {
            e.preventDefault();

            // Dùng thẳng lệnh remove() - Quét sạch class 'show'
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');

            console.log("🔴 ĐÃ ÉP ĐÓNG: Cả Menu và Thảm đen đã thu lại!");
        });
    }
});




// ==========================================
// 1. LOGIC CHUYỂN TAB MENU (CHỈ CẦN DÁN XUỐNG ĐÁY FILE)
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const menuSchedule = document.getElementById('menu-schedule');
    const menuCourses = document.getElementById('menu-courses');
    const sectionSchedule = document.getElementById('section-schedule');
    const sectionCourses = document.getElementById('section-courses');

    // Bật máy dò: In ra F12 xem đã bắt được đủ 4 thằng này trong HTML chưa
    console.log("Trạng thái bắt ID:", { menuSchedule, menuCourses, sectionSchedule, sectionCourses });

    if (menuSchedule && menuCourses && sectionSchedule && sectionCourses) {
        // Sự kiện bấm vào Lịch làm việc
        menuSchedule.addEventListener('click', (e) => {
            e.preventDefault();
            menuCourses.classList.remove('active');
            menuSchedule.classList.add('active');

            sectionCourses.style.display = 'none';
            sectionSchedule.style.display = 'block';
        });

        // Sự kiện bấm vào Quản lý Khóa Học (Đăng Ký)
        menuCourses.addEventListener('click', (e) => {
            e.preventDefault();
            menuSchedule.classList.remove('active');
            menuCourses.classList.add('active');

            sectionSchedule.style.display = 'none';
            sectionCourses.style.display = 'block';

            // ĐÃ SỬA DÒNG NÀY: Gọi đúng tên hàm tải dữ liệu khách hàng
            window.loadRegistrationData();
        });
    } else {
        console.error("CẢNH BÁO: Không tìm thấy thẻ HTML! Hãy kiểm tra lại id='menu-courses' hoặc id='section-courses' trong file admin.html");
    }
});

// ==========================================
// HÀM ĐỔ DỮ LIỆU & XỬ LÝ KHÁCH ĐĂNG KÝ
// ==========================================

// 1. Hàm Load dữ liệu (Phải bọc trong function thế này mới gọi đi gọi lại được nha)
window.loadRegistrationData = function () {
    fetch('http://localhost:5000/api/admin/registrations')
        .then(res => res.json())
        .then(regs => {
            const regBody = document.getElementById('registrationBody');
            if (regBody) {
                let regHtml = '';
                regs.forEach(r => {
                    // Format ngày
                    const d = new Date(r.created_at);
                    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

                    let badge = r.status === 'called' ? '<span class="status-badge bg-success">Đã tư vấn</span>' : '<span class="status-badge bg-danger">Chưa gọi</span>';

                    // Nút hành động
                    let actionBtn = r.status === 'pending'
                        ? `<button class="btn-primary" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;" onclick="markAsCalled(${r.id})"><i class="fas fa-phone-alt"></i> Đã gọi</button>`
                        : '';
                    actionBtn += `<button class="btn-delete" onclick="deleteReg(${r.id})" title="Xóa"><i class="fas fa-trash-alt"></i></button>`;

                    regHtml += `
                        <tr>
                            <td style="font-weight: bold;">${dateStr}</td>
                            <td>${r.guest_name}</td>
                            <td style="font-weight: 600; color: #ff7b00;">${r.phone}</td>
                            <td>${r.course_name} <br> <span style="font-size:11px; color:#888;">(${r.grade || 'Không rõ'})</span></td>
                            <td>${badge}</td>
                            <td>${actionBtn}</td>
                        </tr>
                    `;
                });
                regBody.innerHTML = regHtml;
            }
        })
        .catch(err => console.error("Lỗi lấy danh sách đăng ký:", err));
};

// 2. Hàm bấm nút "Đã gọi"
window.markAsCalled = function (id) {
    fetch(`http://localhost:5000/api/admin/registrations/${id}/status`, { method: 'PUT' })
        .then(res => res.json())
        .then(data => {
            Swal.fire({ icon: 'success', title: 'Đã lưu trạng thái!', showConfirmButton: false, timer: 1000 });
            window.loadRegistrationData(); // <== BÍ KÍP ĐÂY: Gọi lại bảng ngay lập tức
        });
};

// 3. Hàm bấm nút "Xóa"
window.deleteReg = function (id) {
    Swal.fire({
        title: 'Xóa dữ liệu khách hàng?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xóa luôn'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://localhost:5000/api/admin/registrations/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    Swal.fire({ icon: 'success', title: 'Đã xóa!', showConfirmButton: false, timer: 1000 });
                    window.loadRegistrationData(); // <== Xóa xong tự vẽ lại bảng luôn
                });
        }
    });
};



// ==========================================
// HÀM XỬ LÝ KHI BẤM NÚT TRONG BẢNG ĐĂNG KÝ
// ==========================================

// Hàm xử lý bấm nút "Đã gọi" màu cam
window.markAsCalled = function (id) {
    // Gọi xuống API cập nhật của Server
    fetch(`http://localhost:5000/api/admin/registrations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            // Hiện popup thông báo thành công nhỏ góc màn hình
            Swal.fire({
                icon: 'success',
                title: 'Đã lưu trạng thái!',
                text: 'Phụ huynh này đã được tư vấn.',
                showConfirmButton: false,
                timer: 1500
            });

            // Cực kỳ quan trọng: Gọi lại hàm tải bảng để cục "Chưa gọi" màu đỏ biến thành "Đã tư vấn" màu xanh
            if (typeof loadRegistrationData === "function") {
                loadRegistrationData();
            }
        })
        .catch(err => console.error("Lỗi khi cập nhật:", err));
};

// Hàm xử lý bấm nút "Thùng rác" màu đỏ
window.deleteReg = function (id) {
    // Bật popup cảnh báo trước khi xóa thật
    Swal.fire({
        title: 'Xóa dữ liệu khách hàng?',
        text: "Dữ liệu này sẽ biến mất vĩnh viễn khỏi hệ thống!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#888',
        confirmButtonText: 'Xóa luôn!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        // Nếu Admin bấm "Xóa luôn!"
        if (result.isConfirmed) {
            fetch(`http://localhost:5000/api/admin/registrations/${id}`, {
                method: 'DELETE'
            })
                .then(res => res.json())
                .then(data => {
                    // Hiện thông báo xóa thành công
                    Swal.fire({
                        icon: 'success',
                        title: 'Đã xóa!',
                        showConfirmButton: false,
                        timer: 1000
                    });

                    // Cập nhật lại bảng cho mất dòng vừa xóa
                    if (typeof loadRegistrationData === "function") {
                        loadRegistrationData();
                    }
                })
                .catch(err => console.error("Lỗi khi xóa:", err));
        }
    });
};









// ==========================================
// HỆ THỐNG XỬ LÝ LỊCH DẠY GIÁO VIÊN (ĐỘNG)
// ==========================================

// 1. Hàm Tải dữ liệu từ SQL lên bảng
function loadTeacherSchedules() {
    fetch(`${API_BASE_URL}/api/teacher-schedules`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#section-teacher-schedule tbody');
            if (!tbody) return;

            tbody.innerHTML = ''; // Xóa sạch dữ liệu cũ

            data.forEach(item => {
                // Xử lý ngày tháng đẹp
                const dateObj = new Date(item.work_date);
                const dayStr = "Thứ " + (dateObj.getDay() === 0 ? "Chủ Nhật" : dateObj.getDay() + 1);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                // Xử lý màu sắc Trạng Thái
                let statusHtml = '';
                if (item.status === 'upcoming') {
                    statusHtml = `<span style="background:#3498db; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Sắp tới</span>`;
                } else if (item.status === 'done') {
                    statusHtml = `<span style="background:#2ecc71; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Đã dạy</span>`;
                } else {
                    statusHtml = `<span style="background:#e74c3c; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Vắng mặt</span>
                                  <br><small style="color:#e74c3c;">(${item.reason || 'Không phép'})</small>`;
                }

                // Đổ vào HTML
                const row = `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px; font-weight: bold;">${dayStr} <br><small style="color:#888;">${dateStr}</small></td>
                        <td style="padding: 15px; font-weight: bold; color: #ff7b00;">${item.class_name}</td>
                        <td style="padding: 15px;">${item.teacher_name}</td>
                        <td style="padding: 15px;">${item.time_range}</td>
                        <td style="padding: 15px;">${statusHtml}</td>
                        <td style="padding: 15px;">
                            <button style="color: #3498db; background: transparent; border: none; cursor: pointer; margin-right: 10px;"><i class="fas fa-edit"></i></button>
                            <button style="color: #e74c3c; background: transparent; border: none; cursor: pointer;"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        })
        .catch(err => console.error("Lỗi tải lịch dạy:", err));
}

// 2. Gắn sự kiện Tự Động Tải khi bấm sang Tab Lịch Dạy
// (Tìm lại đoạn code "TỪ ĐIỂN CHUYỂN TAB" tui viết ở tin nhắn trước, thêm hàm này vào)
// if (tab.menu === 'menu-teacher-schedule') {
//      loadTeacherSchedules(); 
// }




// ==========================================
// HỆ THỐNG CHUYỂN TAB THÔNG MINH
// ==========================================
document.addEventListener("DOMContentLoaded", function () {

    // Danh sách các tab cần liên kết
    const tabs = [
        { menu: 'menu-schedule', section: 'section-schedule' },
        { menu: 'menu-courses', section: 'section-courses' },
        { menu: 'menu-teacher-schedule', section: 'section-teacher-schedule' },
        { menu: 'menu-student-schedule', section: 'section-student-schedule' },
        { menu: 'menu-attendance', section: 'section-admin-attendance' },
        { menu: 'menu-leave-requests', section: 'section-admin-requests' },
        { menu: 'menu-admin-scores', section: 'section-admin-scores' }
    ];
    // Lặp qua từng cặp để gắn sự kiện bấm
    tabs.forEach(tab => {
        const menuBtn = document.getElementById(tab.menu);
        const sectionContent = document.getElementById(tab.section);

        if (menuBtn && sectionContent) {
            // SỰ KIỆN CLICK BẮT ĐẦU TỪ ĐÂY
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // 1. Giấu tất cả các Section đi
                tabs.forEach(t => {
                    const content = document.getElementById(t.section);
                    if (content) content.style.display = 'none';
                });

                // 2. Tẩy màu cam (active) ở tất cả các nút Menu
                document.querySelectorAll('.sidebar-menu li').forEach(li => {
                    li.classList.remove('active');
                });

                // 3. Hiện Section được chọn lên và tô màu cam cho Nút Menu đó
                sectionContent.style.display = 'block';
                menuBtn.classList.add('active');

                // 4. Load dữ liệu tab Quản Lý Đăng Ký
                if (tab.menu === 'menu-courses' && typeof window.loadRegistrationData === 'function') {
                    window.loadRegistrationData();
                }

                // 5. Load dữ liệu tab Lịch Dạy Giáo Viên
                if (tab.menu === 'menu-teacher-schedule' && typeof window.loadTeacherSchedules === 'function') {
                    window.loadTeacherSchedules();
                }

                // 6. Nếu là tab Học Sinh thì load Form VÀ load Bảng Thống Kê
                if (tab.menu === 'menu-student-schedule') {
                    if (typeof window.loadStudentAndClassData === 'function') {
                        window.loadStudentAndClassData();
                    }
                    // 👉 GỌI THÊM BẢNG VÀO ĐÂY NỮA
                    if (typeof window.loadEnrollmentTable === 'function') {
                        window.loadEnrollmentTable();
                    }
                }
                // 7. Load dữ liệu khi bấm vào tab Danh sách điểm danh
                if (tab.menu === 'menu-attendance' && typeof window.loadAdminAttendance === 'function') {
                    window.loadAdminAttendance();
                }
                // 8. Load dữ liệu tự động khi bấm vào tab Quản Lý Điểm Số
                if (tab.menu === 'menu-admin-scores' && typeof window.loadAdminScores === 'function') {
                    window.loadAdminScores();
                }
                // 9. THÊM MỚI: Load dữ liệu khi bấm vào tab Quản Lý Đơn Từ
                if (tab.menu === 'menu-leave-requests' && typeof window.loadAdminRequests === 'function') {
                    window.loadAdminRequests();
                }
            }); // KẾT THÚC SỰ KIỆN CLICK NẰM Ở ĐÂY NÈ
        }
    });
});





// ==========================================
// HÀM ĐỔ DỮ LIỆU & PHÂN CA GIÁO VIÊN
// ==========================================

// 1. Hàm tải và vẽ bảng lịch dạy
window.loadTeacherSchedules = function () {
    fetch('http://localhost:5000/api/teacher-schedules')
        .then(res => res.json())
        .then(schedules => {
            // Giả sử id tbody của bảng lịch dạy là teacherScheduleBody
            // (Bạn nhớ thêm id="teacherScheduleBody" vào thẻ <tbody> trong HTML nhé)
            const tbody = document.getElementById('teacherScheduleBody');
            if (!tbody) return;

            let html = '';
            schedules.forEach(s => {
                // Xử lý ngày tháng
                const d = new Date(s.work_date);
                const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

                // Trạng thái (Mặc định khi phân ca xong là Sắp tới - upcoming)
                let status = s.status || 'upcoming';
                let badge = status === 'done' ? '<span class="status-badge bg-success">Đã dạy</span>' :
                    (status === 'upcoming' ? '<span class="status-badge bg-primary">Sắp tới</span>' :
                        '<span class="status-badge bg-danger">Vắng</span>');

                html += `
                    <tr>
                        <td style="font-weight: bold;">${dateStr}</td>
                        <td style="color: #ff7b00; font-weight: 600;">${s.class_name}</td>
                        <td>${s.teacher_name}</td>
                        <td>${s.room}</td>
                        <td>${s.time_range}</td>
                        <td>${badge}</td>
                        <td>
                            <button class="btn-delete" onclick="alert('Chức năng xóa lịch đang cập nhật!')"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        })
        .catch(err => console.error("Lỗi lấy lịch GV:", err));
};

// ====================================================
// HỆ THỐNG XỬ LÝ LỊCH DẠY GIÁO VIÊN (ĐỘNG) - HOÀN CHỈNH
// ====================================================

// 1. Danh sách 11 giáo viên (Dùng chung cho cả Lọc và Phân ca)
const teachersList = [
    { mshs: 'GV001', name: 'Cô Đan Châu' },
    { mshs: 'GV002', name: 'Cô Đào Hồng' },
    { mshs: 'GV003', name: 'Cô Kiều Hạnh' },
    { mshs: 'GV004', name: 'Cô Cẩm Nhung' },
    { mshs: 'GV005', name: 'Cô Phương Anh' },
    { mshs: 'GV006', name: 'Cô Hằng Anh' },
    { mshs: 'GV007', name: 'Cô Mỹ Hạnh' },
    { mshs: 'GV008', name: 'Cô Quỳnh' },
    { mshs: 'GV009', name: 'Cô Thảo Ly' },
    { mshs: 'GV010', name: 'Cô Niềm' },
    { mshs: 'GV011', name: 'Cô Mai' }
];

// 2. Tự động bơm danh sách giáo viên vào ô Lọc (Bên ngoài bảng)
const filterTeacherSelect = document.getElementById('filterTeacherSelect');
if (filterTeacherSelect) {
    let filterOptions = '<option value="all">-- Toàn bộ Trung Tâm --</option>';
    teachersList.forEach(t => {
        filterOptions += `<option value="${t.mshs}">${t.name}</option>`;
    });
    filterTeacherSelect.innerHTML = filterOptions;

    // Lọc dữ liệu khi Admin chọn tên cô giáo
    filterTeacherSelect.addEventListener('change', (e) => {
        loadTeacherSchedules(e.target.value);
    });
}

// 3. Hàm Tải dữ liệu từ SQL lên bảng (Có nhận tham số mshsFilter để lọc)
window.loadTeacherSchedules = function (mshsFilter = 'all') {
    let url = 'http://localhost:5000/api/teacher-schedules';
    if (mshsFilter !== 'all') {
        url += `?mshs=${mshsFilter}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#section-teacher-schedule tbody');
            if (!tbody) return;

            tbody.innerHTML = ''; // Xóa sạch dữ liệu cũ

            data.forEach(item => {
                const dateObj = new Date(item.work_date);
                const dayStr = "Thứ " + (dateObj.getDay() === 0 ? "Chủ Nhật" : dateObj.getDay() + 1);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                let statusHtml = '';
                if (item.status === 'upcoming' || !item.status) {
                    statusHtml = `<span style="background:#3498db; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Sắp tới</span>`;
                } else if (item.status === 'done') {
                    statusHtml = `<span style="background:#2ecc71; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Đã dạy</span>`;
                } else {
                    statusHtml = `<span style="background:#e74c3c; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Vắng mặt</span><br><small style="color:#e74c3c;">(${item.reason || 'Không phép'})</small>`;
                }

                const row = `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px; font-weight: bold;">${dayStr} <br><small style="color:#888;">${dateStr}</small></td>
                <td style="padding: 15px; font-weight: bold; color: #ff7b00;">${item.class_name}</td>
                <td style="padding: 15px;">${item.teacher_name}</td>
                <td style="padding: 15px;">${item.room}</td>
                <td style="padding: 15px;">${item.time_range}</td>
                <td style="padding: 15px;">${statusHtml}</td>
                <td style="padding: 15px;">
                    <!-- NÚT SỬA NGÀY (CÂY BÚT) -->
                    <button onclick="editTeacherScheduleDate(${item.id}, '${item.work_date}')" style="color: #3498db; background: transparent; border: none; cursor: pointer; margin-right: 15px;" title="Đổi ngày dạy">
                        <i class="fas fa-edit"></i>
                    </button>
                    <!-- NÚT XÓA (THÙNG RÁC) -->
                    <button onclick="deleteTeacherSchedule(${item.id})" style="color: #e74c3c; background: transparent; border: none; cursor: pointer;" title="Xóa ca dạy">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        })
        .catch(err => console.error("Lỗi tải lịch dạy:", err));
};

// 4. Hàm Xóa 1 ca dạy (Thùng rác - Đã nâng cấp UI)
window.deleteTeacherSchedule = function (id) {
    Swal.fire({
        title: 'Xóa ca dạy này?',
        text: "Ca dạy sẽ bị xóa vĩnh viễn khỏi hệ thống!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#888',
        confirmButtonText: 'Xóa luôn!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Gọi API chọc xuống SQL để xóa
            fetch(`http://localhost:5000/api/teacher-schedules/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    // Báo thành công
                    Swal.fire({ icon: 'success', title: 'Đã xóa!', showConfirmButton: false, timer: 1000 });

                    // Lấy giá trị đang lọc hiện tại (VD: Cô Hồng) để tải lại đúng lịch của GV đó
                    const filterSelect = document.getElementById('filterTeacherSelect');
                    const currentFilter = filterSelect ? filterSelect.value : 'all';
                    loadTeacherSchedules(currentFilter);
                })
                .catch(err => console.error("Lỗi xóa lịch:", err));
        }
    });
};

// 5. SỰ KIỆN BẤM NÚT "+ Phân ca mới" (Bật Popup Swal.fire)
const btnAddTeacherSchedule = document.getElementById('btnAddTeacherSchedule');
if (btnAddTeacherSchedule) {
    btnAddTeacherSchedule.addEventListener('click', async () => {

        // Tạo HTML cho các thẻ option
        let teacherOptions = '<option value="">-- Chọn Giáo Viên --</option>';
        teachersList.forEach(t => {
            teacherOptions += `<option value="${t.mshs}" data-name="${t.name}">${t.name} (${t.mshs})</option>`;
        });

        // Bật popup
        const { value: formValues } = await Swal.fire({
            title: 'Phân Ca Dạy Mới',
            html: `
                <select id="swal-mshs" class="swal2-input" style="width: 85%;">
                    ${teacherOptions}
                </select>
                <input type="text" id="swal-class" class="swal2-input" placeholder="Môn - Lớp (VD: Toán - Lớp 9)" style="width: 85%;">
                <input type="date" id="swal-date" class="swal2-input" style="width: 85%;">
                <input type="text" id="swal-time" class="swal2-input" placeholder="Thời gian (VD: 18:00 - 19:30)" style="width: 85%;">
                <input type="text" id="swal-room" class="swal2-input" placeholder="Phòng học (VD: Phòng 101)" style="width: 85%;">
            `,
            confirmButtonColor: '#ff7b00',
            confirmButtonText: 'Tạo Lịch Dạy',
            showCancelButton: true,
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const selectGV = document.getElementById('swal-mshs');
                const mshs = selectGV.value;

                let teacher_name = '';
                if (mshs) {
                    teacher_name = selectGV.options[selectGV.selectedIndex].getAttribute('data-name');
                }

                const class_name = document.getElementById('swal-class').value;
                const work_date = document.getElementById('swal-date').value;
                const time_range = document.getElementById('swal-time').value;
                const room = document.getElementById('swal-room').value;

                if (!mshs || !class_name || !work_date || !time_range) {
                    Swal.showValidationMessage('Vui lòng nhập đủ thông tin (Giáo viên, Lớp, Ngày, Giờ)!');
                    return false;
                }

                return { mshs, teacher_name, class_name, work_date, time_range, room };
            }
        });

        // Xử lý lưu xuống API
        if (formValues) {
            fetch('http://localhost:5000/api/teacher-schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formValues)
            })
                .then(res => res.json())
                .then(data => {
                    Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã phân ca dạy mới!', showConfirmButton: false, timer: 1500 });
                    // Cập nhật lại bảng đang hiển thị
                    const currentFilter = document.getElementById('filterTeacherSelect').value;
                    loadTeacherSchedules(currentFilter);
                })
                .catch(err => console.error("Lỗi lưu lịch dạy:", err));
        }
    });
}



// ====================================================
// HÀM LÀM MỚI TOÀN BỘ LỊCH TUẦN
// ====================================================
window.confirmClearSchedule = function () {
    Swal.fire({
        title: 'Làm mới lịch tuần?',
        text: "Hành động này sẽ XÓA SẠCH TOÀN BỘ lịch dạy của TẤT CẢ giáo viên. Bạn có chắc chắn không?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c', // Nút xóa màu đỏ
        cancelButtonColor: '#888',
        confirmButtonText: 'Đồng ý, Xóa tất cả!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Gọi API xóa toàn bộ bảng
            fetch('http://localhost:5000/api/teacher-schedules', { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    // Báo thành công
                    Swal.fire({ icon: 'success', title: 'Đã làm mới tuần!', showConfirmButton: false, timer: 1500 });

                    // Tải lại bảng lịch dạy (lúc này sẽ trống trơn)
                    const filterSelect = document.getElementById('filterTeacherSelect');
                    const currentFilter = filterSelect ? filterSelect.value : 'all';
                    loadTeacherSchedules(currentFilter);
                })
                .catch(err => console.error("Lỗi làm mới tuần:", err));
        }
    });
};




// ==========================================
// HÀM 1: SỬA NHANH NGÀY DẠY (Cây Bút)
// ==========================================
window.editTeacherScheduleDate = async function (id, currentDate) {
    // Ép kiểu ngày cũ để hiển thị mặc định trên Popup
    const d = new Date(currentDate);
    // Cộng thêm 1 ngày để fix lỗi timezone hiển thị lùi ngày
    d.setDate(d.getDate() + 1);
    const dateStr = d.toISOString().split('T')[0];

    const { value: newDate } = await Swal.fire({
        title: 'Chuyển lịch sang ngày mới?',
        input: 'date',
        inputValue: dateStr,
        showCancelButton: true,
        confirmButtonColor: '#ff7b00',
        confirmButtonText: 'Lưu thay đổi',
        cancelButtonText: 'Hủy'
    });

    if (newDate) {
        // Gọi API PUT để cập nhật ngày
        fetch(`http://localhost:5000/api/teacher-schedules/${id}/date`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ work_date: newDate })
        })
            .then(res => res.json())
            .then(data => {
                Swal.fire({ icon: 'success', title: 'Đã đổi ngày!', showConfirmButton: false, timer: 1000 });
                // Tải lại bảng theo filter hiện hành
                const filterSelect = document.getElementById('filterTeacherSelect');
                const currentFilter = filterSelect ? filterSelect.value : 'all';
                loadTeacherSchedules(currentFilter);
            })
            .catch(err => console.error("Lỗi đổi ngày:", err));
    }
};

// ==========================================
// HÀM 2: RESET TRẠNG THÁI TOÀN BỘ VỀ "SẮP TỚI"
// ==========================================
window.confirmResetStatus = function () {
    Swal.fire({
        title: 'Reset trạng thái tuần mới?',
        text: "Tất cả ca dạy sẽ được đổi về 'Sắp tới'. Ngày tháng và lịch dạy vẫn được giữ nguyên!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2ecc71', // Màu xanh lá
        cancelButtonColor: '#888',
        confirmButtonText: 'Đồng ý, Reset!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Gọi API PUT để reset
            fetch('http://localhost:5000/api/teacher-schedules/reset-status', { method: 'PUT' })
                .then(res => res.json())
                .then(data => {
                    Swal.fire({ icon: 'success', title: 'Đã reset thành công!', showConfirmButton: false, timer: 1500 });
                    // Tải lại bảng
                    const filterSelect = document.getElementById('filterTeacherSelect');
                    const currentFilter = filterSelect ? filterSelect.value : 'all';
                    loadTeacherSchedules(currentFilter);
                })
                .catch(err => console.error("Lỗi reset trạng thái:", err));
        }
    });
};







// ==========================================
// HÀM XUẤT EXCEL BẢNG CHẤM CÔNG / LỊCH DẠY
// ==========================================
window.exportToExcel = function () {
    // 1. Lấy mã giáo viên đang được lọc hiện tại
    const filterSelect = document.getElementById('filterTeacherSelect');
    const mshsFilter = filterSelect ? filterSelect.value : 'all';

    let url = 'http://localhost:5000/api/teacher-schedules';
    if (mshsFilter !== 'all') {
        url += `?mshs=${mshsFilter}`;
    }

    // 2. Kéo dữ liệu từ API về và chuyển thành Excel
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                Swal.fire({ icon: 'warning', title: 'Trống', text: 'Không có dữ liệu để xuất Excel!' });
                return;
            }

            // Mông má lại dữ liệu cho đẹp trước khi đưa vào Excel
            const excelData = data.map((item, index) => {
                const d = new Date(item.work_date);
                const dayStr = "Thứ " + (d.getDay() === 0 ? "Chủ Nhật" : d.getDay() + 1);
                const dateStr = d.toLocaleDateString('vi-VN');

                // Dịch trạng thái từ tiếng Anh sang tiếng Việt chuẩn chỉ
                let statusText = 'Sắp tới';
                if (item.status === 'done') {
                    statusText = 'Đã dạy';
                } else if (item.status && item.status !== 'upcoming') {
                    statusText = `Vắng mặt (${item.reason || 'Không phép'})`;
                }

                return {
                    "STT": index + 1,
                    "Mã GV": item.mshs,
                    "Giáo Viên": item.teacher_name,
                    "Thứ": dayStr,
                    "Ngày": dateStr,
                    "Môn - Lớp": item.class_name,
                    "Phòng": item.room,
                    "Thời Gian": item.time_range,
                    "Trạng Thái": statusText
                };
            });

            // 3. Tạo file Excel thực thụ (.xlsx)
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Chỉnh độ rộng cột cho đẹp
            worksheet['!cols'] = [
                { wch: 5 },  // STT
                { wch: 10 }, // Mã GV
                { wch: 25 }, // Tên
                { wch: 12 }, // Thứ
                { wch: 15 }, // Ngày
                { wch: 20 }, // Lớp
                { wch: 10 }, // Phòng
                { wch: 15 }, // Giờ
                { wch: 25 }  // Trạng thái
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bang_Cham_Cong");

            // 4. Lưu file và tải xuống máy
            const fileName = `Bang_Cham_Cong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            Swal.fire({ icon: 'success', title: 'Xuất Excel thành công!', showConfirmButton: false, timer: 1500 });
        })
        .catch(err => console.error("Lỗi xuất Excel:", err));
};




// ==========================================
// TẢI DỮ LIỆU TỪ SQL LÊN FORM XẾP LỚP
// ==========================================
window.loadStudentAndClassData = function () {
    // 1. Tải danh sách Học Sinh (chỉ lấy role = 'student')
    fetch(`${API_BASE_URL}/api/students`)
        .then(res => res.json())
        .then(data => {
            const studentSelect = document.getElementById('studentSelect');
            if (!studentSelect) return;
            studentSelect.innerHTML = '<option value="">-- Chọn Học Sinh --</option>';
            data.forEach(hs => {
                studentSelect.innerHTML += `<option value="${hs.mshs}">${hs.mshs} - ${hs.fullname}</option>`;
            });
        })
        .catch(err => console.error("Lỗi tải DS học sinh:", err));

    // 2. Tải danh sách Lớp Học (Lấy từ những lớp Giáo viên đang dạy)
    fetch(`${API_BASE_URL}/api/active-classes`)
        .then(res => res.json())
        .then(data => {
            const classSelect = document.getElementById('classSelect');
            if (!classSelect) return;
            classSelect.innerHTML = '<option value="">-- Chọn Môn/Lớp --</option>';
            data.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls.class_name}">${cls.class_name}</option>`;
            });
        })
        .catch(err => console.error("Lỗi tải DS lớp:", err));
};

// ==========================================
// LƯU DỮ LIỆU XẾP LỚP XUỐNG SQL
// ==========================================
window.saveStudentEnrollment = function () {
    const studentSelect = document.getElementById('studentSelect');
    const classSelect = document.getElementById('classSelect');

    const mshs = studentSelect.value;
    // Tách chuỗi cẩn thận hơn để tránh lỗi nếu tên có dấu gạch ngang
    const student_name = studentSelect.options[studentSelect.selectedIndex]?.text.split(' - ').slice(1).join(' - ');
    const class_name = classSelect.value;

    if (!mshs || !class_name) {
        Swal.fire({ icon: 'warning', title: 'Khoan đã', text: 'Vui lòng chọn đủ Học sinh và Lớp!', confirmButtonColor: '#ff7b00' });
        return;
    }

    fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mshs, student_name, class_name })
    })
        .then(res => res.json())
        .then(data => {
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã xếp học sinh vào lớp!', confirmButtonColor: '#2ecc71' });
            // Reset lại 2 ô chọn
            studentSelect.value = '';
            classSelect.value = '';

            // 👉 ĐIỂM CHỐT LÀ ĐÂY: Lưu xong thì gọi hàm load lại bảng liền!
            if (typeof window.loadEnrollmentTable === 'function') {
                window.loadEnrollmentTable();
            }
        })
        .catch(err => {
            console.error("Lỗi xếp lớp:", err);
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối máy chủ!' });
        });
};





// ==========================================
// HÀM TẢI BẢNG DANH SÁCH ĐÃ XẾP LỚP
// ==========================================
window.loadEnrollmentTable = function () {
    fetch(`${API_BASE_URL}/api/enrollments`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('enrollmentBody');
            if (!tbody) return;

            tbody.innerHTML = ''; // Xóa trắng trước khi load lại

            data.forEach(item => {
                const dateObj = new Date(item.created_at);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                const row = `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px; font-weight: bold; color: #555;">${item.mshs}</td>
                        <td style="padding: 15px; font-weight: bold;">${item.student_name}</td>
                        <td style="padding: 15px; font-weight: bold; color: #ff7b00;">${item.class_name}</td>
                        <td style="padding: 15px; font-size: 13px; color: #888;">${dateStr}</td>
                        <td style="padding: 15px;">
                            <!-- NÚT SỬA (CÂY BÚT XANH) -->
                            <button onclick="editEnrollment(${item.id}, '${item.mshs}', '${item.class_name}')" style="color: #3498db; background: transparent; border: none; cursor: pointer; font-size: 16px; margin-right: 15px;" title="Đổi lớp">
                                <i class="fas fa-edit"></i>
                            </button>

                            <!-- NÚT XÓA (THÙNG RÁC ĐỎ) -->
                            <button onclick="deleteEnrollment(${item.id})" style="color: #e74c3c; background: transparent; border: none; cursor: pointer; font-size: 16px;" title="Xóa khỏi lớp">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        })
        .catch(err => console.error("Lỗi tải bảng xếp lớp:", err));
};

// ==========================================
// HÀM XÓA HỌC SINH KHỎI LỚP (Bấm thùng rác)
// ==========================================
window.deleteEnrollment = function (id) {
    Swal.fire({
        title: 'Rút học sinh khỏi lớp?',
        text: "Hành động này sẽ xóa dữ liệu học sinh khỏi danh sách lớp!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Rút ngay!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_BASE_URL}/api/enrollments/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    Swal.fire('Thành công!', 'Đã rút học sinh khỏi lớp.', 'success');
                    window.loadEnrollmentTable(); // Tự load lại bảng cho mới
                });
        }
    });
};




// ==========================================
// HÀM MỞ POPUP ĐỔI LỚP CHO HỌC SINH
// ==========================================
window.editEnrollment = function (id, mshs, currentClass) {
    // 1. Kéo danh sách lớp học đang mở từ SQL lên
    fetch(`${API_BASE_URL}/api/active-classes`)
        .then(res => res.json())
        .then(classes => {
            // 2. Tạo giao diện Dropdown chứa các lớp
            let optionsHtml = '';
            classes.forEach(cls => {
                // Tự động đánh dấu (selected) lớp học hiện tại của bé
                const isSelected = (cls.class_name === currentClass) ? 'selected' : '';
                optionsHtml += `<option value="${cls.class_name}" ${isSelected}>${cls.class_name}</option>`;
            });

            // 3. Mở bảng Popup của SweetAlert2
            Swal.fire({
                title: 'Chuyển Lớp Học',
                html: `
                    <div style="text-align: left; margin-bottom: 10px;">
                        <label style="font-weight: bold; color: #555;">Mã HS: ${mshs}</label><br>
                        <small>Lớp cũ: <span style="color:#e74c3c">${currentClass}</span></small>
                    </div>
                    <select id="swal-class-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 15px;">
                        ${optionsHtml}
                    </select>
                `,
                showCancelButton: true,
                confirmButtonColor: '#2ecc71',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-save"></i> Lưu thay đổi',
                cancelButtonText: 'Hủy',
                preConfirm: () => {
                    return document.getElementById('swal-class-select').value;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const newClass = result.value;

                    // Nếu Admin không đổi gì mà bấm Lưu thì bỏ qua
                    if (newClass === currentClass) return;

                    // 4. Bắn API gửi dữ liệu lớp mới xuống Backend
                    fetch(`${API_BASE_URL}/api/enrollments/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ new_class_name: newClass, mshs: mshs })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                Swal.fire('Thất bại', data.error, 'error');
                            } else {
                                Swal.fire('Thành công!', 'Đã cập nhật lớp mới cho học sinh.', 'success');
                                window.loadEnrollmentTable(); // Load lại bảng ngay lập tức
                            }
                        })
                        .catch(err => console.error("Lỗi cập nhật:", err));
                }
            });
        })
        .catch(err => console.error("Lỗi tải danh sách lớp để sửa:", err));
};


// ==========================================
// HÀM TẢI DỮ LIỆU ĐIỂM DANH LÊN BẢNG ADMIN (CÓ BỘ LỌC THÉP FRONTEND)
// ==========================================
window.loadAdminAttendance = function () {
    const tbody = document.getElementById('adminAttendanceBody');
    const teacherSelect = document.getElementById('filterTeacherAttendance');
    if (!tbody) return;

    // 1. Tải danh sách giáo viên vào Dropdown (Chỉ chạy 1 lần)
    if (teacherSelect && teacherSelect.options.length <= 1) {
        fetch('http://localhost:5000/api/filter-teachers')
            .then(res => res.json())
            .then(teachers => {
                teachers.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.teacher_name;
                    option.innerText = t.teacher_name;
                    teacherSelect.appendChild(option);
                });
            }).catch(err => console.error("Lỗi tải danh sách giáo viên:", err));
    }

    // 2. Bật hiệu ứng Loading
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f39c12; padding: 30px;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px; display: block;"></i> Đang tải dữ liệu điểm danh...</td></tr>';

    // 3. Đọc giá trị Dropdown
    const selectedTeacher = teacherSelect ? teacherSelect.value : '';
    let url = 'http://localhost:5000/api/admin-attendance';
    if (selectedTeacher && selectedTeacher !== '') {
        url += '?teacher=' + encodeURIComponent(selectedTeacher);
    }

    // 4. Gọi API lấy dữ liệu
    fetch(url)
        .then(res => res.json())
        .then(data => {
            // Xử lý lỗi Database
            if (data.status === 'error') {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 30px; font-weight: bold;">Lỗi Database: ${data.message}</td></tr>`;
                return;
            }

            // ========================================================
            // 🛡️ BỘ LỌC THÉP TRÊN FRONTEND (CHỐNG NHIỄU DỮ LIỆU)
            // Lọc lại 1 lần nữa để đảm bảo chắc chắn 100% khớp Dropdown
            // ========================================================
            let finalData = data;
            if (selectedTeacher && selectedTeacher !== '') {
                finalData = data.filter(item => item.teacher_name === selectedTeacher);
            }

            // NẾU SAU KHI LỌC MÀ TRỐNG -> BÁO KHÔNG CÓ DỮ LIỆU
            if (!finalData || finalData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="padding: 40px; text-align: center; color: #e74c3c; font-weight: bold; font-size: 15px;">
                            <i class="fas fa-folder-open" style="font-size: 30px; margin-bottom: 10px; display: block; color: #ccc;"></i>
                            Không có dữ liệu điểm danh của giáo viên này!
                        </td>
                    </tr>`;
                return;
            }

            // CÓ DỮ LIỆU -> Vẽ bảng
            tbody.innerHTML = '';

            finalData.forEach(item => {
                // 1. Xử lý Trạng thái (Giữ nguyên của bạn)
                const statusBadge = item.status === 'present'
                    ? '<span style="background: #2ecc71; color: white; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 13px;"><i class="fas fa-check"></i> Có mặt</span>'
                    : '<span style="background: #e74c3c; color: white; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 13px;"><i class="fas fa-times"></i> Vắng mặt</span>';

                // 2. Xử lý Thời gian (Bỏ khai báo dateStr bị trùng lúc đầu)
                const dateObj = new Date(item.created_at || item.date);
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN');
                const displayDate = `<span style="color:#e74c3c; font-weight:bold;">${timeStr}</span><br><small style="color:#7f8c8d;">${dateStr}</small>`;

                // 3. Đổ dữ liệu vào HTML
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                tr.innerHTML = `
        <td style="vertical-align: middle; padding: 15px; color: #555; text-align: center;">${displayDate}</td> <!-- Thay đổi cực kỳ quan trọng ở đây -->
        <td style="vertical-align: middle; padding: 15px; font-weight: bold; color: #172b4d;">${item.teacher_name || 'Đang cập nhật'}</td>
        <td style="vertical-align: middle; padding: 15px; color: #ff7b00; font-weight: bold;">${item.class_name || 'Đang cập nhật'}</td>
        <td style="vertical-align: middle; padding: 15px;">${item.mshs} - ${item.student_name}</td>
        <td style="vertical-align: middle; padding: 15px;">${statusBadge}</td>
        <td style="vertical-align: middle; padding: 15px; color: #e74c3c; font-style: italic;">${item.note || ''}</td>
    `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Lỗi lấy điểm danh:", err);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red; padding: 30px; font-weight: bold;"><i class="fas fa-wifi" style="display:block; font-size: 24px; margin-bottom: 10px;"></i> Không thể kết nối đến Máy chủ!</td></tr>';
        });
};









// ==========================================
// HÀM XUẤT DỮ LIỆU ĐIỂM DANH RA FILE EXCEL
// ==========================================
window.exportExcelAttendance = function () {
    // 1. Tìm cái bảng báo cáo điểm danh
    const table = document.querySelector('#section-admin-attendance table');
    if (!table) return;

    // 2. Chặn ngay nếu bảng đang báo rỗng (Không cho xuất file trắng)
    const tbody = document.getElementById('adminAttendanceBody');
    if (tbody.innerText.includes('Không có dữ liệu') || tbody.innerText.includes('chưa có dữ liệu')) {
        Swal.fire('Thông báo', 'Bảng báo cáo đang trống, không có dữ liệu để xuất Excel!', 'warning');
        return;
    }

    // 3. Tự động tạo tên file thông minh (Theo tên Giáo viên & Ngày xuất)
    const teacherSelect = document.getElementById('filterTeacherAttendance');
    let teacherName = teacherSelect && teacherSelect.value !== '' ? teacherSelect.value : 'Tat_Ca_Giao_Vien';
    teacherName = teacherName.replace(/\s+/g, '_'); // Bỏ dấu cách để tên file không bị lỗi

    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const fileName = `Bao_Cao_Diem_Danh_${teacherName}_${dateStr}.xlsx`;

    // 4. Gọi thư viện xuất Excel thần thánh
    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.table_to_book(table, { sheet: "Điểm Danh" });
        XLSX.writeFile(wb, fileName);
    } else {
        Swal.fire('Lỗi Hệ Thống', 'Chưa tải được bộ thư viện xuất Excel. Vui lòng F5 lại trang web!', 'error');
    }
};









// ==========================================
// HÀM RESET (XÓA) DỮ LIỆU ĐIỂM DANH (THEO GIÁO VIÊN HOẶC TẤT CẢ)
// ==========================================
window.resetTeacherAttendance = function () {
    const teacherSelect = document.getElementById('filterTeacherAttendance');
    const selectedTeacher = teacherSelect ? teacherSelect.value : '';

    let titleMsg = '';
    let textMsg = '';
    let apiQuery = '';

    // 1. Phân loại mức độ xóa (Tất cả hay Một người)
    if (!selectedTeacher || selectedTeacher === '') {
        titleMsg = 'XÓA TOÀN BỘ DỮ LIỆU ĐIỂM DANH?';
        textMsg = 'CẢNH BÁO ĐỎ: Hành động này sẽ XÓA VĨNH VIỄN lịch sử điểm danh của TẤT CẢ GIÁO VIÊN trong hệ thống. Bạn đã xuất file Excel lưu trữ chưa?';
        apiQuery = '?teacher=ALL'; // Cờ hiệu báo cho Backend biết là xóa sạch
    } else {
        titleMsg = `Reset dữ liệu của ${selectedTeacher}?`;
        textMsg = 'Hành động này sẽ XÓA VĨNH VIỄN toàn bộ lịch sử điểm danh của giáo viên này. Bạn có chắc chắn đã xuất file Excel chưa?';
        apiQuery = `?teacher=${encodeURIComponent(selectedTeacher)}`;
    }

    // 2. Hiển thị cảnh báo 2 lớp
    Swal.fire({
        title: titleMsg,
        text: textMsg,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-check"></i> Đã xuất Excel, Xóa ngay!',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {

            // 3. Gọi API Delete xuống Server
            fetch(`http://localhost:5000/api/admin-attendance${apiQuery}`, {
                method: 'DELETE'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Thông báo linh hoạt theo hành động
                        let successMsg = (!selectedTeacher || selectedTeacher === '')
                            ? 'Đã dọn sạch TOÀN BỘ dữ liệu điểm danh của trung tâm.'
                            : `Đã dọn sạch dữ liệu điểm danh của ${selectedTeacher}.`;

                        Swal.fire('Hoàn tất!', successMsg, 'success');
                        loadAdminAttendance(); // Load lại bảng trắng bốc
                    } else {
                        Swal.fire('Lỗi hệ thống', data.message || 'Không thể xóa dữ liệu.', 'error');
                    }
                })
                .catch(err => {
                    console.error("Lỗi xóa dữ liệu:", err);
                    Swal.fire('Lỗi mạng', 'Không thể kết nối đến Máy chủ.', 'error');
                });

        }
    });
};




// ==========================================
// TÍNH NĂNG QUẢN LÝ BẢNG ĐIỂM (ADMIN) - BẢN CÓ DROPDOWN GIÁO VIÊN
// ==========================================
window.loadAdminScores = function () {
    const tbody = document.getElementById('adminScoreBody');
    const teacherSelect = document.getElementById('filterScoreTeacherAdmin');
    if (!tbody) return;

    // 1. Tải danh sách giáo viên vào Dropdown (Chỉ chạy 1 lần)
    if (teacherSelect && teacherSelect.options.length <= 1) {
        fetch('http://localhost:5000/api/filter-teachers')
            .then(res => res.json())
            .then(teachers => {
                teachers.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.teacher_name;
                    option.innerText = t.teacher_name;
                    teacherSelect.appendChild(option);
                });
            }).catch(err => console.error("Lỗi tải danh sách giáo viên:", err));
    }

    // 2. Hiện loading
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #f39c12;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Đang tải bảng điểm...</p></td></tr>';

    // 3. Ráp URL lấy điểm theo giáo viên đang chọn
    const selectedTeacher = teacherSelect ? teacherSelect.value : '';
    let url = 'http://localhost:5000/api/admin-scores';
    if (selectedTeacher && selectedTeacher !== '') {
        url += '?teacher=' + encodeURIComponent(selectedTeacher);
    }

    // 4. Gọi API
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Máy chủ phản hồi lỗi " + res.status);
            return res.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #e74c3c;">Giáo viên này chưa nộp bảng điểm nào!</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            data.forEach(item => {
                const statusBadge = item.status === 'Đã duyệt'
                    ? '<span style="background: #2ecc71; color: white; padding: 5px 10px; border-radius: 4px; font-weight:bold; font-size: 12px;">Đã duyệt</span>'
                    : '<span style="background: #f39c12; color: white; padding: 5px 10px; border-radius: 4px; font-weight:bold; font-size: 12px;">Chờ duyệt</span>';

                // Format lại thời gian từ Database thành định dạng Ngày/Tháng/Năm Giờ:Phút
                const submitTime = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                tr.innerHTML = `
                    <td style="padding: 15px; font-size: 13px; color: #7f8c8d; font-weight: 500;">${submitTime}</td>
                    <td style="font-weight: bold; color: #555;">${item.mshs}</td>
                    <td style="font-weight: bold; color: #172b4d;">${item.student_name}</td>
                    <td style="color: #ff7b00; font-weight: bold;">${item.class_name}</td>
                    <td>${item.teacher_name}</td>
                    <td style="font-weight: bold; color: #e74c3c; font-size: 18px;">${item.score}</td>
                    <td style="font-style: italic; color: #666; font-size: 14px;">${item.note || ''}</td>
                    <td>${statusBadge}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Lỗi:", err);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: red; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> Lỗi kết nối máy chủ! Hãy chắc chắn đã Restart Node.js</td></tr>';
        });
}













// ==========================================
// TÍNH NĂNG XUẤT EXCEL CHO ADMIN QUẢN LÝ ĐIỂM
// ==========================================
window.exportAdminScoresExcel = function () {
    const tableBody = document.getElementById('adminScoreBody');
    const rows = tableBody.querySelectorAll('tr');

    // Chặn xuất file nếu bảng đang trống hoặc đang xoay loading
    if (rows.length === 0 || rows[0].innerText.includes('Chưa có') || rows[0].innerText.includes('Đang tải')) {
        Swal.fire('Chú ý', 'Không có dữ liệu điểm để xuất!', 'warning');
        return;
    }

    let excelData = [];

    // Quét từng dòng trong bảng để lấy dữ liệu
    rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length === 8) { // Đảm bảo đúng 8 cột dữ liệu
            excelData.push({
                "Thời gian nộp": cells[0].innerText.trim(),
                "Mã HS": cells[1].innerText.trim(),
                "Tên Học Sinh": cells[2].innerText.trim(),
                "Lớp": cells[3].innerText.trim(),
                "Giáo viên": cells[4].innerText.trim(),
                "Điểm Số (10)": cells[5].innerText.trim(),
                "Nhận xét": cells[6].innerText.trim(),
                "Trạng thái": cells[7].innerText.trim()
            });
        }
    });

    if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Chỉnh độ rộng cột cho đẹp
        ws['!cols'] = [
            { wch: 22 }, // Thời gian
            { wch: 12 }, // Mã HS
            { wch: 25 }, // Tên HS
            { wch: 15 }, // Lớp
            { wch: 20 }, // Giáo viên
            { wch: 12 }, // Điểm
            { wch: 35 }, // Nhận xét
            { wch: 15 }  // Trạng thái
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bảng Điểm Trung Tâm");

        // Logic đặt tên file thông minh dựa vào Dropdown
        const teacherSelect = document.getElementById('filterScoreTeacherAdmin');
        let fileName = "DiemTrungTam";

        if (teacherSelect && teacherSelect.value !== "") {
            fileName += "_" + teacherSelect.value.replace(/\s+/g, '_');
        } else {
            fileName += "_TatCaGiaoVien";
        }

        const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
    } else {
        Swal.fire('Lỗi', 'Hệ thống chưa tải xong thư viện Excel. Vui lòng F5 lại trang!', 'error');
    }
}




// ==========================================
// 2. TÍNH NĂNG DUYỆT ĐIỂM HÀNG LOẠT (ADMIN)
// ==========================================
window.approveScoresBatch = function () {
    const teacherSelect = document.getElementById('filterScoreTeacherAdmin');
    const selectedTeacher = teacherSelect ? teacherSelect.value : '';

    const targetText = selectedTeacher === "" ? "TẤT CẢ các bảng điểm trong trung tâm" : `tất cả bảng điểm của giáo viên [${selectedTeacher}]`;

    Swal.fire({
        title: 'Xác nhận duyệt điểm?',
        text: `Hành động này sẽ chuyển trạng thái thành "Đã duyệt" cho ${targetText}. Học sinh sẽ có thể xem được điểm số của mình!`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#7f8c8d',
        confirmButtonText: 'Đồng ý, Duyệt ngay!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('http://localhost:5000/api/scores/approve-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher: selectedTeacher })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire('Thành công!', data.message, 'success');
                        // Tự động tải lại bảng điểm để cập nhật giao diện hiển thị "Đã duyệt"
                        window.loadAdminScores();
                    } else {
                        Swal.fire('Lỗi', 'Không thể duyệt điểm', 'error');
                    }
                })
                .catch(err => {
                    console.error("Lỗi kết nối:", err);
                    Swal.fire('Lỗi', 'Lỗi kết nối đến máy chủ', 'error');
                });
        }
    });
}



// ==========================================
// TÍNH NĂNG XÓA ĐIỂM HÀNG LOẠT THEO GIÁO VIÊN CỤ THỂ
// ==========================================
window.deleteScoresBatch = function () {
    // 1. Lấy giá trị từ ô Dropdown chọn giáo viên
    const teacherSelect = document.getElementById('filterScoreTeacherAdmin');
    const selectedTeacher = teacherSelect ? teacherSelect.value : '';

    // 2. Chốt chặn: Nếu chưa chọn giáo viên (đang để "Tất cả") thì cảnh báo và DỪNG
    if (!selectedTeacher || selectedTeacher === "") {
        Swal.fire({
            title: 'Hành động bị từ chối!',
            text: 'Bạn không thể xóa toàn bộ điểm của Trung tâm. Vui lòng chọn đích danh một giáo viên ở ô bên cạnh để xóa điểm của lớp đó!',
            icon: 'warning',
            confirmButtonColor: '#f39c12'
        });
        return;
    }

    // 3. Nếu đã chọn giáo viên, hiện hộp thoại xác nhận nguy hiểm
    Swal.fire({
        title: 'Cảnh báo nguy hiểm!',
        text: `Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu điểm của ${selectedTeacher} không? Hành động này không thể hoàn tác!`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '<i class="fas fa-trash"></i> Vâng, xóa hết!',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {

            // 4. Gọi API xóa dưới Backend
            fetch('http://localhost:5000/api/scores/delete-batch', {
                method: 'DELETE', // Dùng method DELETE cho chuẩn chuẩn RESTful
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher: selectedTeacher })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire('Đã xóa!', `Đã xóa thành công ${data.deletedRows} bản ghi điểm của ${selectedTeacher}.`, 'success');
                        // Tự động load lại bảng sau khi xóa
                        if (typeof window.loadAdminScores === 'function') {
                            window.loadAdminScores();
                        }
                    } else {
                        Swal.fire('Lỗi!', data.message, 'error');
                    }
                })
                .catch(err => {
                    console.error("Lỗi khi xóa điểm:", err);
                    Swal.fire('Lỗi kết nối!', 'Không thể kết nối đến máy chủ.', 'error');
                });
        }
    });
};












// ==========================================
// QUẢN LÝ ĐƠN TỪ HỌC SINH (ADMIN)
// ==========================================
let allAdminRequests = []; // Lưu danh sách đơn tạm để lọc

window.loadAdminRequests = function () {
    const tbody = document.getElementById('adminRequestsBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #ff7b00;"></i> Đang tải dữ liệu...</td></tr>`;

    fetch(`${API_BASE_URL}/api/admin-requests`)
        .then(res => res.json())
        .then(data => {
            allAdminRequests = data || [];
            renderAdminRequestsTable(allAdminRequests);
        })
        .catch(err => {
            console.error("Lỗi tải đơn học sinh:", err);
            tbody.innerHTML = `<tr><td colspan="8" style="color: red; padding: 20px;">Lỗi khi tải dữ liệu từ máy chủ!</td></tr>`;
        });
};

// Hàm vẽ bảng danh sách đơn
function renderAdminRequestsTable(list) {
    const tbody = document.getElementById('adminRequestsBody');
    tbody.innerHTML = '';

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="padding: 25px; color: #7f8c8d; font-style: italic;">Không có đơn nào cần xử lý.</td></tr>`;
        return;
    }

    list.forEach(req => {
        // 1. Định dạng thời gian gửi (Giờ đỏ trên, Ngày xám dưới)
        const dateObj = new Date(req.created_at);
        const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('vi-VN');
        const displayDate = `<span style="color:#e74c3c; font-weight:bold;">${timeStr}</span><br><small style="color:#7f8c8d;">${dateStr}</small>`;

        // 2. Định dạng nhãn Loại đơn (Chống rớt dòng trên Mobile)
        let typeBadge = '';
        const badgeStyle = 'color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap; display: inline-block;';

        if (req.request_type === 'Đơn xin vắng học') {
            typeBadge = `<span style="background: #e67e22; ${badgeStyle}"><i class="fas fa-user-clock"></i> Vắng học</span>`;
        } else if (req.request_type === 'Đơn xin phúc khảo điểm') {
            typeBadge = `<span style="background: #3498db; ${badgeStyle}"><i class="fas fa-marker"></i> Phúc khảo</span>`;
        } else {
            typeBadge = `<span style="background: #9b59b6; ${badgeStyle}"><i class="fas fa-receipt"></i> Đóng phí</span>`;
        }

        // 3. Định dạng nhãn Trạng thái (Dùng &nbsp; để cột chặt chữ)
        let statusBadge = '';
        const statusStyle = 'padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;';

        if (req.status === 'Đã duyệt') {
            statusBadge = `<span style="background: #2ecc71; color: white; ${statusStyle}">Đã&nbsp;duyệt</span>`;
        } else if (req.status === 'Từ chối') {
            statusBadge = `<span style="background: #e74c3c; color: white; ${statusStyle}">Từ&nbsp;chối</span>`;
        } else {
            statusBadge = `<span style="background: #f1c40f; color: #2c3e50; ${statusStyle}">Chờ&nbsp;duyệt</span>`;
        }

        // 4. Các nút thao tác
        let actionButtons = '';
        if (req.status === 'Chờ duyệt') {
            actionButtons = `
                <button onclick="updateRequestStatus(${req.id}, 'Đã duyệt')" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;" title="Duyệt đơn">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="updateRequestStatus(${req.id}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Từ chối">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            actionButtons = `<span style="color: #95a5a6; font-size: 12px; font-style: italic;">Đã hoàn tất</span>`;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="vertical-align: middle; padding: 12px;">${displayDate}</td>
            <td style="vertical-align: middle;">${typeBadge}</td>
            <td style="vertical-align: middle; font-weight: bold; color: #2c3e50;">${req.mshs} - ${req.student_name}</td>
            <td style="vertical-align: middle; color: #ff7b00; font-weight: bold;">${req.class_name}</td>
            <td style="vertical-align: middle;">${req.teacher_name || '<em style="color:#95a5a6;">(Trung tâm)</em>'}</td>
            <td style="vertical-align: middle; text-align: left; padding: 10px; font-size: 13px; color: #34495e; white-space: pre-line;">${req.content}</td>
            <td style="vertical-align: middle;">${statusBadge}</td>
            <td style="vertical-align: middle;">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Bộ lọc loại đơn & trạng thái
window.filterAdminRequests = function () {
    const selectedType = document.getElementById('filterRequestType').value;
    const selectedStatus = document.getElementById('filterRequestStatus').value;

    const filtered = allAdminRequests.filter(item => {
        const matchType = !selectedType || item.request_type === selectedType;
        const matchStatus = !selectedStatus || item.status === selectedStatus;
        return matchType && matchStatus;
    });

    renderAdminRequestsTable(filtered);
};

// 1. CẬP NHẬT TRẠNG THÁI (Giao diện nhập Ghi chú xịn xò)
window.updateRequestStatus = function (id, newStatus) {
    Swal.fire({
        title: `Xác nhận ${newStatus}`,
        html: `Vui lòng nhập phản hồi cho học sinh <b style="color:red">(Bắt buộc)</b>:`,
        input: 'textarea',
        inputPlaceholder: 'Nhập lý do duyệt hoặc từ chối vào đây...',
        icon: newStatus === 'Đã duyệt' ? 'question' : 'warning',
        showCancelButton: true,
        confirmButtonColor: newStatus === 'Đã duyệt' ? '#2ecc71' : '#e74c3c',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '<i class="fas fa-save"></i> Lưu phản hồi',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'LỖI: Bạn không được để trống thông tin này!'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const note = result.value.trim();

            // Gửi API cập nhật
            fetch(`${API_BASE_URL}/api/admin-requests/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus, admin_note: note })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({ title: 'Thành công!', text: 'Đã lưu phản hồi.', icon: 'success', timer: 1500, showConfirmButton: false });
                        loadAdminRequests(); // Tải lại bảng
                    } else {
                        Swal.fire('Lỗi hệ thống', data.message, 'error');
                    }
                });
        }
    });
};

// 2. XÓA ĐƠN (Giao diện cảnh báo đỏ rực nguy hiểm)
window.deleteRequestsByType = function () {
    const selectedType = document.getElementById('filterRequestType').value;

    // Chặn xóa nếu chưa chọn loại đơn
    if (!selectedType) {
        Swal.fire({
            title: 'Thao tác bị chặn!',
            text: "Bạn phải chọn một 'Loại đơn' cụ thể ở thanh lọc (VD: Đơn xin vắng học) thì mới được phép xóa.",
            icon: 'error',
            confirmButtonColor: '#34495e'
        });
        return;
    }

    // Hiện bảng Cảnh báo nguy hiểm
    Swal.fire({
        title: 'CẢNH BÁO NGUY HIỂM!',
        html: `Bạn có chắc chắn muốn xóa TẤT CẢ <b>"${selectedType}"</b> không?<br><br><span style="color:#e74c3c; font-weight:bold;">(Dữ liệu sẽ bốc hơi khỏi hệ thống và học sinh cũng sẽ mất đơn này vĩnh viễn!)</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#34495e',
        confirmButtonText: '<i class="fas fa-trash-alt"></i> Vâng, Xóa hết đi!',
        cancelButtonText: 'Hủy thao tác'
    }).then((result) => {
        if (result.isConfirmed) {
            // Gửi API xóa
            fetch(`${API_BASE_URL}/api/admin-requests/delete-by-type`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_type: selectedType })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            title: 'Đã dọn dẹp!',
                            text: `Thành công xóa ${data.deletedCount} đơn.`,
                            icon: 'success',
                            confirmButtonColor: '#3498db'
                        });
                        loadAdminRequests();
                    }
                });
        }
    });
};

// 3. XUẤT EXCEL (Chuẩn cột 100%, không bị dồn cục)
window.exportRequestsToExcel = function () {
    const selectedType = document.getElementById('filterRequestType').value;
    const selectedStatus = document.getElementById('filterRequestStatus').value;

    // Lấy dữ liệu đã lọc
    const filtered = allAdminRequests.filter(item => {
        const matchType = !selectedType || item.request_type === selectedType;
        const matchStatus = !selectedStatus || item.status === selectedStatus;
        return matchType && matchStatus;
    });

    if (filtered.length === 0) {
        alert("Không có dữ liệu nào để xuất!");
        return;
    }

    // Tạo cấu trúc HTML Table giả lập file Excel
    let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <!-- Ép Excel hiển thị đúng font và lưới -->
            <style>
                table { border-collapse: collapse; font-family: Arial, sans-serif; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top; }
                th { background-color: #f2f2f2; font-weight: bold; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>
                        <th>Thời gian gửi</th>
                        <th>Loại đơn</th>
                        <th>Mã HS</th>
                        <th>Tên Học Sinh</th>
                        <th>Lớp</th>
                        <th>Giáo viên</th>
                        <th>Nội dung đơn</th>
                        <th>Trạng thái</th>
                        <th>Phản hồi của Admin</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Đổ dữ liệu vào từng ô
    filtered.forEach(req => {
        const dateStr = new Date(req.created_at).toLocaleString('vi-VN');
        // Xử lý xuống dòng trong Excel bằng thẻ <br>
        const cleanContent = req.content ? req.content.replace(/\n/g, '<br>') : '';
        const cleanNote = req.admin_note ? req.admin_note.replace(/\n/g, '<br>') : '';

        tableHtml += `
            <tr>
                <td>${dateStr}</td>
                <td>${req.request_type}</td>
                <td>${req.mshs}</td>
                <td>${req.student_name}</td>
                <td>${req.class_name}</td>
                <td>${req.teacher_name || 'Gửi Trung tâm'}</td>
                <td>${cleanContent}</td>
                <td>${req.status}</td>
                <td>${cleanNote}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table></body></html>`;

    // Đóng gói thành Blob định dạng .xls
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);

    // Tự động tải file
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_Sach_Don_${new Date().getTime()}.xls`;
    document.body.appendChild(link);
    link.click();

    // Dọn dẹp bộ nhớ
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};