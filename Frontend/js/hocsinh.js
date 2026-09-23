

// Khởi chạy hệ thống ngay khi trang vừa load xong
document.addEventListener("DOMContentLoaded", () => {
    initStudentDashboard();
});

// ==========================================
// 1. HÀM KHỞI TẠO (KIỂM TRA & LẤY THÔNG TIN)
// ==========================================
function initStudentDashboard() {
    // Kiểm tra "vé vào cửa" (Auth)
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../../index.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'student') {
        window.location.href = '../../index.html';
        return;
    }

    currentStudent = user;

    // Hiển thị Lời chào bằng Tên Thật (Lấy từ DB)
    const displayName = user.fullname || user.fullName || user.username || 'Học Sinh';
    const welcomeEl = document.getElementById('welcomeStudentMessage');
    if (welcomeEl) {
        welcomeEl.innerHTML = `<i class="fab fa-pagelines"></i> Chào học sinh: <span style="color:#2c3e50; font-weight: 800;">${displayName}</span>`;
    }

    // ==========================================
    // KHÚC ĐÃ SỬA: LOGIC MENU 3 GẠCH + THẢM ĐEN + BÁO CÁO F12
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (mobileMenuBtn && sidebar && mobileOverlay) {
        // Bấm nút 3 gạch
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mobileOverlay.classList.toggle('active');

            if (sidebar.classList.contains('active')) {
                console.log("🟢 ĐÃ MỞ: Cửa Menu và Thảm đen đã được trải ra!");
            } else {
                console.log("🔴 ĐÃ ĐÓNG: Cửa Menu và Thảm đen đã được thu lại!");
            }
        });

        // Bấm ra ngoài thảm đen để đóng
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
            console.log("🔴 ĐÃ ĐÓNG: Bấm ra ngoài thảm đen!");
        });

        // Bấm vào link menu cũng tự đóng
        const menuItems = document.querySelectorAll('.sidebar-menu li a');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                }
            });
        });
    }
    // Kiểm tra Mã Học Sinh (mshs) và bắt đầu kéo dữ liệu
    const realMshs = user.mshs;
    if (!realMshs) {
        showErrorState("Tài khoản của bạn chưa được cấp Mã Học Sinh (MSHS). Vui lòng liên hệ Trung Tâm để cập nhật!");
        return;
    }

    // Kích hoạt hàm tải lịch học thật từ Server
    loadStudentSchedule(realMshs);
}

