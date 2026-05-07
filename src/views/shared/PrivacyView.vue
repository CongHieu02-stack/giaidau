<template>
  <div class="privacy-container">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Chính sách bảo mật</h1>
        <p class="page-subtitle">Cập nhật lần cuối: 05/05/2026</p>
      </div>

      <div class="content-box">
        <section class="privacy-section">
          <h2>1. Thông tin chúng tôi thu thập</h2>
          <p>Chúng tôi thu thập các thông tin sau khi bạn sử dụng dịch vụ:</p>
          <ul>
            <li><strong>Thông tin tài khoản:</strong> Họ tên, email, số điện thoại, ngày sinh</li>
            <li><strong>Thông tin câu lạc bộ:</strong> Tên CLB, logo, thành viên</li>
            <li><strong>Thông tin hoạt động:</strong> Lịch sử tham gia giải đấu, kết quả thi đấu</li>
            <li><strong>Thông tin kỹ thuật:</strong> IP, thiết bị, trình duyệt</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>2. Mục đích sử dụng thông tin</h2>
          <p>Thông tin của bạn được sử dụng cho các mục đích:</p>
          <ul>
            <li>Cung cấp và quản lý tài khoản người dùng</li>
            <li>Tổ chức và quản lý giải đấu</li>
            <li>Thông báo về lịch thi đấu, kết quả và tin tức</li>
            <li>Cải thiện chất lượng dịch vụ</li>
            <li>Phòng chống gian lận và bảo mật</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>3. Bảo vệ thông tin</h2>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ dữ liệu của bạn:
          </p>
          <ul>
            <li>Mã hóa dữ liệu truyền tải (SSL/TLS)</li>
            <li>Lưu trữ dữ liệu trên hệ thống bảo mật cao</li>
            <li>Kiểm soát truy cập nghiêm ngặt</li>
            <li>Sao lưu dữ liệu định kỳ</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>4. Chia sẻ thông tin</h2>
          <p>
            Chúng tôi <strong>không bán</strong> thông tin cá nhân cho bên thứ ba.
            Thông tin chỉ được chia sẻ trong các trường hợp:
          </p>
          <ul>
            <li>Với sự đồng ý của bạn</li>
            <li>Để tuân thủ pháp luật</li>
            <li>Với đối tác cung cấp dịch vụ (có cam kết bảo mật)</li>
            <li>Thông tin công khai trong giải đấu (tên, CLB, kết quả)</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>5. Quyền của người dùng</h2>
          <p>Bạn có quyền:</p>
          <ul>
            <li>Truy cập và xem thông tin cá nhân</li>
            <li>Chỉnh sửa thông tin không chính xác</li>
            <li>Yêu cầu xóa tài khoản và dữ liệu</li>
            <li>Từ chối nhận thông báo marketing</li>
            <li>Khiếu nại về việc xử lý dữ liệu</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>6. Liên hệ</h2>
          <p>
            Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:
            <a href="mailto:privacy@giaidau.vn" class="contact-link">privacy@giaidau.vn</a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-container {
  min-height: 100vh;
  padding: 80px 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 12px;
}

.page-subtitle {
  color: #94a3b8;
}

.content-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px;
}

.privacy-section {
  margin-bottom: 32px;
}

.privacy-section:last-child {
  margin-bottom: 0;
}

.privacy-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.privacy-section p {
  line-height: 1.7;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.privacy-section ul {
  list-style: none;
  padding: 0;
}

.privacy-section li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 10px;
  line-height: 1.6;
  color: #cbd5e1;
}

.privacy-section li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #60a5fa;
}

.contact-link {
  color: #60a5fa;
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
}
</style>
