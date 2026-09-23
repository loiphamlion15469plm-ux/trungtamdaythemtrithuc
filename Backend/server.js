const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// API thử nghiệm
app.get('/api/test', (req, res) => {
    res.json({ message: "🚀 Máy chủ Backend và CSDL đã sẵn sàng chiến đấu!" });
});

// API XỬ LÝ ĐĂNG KÝ KHÓA HỌC

app.post('/api/register', (req, res) => {
    // 1. Nhận đủ 4 món dữ liệu từ Frontend
    const { fullname, phone, grade, course_name } = req.body;

    // 2. Đi tìm ID của môn học
    const findCourseQuery = "SELECT id FROM courses WHERE course_name = ?";

    db.query(findCourseQuery, [course_name], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi hệ thống Database!" });
        if (results.length === 0) return res.status(404).json({ error: "Không tìm thấy khóa học này" });

        const courseId = results[0].id;

        // 3. LƯU Ý CHỖ NÀY: Đã thêm cột 'grade' và thêm dấu '?' thứ 4
        const insertQuery = "INSERT INTO guest_registrations (guest_name, phone, grade, course_id) VALUES (?, ?, ?, ?)";

        // Truyền đủ 4 biến (fullname, phone, grade, courseId) vào lệnh
        db.query(insertQuery, [fullname, phone, grade, courseId], (err, result) => {
            if (err) return res.status(500).json({ error: "Lỗi khi lưu đăng ký!" });

            res.status(200).json({ message: "Đăng ký thành công dữ liệu đã vào kho!" });
        });
    });
});

