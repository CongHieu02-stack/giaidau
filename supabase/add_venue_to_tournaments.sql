-- Thêm cột venue_id vào bảng tournaments để liên kết với bảng venues
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

-- Cập nhật RLS nếu cần (thường đã được bao phủ bởi policy cũ nếu dùng SELECT *)
