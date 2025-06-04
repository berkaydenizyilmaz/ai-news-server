-- AI News Platform Database Schema
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create cron schema if not exists
CREATE SCHEMA IF NOT EXISTS cron;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- User roles enum
CREATE TYPE user_role AS ENUM ('visitor', 'user', 'moderator', 'admin');

-- News status enum  
CREATE TYPE news_status AS ENUM ('pending', 'processing', 'published', 'rejected');

-- Forum status enum
CREATE TYPE forum_status AS ENUM ('active', 'locked', 'deleted');

-- Entity types enum
CREATE TYPE entity_type AS ENUM ('forum_post', 'forum_topic');

-- Notification types enum
CREATE TYPE notification_type AS ENUM ('comment_reply', 'forum_reply', 'forum_mention', 'news_published', 'system');

-- Log levels enum
CREATE TYPE log_level AS ENUM ('info', 'warning', 'error', 'debug');

-- Setting types enum
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- Report status enum
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Statistic periods enum
CREATE TYPE statistic_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

-- Statistic categories enum
CREATE TYPE statistic_category AS ENUM ('user', 'news', 'forum', 'ai');

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT, -- Cloudinary URL'i
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (admin ayarları)
CREATE TABLE settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type setting_type NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'rss', 'ai', 'general' vb.
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News categories table
CREATE TABLE news_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSS Sources table
CREATE TABLE rss_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES news_categories(id), -- RSS kaynağının kategorisi
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Original news (RSS'den çekilen ham haberler)
CREATE TABLE original_news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    original_url TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(255),
    published_date TIMESTAMP WITH TIME ZONE,
    rss_source_id UUID REFERENCES rss_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed news (AI tarafından işlenmiş haberler)
CREATE TABLE processed_news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_news_id UUID REFERENCES original_news(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(600) UNIQUE NOT NULL,
    content TEXT NOT NULL, -- AI tarafından oluşturulan içerik
    summary TEXT,
    image_url TEXT,
    category_id UUID REFERENCES news_categories(id), -- Haberin kategorisi
    status news_status DEFAULT 'pending',
    confidence_score DECIMAL(3,2), -- AI güven puanı (0.00-1.00)
    differences_analysis TEXT, -- Kaynaklar arası farklar analizi
    view_count INTEGER DEFAULT 0,
    processed_time INTEGER, -- AI işleme süresi (saniye)
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News sources (AI tarafından kullanılan ek kaynaklar)
CREATE TABLE news_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processed_news_id UUID REFERENCES processed_news(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false, -- Ana kaynak mı?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (processed_news'e yapılan yorumlar)
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processed_news_id UUID REFERENCES processed_news(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested comments
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum categories table
CREATE TABLE forum_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(300) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum topics table
CREATE TABLE forum_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES forum_categories(id),
    user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(600) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    status forum_status DEFAULT 'active',
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum posts table
CREATE TABLE forum_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News quotes in forum (processed_news alıntıları)
CREATE TABLE forum_news_quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    processed_news_id UUID REFERENCES processed_news(id),
    quoted_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum likes table
CREATE TABLE forum_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL, -- 'forum_post' veya 'forum_topic'
    entity_id UUID NOT NULL,
    is_like BOOLEAN NOT NULL, -- true: beğeni, false: beğenmeme
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (bildirimler)
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- İlgili içeriğin ID'si (comment, forum_post, news vb.)
    related_type VARCHAR(50), -- 'comment', 'forum_post', 'news', 'forum_topic'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs table (sistem logları)
CREATE TABLE logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level log_level NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(100), -- 'auth', 'news', 'rss', 'forum', 'ai' vb.
    action VARCHAR(100), -- 'login', 'create_news', 'fetch_rss', 'process_ai' vb.
    user_id UUID REFERENCES users(id), -- İşlemi yapan kullanıcı (varsa)
    ip_address INET, -- IP adresi
    user_agent TEXT, -- Browser/client bilgisi
    request_id VARCHAR(100), -- Request tracking için
    metadata JSONB, -- Ek bilgiler (JSON formatında)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (şikayetler)
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES users(id),
    reported_type VARCHAR(50) NOT NULL, -- 'news', 'comment', 'forum_post'
    reported_id UUID NOT NULL, -- ID of reported content
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform statistics table
CREATE TABLE platform_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    period statistic_period NOT NULL,
    date DATE NOT NULL,
    category statistic_category NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, date, category)
);

-- Create indexes for better performance
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_news_categories_slug ON news_categories(slug);
CREATE INDEX idx_rss_sources_category ON rss_sources(category_id);
CREATE INDEX idx_original_news_rss_source ON original_news(rss_source_id);
CREATE INDEX idx_original_news_published_date ON original_news(published_date);
CREATE INDEX idx_news_sources_processed_news ON news_sources(processed_news_id);
CREATE INDEX idx_processed_news_status ON processed_news(status);
CREATE INDEX idx_processed_news_published_at ON processed_news(published_at);
CREATE INDEX idx_processed_news_original ON processed_news(original_news_id);
CREATE INDEX idx_processed_news_category ON processed_news(category_id);
CREATE INDEX idx_processed_news_slug ON processed_news(slug);
CREATE INDEX idx_processed_news_processed_time ON processed_news(processed_time);
CREATE INDEX idx_comments_processed_news_id ON comments(processed_news_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_status ON forum_topics(status);
CREATE INDEX idx_forum_topics_user ON forum_topics(user_id);
CREATE INDEX idx_forum_topics_slug ON forum_topics(slug);
CREATE INDEX idx_forum_topics_last_reply ON forum_topics(last_reply_at DESC);
CREATE INDEX idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX idx_forum_likes_user ON forum_likes(user_id);
CREATE INDEX idx_forum_likes_entity ON forum_likes(entity_type, entity_id);
CREATE INDEX idx_forum_news_quotes_post ON forum_news_quotes(post_id);
CREATE INDEX idx_forum_news_quotes_news ON forum_news_quotes(processed_news_id);
CREATE INDEX idx_reports_type_id ON reports(reported_type, reported_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reviewer ON reports(reviewed_by);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_module ON logs(module);
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_platform_statistics_period_date ON platform_statistics(period, date DESC);
CREATE INDEX idx_platform_statistics_category_date ON platform_statistics(category, date DESC);
CREATE INDEX idx_processed_news_confidence ON processed_news(confidence_score);
CREATE INDEX idx_logs_request_id ON logs(request_id);
CREATE INDEX idx_forum_likes_composite ON forum_likes(user_id, entity_type, entity_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function for forum_likes
CREATE OR REPLACE FUNCTION update_forum_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT durumunda, önce varsa eski oyu silelim
    IF TG_OP = 'INSERT' THEN
        -- Aynı kullanıcının aynı içerik için önceki oyunu sil
        DELETE FROM forum_likes 
        WHERE user_id = NEW.user_id 
        AND entity_type = NEW.entity_type 
        AND entity_id = NEW.entity_id 
        AND id != NEW.id;  -- Yeni eklenen hariç
        
        -- Like/Dislike sayılarını güncelle
        IF NEW.entity_type = 'forum_topic' THEN
            UPDATE forum_topics SET 
                like_count = CASE WHEN NEW.is_like THEN like_count + 1 ELSE like_count END,
                dislike_count = CASE WHEN NOT NEW.is_like THEN dislike_count + 1 ELSE dislike_count END
            WHERE id = NEW.entity_id;
        ELSE
            UPDATE forum_posts SET 
                like_count = CASE WHEN NEW.is_like THEN like_count + 1 ELSE like_count END,
                dislike_count = CASE WHEN NOT NEW.is_like THEN dislike_count + 1 ELSE dislike_count END
            WHERE id = NEW.entity_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Silme durumunda sayıları azalt
        IF OLD.entity_type = 'forum_topic' THEN
            UPDATE forum_topics SET 
                like_count = CASE WHEN OLD.is_like THEN like_count - 1 ELSE like_count END,
                dislike_count = CASE WHEN NOT OLD.is_like THEN dislike_count - 1 ELSE dislike_count END
            WHERE id = OLD.entity_id;
        ELSE
            UPDATE forum_posts SET 
                like_count = CASE WHEN OLD.is_like THEN like_count - 1 ELSE like_count END,
                dislike_count = CASE WHEN NOT OLD.is_like THEN dislike_count - 1 ELSE dislike_count END
            WHERE id = OLD.entity_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Calculate statistics function
CREATE OR REPLACE FUNCTION calculate_statistics(_period statistic_period)
RETURNS void AS $$
DECLARE
    _date DATE := CURRENT_DATE;
    _start_date DATE;
    _metrics JSONB;
BEGIN
    -- Periyoda göre başlangıç tarihini belirle
    _start_date := CASE _period
        WHEN 'daily' THEN _date - INTERVAL '1 day'
        WHEN 'weekly' THEN _date - INTERVAL '7 days'
        WHEN 'monthly' THEN _date - INTERVAL '1 month'
        WHEN 'all_time' THEN (SELECT MIN(created_at)::DATE FROM users)
    END;

    -- Kullanıcı istatistikleri
    _metrics := jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE created_at::DATE <= _date),
        'new_users', (
            SELECT COUNT(*) 
            FROM users 
            WHERE created_at::DATE BETWEEN _start_date AND _date
        ),
        'active_users', (
            SELECT COUNT(DISTINCT user_id) 
            FROM logs 
            WHERE created_at::DATE BETWEEN _start_date AND _date
        ),
        'total_moderators', (
            SELECT COUNT(*) 
            FROM users 
            WHERE role = 'moderator'
        )
    );

    -- Kullanıcı istatistiklerini kaydet
    INSERT INTO platform_statistics (period, date, category, metrics)
    VALUES (_period, _date, 'user', _metrics)
    ON CONFLICT (period, date, category) 
    DO UPDATE SET metrics = _metrics;

    -- Haber istatistikleri
    _metrics := jsonb_build_object(
        'total_news', (
            SELECT COUNT(*) 
            FROM processed_news 
            WHERE status = 'published'
        ),
        'new_news', (
            SELECT COUNT(*) 
            FROM processed_news 
            WHERE published_at::DATE BETWEEN _start_date AND _date
        ),
        'total_views', (
            SELECT COALESCE(SUM(view_count), 0) 
            FROM processed_news
        ),
        'period_views', (
            SELECT COALESCE(SUM(view_count), 0)
            FROM processed_news
            WHERE updated_at::DATE BETWEEN _start_date AND _date
        )
    );

    -- Haber istatistiklerini kaydet
    INSERT INTO platform_statistics (period, date, category, metrics)
    VALUES (_period, _date, 'news', _metrics)
    ON CONFLICT (period, date, category) 
    DO UPDATE SET metrics = _metrics;

    -- Forum istatistikleri
    _metrics := jsonb_build_object(
        'total_topics', (
            SELECT COUNT(*) 
            FROM forum_topics 
            WHERE status = 'active'
        ),
        'new_topics', (
            SELECT COUNT(*) 
            FROM forum_topics 
            WHERE created_at::DATE BETWEEN _start_date AND _date
        ),
        'total_posts', (
            SELECT COUNT(*) 
            FROM forum_posts 
            WHERE NOT is_deleted
        ),
        'new_posts', (
            SELECT COUNT(*) 
            FROM forum_posts 
            WHERE created_at::DATE BETWEEN _start_date AND _date
        ),
        'total_likes', (
            SELECT COUNT(*) 
            FROM forum_likes 
            WHERE is_like
        ),
        'period_likes', (
            SELECT COUNT(*) 
            FROM forum_likes 
            WHERE is_like AND created_at::DATE BETWEEN _start_date AND _date
        )
    );

    -- Forum istatistiklerini kaydet
    INSERT INTO platform_statistics (period, date, category, metrics)
    VALUES (_period, _date, 'forum', _metrics)
    ON CONFLICT (period, date, category) 
    DO UPDATE SET metrics = _metrics;

    -- Sistem istatistikleri
    _metrics := jsonb_build_object(
        'total_errors', (
            SELECT COUNT(*) 
            FROM logs 
            WHERE level = 'error' 
            AND created_at::DATE BETWEEN _start_date AND _date
        ),
        'avg_ai_processing_time', (
            SELECT AVG(processed_time)::INTEGER
            FROM processed_news 
            WHERE created_at::DATE BETWEEN _start_date AND _date
            AND processed_time IS NOT NULL
        ),
        'total_reports', (
            SELECT COUNT(*) 
            FROM reports 
            WHERE created_at::DATE BETWEEN _start_date AND _date
        ),
        'pending_reports', (
            SELECT COUNT(*) 
            FROM reports 
            WHERE status = 'pending'
        )
    );

    -- Sistem istatistiklerini kaydet
    INSERT INTO platform_statistics (period, date, category, metrics)
    VALUES (_period, _date, 'system', _metrics)
    ON CONFLICT (period, date, category) 
    DO UPDATE SET metrics = _metrics;

END;
$$ LANGUAGE plpgsql;

-- Tüm istatistikleri hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_all_statistics()
RETURNS void AS $$
BEGIN
    -- Günlük istatistikler
    PERFORM calculate_statistics('daily');
    
    -- Haftalık istatistikler (her pazartesi)
    IF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
        PERFORM calculate_statistics('weekly');
    END IF;
    
    -- Aylık istatistikler (her ayın 1'i)
    IF EXTRACT(DAY FROM CURRENT_DATE) = 1 THEN
        PERFORM calculate_statistics('monthly');
    END IF;
    
    -- Tüm zamanlar (her gün güncellenir)
    PERFORM calculate_statistics('all_time');
END;
$$ LANGUAGE plpgsql;

-- Cron job
SELECT cron.schedule('0 0 * * *', $$ -- Her gün gece yarısı
    SELECT calculate_all_statistics();
$$);

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_categories_updated_at BEFORE UPDATE ON news_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rss_sources_updated_at BEFORE UPDATE ON rss_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_original_news_updated_at BEFORE UPDATE ON original_news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processed_news_updated_at BEFORE UPDATE ON processed_news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON news_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_topics_updated_at BEFORE UPDATE ON forum_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_news_quotes_updated_at BEFORE UPDATE ON forum_news_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_likes_updated_at BEFORE UPDATE ON forum_likes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_statistics_updated_at BEFORE UPDATE ON platform_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for forum_likes
CREATE TRIGGER update_forum_like_counts_trigger AFTER INSERT OR DELETE ON forum_likes FOR EACH ROW EXECUTE FUNCTION update_forum_like_counts();

-- Row Level Security (RLS) policies will be added based on requirements
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE original_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_news_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO settings (key, value, type, description, category) VALUES
-- RSS Settings
('rss_fetch_interval', '300000', 'number', 'RSS kaynaklarını çekme aralığı (milisaniye)', 'rss'),
('rss_max_items_per_source', '5', 'number', 'Her RSS kaynağından maksimum haber sayısı', 'rss'),
('rss_timeout', '30000', 'number', 'RSS fetch timeout süresi (milisaniye)', 'rss'),

-- AI Settings
('ai_model', 'gemini-2.0-flash', 'string', 'Kullanılacak AI modeli', 'ai'),
('ai_temperature', '0.7', 'number', 'AI model temperature değeri', 'ai'),
('ai_max_tokens', '2048', 'number', 'AI yanıt maksimum token sayısı', 'ai'),
('ai_confidence_threshold', '0.6', 'number', 'Haber yayınlama için minimum güven puanı', 'ai'),

-- General Settings
('site_name', 'AI News Platform', 'string', 'Site adı', 'general'),
('site_description', 'AI destekli haber platformu', 'string', 'Site açıklaması', 'general'),
('site_maintenance_mode', 'false', 'boolean', 'Siteyi bakım moduna al', 'general'),
('site_maintenance_message', 'Site bakım modundadır. Lütfen daha sonra tekrar deneyiniz.', 'string', 'Bakım modu mesajı', 'general'),
('site_api_rate_limit_anonymous_requests_per_minute', '60', 'number', 'Anonim kullanıcılar için API istek sınırı', 'general'),
('site_api_rate_limit_authenticated_requests_per_minute', '200', 'number', 'Kimliği doğrulanmış kullanıcılar için API istek sınırı', 'general'),

-- Auth Settings
('enable_user_registration', 'true', 'boolean', 'Kullanıcı kaydına izin ver', 'auth'),
('max_user_accounts_per_ip', '3', 'number', 'Aynı IP adresinden maksimum kullanıcı hesabı sayısı', 'auth'),
('max_registration_attempts', '5', 'number', 'Maksimum kayıt deneme sayısı', 'auth'),
('registration_lockout_duration', '15', 'number', 'Kayıt kilitlendiğinde süre (dakika)', 'auth'),
('max_login_attempts', '5', 'number', 'Maksimum giriş deneme sayısı', 'auth'),
('login_lockout_duration', '15', 'number', 'Giriş kilitlendiğinde süre (dakika)', 'auth'),

-- News Settings
('enable_news_feed', 'true', 'boolean', 'Haber akışına izin ver', 'news'),
('enable_news_comments', 'true', 'boolean', 'Haber yorumlarına izin ver', 'news'),
('max_comments_per_news', '1000', 'number', 'Haber başına maksimum yorum sayısı', 'news'),
('ai_processing_timeout', '60', 'number', 'Bir haber için AI işleme süresi sınırı (saniye)', 'news'),

-- Forum Settings
('enable_forum_topics', 'true', 'boolean', 'Forum konularına izin ver', 'forum'),
('enable_forum_posts', 'true', 'boolean', 'Forum gönderilerine izin ver', 'forum'),
('forum_topics_per_page', '10', 'number', 'Forum konuları sayfa başına gösterilen sayı', 'forum'),
('forum_posts_per_page', '10', 'number', 'Forum gönderileri sayfa başına gösterilen sayı', 'forum');

-- Insert default news categories
INSERT INTO news_categories (name, slug, description) VALUES
('Teknoloji', 'teknoloji', 'Teknoloji haberleri ve gelişmeleri'),
('Politika', 'politika', 'Politik haberler ve gelişmeler'),
('Ekonomi', 'ekonomi', 'Ekonomi ve finans haberleri'),
('Spor', 'spor', 'Spor haberleri ve sonuçları'),
('Sağlık', 'saglik', 'Sağlık ve tıp haberleri'),
('Eğitim', 'egitim', 'Eğitim haberleri ve gelişmeleri'),
('Kültür-Sanat', 'kultur-sanat', 'Kültür ve sanat haberleri'),
('Bilim', 'bilim', 'Bilim ve araştırma haberleri'),
('Dünya', 'dunya', 'Dünya haberleri ve uluslararası gelişmeler'),
('Genel', 'genel', 'Genel haberler');

-- Insert default forum categories
INSERT INTO forum_categories (name, description, slug) VALUES
('Genel Tartışma', 'Genel konular hakkında tartışma alanı', 'genel-tartisma'),
('Teknoloji', 'Teknoloji haberleri ve tartışmaları', 'teknoloji'),
('Politika', 'Politik haberler ve tartışmalar', 'politika'),
('Spor', 'Spor haberleri ve tartışmaları', 'spor'),
('Ekonomi', 'Ekonomi haberleri ve tartışmaları', 'ekonomi');

-- ==================== USER POLICIES ====================
CREATE POLICY "users_select_public_policy" ON users
    FOR SELECT USING (
        -- Herkes public bilgileri görebilir (id, username, avatar_url)
        true
    );

CREATE POLICY "users_select_private_policy" ON users
    FOR SELECT USING (
        -- Kendi private bilgilerini görebilir
        auth.uid() = id
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        -- Kendi bilgilerini güncelleyebilir (rol hariç)
        (auth.uid() = id AND role = role)
        -- Admin hepsini güncelleyebilir
        OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        -- Sadece admin kullanıcı silebilir
        auth.jwt() ->> 'role' = 'admin'
    );

-- ==================== NEWS RELATED POLICIES ====================
-- News Categories
CREATE POLICY "news_categories_select_policy" ON news_categories
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "news_categories_modify_policy" ON news_categories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- RSS Sources
CREATE POLICY "rss_sources_select_policy" ON rss_sources
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "rss_sources_modify_policy" ON rss_sources
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Original News
CREATE POLICY "original_news_select_policy" ON original_news
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "original_news_modify_policy" ON original_news
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Processed News
CREATE POLICY "processed_news_select_policy" ON processed_news
    FOR SELECT USING (
        -- Published olanları herkes görebilir
        status = 'published'
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "processed_news_modify_policy" ON processed_news
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- News Sources
CREATE POLICY "news_sources_select_policy" ON news_sources
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "news_sources_modify_policy" ON news_sources
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- ==================== FORUM POLICIES ====================
-- Forum Categories
CREATE POLICY "forum_categories_select_policy" ON forum_categories
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "forum_categories_modify_policy" ON forum_categories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Forum Topics
CREATE POLICY "forum_topics_select_policy" ON forum_topics
    FOR SELECT USING (
        -- Active konuları herkes görebilir
        status = 'active'
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "forum_topics_insert_policy" ON forum_topics
    FOR INSERT WITH CHECK (
        -- Giriş yapmış kullanıcı konu açabilir
        auth.uid() IS NOT NULL
    );

CREATE POLICY "forum_topics_update_policy" ON forum_topics
    FOR UPDATE USING (
        -- Kendi konusunu düzenleyebilir (status hariç)
        (auth.uid() = user_id AND status = status)
        -- Admin/moderatör hepsini düzenleyebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "forum_topics_delete_policy" ON forum_topics
    FOR DELETE USING (
        auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- Forum Posts
CREATE POLICY "forum_posts_select_policy" ON forum_posts
    FOR SELECT USING (
        -- Silinmemiş mesajları herkes görebilir
        NOT is_deleted
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "forum_posts_insert_policy" ON forum_posts
    FOR INSERT WITH CHECK (
        -- Giriş yapmış kullanıcı mesaj yazabilir
        auth.uid() IS NOT NULL
    );

CREATE POLICY "forum_posts_update_policy" ON forum_posts
    FOR UPDATE USING (
        -- Kendi gönderilerini düzenleyebilir
        auth.uid() = user_id
        -- Admin/moderatör hepsini düzenleyebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- Forum Likes
CREATE POLICY "forum_likes_select_policy" ON forum_likes
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "forum_likes_insert_policy" ON forum_likes
    FOR INSERT WITH CHECK (
        -- Giriş yapmış kullanıcı oy verebilir
        auth.uid() = user_id
    );

CREATE POLICY "forum_likes_update_delete_policy" ON forum_likes
    FOR ALL USING (
        -- Kullanıcı kendi oyunu değiştirebilir/silebilir
        auth.uid() = user_id
        -- Admin/moderatör hepsini yönetebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- Forum News Quotes
CREATE POLICY "forum_news_quotes_select_policy" ON forum_news_quotes
    FOR SELECT USING (true);  -- Herkes görebilir

CREATE POLICY "forum_news_quotes_modify_policy" ON forum_news_quotes
    FOR ALL USING (
        -- Kendi post'undaki alıntıyı yönetebilir
        auth.uid() IN (
            SELECT user_id FROM forum_posts WHERE id = forum_news_quotes.post_id
        )
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- ==================== COMMENTS POLICIES ====================
CREATE POLICY "comments_select_policy" ON comments
    FOR SELECT USING (
        -- Silinmemiş yorumları herkes görebilir
        NOT is_deleted
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "comments_insert_policy" ON comments
    FOR INSERT WITH CHECK (
        -- Giriş yapmış kullanıcı yorum yazabilir
        auth.uid() IS NOT NULL
    );

CREATE POLICY "comments_update_delete_policy" ON comments
    FOR ALL USING (
        -- Kendi yorumunu düzenleyebilir/silebilir
        auth.uid() = user_id
        -- Admin/moderatör hepsini yönetebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- ==================== NOTIFICATIONS POLICIES ====================
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        -- Kullanıcı kendi bildirimlerini görebilir
        auth.uid() = user_id
    );

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (
        -- Kullanıcı kendi bildirimlerini güncelleyebilir (okundu işaretleme vb.)
        auth.uid() = user_id
    );

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (
        -- Kullanıcı kendi bildirimlerini silebilir
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- ==================== REPORTS POLICIES ====================
CREATE POLICY "reports_select_policy" ON reports
    FOR SELECT USING (
        -- Kullanıcı kendi raporlarını görebilir
        auth.uid() = reporter_id
        -- Admin/moderatör hepsini görebilir
        OR auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

CREATE POLICY "reports_insert_policy" ON reports
    FOR INSERT WITH CHECK (
        -- Giriş yapmış kullanıcı rapor oluşturabilir
        auth.uid() IS NOT NULL
    );

CREATE POLICY "reports_update_policy" ON reports
    FOR UPDATE USING (
        -- Admin/moderatör sadece durum güncelleyebilir
        auth.jwt() ->> 'role' IN ('admin', 'moderator')
    );

-- ==================== SETTINGS POLICIES ====================
-- Sadece admin görebilir
CREATE POLICY "settings_select_policy" ON settings
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Sadece admin düzenleyebilir/ekleyebilir/silebilir
CREATE POLICY "settings_modify_policy" ON settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- ==================== LOGS POLICIES ====================
CREATE POLICY "logs_select_policy" ON logs
    FOR SELECT USING (
        -- Admin tüm logları görebilir
        auth.jwt() ->> 'role' = 'admin'
        -- Moderatör sadece forum ve user loglarını görebilir
        OR (
            auth.jwt() ->> 'role' = 'moderator' AND
            module IN ('forum', 'user')
        )
    );

CREATE POLICY "logs_insert_policy" ON logs
    FOR INSERT WITH CHECK (true);  -- Sistem log ekleyebilir

-- ==================== PLATFORM STATISTICS POLICIES ====================
CREATE POLICY "platform_statistics_select_policy" ON platform_statistics
    FOR SELECT USING (
        -- Admin tüm istatistikleri görebilir
        auth.jwt() ->> 'role' = 'admin'
        -- Moderatör sadece forum ve user istatistiklerini görebilir
        OR (
            auth.jwt() ->> 'role' = 'moderator' 
            AND category IN ('forum', 'user')
        )
    );