// KHỞI ĐỘNG MÁY CHỦ
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy êm ru trên cổng ${PORT}...`);
});

// ==========================================
// API 1: XỬ LÝ TẠO TÀI KHOẢN MỚI (UPDATE)
// ==========================================
app.post('/api/users/register', (req, res) => {
    let { role, mshs, username, phone, password } = req.body;

    // Chặn cửa nếu Frontend gửi thiếu data
    if (!role || !username || !phone || !password || !mshs) {
        return res.status(400).json({ status: "error", message: "Thiếu dữ liệu gửi lên!" });
    }

    // 1. Dò sổ: Mã định danh này đã được cấp chưa?
    const checkSql = "SELECT * FROM users WHERE mshs = ? AND role = ?";
    db.query(checkSql, [mshs, role], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi kết nối CSDL!" });

        // Từ chối nếu mã điền bừa (như GV007) hoặc sai vai trò
        if (results.length === 0) {
            return res.status(400).json({ status: "error", message: "Mã định danh không tồn tại hoặc sai vai trò!" });
        }

        // Từ chối nếu mã đã có người xài
        if (results[0].username && results[0].username !== "") {
            return res.status(400).json({ status: "error", message: "Mã định danh này đã được tạo tài khoản!" });
        }

        // 2. Chấp thuận: CẬP NHẬT (UPDATE) thông tin vào đúng dòng đó
        const updateSql = "UPDATE users SET username = ?, phone = ?, password = ? WHERE mshs = ? AND role = ?";
        db.query(updateSql, [username, phone, password, mshs, role], (err, result) => {
            if (err) return res.status(500).json({ status: "error", message: "Lỗi cập nhật dữ liệu!" });
            res.status(200).json({ status: "success", message: "Tạo tài khoản thành công!" });
        });
    });
});

// ==========================================
// API 2: XỬ LÝ ĐĂNG NHẬP (KHÓA 4 YẾU TỐ)
// ==========================================
app.post('/api/users/login', (req, res) => {
    const { role, username, password, mshs } = req.body;

    // Ép buộc phải khớp cả 4 cột: role, username, password và mshs
    const loginSql = "SELECT * FROM users WHERE role = ? AND username = ? AND password = ? AND mshs = ?";

    db.query(loginSql, [role, username, password, mshs], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi Database!" });
        if (results.length > 0) {
            const user = results[0]; // Lấy thông tin dòng dữ liệu tìm được trong SQL
            res.status(200).json({
                status: "success",
                message: "Chào mừng trở lại!",
                user: {
                    mshs: user.mshs,
                    fullname: user.fullname,
                    role: user.role,
                    username: user.username
                }
            });
        } else {
            res.status(401).json({ status: "error", message: "Sai Tài khoản, Mật khẩu, Vai trò hoặc Mã định danh!" });
        }
    });
});

// ==========================================
// 3. API XÁC MINH TÀI KHOẢN (QUÊN MẬT KHẨU)
// ==========================================
app.post('/api/users/verify', (req, res) => {
    const { role, username, mshs } = req.body;

    // Chỉ tìm theo Vai trò và Tên tài khoản
    let verifyQuery = "SELECT * FROM users WHERE role = ? AND username = ?";
    let params = [role, username];

    // NẾU LÀ HỌC SINH: Ép buộc nối thêm điều kiện kiểm tra Mã Số Học Sinh
    if (role === 'student') {
        verifyQuery += " AND mshs = ?";
        params.push(mshs);
    }

    db.query(verifyQuery, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi Database!" });

        if (results.length > 0) {
            res.status(200).json({ status: "success", message: "Tài khoản hợp lệ!" });
        } else {
            // Trả về mã 404 cho F12 biết là "Không tìm thấy dữ liệu khớp"
            res.status(200).json({ status: "error", message: "Thông tin không chính xác hoặc tài khoản không tồn tại!" });
        }
    });
});

// API CẬP NHẬT MẬT KHẨU MỚI
app.post('/api/users/reset', (req, res) => {
    const { role, username, newPassword } = req.body;
    const updateQuery = "UPDATE users SET password = ? WHERE role = ? AND username = ?";

    db.query(updateQuery, [newPassword, role, username], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi Database!" });
        res.status(200).json({ status: "success", message: "Đổi mật khẩu thành công!" });
    });
});

// ==========================================
// 4. API CẬP NHẬT MẬT KHẨU MỚI
// ==========================================
app.post('/api/users/reset', (req, res) => {
    const { role, username, newPassword } = req.body;
    const updateQuery = "UPDATE users SET password = ? WHERE role = ? AND username = ?";

    db.query(updateQuery, [newPassword, role, username], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi Database!" });

        // Bắt buộc phải có ít nhất 1 dòng bị thay đổi thì mới tính là thành công
        if (result.affectedRows > 0) {
            res.status(200).json({ status: "success", message: "Đổi mật khẩu thành công!" });
        } else {
            res.status(400).json({ status: "error", message: "Lỗi: Không tìm thấy tài khoản để cập nhật!" });
        }
    });
});





// ==========================================
// API QUẢN LÝ LỊCH TRỰC CỦA ADMIN
// ==========================================

// 1. Lấy danh sách lịch trực
app.get('/api/admin/schedules', (req, res) => {
    // Sắp xếp ngày từ cũ đến mới
    db.query("SELECT * FROM schedules ORDER BY work_date ASC", (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Database!" });
        res.json(results);
    });
});

// 2. Thêm lịch trực mới
app.post('/api/admin/schedules', (req, res) => {
    const { date, shift, task, time } = req.body;
    const sql = "INSERT INTO schedules (work_date, shift, task, time_range, status) VALUES (?, ?, ?, ?, 'upcoming')";
    db.query(sql, [date, shift, task, time], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi lưu Database!" });
        res.status(200).json({ message: "Phân lịch thành công!" });
    });
});

// 3. Cập nhật Trạng thái (Xử lý vụ Nghỉ phải có lý do)
app.put('/api/admin/schedules/:id/status', (req, res) => {
    const { status, reason } = req.body;
    const id = req.params.id;
    const sql = "UPDATE schedules SET status = ?, reason = ? WHERE id = ?";
    db.query(sql, [status, reason || null, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi cập nhật!" });
        res.status(200).json({ message: "Đã cập nhật trạng thái!" });
    });
});





// ==========================================
// API: TẠO LỊCH TRỰC MỚI CHO ADMIN (POST)
// ==========================================
app.post('/api/admin/schedules', (req, res) => {
    // 1. Nhận dữ liệu từ form Frontend gửi lên
    const { work_date, shift, task, time_range } = req.body;

    // 2. Kiểm tra xem có gửi thiếu dữ liệu không
    if (!work_date || !shift || !task || !time_range) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // 3. Chuẩn bị câu lệnh SQL (Mặc định status là 'upcoming' - Sắp tới)
    const insertQuery = `
        INSERT INTO admin_schedules (work_date, shift, task, time_range, status) 
        VALUES (?, ?, ?, ?, 'upcoming')
    `;

    // 4. Nhét vào Database
    db.query(insertQuery, [work_date, shift, task, time_range], (err, result) => {
        if (err) {
            console.error("Lỗi MySQL khi tạo lịch:", err);
            return res.status(500).json({ error: "Lỗi hệ thống Database!" });
        }
        // Trả về thông báo thành công cho JS nó alert lên
        res.status(200).json({ status: "success", message: "Tạo lịch trực thành công!" });
    });
});


// ==========================================
// API: XÓA LỊCH TRỰC CỦA ADMIN (DELETE)
// ==========================================
app.delete('/api/admin/schedules/:id', (req, res) => {
    const scheduleId = req.params.id;
    const deleteQuery = "DELETE FROM schedules WHERE id = ?";

    db.query(deleteQuery, [scheduleId], (err, result) => {
        if (err) {
            console.error("Lỗi MySQL khi xóa lịch:", err);
            return res.status(500).json({ error: "Lỗi hệ thống Database!" });
        }
        res.status(200).json({ status: "success", message: "Đã xóa ca trực thành công!" });
    });
});










// 4. API Lấy danh sách Khách Đăng Ký cho Admin (Đã sửa theo Cấu trúc của bạn)
app.get('/api/admin/registrations', (req, res) => {
    // Dùng LEFT JOIN để lấy tên khóa học từ bảng courses dựa vào course_id
    const sql = `
        SELECT g.id, g.guest_name, g.phone, g.grade, g.status, g.created_at, c.course_name 
        FROM guest_registrations g
        LEFT JOIN courses c ON g.course_id = c.id
        ORDER BY g.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Database" });
        res.json(results);
    });
});

// 5. API Admin đánh dấu "Đã gọi"
app.put('/api/admin/registrations/:id/status', (req, res) => {
    db.query("UPDATE guest_registrations SET status = 'called' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi Database" });
        res.json({ message: "Đã lưu trạng thái" });
    });
});

// 6. API Admin xóa thông tin đăng ký
app.delete('/api/admin/registrations/:id', (req, res) => {
    db.query("DELETE FROM guest_registrations WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi Database" });
        res.json({ message: "Đã xóa" });
    });
});





// ==========================================
// API XỬ LÝ NÚT BẤM CỦA BẢNG ĐĂNG KÝ
// ==========================================