// ==========================================
// 2. HÀM GỌI API (KẾT NỐI SERVER)
// ==========================================
function loadStudentSchedule(mshs) {
    const container = document.getElementById('studentScheduleContainer');
    if (!container) return;

    // Hiệu ứng xoay loading
    container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #ff7b00;">
            <i class="fas fa-circle-notch fa-spin fa-3x" style="margin-bottom: 15px;"></i>
            <h4 style="color: #2c3e50;">Đang đồng bộ lịch học từ hệ thống...</h4>
        </div>
    `;

    fetch(`${API_BASE_URL}/api/student-schedule/${encodeURIComponent(mshs)}`)
        .then(res => {
            if (!res.ok) throw new Error("Lỗi mạng hoặc máy chủ không phản hồi");
            return res.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                showEmptyState();
                return;
            }
            renderSchedule(data);
        })
        .catch(err => {
            console.error("Lỗi lấy lịch học:", err);
            showErrorState("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Internet hoặc F5 lại trang!");
        });
}

// ==========================================
// 3. HÀM VẼ GIAO DIỆN LỊCH HỌC (RENDER UI)
// ==========================================
function renderSchedule(scheduleData) {
    const container = document.getElementById('studentScheduleContainer');

    // Gom nhóm theo ngày
    const grouped = {};
    scheduleData.forEach(item => {
        const dateObj = new Date(item.date);

        // Tạo bộ từ điển tự động dịch ra Thứ
        const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayStr = daysOfWeek[dateObj.getDay()];

        // Lấy định dạng Ngày/Tháng/Năm
        const dateFormatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

        // Ghép chuỗi chuẩn Mobile (VD: "Thứ 2 - Ngày 21/09/2026")
        const dateStr = `${dayStr} - Ngày ${dateFormatted}`;

        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(item);
    });
    let html = '';
    for (const [date, classes] of Object.entries(grouped)) {
        html += `
            <div class="date-header" style="color: black; font-weight: bold; font-size: 16px;">
            <i class="far fa-calendar-check" style="color: #ff7b00; margin-right: 5px;"></i> ${date}
            </div>
                <div class="horizontal-cards">
        `;

        classes.forEach(c => {
            const time = c.time || 'Chưa xếp giờ';
            const className = c.class_name || 'Lớp chưa xác định';
            const room = c.room || 'Đang chờ xếp';
            const teacher = c.teacher_name || 'Đang chờ phân công';

            html += `
                <div class="course-card">
                    <div class="course-time" style="color: #e74c3c;"><i class="far fa-clock"></i> ${time}</div>
                    <div class="course-name">${className}</div>
                    <div class="course-detail">
                        <i class="fas fa-door-open"></i> Phòng: <strong>${room}</strong>
                    </div>
                    <div class="course-detail">
                        <i class="fas fa-chalkboard-teacher"></i> Giáo viên: <strong>${teacher}</strong>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ==========================================
// 4. HÀM XỬ LÝ GIAO DIỆN TRỐNG & LỖI
// ==========================================
function showEmptyState() {
    const container = document.getElementById('studentScheduleContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; background: #fff5eb; border-radius: 12px; border: 1px dashed #ff7b00; margin-top: 20px;">
            <i class="fas fa-mug-hot fa-3x" style="color: #ff9f43; margin-bottom: 20px;"></i>
            <h3 style="color: #d35400; margin-bottom: 10px;">Bạn chưa có lịch học nào!</h3>
            <p style="color: #7f8c8d; font-size: 15px;">Có vẻ như Trung tâm chưa xếp lớp cho bạn hoặc bạn đang trong thời gian nghỉ.</p>
            <button onclick="loadStudentSchedule('${currentStudent.mshs}')" class="btn btn-primary" style="background: #ff7b00; border: none; padding: 10px 20px; color: white; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: bold; transition: 0.3s;">
                <i class="fas fa-sync-alt"></i> Tải lại lịch
            </button>
        </div>
    `;
}

function showErrorState(message) {
    const container = document.getElementById('studentScheduleContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #fdf5f6; border-radius: 12px; border: 1px dashed #e74c3c; margin-top: 20px;">
            <i class="fas fa-exclamation-triangle fa-3x" style="color: #e74c3c; margin-bottom: 20px;"></i>
            <h3 style="color: #c0392b; margin-bottom: 10px;">Đã xảy ra sự cố!</h3>
            <p style="color: #7f8c8d; font-size: 15px;">${message}</p>
        </div>
    `;
}

// ==========================================
// 5. TÍNH NĂNG ĐĂNG XUẤT AN TOÀN
// ==========================================
window.logout = function () {
    Swal.fire({
        title: 'Đăng xuất?',
        text: "Bạn có chắc chắn muốn thoát khỏi hệ thống?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff7b00',
        cancelButtonColor: '#7f8c8d',
        confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Đăng xuất ngay',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('currentUser');
            window.location.href = '../../index.html';
        }
    });
}


// ==========================================
// TÍNH NĂNG CHUÔNG THÔNG BÁO & MENU CÁ NHÂN
// ==========================================

// Đổ dữ liệu thật vào Menu Góc phải khi load trang
document.addEventListener("DOMContentLoaded", () => {
    if (currentStudent) {
        const displayName = currentStudent.fullname || currentStudent.fullName || currentStudent.username || 'Học Sinh';
        const phone = currentStudent.phone || 'Chưa cập nhật';
        const username = currentStudent.username || '';

        // Đổ tên lên góc phải
        const headerProfileName = document.getElementById('headerProfileName');
        if (headerProfileName) headerProfileName.innerText = displayName;

        // Đổ dữ liệu vào Modal cá nhân
        const modalUsername = document.getElementById('modalUsername');
        const modalPhone = document.getElementById('modalPhone');
        if (modalUsername) modalUsername.value = username;
        if (modalPhone) modalPhone.value = phone;

        // Hiển thị Avatar (Nếu đã lưu URL ảnh, không thì xài ảnh mặc định có tên viết tắt)
        const avatarUrl = currentStudent.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=ff7b00&color=fff`;
        document.getElementById('headerAvatar').src = avatarUrl;
        document.getElementById('modalAvatarPreview').src = avatarUrl;
    }
});

// Đóng mở Chuông & Profile Menu
window.toggleNotiMenu = function (e) {
    e.stopPropagation();
    document.getElementById('notiDropdown').classList.toggle('active');
    document.getElementById('profileDropdown').classList.remove('active');
}

window.toggleProfileMenu = function (e) {
    e.stopPropagation();
    document.getElementById('profileDropdown').classList.toggle('active');
    document.getElementById('notiDropdown').classList.remove('active');
}

// Bấm ra ngoài tự đóng dropdown
document.addEventListener('click', () => {
    const notiDropdown = document.getElementById('notiDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    if (notiDropdown) notiDropdown.classList.remove('active');
    if (profileDropdown) profileDropdown.classList.remove('active');
});

// Modal Thông tin cá nhân
window.openProfileModal = function () {
    document.getElementById('profileModal').classList.add('active');
}
window.closeProfileModal = function () {
    document.getElementById('profileModal').classList.remove('active');
}

// Logic load ảnh xem trước khi bấm Đổi Ảnh
window.previewAvatar = function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Đổi ảnh trong Modal
            document.getElementById('modalAvatarPreview').src = e.target.result;
            // Đổi ảnh trên thanh Header luôn cho ngầu
            document.getElementById('headerAvatar').src = e.target.result;

            // Note: Để lưu vĩnh viễn cần đẩy e.target.result lên API server
            Swal.fire({
                title: 'Thành công',
                text: 'Đã cập nhật ảnh đại diện tạm thời (Cần API để lưu vĩnh viễn)',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
        reader.readAsDataURL(file);
    }
}







// ==========================================
// CHUYỂN TAB: LỊCH HỌC <-> ĐIỂM SỐ <-> LÀM ĐƠN <-> XEM ĐƠN
// ==========================================
window.switchTab = function (tabName) {
    // 1. GỌI TÊN CÁC KHUNG GIAO DIỆN
    const scheduleContainer = document.getElementById('scheduleCard');
    const scoreContainer = document.getElementById('scoreCard');
    const requestContainer = document.getElementById('studentsRequestContainer');
    const viewRequestsContainer = document.getElementById('viewRequestsContainer'); // MỚI

    // 2. GỌI TÊN CÁC NÚT BẤM TRÊN MENU
    const menuSchedule = document.getElementById('menuSchedule');
    const menuScore = document.getElementById('menuScore');
    const menuRequest = document.getElementById('menuRequest');
    const menuViewRequests = document.getElementById('menuViewRequests'); // MỚI

    // 3. ẨN TẤT CẢ VÀ TẮT HIGHLIGHT
    if (scheduleContainer) scheduleContainer.style.display = 'none';
    if (scoreContainer) scoreContainer.style.display = 'none';
    if (requestContainer) requestContainer.style.display = 'none';
    if (viewRequestsContainer) viewRequestsContainer.style.display = 'none'; // MỚI

    if (menuSchedule) menuSchedule.classList.remove('active');
    if (menuScore) menuScore.classList.remove('active');
    if (menuRequest) menuRequest.classList.remove('active');
    if (menuViewRequests) menuViewRequests.classList.remove('active'); // MỚI

    // 4. KÍCH HOẠT TAB ĐƯỢC CHỌN
    if (tabName === 'schedule') {
        if (scheduleContainer) scheduleContainer.style.display = 'block';
        if (menuSchedule) menuSchedule.classList.add('active');

    } else if (tabName === 'score') {
        if (scoreContainer) scoreContainer.style.display = 'block';
        if (menuScore) menuScore.classList.add('active');
        if (currentStudent && currentStudent.mshs && typeof loadStudentScores === 'function') {
            loadStudentScores(currentStudent.mshs);
        }

    } else if (tabName === 'request') {
        if (requestContainer) requestContainer.style.display = 'block';
        if (menuRequest) menuRequest.classList.add('active');
        if (typeof prepareRequestForm === 'function') prepareRequestForm(); // Reset form làm đơn

    } else if (tabName === 'viewRequests') {
        // 👉 KHÚC NÀY XỬ LÝ TAB XEM ĐƠN MỚI
        if (viewRequestsContainer) viewRequestsContainer.style.display = 'block';
        if (menuViewRequests) menuViewRequests.classList.add('active');

        // Gọi API tải lịch sử khi vừa bấm sang Tab này
        if (typeof loadStudentRequestHistory === 'function') {
            loadStudentRequestHistory();
        }
    }

    // 5. ĐÓNG SIDEBAR TRÊN MOBILE
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active');
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) overlay.classList.remove('active');
    }
};
// ==========================================
// TẢI VÀ VẼ GIAO DIỆN KẾT QUẢ HỌC TẬP
// ==========================================
function loadStudentScores(mshs) {
    const wrapper = document.getElementById('scoreCardsWrapper');
    wrapper.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#ff7b00;"></i> Đang lấy điểm...</div>';

    fetch(`${API_BASE_URL}/api/student-scores/${encodeURIComponent(mshs)}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                wrapper.innerHTML = '<div style="text-align:center; padding: 30px; color: #7f8c8d; font-style: italic;">Chưa có kết quả học tập nào được cập nhật!</div>';
                return;
            }

            wrapper.innerHTML = '';
            data.forEach(item => {
                // Xử lý thời gian
                let timeString = 'N/A';
                if (item.created_at) {
                    const d = new Date(item.created_at);
                    timeString = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' | ' + d.toLocaleDateString('vi-VN');
                }

                // ==========================================
                // LOGIC MÀU SẮC THÔNG MINH THEO ĐIỂM SỐ
                // ==========================================
                const scoreVal = parseFloat(item.score) || 0;
                let sBg = '#fdedec', sBorder = '#e74c3c', sText = '#c0392b'; // Mặc định Đỏ (Dưới 5)

                if (scoreVal >= 8) {
                    sBg = '#e8f8f5'; sBorder = '#2ecc71'; sText = '#27ae60'; // Xanh lá (Giỏi)
                } else if (scoreVal >= 5) {
                    sBg = '#fef9e7'; sBorder = '#f1c40f'; sText = '#d35400'; // Vàng cam (TB, Khá)
                }

                // ==========================================
                // VẼ KHUNG GIAO DIỆN (UI CARD)
                // ==========================================
                const card = document.createElement('div');
                card.style.cssText = "background: white; border-radius: 12px; padding: 20px; border: 1px solid #eee; border-left: 6px solid #ff7b00; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;";

                card.innerHTML = `
                    <div style="flex: 1; min-width: 250px;">
                        <!-- Tiêu đề môn học có Icon -->
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div style="background: #fff3e0; color: #ff7b00; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h4 style="color: #2c3e50; margin: 0; font-size: 19px; font-weight: 800; text-transform: uppercase;">${item.class_name}</h4>
                        </div>
                        
                        <!-- Thông tin giáo viên & Thời gian -->
                        <div style="color: #555; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-chalkboard-teacher" style="color: #7f8c8d; width: 16px; text-align: center;"></i> 
                            <span>Giáo viên: <strong>${item.teacher_name}</strong></span>
                        </div>
                        <div style="color: #95a5a6; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="far fa-clock" style="color: #bdc3c7; width: 16px; text-align: center;"></i> 
                            <span>Cập nhật: ${timeString}</span>
                        </div>

                        <!-- Khung nhận xét (Quote block) -->
                        <div style="margin-top: 15px; background: #f8f9fa; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #3498db; position: relative;">
                            <i class="fas fa-quote-right" style="position: absolute; top: 10px; right: 15px; color: #e9ecef; font-size: 24px;"></i>
                            <div style="color: #3498db; font-weight: bold; font-size: 13px; margin-bottom: 4px;">
                                <i class="fas fa-comment-dots"></i> Lời nhận xét:
                            </div>
                            <div style="color: #2c3e50; font-style: italic; font-size: 14px; line-height: 1.5;">
                                "${item.note || 'Không có lời nhận xét nào.'}"
                            </div>
                        </div>
                    </div>

                    <!-- Vòng tròn Điểm Số -->
                    <div style="margin-left: 20px; margin-top: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 100px;">
                        <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">ĐIỂM SỐ</div>
                        <div style="width: 75px; height: 75px; border-radius: 50%; background: ${sBg}; border: 3px solid ${sBorder}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
                            <span style="font-size: 34px; font-weight: 900; color: ${sText};">${item.score}</span>
                        </div>
                    </div>
                `;
                wrapper.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            wrapper.innerHTML = '<div style="text-align:center; color: red;">Lỗi kết nối máy chủ!</div>';
        });
}


// ==========================================
// LOGIC LÀM ĐƠN (TỰ ĐỘNG TÌM LỊCH HỌC)
// ==========================================

let studentSchedulesForRequest = []; // Biến toàn cục lưu lịch học tạm thời

function prepareRequestForm() {
    // 1. Chỉ tự động điền Ngày tháng
    const today = new Date();
    document.getElementById('reqDate').value = today.toLocaleDateString('vi-VN');

    // Xóa trắng ô Họ tên để học sinh tự nhập
    document.getElementById('reqStudentName').value = '';

    // 2. Kéo API lấy lịch học thực tế của học sinh này về để chuẩn bị cho Đơn xin vắng học
    if (currentStudent && currentStudent.mshs) {
        fetch(`${API_BASE_URL}/api/student-schedule/${encodeURIComponent(currentStudent.mshs)}`)
            .then(res => res.json())
            .then(data => {
                studentSchedulesForRequest = data || []; // Lưu lại
            })
            .catch(err => console.error("Lỗi lấy lịch học làm đơn:", err));
    }
}

// Xử lý thông báo động & Giao diện chọn lịch học
window.handleRequestTypeChange = function () {
    const type = document.getElementById('reqType').value;
    const noticeDiv = document.getElementById('reqNotice');
    const scheduleGroup = document.getElementById('scheduleSelectGroup');
    const reqSchedule = document.getElementById('reqSchedule');

    // Reset giao diện
    scheduleGroup.style.display = 'none';
    reqSchedule.removeAttribute('required');
    noticeDiv.innerHTML = '';

    if (type === 'Đơn xin vắng học') {
        noticeDiv.innerHTML = '<span style="color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> Lưu ý: Đơn chỉ có hiệu lực trong 24h và trước buổi học, sau buổi học sẽ không được chấp nhận.</span>';

        // Hiện khung chọn lịch học
        scheduleGroup.style.display = 'block';
        reqSchedule.setAttribute('required', 'true');

        // Đổ dữ liệu lịch học vào Dropdown
        reqSchedule.innerHTML = '<option value="">-- Chọn buổi học muốn vắng --</option>';
        if (studentSchedulesForRequest.length === 0) {
            reqSchedule.innerHTML = '<option value="">(Bạn chưa có lịch học nào sắp tới)</option>';
        } else {
            studentSchedulesForRequest.forEach(item => {
                // Ráp chuỗi: Ngày - Giờ - Môn - GV
                const dateObj = new Date(item.date);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                // Đóng gói data:class_name và data:teacher_name vào option để tý nữa lấy ra xài
                const optionText = `Ngày ${dateStr} | ${item.time} | Môn: ${item.class_name} | GV: ${item.teacher_name}`;
                const opt = document.createElement('option');
                opt.value = optionText; // Lưu chuỗi hiển thị
                opt.dataset.className = item.class_name; // Lưu ẩn tên lớp
                opt.dataset.teacherName = item.teacher_name; // Lưu ẩn tên GV
                opt.textContent = optionText;
                reqSchedule.appendChild(opt);
            });
        }
    }
    else if (type === 'Đơn xin phúc khảo điểm') {
        noticeDiv.innerHTML = '<span style="color: #3498db;"><i class="fas fa-info-circle"></i> Thông báo: Phúc khảo điểm xin vui lòng đợi trong vòng 24h để quản lý xử lý dữ liệu và trả lời đơn phúc khảo.</span>';
    }
    else if (type === 'Đơn xin kiểm tra khoản đóng phí') {
        noticeDiv.innerHTML = '<span style="color: #f39c12;"><i class="fas fa-clock"></i> Thông báo: Vui lòng đợi quản lý trung tâm xét duyệt.</span>';
    }
}

// Bấm nút Nộp đơn
window.submitStudentRequest = function (event) {
    event.preventDefault();

    if (!currentStudent || !currentStudent.mshs) {
        Swal.fire('Lỗi', 'Không tìm thấy dữ liệu học sinh. Vui lòng đăng nhập lại!', 'error');
        return;
    }

    const requestType = document.getElementById('reqType').value;
    let targetTeacher = null;
    let detailContent = document.getElementById('reqContent').value;

    // NẾU LÀ ĐƠN VẮNG HỌC: Trích xuất tên Giáo viên từ cái lịch đã chọn để hệ thống biết gửi cho ai
    if (requestType === 'Đơn xin vắng học') {
        const selectEl = document.getElementById('reqSchedule');
        const selectedOption = selectEl.options[selectEl.selectedIndex];

        if (!selectedOption.value) {
            Swal.fire('Lỗi', 'Vui lòng chọn buổi học bạn muốn vắng!', 'warning');
            return;
        }

        targetTeacher = selectedOption.dataset.teacherName; // Lấy tên GV
        // Gắn thêm thông tin buổi học vào nội dung đơn cho Admin dễ đọc
        detailContent = `[Xin vắng buổi học: ${selectedOption.value}]\n\nLý do: ${detailContent}`;
    }

    const payload = {
        mshs: currentStudent.mshs,
        student_name: document.getElementById('reqStudentName').value,
        class_name: document.getElementById('reqClass').value,
        request_type: requestType,
        teacher_name: targetTeacher, // Sẽ có tên GV nếu là đơn vắng học, ngược lại là null
        content: detailContent
    };

    // Gửi lên Backend
    fetch(`${API_BASE_URL}/api/submit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Đơn của bạn đã được gửi. Quản lý trung tâm (và Giáo viên phụ trách) sẽ xem xét trong thời gian sớm nhất.',
                    icon: 'success',
                    confirmButtonColor: '#3498db'
                });
                document.getElementById('studentRequestForm').reset();
                handleRequestTypeChange();
                prepareRequestForm();
            } else {
                Swal.fire('Lỗi hệ thống', data.message || 'Không thể nộp đơn.', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Lỗi mạng', 'Máy chủ đang bận, vui lòng thử lại sau!', 'error');
        });
}








// ==========================================
// TÍNH NĂNG: XEM LỊCH SỬ & KẾT QUẢ ĐƠN TỪ (CẬP NHẬT CHỐNG LỖI)
// ==========================================
window.loadStudentRequestHistory = function () {
    // Ép lấy ID học sinh dù lưu dưới biến nào
    const mshs = currentStudent.mshs || currentStudent.username || currentStudent.id;

    const tbody = document.getElementById('requestHistoryBody');
    if (!tbody) return;

    if (!mshs) {
        tbody.innerHTML = `<tr><td colspan="5" style="color: red; padding: 20px;">Lỗi: Không xác định được mã học sinh đang đăng nhập!</td></tr>`;
        return;
    }

    // Hiệu ứng loading
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 30px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin"></i> Đang kết nối lấy dữ liệu từ Server...</td></tr>`;

    // Kéo dữ liệu từ API
    fetch(`${API_BASE_URL}/api/student-requests/${mshs}`)
        .then(res => {
            if (!res.ok) throw new Error("API chưa được bật hoặc báo lỗi!");
            return res.json();
        })
        .then(data => {
            tbody.innerHTML = '';

            // Nếu chưa có đơn
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; color: #7f8c8d; font-style: italic;">Bạn chưa gửi đơn nào.</td></tr>`;
                return;
            }

            // In dữ liệu ra bảng
            data.forEach(req => {
                const dateObj = new Date(req.created_at);
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN');
                const timeHtml = `<span style="color:#e74c3c; font-weight:bold;">${timeStr}</span><br><small style="color:#7f8c8d;">${dateStr}</small>`;

                let statusBadge = '';
                if (req.status === 'Đã duyệt') {
                    statusBadge = `<span style="background: #2ecc71; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Đã duyệt</span>`;
                } else if (req.status === 'Từ chối') {
                    statusBadge = `<span style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Từ chối</span>`;
                } else {
                    statusBadge = `<span style="background: #f1c40f; color: #2c3e50; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">Chờ duyệt</span>`;
                }

                // 3. Khung phản hồi của Admin (Đã ép chữ vào giữa, đổi viền trái thành viền dưới cho cân đối)
                let noteHtml = '';
                if (req.admin_note) {
                    const borderColor = req.status === 'Đã duyệt' ? '#2ecc71' : '#e74c3c';
                    noteHtml = `<div style="background: #f8fafc; border-bottom: 2px solid ${borderColor}; padding: 8px; border-radius: 4px; text-align: center; font-size: 13px; color: #2c3e50; white-space: pre-line;">${req.admin_note}</div>`;
                } else {
                    noteHtml = `<span style="color: #95a5a6; font-style: italic; font-size: 12px;">Đang chờ xử lý...</span>`;
                }

                // 4. Vẽ HTML: Thêm text-align: center và border-right cho từng cột
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                tr.innerHTML = `
                    <td style="vertical-align: middle; text-align: center; padding: 12px; border-right: 1px dashed #eee;">${timeHtml}</td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px; border-right: 1px dashed #eee;"><strong style="color: #e67e22;">${req.request_type}</strong></td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px; font-size: 13px; color: #34495e; white-space: pre-line; border-right: 1px dashed #eee;">${req.content || req.reason || 'Không có nội dung'}</td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px; border-right: 1px dashed #eee;">${statusBadge}</td>
                    <td style="vertical-align: middle; text-align: center; padding: 12px;">${noteHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Lỗi:", err);
            tbody.innerHTML = `<tr><td colspan="5" style="color: red; padding: 20px;">Lỗi: Chưa tìm thấy API Server! Hãy kiểm tra lại file server.js và khởi động lại Node.</td></tr>`;
        });
}