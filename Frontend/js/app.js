// ==========================================
// CẤU HÌNH MÁY CHỦ (CHỐNG SẬP KHI LÊN HOSTING)
// ==========================================
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const API_BASE_URL = isLocal ? 'http://localhost:5000' : 'https://api.trithuccenter.com';






document.addEventListener("DOMContentLoaded", function() {
    
    const modal = document.getElementById('registerModal');
    const closeBtn = document.querySelector('.close-btn');
    const courseInput = document.getElementById('course');
    const registerForm = document.getElementById('registerForm');
    const registerButtons = document.querySelectorAll('.btn-register:not(.disabled)');

    // 1. Khi bấm vào nút "Đăng ký ngay"
    registerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseCard = this.parentElement;
            const courseName = courseCard.querySelector('h3').innerText;
            
            courseInput.value = courseName;
            modal.style.display = 'flex'; // Hiện Popup lên
        });
    });

    // 2. Khi bấm vào nút X để tắt
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // 3. Khi bấm ra ngoài rìa đen của popup cũng tắt luôn
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 4. Khi khách hàng bấm "Gửi Thông Tin"

registerForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // Chặn tải lại trang
    
    // Lấy dữ liệu người dùng nhập
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const course = document.getElementById('course').value;
    const grade = document.getElementById('grade').value; // Lấy thêm Khối Lớp

    // ... (Đoạn code đổi chữ Đang xử lý)
    // Khai báo nút và đổi chữ thành Đang xử lý trước khi gửi
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerText = "Đang xử lý...";
    submitBtn.disabled = true;
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Nhét ĐỦ 4 BIẾN vào đây để gửi đi
            body: JSON.stringify({ fullname, phone, grade, course_name: course }) 
        });
            
            const data = await response.json();

            if (response.ok) {
                // Đóng bảng đăng ký & Xóa dữ liệu cũ
                modal.style.display = 'none'; 
                registerForm.reset();
                

                // Đổ chữ vào bảng Premium và bật nó lên
                document.getElementById('successMessage').innerText = `Cảm ơn ${fullname}. Trung tâm sẽ gọi số ${phone} sớm nhất!`;
                document.getElementById('customSuccessModal').style.display = 'flex';
            } else {
                alert(`❌ Lỗi: ${data.error}`);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối đến máy chủ!');
        } finally {
            submitBtn.innerText = "Gửi Thông Tin";
            submitBtn.disabled = false;
        }
    });

    // 5. Nút tắt bảng thông báo Premium (Dán sát ngay trên dấu ngoặc } cuối cùng của file)
    document.getElementById('closeSuccessBtn').addEventListener('click', function() {
        document.getElementById('customSuccessModal').style.display = 'none';
    });
});
document.addEventListener("DOMContentLoaded", function() {
    // 1. Gom tất cả ảnh và dấu chấm vào danh sách
    const slides = document.querySelectorAll(".notice-board-container .notice-image");
    const dots = document.querySelectorAll(".slider-dots .dot");
    let currentIndex = 0;
    let slideInterval;

    // 2. Hàm xử lý chuyển đổi ảnh và dấu chấm
    function showSlide(index) {
        // Tắt ảnh và chấm hiện tại
        slides[currentIndex].classList.remove("active");
        if (dots.length > 0) {
            dots[currentIndex].classList.remove("active");
        }
        
        // Cập nhật vị trí mới
        currentIndex = index;
        
        // Bật ảnh và chấm mới lên
        slides[currentIndex].classList.add("active");
        if (dots.length > 0) {
            dots[currentIndex].classList.add("active");
        }
    }

    // 3. Hàm tự động nhảy sang ảnh tiếp theo
    function nextSlide() {
        let nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }

    // 4. Khởi động bộ đếm và gắn sự kiện click
    if (slides.length > 1) {
        // Chạy tự động mỗi 8000 mili-giây (8 giây)
        slideInterval = setInterval(nextSlide, 8000);

        // Bắt sự kiện khi người dùng bấm chuột vào từng dấu chấm
        if (dots.length > 0) {
            dots.forEach(function(dot, index) {
                dot.addEventListener("click", function() {
                    // Xóa bộ đếm cũ để không bị lộn xộn nhịp thời gian
                    clearInterval(slideInterval);
                    
                    // Chuyển ngay lập tức đến ảnh vừa bấm
                    showSlide(index);
                    
                    // Bật lại bộ đếm 8 giây
                    slideInterval = setInterval(nextSlide, 5000);
                });
            });
        }
    }
});








// Tính năng: Bật/Tắt Menu 3 gạch trên điện thoại
const menuToggle = document.getElementById('mobile-menu');
const menu = document.querySelector('.menu');

if (menuToggle && menu) {
    menuToggle.addEventListener('click', function() {
        // Lệnh toggle: Nếu chưa có thì thêm, có rồi thì xóa class 'active'
        menu.classList.toggle('active'); 
    });
}