// 1. API Cập nhật trạng thái "Đã gọi"
app.put('/api/admin/registrations/:id/status', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE guest_registrations SET status = 'called' WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Lỗi cập nhật trạng thái:", err);
            return res.status(500).json({ error: "Lỗi Database" });
        }
        res.status(200).json({ message: "Đã cập nhật trạng thái thành công!" });
    });
});

// 2. API Xóa khách hàng đăng ký
app.delete('/api/admin/registrations/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM guest_registrations WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Lỗi xóa khách hàng:", err);
            return res.status(500).json({ error: "Lỗi Database" });
        }
        res.status(200).json({ message: "Đã xóa khách hàng thành công!" });
    });
});







// ==========================================
// 1. API THÊM LỊCH DẠY (Lưu cả MÃ và TÊN)
// ==========================================
app.post('/api/teacher-schedules', (req, res) => {
    const { mshs, teacher_name, class_name, work_date, time_range, room } = req.body;
    const sql = `INSERT INTO teacher_schedules (mshs, teacher_name, class_name, work_date, time_range, room) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [mshs, teacher_name, class_name, work_date, time_range, room], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi thêm lịch dạy!" });
        res.status(200).json({ message: "Phân ca thành công!" });
    });
});

// ==========================================
// 2. API LẤY DANH SÁCH LỊCH DẠY LÊN GIAO DIỆN (CÓ BỘ LỌC)
// ==========================================
app.get('/api/teacher-schedules', (req, res) => {
    const mshs = req.query.mshs; // Lấy mã giáo viên từ yêu cầu của Frontend
    let sql = "SELECT * FROM teacher_schedules";
    let params = [];

    // Nếu có chọn 1 giáo viên cụ thể (khác "all"), thì thêm điều kiện Lọc vào SQL
    if (mshs && mshs !== 'all') {
        sql += " WHERE mshs = ?";
        params.push(mshs);
    }

    sql += " ORDER BY work_date ASC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi tải dữ liệu!" });
        res.status(200).json(results);
    });
});

// ==========================================
// 3. API XÓA 1 CA DẠY CỤ THỂ
// ==========================================
app.delete('/api/teacher-schedules/:id', (req, res) => {
    const sql = "DELETE FROM teacher_schedules WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi khi xóa lịch dạy" });
        res.json({ message: "Đã xóa ca dạy thành công!" });
    });
});





// ==========================================
// API HỖ TRỢ PHÂN CA GIÁO VIÊN
// ==========================================

// 1. API Lấy danh sách Giáo viên từ bảng users
app.get('/api/admin/teachers-list', (req, res) => {
    // Giả sử giáo viên có role = 'teacher' trong bảng users
    const sql = "SELECT mshs, fullname FROM users WHERE role = 'teacher'";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy danh sách giáo viên" });
        res.json(results);
    });
});

// 2. API Xóa 1 ca dạy cụ thể theo ID
app.delete('/api/teacher-schedules/:id', (req, res) => {
    const sql = "DELETE FROM teacher_schedules WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi khi xóa lịch dạy" });
        res.json({ message: "Đã xóa ca dạy thành công!" });
    });
});




// ==========================================
// 4. API LÀM MỚI TUẦN (Xóa toàn bộ lịch dạy)
// ==========================================
app.delete('/api/teacher-schedules', (req, res) => {
    // TRUNCATE TABLE giúp xóa sạch dữ liệu và reset lại ID về 1 cực kỳ nhanh
    const sql = "TRUNCATE TABLE teacher_schedules";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi khi làm mới lịch dạy" });
        res.json({ message: "Đã xóa toàn bộ lịch dạy để bắt đầu tuần mới!" });
    });
});




// ==========================================
// 4. API RESET TRẠNG THÁI VỀ "SẮP TỚI" (Dành cho tuần mới)
// ==========================================
app.put('/api/teacher-schedules/reset-status', (req, res) => {
    // Đổi toàn bộ status thành 'upcoming' và xóa sạch lý do vắng (nếu có)
    const sql = "UPDATE teacher_schedules SET status = 'upcoming', reason = NULL";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi reset trạng thái" });
        res.json({ message: "Đã reset trạng thái toàn bộ ca dạy!" });
    });
});

// ==========================================
// 5. API SỬA NHANH NGÀY DẠY CỦA 1 CA
// ==========================================
app.put('/api/teacher-schedules/:id/date', (req, res) => {
    const { work_date } = req.body;
    const sql = "UPDATE teacher_schedules SET work_date = ? WHERE id = ?";
    db.query(sql, [work_date, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi cập nhật ngày" });
        res.json({ message: "Cập nhật ngày thành công!" });
    });
});






// ====================================================
// ROBOT TỰ ĐỘNG RESET TUẦN MỚI (CHẠY NGẦM)
// ====================================================
// '0 0 * * 1' nghĩa là: Chạy vào đúng 00:00 phút, vào ngày Thứ 2 hàng tuần
cron.schedule('0 0 * * 1', () => {
    console.log('🤖 [CRON JOB] Đang tiến hành tự động chuyển lịch sang tuần mới...');

    // Câu lệnh SQL "thần thánh": Vừa đổi status về 'upcoming', vừa xóa reason, VỪA CỘNG THÊM 7 NGÀY vào work_date
    const sql = `
        UPDATE teacher_schedules 
        SET status = 'upcoming', 
            reason = NULL, 
            work_date = DATE_ADD(work_date, INTERVAL 7 DAY)
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('❌ [CRON JOB] Lỗi khi tự động cập nhật lịch:', err);
        } else {
            console.log(`✅ [CRON JOB] Thành công! Đã dời ngày và reset trạng thái cho ${result.affectedRows} ca dạy.`);
        }
    });
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" // Đảm bảo chạy đúng theo giờ Việt Nam
});









