<template>
  <div class="terms-container">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Điều khoản sử dụng</h1>
        <p class="page-subtitle">Cập nhật lần cuối: 05/05/2026</p>
      </div>

      <div class="content-box">
        <section class="terms-section">
          <h2>1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc truy cập và sử dụng nền tảng, bạn đồng ý tuân thủ các điều khoản và điều kiện này.
            Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
          </p>
        </section>

        <section class="terms-section">
          <h2>2. Tài khoản người dùng</h2>
          <ul>
            <li>Bạn phải cung cấp thông tin chính xác và đầy đủ khi đăng ký</li>
            <li>Bạn chịu trách nhiệm bảo mật mật khẩu và tài khoản của mình</li>
            <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép</li>
            <li>Mỗi người chỉ được phép sở hữu một tài khoản</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>3. Quy tắc ứng xử</h2>
          <p>Người dùng cam kết không:</p>
          <ul>
            <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
            <li>Quấy rối, đe dọa hoặc xúc phạm người khác</li>
            <li>Giả mạo danh tính hoặc tổ chức</li>
            <li>Phát tán thông tin sai lệch về giải đấu</li>
            <li>Gian lận trong đăng ký hoặc thi đấu</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>4. Nội dung người dùng</h2>
          <p>
            Bạn giữ quyền sở hữu nội dung bạn tạo ra (thông tin CLB, kết quả...).
            Bằng việc đăng tải, bạn cấp quyền cho chúng tôi sử dụng nội dung để vận hành dịch vụ.
          </p>
        </section>

        <section class="terms-section">
          <h2>5. Giới hạn trách nhiệm</h2>
          <p>
            Chúng tôi không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả
            phát sinh từ việc sử dụng dịch vụ. Chúng tôi cam kết nỗ lực tối đa để đảm bảo dịch vụ
            hoạt động ổn định nhưng không đảm bảo 100% uptime.
          </p>
        </section>

        <section class="terms-section">
          <h2>6. Chấm dứt dịch vụ</h2>
          <p>
            Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản nếu phát hiện vi phạm điều khoản
            mà không cần thông báo trước. Bạn có thể xóa tài khoản bất cứ lúc nào.
          </p>
        </section>

        <section class="terms-section">
          <h2>7. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có thể cập nhật điều khoản bất cứ lúc nào. Thay đổi có hiệu lực ngay khi đăng tải.
            Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận điều khoản mới.
          </p>
        </section>

        <section class="terms-section">
          <h2>8. Liên hệ</h2>
          <p>
            Mọi thắc mắc về điều khoản, vui lòng liên hệ:
            <a href="mailto:legal@giaidau.vn" class="contact-link">legal@giaidau.vn</a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terms-container {
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

.terms-section {
  margin-bottom: 32px;
}

.terms-section:last-child {
  margin-bottom: 0;
}

.terms-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.terms-section p {
  line-height: 1.7;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.terms-section ul {
  list-style: none;
  padding: 0;
}

.terms-section li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 10px;
  line-height: 1.6;
  color: #cbd5e1;
}

.terms-section li::before {
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
