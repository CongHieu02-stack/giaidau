# Hướng dẫn cài đặt và cấu hình MyLeague

## 1. Cài đặt Dependencies

```bash
npm install
```

## 2. Cấu hình Supabase

### Bước 1: Tạo project Supabase
1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/đăng nhập tài khoản
3. Tạo project mới
4. Copy URL và Anon Key từ Settings > API

### Bước 2: Tạo bảng trong Database

Chạy các câu lệnh SQL sau trong Supabase SQL Editor:

```sql
-- 1. Bảng profiles (mở rộng từ auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'club_leader', 'club_deputy', 'referee', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Bảng sports_categories
CREATE TABLE sports_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    rules TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Bảng clubs
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    leader_id UUID REFERENCES profiles(id),
    deputy_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'dissolved')),
    rejection_reason TEXT,
    suspension_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Bảng club_members
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'deputy')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- 5. Bảng tournaments
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sport_category_id UUID REFERENCES sports_categories(id),
    rules TEXT,
    max_teams INTEGER NOT NULL,
    registration_deadline TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    match_days INTEGER[] DEFAULT '{6,7}',
    match_times TIME[] DEFAULT '{"17:00", "19:00"}',
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    champion_club_id UUID REFERENCES clubs(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Bảng tournament_registrations
CREATE TABLE tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, club_id)
);

-- 7. Bảng venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Bảng matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    home_club_id UUID REFERENCES clubs(id),
    away_club_id UUID REFERENCES clubs(id),
    venue_id UUID REFERENCES venues(id),
    referee_id UUID REFERENCES profiles(id),
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled')),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Bảng match_events
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id),
    club_id UUID REFERENCES clubs(id),
    event_type VARCHAR(50) CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out', 'start', 'pause', 'resume', 'end')),
    minute INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Bảng notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('tournament', 'club', 'match', 'system')),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies cho profiles
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies cho clubs
CREATE POLICY "Clubs viewable by everyone" ON clubs FOR SELECT USING (true);
CREATE POLICY "Leaders can update own clubs" ON clubs FOR UPDATE USING (leader_id = auth.uid());

-- Policies cho tournaments
CREATE POLICY "Tournaments viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournaments" ON tournaments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Tạo function để tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user',
        'active'
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Tạo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Thêm dữ liệu mẫu cho sports_categories
INSERT INTO sports_categories (name, icon_url, description) VALUES
('Bóng đá', '⚽', 'Môn thể thao vua với 11 người mỗi đội'),
('Bóng rổ', '🏀', 'Thi đấu bóng rổ 5x5 hoặc 3x3'),
('Cầu lông', '🏸', 'Thi đấu đơn hoặc đôi nam/nữ'),
('Pickleball', '🎾', 'Môn thể thao mới kết hợp tennis và cầu lông'),
('Tennis', '🎾', 'Thi đấu quần vợt'),
('Bóng chuyền', '🏐', 'Thi đấu bóng chuyền sân trong hoặc bãi biển');
```

### Bước 3: Cấu hình file .env

```bash
cp .env.example .env
```

Sửa file `.env` với thông tin Supabase của bạn:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Chạy ứng dụng

### Development
```bash
npm run dev
```

### Build production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 4. Cấu trúc thư mục

```
src/
├── components/          # Vue components
│   ├── common/           # Shared components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── composables/          # Vue composables
├── config/               # Configuration files
├── domain/               # Domain entities (SRP)
├── repositories/         # Repository pattern (SRP)
├── router/               # Vue Router config
├── services/             # Business logic (SRP)
├── stores/               # Pinia stores
├── types/                # TypeScript definitions
├── utils/                # Utility functions
└── views/                # Page components
    ├── admin/            # Admin views
    ├── auth/             # Authentication views
    ├── club/             # Club leader views
    ├── referee/          # Referee views
    ├── shared/           # Public views
    └── user/             # User views
```

## 5. Design Patterns đã áp dụng

### SRP (Single Responsibility Principle)
- Mỗi class/service/component chỉ có một lý do để thay đổi
- Domain entities chứa business logic
- Services xử lý business operations
- Repositories xử lý data access

### Repository Pattern
- Abstract data access layer
- Easy to test and mock
- Can switch database without changing business logic

### Service Pattern
- Encapsulate business logic
- Coordinate between multiple repositories
- Handle transactions

### Factory Pattern
- Create complex objects consistently
- Used for Tournament, Match creation

### Observer Pattern
- Domain events for notifications
- Decoupled event handling

### Strategy Pattern
- Pluggable scheduling algorithms
- Different tournament formats

## 6. Tài khoản mặc định

Sau khi cài đặt, tạo tài khoản Super Admin đầu tiên:

1. Đăng ký tài khoản qua UI
2. Truy cập Supabase Dashboard
3. Vào Table Editor > profiles
4. Tìm user vừa tạo, sửa role thành `super_admin`

## 7. Lưu ý khi deploy

1. **Environment Variables**: Đảm bảo tất cả biến môi trường được thiết lập
2. **Database**: Chạy migrations trước khi deploy
3. **RLS Policies**: Kiểm tra policies hoạt động đúng
4. **Email Templates**: Cấu hình email templates trong Supabase Auth

## 8. Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra Console Browser
2. Kiểmtra Supabase Logs
3. Kiểm tra Network tab trong DevTools