// ==========================================
// API DÀNH CHO FORM XẾP LỚP HỌC SINH
// ==========================================

// 1. Lấy danh sách toàn bộ học sinh
app.get('/api/students', (req, res) => {
    const sql = "SELECT mshs, fullname FROM users WHERE role = 'student' ORDER BY id ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy danh sách học sinh" });
        res.json(results);
    });
});

// 2. Lấy danh sách các lớp ĐANG CÓ LỊCH DẠY (Tránh xếp nhầm lớp không tồn tại)
app.get('/api/active-classes', (req, res) => {
    const sql = "SELECT DISTINCT class_name FROM teacher_schedules WHERE class_name IS NOT NULL ORDER BY class_name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy danh sách lớp" });
        res.json(results);
    });
});




// ==========================================
// 3. LƯU XẾP LỚP (Khi Admin bấm nút Lưu)
// ==========================================
app.post('/api/enrollments', (req, res) => {
    const { mshs, student_name, class_name } = req.body;

    // Kiểm tra xem bé này đã học lớp này chưa (chống trùng lặp)
    const checkSql = "SELECT * FROM class_enrollments WHERE mshs = ? AND class_name = ?";
    db.query(checkSql, [mshs, class_name], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi cơ sở dữ liệu" });

        if (results.length > 0) {
            return res.status(400).json({ error: "Học sinh này đã được xếp vào lớp này rồi!" });
        }

        // Nếu chưa có thì Insert vào bảng
        const insertSql = "INSERT INTO class_enrollments (mshs, student_name, class_name) VALUES (?, ?, ?)";
        db.query(insertSql, [mshs, student_name, class_name], (err, result) => {
            if (err) return res.status(500).json({ error: "Lỗi xếp lớp" });
            res.status(200).json({ message: "Xếp lớp thành công!" });
        });
    });
});







// ==========================================
// 4. LẤY DANH SÁCH ĐÃ XẾP LỚP LÊN BẢNG
// ==========================================
app.get('/api/enrollments', (req, res) => {
    // Sắp xếp ID giảm dần để đứa nào vừa xếp xong sẽ nằm trên cùng
    const sql = "SELECT * FROM class_enrollments ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi tải danh sách xếp lớp" });
        res.status(200).json(results);
    });
});

// ==========================================
// 5. XÓA 1 HỌC SINH KHỎI LỚP (Nút Thùng rác)
// ==========================================
app.delete('/api/enrollments/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM class_enrollments WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi xóa dữ liệu" });
        res.status(200).json({ message: "Đã xóa học sinh khỏi lớp!" });
    });
});


// ==========================================
// 6. CẬP NHẬT/ĐỔI LỚP CHO HỌC SINH (Nút Sửa)
// ==========================================
app.put('/api/enrollments/:id', (req, res) => {
    const { id } = req.params;
    const { new_class_name, mshs } = req.body;

    // 1. Kiểm tra xem bé này đã học lớp mới này chưa
    const checkSql = "SELECT * FROM class_enrollments WHERE mshs = ? AND class_name = ? AND id != ?";
    db.query(checkSql, [mshs, new_class_name, id], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi kiểm tra dữ liệu!" });

        if (results.length > 0) {
            return res.status(400).json({ error: "Học sinh này ĐÃ CÓ trong lớp này rồi!" });
        }

        // 2. Nếu chưa có thì tiến hành đổi tên lớp
        const updateSql = "UPDATE class_enrollments SET class_name = ? WHERE id = ?";
        db.query(updateSql, [new_class_name, id], (err, result) => {
            if (err) return res.status(500).json({ error: "Lỗi khi đổi lớp!" });
            res.status(200).json({ message: "Đổi lớp thành công!" });
        });
    });
});






// ==========================================
// API: LẤY DANH SÁCH LỊCH DẠY
// (Dùng chung cho cả Admin xem toàn bộ, và Giáo viên xem cá nhân)
// ==========================================
app.get('/api/teacher-schedules', (req, res) => {
    // Lấy mã mshs từ trên URL frontend gửi xuống (VD: ?mshs=GV001)
    const mshs = req.query.mshs;

    let sql = "SELECT * FROM teacher_schedules";
    let params = [];

    // Nếu API nhận được mshs -> Nó hiểu là Giáo Viên đang xem -> Chỉ lấy lịch của người đó
    if (mshs && mshs !== 'undefined') {
        sql += " WHERE mshs = ?";
        params.push(mshs);
    }

    // Sắp xếp lịch theo ngày cho đẹp
    sql += " ORDER BY work_date ASC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Lỗi lấy lịch:", err);
            return res.status(500).json({ error: "Lỗi lấy dữ liệu lịch dạy" });
        }
        res.json(results);
    });
});



