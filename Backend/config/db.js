const mysql = require('mysql2');

// Kết nối XAMPP (Localhost mặc định user là root, không có password)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // XAMPP mặc định không có mật khẩu
    database: 'TriThucCenter'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Lỗi kết nối Cơ sở dữ liệu MySQL:', err.message);
        return;
    }
    console.log('✅ Đã kết nối thành công với Cơ sở dữ liệu MySQL trên XAMPP!');
});

module.exports = db;