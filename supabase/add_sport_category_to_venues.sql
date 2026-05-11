-- Thêm cột sport_category_id vào bảng venues
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS sport_category_id UUID REFERENCES sports_categories(id);