// ==========================================
// API: GIÁO VIÊN BÁO CÁO TRẠNG THÁI CA DẠY (CHỈ 1 LẦN)
// ==========================================
app.put('/api/teacher-schedules/:id/status', (req, res) => {
    const scheduleId = req.params.id;
    const { status, reason } = req.body;

    // Chỉ cho phép cập nhật nếu trạng thái hiện tại đang là Sắp tới/Trống
    // (Bảo vệ thêm 1 lớp từ Backend để chống hack)
    const sql = "UPDATE teacher_schedules SET status = ?, reason = ? WHERE id = ? AND (status IS NULL OR status = 'upcoming' OR status = 'Sắp tới')";

    db.query(sql, [status, reason || null, scheduleId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: "error", message: "Lỗi Database" });
        }

        // Nếu không có dòng nào bị ảnh hưởng -> Có thể ca này đã được báo cáo rồi
        if (result.affectedRows === 0) {
            return res.status(400).json({ status: "error", message: "Ca dạy này đã được cập nhật từ trước, không thể sửa lại!" });
        }

        res.json({ status: "success", message: "Cập nhật thành công!" });
    });
});





// ==========================================
// API LẤY DANH SÁCH LỚP (BẢN CHUẨN: LỌC THEO MÃ GIÁO VIÊN)
// ==========================================
app.get('/api/teacher-classes/:magv', (req, res) => {
    const magv = req.params.magv; // Nhận mã GV (ví dụ: GV001) từ Frontend

    // Tìm trực tiếp trong cột mshs (cột đang chứa mã GV001, GV005 của bạn)
    const sql = 'SELECT DISTINCT class_name FROM teacher_schedules WHERE mshs = ? AND class_name IS NOT NULL';

    db.query(sql, [magv], (err, results) => {
        if (err) {
            console.error("Lỗi lấy danh sách lớp:", err);
            return res.status(500).json({ error: "Lỗi Database" });
        }
        res.json(results);
    });
});



// ==========================================
// API: GIÁO VIÊN LƯU ĐIỂM DANH (CHỈ ĐƯỢC LƯU 1 LẦN)
// ==========================================
app.post('/api/attendance', (req, res) => {
    const { schedule_id, attendance_data } = req.body;

    if (!schedule_id || !attendance_data || attendance_data.length === 0) {
        return res.status(400).json({ status: "error", message: "Dữ liệu không hợp lệ!" });
    }

    // 1. Kiểm tra xem ca dạy này đã điểm danh chưa
    const checkSql = "SELECT id FROM student_attendance WHERE schedule_id = ?";
    db.query(checkSql, [schedule_id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi kiểm tra dữ liệu" });

        // NẾU ĐÃ CÓ DỮ LIỆU -> CHẶN LẠI NGAY
        if (results.length > 0) {
            return res.status(403).json({
                status: "error",
                message: "Ca dạy này ĐÃ ĐƯỢC ĐIỂM DANH! Vui lòng liên hệ Admin nếu muốn sửa đổi."
            });
        }

        // 2. Nếu chưa, tiến hành lưu toàn bộ học sinh
        // Chuẩn bị mảng dữ liệu để Insert nhiều dòng cùng lúc (Bulk Insert)
        const values = attendance_data.map(student => [
            schedule_id,
            student.mshs,
            student.student_name,
            student.status,
            student.note || ''
        ]);

        const insertSql = "INSERT INTO student_attendance (schedule_id, mshs, student_name, status, note) VALUES ?";

        db.query(insertSql, [values], (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Lỗi lưu điểm danh:", insertErr);
                return res.status(500).json({ status: "error", message: "Lỗi lưu vào Database" });
            }
            res.json({ status: "success", message: "Đã lưu danh sách điểm danh thành công!" });
        });
    });
});






