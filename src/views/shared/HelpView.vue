<template>
  <div class="help-container">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Trung tâm trợ giúp</h1>
        <p class="page-subtitle">Hướng dẫn sử dụng và giải đáp thắc mắc</p>
      </div>

      <section class="help-section">
        <h2>Câu hỏi thường gặp</h2>
        
        <div class="faq-list">
          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(0)">
              <span>Làm thế nào để tạo giải đấu mới?</span>
              <i class="pi" :class="openFaq === 0 ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div v-show="openFaq === 0" class="faq-answer">
              <p>
                Để tạo giải đấu mới, bạn cần có quyền Admin. Truy cập vào mục "Quản lý giải" 
                và chọn "Tạo giải đấu". Điền đầy đủ thông tin về tên giải, bộ môn, số đội tham gia,
                thời gian đăng ký và thi đấu, sau đó nhấn "Xác nhận tạo giải".
              </p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(1)">
              <span>Làm sao để đăng ký tham gia giải đấu?</span>
              <i class="pi" :class="openFaq === 1 ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div v-show="openFaq === 1" class="faq-answer">
              <p>
                Vào trang chi tiết giải đấu đang mở đăng ký, chọn "Đăng ký tham gia".
                Hệ thống sẽ gửi yêu cầu đến ban tổ chức. Sau khi được phê duyệt, câu lạc bộ của bạn
                sẽ chính thức tham gia giải đấu.
              </p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(2)">
              <span>Tôi quên mật khẩu, phải làm sao?</span>
              <i class="pi" :class="openFaq === 2 ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div v-show="openFaq === 2" class="faq-answer">
              <p>
                Tại trang đăng nhập, chọn "Quên mật khẩu". Nhập email đã đăng ký,
                hệ thống sẽ gửi link đặt lại mật khẩu vào email của bạn.
              </p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(3)">
              <span>Làm thế nào để cập nhật kết quả trận đấu?</span>
              <i class="pi" :class="openFaq === 3 ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div v-show="openFaq === 3" class="faq-answer">
              <p>
                Trọng tài hoặc Admin giải đấu có thể cập nhật kết quả. Vào mục "Quản lý trận đấu",
                chọn trận cần cập nhật, nhập tỷ số và trạng thái trận đấu, sau đó lưu lại.
              </p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(4)">
              <span>Có thể chỉnh sửa thông tin giải đấu sau khi tạo không?</span>
              <i class="pi" :class="openFaq === 4 ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div v-show="openFaq === 4" class="faq-answer">
              <p>
                Có thể chỉnh sửa một số thông tin như lịch thi đấu, thể lệ, số lượng đội tham gia.
                Tuy nhiên, tên giải và bộ môn không thể thay đổi sau khi tạo. Giải đã kết thúc hoặc
                đã hủy không thể chỉnh sửa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2>Liên hệ hỗ trợ</h2>
        <p>
          Nếu cần thêm trợ giúp, vui lòng gửi email đến
          <a href="mailto:support@giaidau.vn" class="contact-link">support@giaidau.vn</a>
          hoặc gọi hotline: <strong>1900-xxxx</strong> (8h-18h, thứ 2-thứ 6).
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const openFaq = ref(null);

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}
</script>

<style scoped>
.help-container {
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
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 16px;
}

.page-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
}

.help-section {
  margin-bottom: 48px;
}

.help-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 24px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.faq-question:hover {
  background: rgba(255, 255, 255, 0.03);
}

.faq-question i {
  color: #60a5fa;
  font-size: 0.875rem;
}

.faq-answer {
  padding: 0 24px 20px;
  color: #cbd5e1;
  line-height: 1.7;
}

.contact-link {
  color: #60a5fa;
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
}
</style>