// ==========================================
// API: ADMIN XEM TOÀN BỘ DANH SÁCH ĐIỂM DANH
// ==========================================
app.get('/api/admin-attendance', (req, res) => {
    // Kết hợp 2 bảng để lấy đầy đủ: Tên lớp, tên Giáo viên và thông tin điểm danh
    const sql = `
        SELECT 
            sa.mshs, sa.student_name, sa.status, sa.note, sa.created_at,
            ts.class_name, ts.teacher_name
        FROM student_attendance sa
        LEFT JOIN teacher_schedules ts ON sa.schedule_id = ts.id
        ORDER BY sa.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Lỗi lấy dữ liệu điểm danh Admin:", err);
            return res.status(500).json({ status: "error", message: "Lỗi Database" });
        }
        res.json(results);
    });
});



// ==========================================
// 1. API: LẤY DANH SÁCH GIÁO VIÊN ĐỂ ĐỔ VÀO BỘ LỌC
// ==========================================
app.get('/api/filter-teachers', (req, res) => {
    // Quét trong lịch dạy để lấy ra tên các giáo viên (không lấy trùng lặp)
    const sql = "SELECT DISTINCT teacher_name FROM teacher_schedules WHERE teacher_name IS NOT NULL AND teacher_name != ''";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Database" });
        res.json(results);
    });
});

// ==========================================
// 2. API: ADMIN XEM ĐIỂM DANH (CÓ TÍCH HỢP BỘ LỌC)
// ==========================================
app.get('/api/admin-attendance', (req, res) => {
    const teacherFilter = req.query.teacher;

    // THÊM DÒNG NÀY VÀO ĐỂ DEBUG:
    console.log("=> Yêu cầu tải danh sách. Đang lọc theo cô:", teacherFilter || "TẤT CẢ");

    let sql = `
        SELECT 
            sa.mshs, sa.student_name, sa.status, sa.note, sa.created_at,
            ts.class_name, ts.teacher_name
        FROM student_attendance sa
        LEFT JOIN teacher_schedules ts ON sa.schedule_id = ts.id
    `;
    let params = [];

    // Nếu có chọn giáo viên thì thêm điều kiện LỌC
    if (teacherFilter) {
        sql += ` WHERE ts.teacher_name = ? `;
        params.push(teacherFilter);
    }

    sql += ` ORDER BY sa.created_at DESC`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: "Lỗi Database" });
        res.json(results);
    });
});







// ==========================================
// API: ADMIN RESET DỮ LIỆU ĐIỂM DANH (XÓA 1 HOẶC XÓA TẤT CẢ)
// ==========================================
app.delete('/api/admin-attendance', (req, res) => {
    const teacherFilter = req.query.teacher;

    if (!teacherFilter) {
        return res.status(400).json({ status: "error", message: "Thiếu dữ liệu yêu cầu xóa" });
    }

    let sql = '';
    let params = [];

    // Nếu Frontend gửi cờ hiệu 'ALL' -> Xóa sạch trơn bảng điểm danh
    if (teacherFilter === 'ALL') {
        sql = `DELETE FROM student_attendance`;
    }
    // Nếu gửi tên Giáo viên cụ thể -> JOIN bảng để tìm và xóa
    else {
        sql = `
            DELETE sa FROM student_attendance sa
            JOIN teacher_schedules ts ON sa.schedule_id = ts.id
            WHERE ts.teacher_name = ?
        `;
        params = [teacherFilter];
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Lỗi Reset dữ liệu điểm danh:", err);
            return res.status(500).json({ status: "error", message: "Lỗi Database khi xóa dữ liệu" });
        }

        res.json({ status: "success", message: "Đã xóa thành công", affectedRows: results.affectedRows });
    });
});




// ==========================================
// TÍNH NĂNG NHẬP ĐIỂM CUỐI KỲ (GIÁO VIÊN)
// ==========================================

// 1. Lấy danh sách lớp học của Giáo viên
app.get('/api/teacher-classes/:username', (req, res) => {
    const username = req.params.username; // Nhận 'danchau123' từ Frontend

    // SQL thông minh: Tự động bắc cầu từ bảng users sang bảng teacher_schedules
    // Lưu ý: Đổi chữ 'users' và 'full_name' thành đúng tên bảng và cột tài khoản của bạn
    const sql = `
        SELECT DISTINCT ts.class_name 
        FROM teacher_schedules ts
        JOIN users u ON ts.teacher_name = u.full_name 
        WHERE u.username = ? AND ts.class_name IS NOT NULL
    `;

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Lỗi lấy danh sách lớp:", err);
            return res.status(500).json({ error: "Lỗi Database" });
        }
        res.json(results);
    });
});

// 2. Lấy danh sách Học sinh theo Lớp (Đã sửa tên bảng chuẩn)
app.get('/api/students-by-class', (req, res) => {
    const className = req.query.className;

    // Đã thay 'students' thành bảng thật của bạn là 'class_enrollments'
    const sql = 'SELECT mshs, student_name FROM class_enrollments WHERE class_name = ?';

    db.query(sql, [className], (err, results) => {
        if (err) {
            console.error("Lỗi lấy danh sách HS:", err);
            return res.status(500).json({ error: "Lỗi Database" });
        }
        res.json(results);
    });
});
// ==========================================
// 3. API Hứng dữ liệu điểm nộp về (BẢN CÓ TÍNH NĂNG CHỐT SỔ)
// ==========================================
app.post('/api/scores/submit-to-admin', (req, res) => {
    const { className, magv, scores } = req.body;

    if (!scores || scores.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Không có dữ liệu điểm' });
    }

    // BƯỚC 1: Lấy Tên thật chuẩn 100% của Giáo viên từ bảng teacher_schedules
    const findTeacherSql = 'SELECT teacher_name FROM teacher_schedules WHERE mshs = ? LIMIT 1';

    db.query(findTeacherSql, [magv], (err, teacherResult) => {
        if (err || teacherResult.length === 0) {
            return res.status(500).json({ status: 'error', message: 'Không xác định được danh tính Giáo viên!' });
        }
        const realTeacherName = teacherResult[0].teacher_name;

        // BƯỚC 2: KIỂM TRA TRẠNG THÁI "CHỐT SỔ" CỦA LỚP NÀY
        const checkStatusSql = "SELECT status FROM student_scores WHERE class_name = ? LIMIT 1";

        db.query(checkStatusSql, [className], (err, statusResult) => {
            if (err) return res.status(500).json({ status: 'error', message: 'Lỗi kiểm tra trạng thái duyệt' });

            // NẾU ĐÃ DUYỆT -> KÉO CẦU DAO, CHẶN ĐỨNG LỆNH NỘP LẠI
            if (statusResult.length > 0 && statusResult[0].status === 'Đã duyệt') {
                return res.status(403).json({
                    status: 'locked',
                    message: 'Admin đã chốt sổ, không thể nộp lại. Nếu cần sửa điểm vui lòng liên hệ Admin!'
                });
            }

            // BƯỚC 3: Nếu vẫn ở trạng thái "Chờ duyệt" hoặc chưa có điểm -> Cho phép ghi đè
            const mshsList = scores.map(s => s.mshs);
            const deleteSql = 'DELETE FROM student_scores WHERE class_name = ? AND mshs IN (?)';

            db.query(deleteSql, [className, mshsList], (err) => {
                if (err) return res.status(500).json({ status: 'error', message: 'Lỗi DB khi dọn dẹp điểm cũ' });

                // BƯỚC 4: Lưu điểm mới
                const insertSql = 'INSERT INTO student_scores (mshs, student_name, class_name, teacher_name, score, note) VALUES ?';
                const values = scores.map(s => [
                    s.mshs, s.studentName, className, realTeacherName, parseFloat(s.score), s.note || ''
                ]);

                db.query(insertSql, [values], (err, results) => {
                    if (err) return res.status(500).json({ status: 'error', message: 'Lỗi DB khi lưu điểm mới' });
                    res.json({ status: 'success', message: 'Đã nộp điểm thành công' });
                });
            });
        });
    });
});

// ==========================================
// API: ADMIN LẤY BẢNG ĐIỂM (LỌC THEO GIÁO VIÊN)
// ==========================================
app.get('/api/admin-scores', (req, res) => {
    const teacher = req.query.teacher;
    let sql = 'SELECT * FROM student_scores ORDER BY created_at DESC';
    let params = [];

    // Nếu Admin có chọn tên Giáo viên
    if (teacher && teacher !== '') {
        sql = 'SELECT * FROM student_scores WHERE teacher_name = ? ORDER BY created_at DESC';
        params = [teacher];
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Lỗi lấy bảng điểm Admin:", err);
            return res.status(500).json({ status: "error", message: "Lỗi Database" });
        }
        res.json(results);
    });
});









// ==========================================
// API: ADMIN DUYỆT ĐIỂM HÀNG LOẠT (THEO GIÁO VIÊN HOẶC TẤT CẢ)
// ==========================================
app.post('/api/scores/approve-batch', (req, res) => {
    const { teacher } = req.body;

    let sql = "UPDATE student_scores SET status = 'Đã duyệt'";
    let params = [];

    // Nếu có chọn giáo viên cụ thể thì chỉ update cho giáo viên đó
    if (teacher && teacher !== '') {
        sql += " WHERE teacher_name = ?";
        params = [teacher];
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Lỗi duyệt điểm hàng loạt:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi Database' });
        }
        res.json({
            status: 'success',
            message: `Đã duyệt thành công ${results.affectedRows} bản ghi điểm số!`,
            affectedRows: results.affectedRows
        });
    });
});



// ==========================================
// API: ADMIN XÓA ĐIỂM HÀNG LOẠT (BẮT BUỘC CÓ TÊN GIÁO VIÊN)
// ==========================================
app.delete('/api/scores/delete-batch', (req, res) => {
    const { teacher } = req.body;

    // Chốt chặn bảo mật Backend: Không có tên giáo viên -> Từ chối xóa
    if (!teacher || teacher.trim() === '') {
        return res.status(400).json({
            status: 'error',
            message: 'Thiếu tên giáo viên. Hệ thống từ chối lệnh xóa toàn bộ.'
        });
    }

    // Chạy lệnh xóa dữ liệu của giáo viên đó
    const sql = "DELETE FROM student_scores WHERE teacher_name = ?";

    db.query(sql, [teacher], (err, results) => {
        if (err) {
            console.error("Lỗi xóa điểm hàng loạt:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi Database' });
        }

        res.json({
            status: 'success',
            message: 'Xóa thành công',
            deletedRows: results.affectedRows // Trả về số lượng dòng đã bị xóa
        });
    });
});







// ==========================================
// API: ĐỒNG BỘ LỊCH DẠY VÀ HỌC SINH CHO BẢNG ĐIỂM
// ==========================================

// 1. API: Lấy Lịch Dạy để làm Dropdown (BẢN CHỐNG LỖI TÊN CỘT)
app.get('/api/teacher-schedule-list/:teacher', (req, res) => {
    const teacher = req.params.teacher;

    // Dùng SELECT * để hốt trọn ổ, không sợ sai tên cột trong Database
    const sql = 'SELECT * FROM teacher_schedules WHERE teacher_name = ? ORDER BY id DESC';

    db.query(sql, [teacher], (err, results) => {
        if (err) {
            console.error("Lỗi DB khi lấy lịch dạy:", err);
            return res.status(500).json({ error: "Lỗi DB" });
        }
        res.json(results);
    });
});
// 2. API: Lấy Học Sinh theo Lớp (Đồng bộ từ tính năng Xếp Lớp)
app.get('/api/students-by-class', (req, res) => {
    const className = req.query.className;

    // 🚨 QUAN TRỌNG: Thay chữ "ten_bang_xep_lop_cua_ban" bằng tên bảng DB thực tế của ông bạn!
    // Ví dụ: student_classes, enrollments, hocsinh_lop...
    const sql = 'SELECT mshs, student_name FROM ten_bang_xep_lop_cua_ban WHERE class_name = ?';

    db.query(sql, [className], (err, results) => {
        if (err) {
            console.error("Lỗi lấy danh sách HS:", err);
            return res.status(500).json({ error: "Lỗi DB" });
        }
        res.json(results); // Sẽ trả về đúng HS003 và HS004 cho lớp Anh văn
    });
});






// ==========================================
// API: TRÍCH XUẤT THỜI KHÓA BIỂU CHO HỌC SINH
// ==========================================
app.get('/api/student-schedule/:mshs', (req, res) => {
    const mshs = req.params.mshs;

    // Đã đổi ts.date thành ts.work_date và ts.time thành ts.time_range
    const sql = `
        SELECT ts.work_date AS date, ts.time_range AS time, ts.class_name, ts.room, ts.teacher_name 
        FROM teacher_schedules ts
        JOIN class_enrollments sc ON ts.class_name = sc.class_name
        WHERE sc.mshs = ?
        ORDER BY ts.work_date ASC, ts.time_range ASC
    `;

    db.query(sql, [mshs], (err, results) => {
        if (err) {
            console.error("Lỗi lấy lịch học sinh:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi Database' });
        }
        res.json(results);
    });
});







// ==========================================
// API HỌC SINH: LẤY KẾT QUẢ HỌC TẬP (CHỈ LẤY ĐIỂM ĐÃ DUYỆT)
// ==========================================
app.get('/api/student-scores/:mshs', (req, res) => {
    const mshs = req.params.mshs;

    // Tìm điểm theo MSHS và chặn đứng những điểm 'Chờ duyệt'
    const sql = `
        SELECT class_name, teacher_name, score, note, created_at 
        FROM student_scores 
        WHERE mshs = ? AND status = 'Đã duyệt' 
        ORDER BY created_at DESC
    `;

    db.query(sql, [mshs], (err, results) => {
        if (err) {
            console.error("Lỗi lấy điểm học sinh:", err);
            return res.status(500).json({ error: "Lỗi cơ sở dữ liệu" });
        }
        res.json(results);
    });
});








// ==========================================
// API LÀM ĐƠN: LẤY DANH SÁCH GIÁO VIÊN
// ==========================================
app.get('/api/get-teachers-list', (req, res) => {
    // Quét các giáo viên đang có lịch dạy để thả vào danh sách chọn
    db.query("SELECT DISTINCT teacher_name FROM teacher_schedules", (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi DB' });
        res.json(results);
    });
});

// ==========================================
// API LÀM ĐƠN: NHẬN ĐƠN TỪ HỌC SINH
// ==========================================
app.post('/api/submit-request', (req, res) => {
    const { mshs, student_name, class_name, request_type, teacher_name, content } = req.body;

    const sql = `INSERT INTO student_requests (mshs, student_name, class_name, request_type, teacher_name, content, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;

    db.query(sql, [mshs, student_name, class_name, request_type, teacher_name, content], (err, result) => {
        if (err) {
            console.error("Lỗi nộp đơn:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ khi nộp đơn' });
        }
        res.json({ status: 'success', message: 'Gửi đơn thành công!' });
    });
});







// ==========================================
// API ADMIN: LẤY TOÀN BỘ DANH SÁCH ĐƠN TỪ HỌC SINH
// ==========================================
app.get('/api/admin-requests', (req, res) => {
    // Admin lấy toàn bộ đơn không phân biệt loại đơn hay giáo viên
    const sql = `SELECT * FROM student_requests ORDER BY created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Lỗi lấy danh sách đơn:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi cơ sở dữ liệu' });
        }
        res.json(results);
    });
});













// ==========================================
// API ADMIN: CẬP NHẬT TRẠNG THÁI & GHI CHÚ PHẢN HỒI
// ==========================================
app.post('/api/admin-requests/update-status', (req, res) => {
    const { id, status, admin_note } = req.body;
    // Lưu trạng thái kèm theo lời nhắn của admin
    const sql = `UPDATE student_requests SET status = ?, admin_note = ? WHERE id = ?`;
    db.query(sql, [status, admin_note, id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Lỗi cập nhật' });
        res.json({ status: 'success', message: 'Đã lưu phản hồi!' });
    });
});

// ==========================================
// API ADMIN: XÓA ĐƠN THEO LOẠI (BẢO VỆ CHỐNG XÓA HÀNG LOẠT)
// ==========================================
app.delete('/api/admin-requests/delete-by-type', (req, res) => {
    const { request_type } = req.body;
    if (!request_type) return res.status(400).json({ status: 'error', message: 'Chưa chọn loại đơn' });

    // Xóa vĩnh viễn khỏi DB (Học sinh cũng sẽ không còn thấy nữa)
    const sql = `DELETE FROM student_requests WHERE request_type = ?`;
    db.query(sql, [request_type], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Lỗi xóa đơn' });
        res.json({ status: 'success', deletedCount: result.affectedRows });
    });
});




// ==========================================
// API HỌC SINH: LẤY LỊCH SỬ ĐƠN TỪ
// ==========================================
app.get('/api/student-requests/:mshs', (req, res) => {
    const mshs = req.params.mshs;
    
    // Lấy toàn bộ đơn của mshs này, sắp xếp đơn mới nhất lên đầu (DESC)
    const sql = `SELECT * FROM student_requests WHERE mshs = ? ORDER BY created_at DESC`;
    
    db.query(sql, [mshs], (err, results) => {
        if (err) {
            console.error("Lỗi lấy lịch sử đơn học sinh:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi Database' });
        }
        res.json(results);
    });
});





// ==========================================
// API GIÁO VIÊN: LẤY DANH SÁCH ĐƠN XIN VẮNG (Bản chuẩn)
// ==========================================
app.get('/api/teacher-requests', (req, res) => {
    // Dùng query thay vì param để tránh lỗi tiếng Việt
    const teacherName = req.query.name; 
    
    if (!teacherName) return res.json([]);

    const sql = `
        SELECT * FROM student_requests 
        WHERE teacher_name = ? AND request_type = 'Đơn xin vắng học'
        ORDER BY created_at DESC
    `;
    
    db.query(sql, [teacherName], (err, results) => {
        if (err) {
            console.error("Lỗi Database:", err);
            return res.status(500).json({ status: 'error', message: 'Lỗi Database' });
        }
        res.json(results);
    });
});