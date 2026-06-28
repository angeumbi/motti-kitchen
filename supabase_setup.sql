-- ==========================================
-- motti-kitchen (모티키친) Supabase Schema
-- Motto: "건강, 신선, 단순" (Healthy, Fresh, Simple)
-- Description: 메뉴 관리 및 회원 역할(Admin/User) 구분을 위한 스키마 및 샘플 데이터
-- ==========================================

-- ------------------------------------------
-- 1. 사용자 역할(Role) 정의를 위한 ENUM 타입 생성
-- ------------------------------------------
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- ------------------------------------------
-- 2. 사용자 프로필 테이블 (auth.users와 1:1 관계)
-- ------------------------------------------
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- 3. 메뉴판 테이블 (샌드위치, 포케, 샐러드)
-- ------------------------------------------
CREATE TABLE public.menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('sandwich', 'poke', 'salad')),
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    calories INT NOT NULL CHECK (calories >= 0),
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    nutrition_facts JSONB NOT NULL DEFAULT '{"carbs_g": 0, "protein_g": 0, "fat_g": 0}'::jsonb,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- 4. 회원가입 시 프로필 자동 생성 트리거 및 함수
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, display_name)
    VALUES (
        new.id,
        new.email,
        'user', -- 기본 역할은 일반 사용자
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- 5. RLS 보안 정책 (Policies) 설정
-- ------------------------------------------

-- [Profiles 테이블 정책]
CREATE POLICY "자신의 프로필은 자신이 조회 가능"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "자신의 프로필은 자신이 등록 가능"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "자신의 프로필은 자신이 수정 가능"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "관리자(admin)는 모든 프로필 조회 가능"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "관리자(admin)는 모든 프로필 수정 가능"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- [Menus 테이블 정책]
CREATE POLICY "일반 메뉴 목록은 비로그인 유저를 포함하여 누구나 조회 가능"
    ON public.menus FOR SELECT
    USING (is_available = true OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY "관리자(admin)만 메뉴 추가 가능"
    ON public.menus FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "관리자(admin)만 메뉴 수정 가능"
    ON public.menus FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "관리자(admin)만 메뉴 삭제 가능"
    ON public.menus FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ------------------------------------------
-- 6. '모티키친' 건강하고 맛있는 샘플 데이터 주입 (더미 데이터)
-- ------------------------------------------
INSERT INTO public.menus (name, english_name, category, description, price, calories, ingredients, nutrition_facts, image_url) VALUES

-- [1] SANDWICHES (샌드위치)
(
    '아보카도 칠면조 샌드위치', 
    'Avocado Turkey Sandwich', 
    'sandwich', 
    '담백한 칠면조 가슴살과 고소한 생 아보카도, 아삭한 야채가 완벽한 조화를 이루는 모티키친 대표 샌드위치', 
    8900, 
    420, 
    ARRAY['호밀 식빵', '오븐구이 칠면조 슬라이스', '생 아보카도', '토마토', '로메인 상추', '스위스 치즈', '허브 렌치 드레싱'],
    '{"carbs_g": 38, "protein_g": 24, "fat_g": 18}'::jsonb,
    'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=800'
),
(
    '바질 페스토 치킨 샌드위치', 
    'Basil Pesto Chicken Sandwich', 
    'sandwich', 
    '직접 만든 향긋한 바질 페스토에 버무린 수비드 닭가슴살과 쫀득한 모짜렐라 치즈의 프레시한 만남', 
    8500, 
    480, 
    ARRAY['치아바타 브레드', '수비드 닭가슴살', '수제 바질 페스토', '생 모짜렐라 치즈', '썬드라이 토마토', '루꼴라'],
    '{"carbs_g": 42, "protein_g": 28, "fat_g": 16}'::jsonb,
    'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&q=80&w=800'
),

-- [2] POKES (포케)
(
    '클래식 생연어 포케', 
    'Classic Fresh Salmon Poke', 
    'poke', 
    '매일 아침 공수하는 신선한 생연어와 고소한 아보카도에 짭조름한 하와이안 특제 소스를 곁들인 보울', 
    12900, 
    510, 
    ARRAY['유기농 현미밥', '슈페리어급 생연어 슬라이스', '아보카도', '오이', '적양파', '날치알', '해초 샐러드', '어니언 후레이크', '스파이시 크림 소스'],
    '{"carbs_g": 54, "protein_g": 22, "fat_g": 20}'::jsonb,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
),
(
    '소이 진저 참치 포케', 
    'Soy Ginger Tuna Poke', 
    'poke', 
    '감칠맛 가득한 특제 소이 진저 드레싱에 마리네이드한 참치와 에다마메(풋콩)가 어우러져 깔끔하고 가벼운 포케', 
    12500, 
    460, 
    ARRAY['귀리 현미밥', '황다랑어 큐브', '에다마메(풋콩)', '미역줄기무침', '래디시 슬라이스', '구운 캐슈넛', '갈릭 칩', '소이 진저 소스'],
    '{"carbs_g": 50, "protein_g": 26, "fat_g": 12}'::jsonb,
    'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=800'
),

-- [3] SALADS (샐러드)
(
    '그릴드 치킨 퀴노아 샐러드', 
    'Grilled Chicken Quinoa Salad', 
    'salad', 
    '직화로 구워 불향을 가둔 닭가슴살과 단백질이 풍부한 슈퍼푸드 퀴노아, 다채로운 야채로 채운 포만감 높은 샐러드', 
    10500, 
    380, 
    ARRAY['로메인&치커리 믹스그린', '그릴드 닭가슴살', '화이트&레드 퀴노아', '방울토마토', '병아리콩', '블랙 올리브', '발사믹 비네그레트 드레싱'],
    '{"carbs_g": 25, "protein_g": 32, "fat_g": 14}'::jsonb,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'
),
(
    '리코타 꿀무화과 샐러드', 
    'Ricotta Sweet Fig Salad', 
    'salad', 
    '부드럽고 묵직한 수제 리코타 치즈와 달콤한 건무화과, 바삭한 견과류에 달콤한 벌꿀을 올린 디저트 샐러드', 
    11000, 
    340, 
    ARRAY['프레시 믹스 채소', '수제 리코타 치즈', '반건조 무화과', '구운 호두', '아몬드 슬라이스', '크랜베리', '천연 벌꿀 드레싱'],
    '{"carbs_g": 28, "protein_g": 12, "fat_g": 20}'::jsonb,
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
);

-- ------------------------------------------
-- [추가] 7. 멤버십 제한 및 포스트 확장 컬럼 추가
-- ------------------------------------------
-- profiles 테이블에 membership 컬럼 추가 (기본값 'basic')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership VARCHAR(50) DEFAULT 'basic' CHECK (membership IN ('basic', 'premium'));

-- posts 테이블에 is_premium 및 다채로운 컬럼들 확장 추가
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS english_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';

-- posts 테이블에 대한 UPDATE/INSERT RLS 권한을 관리자(admin)에게 부여
DROP POLICY IF EXISTS "관리자만 포스트를 추가할 수 있습니다" ON public.posts;
CREATE POLICY "관리자만 포스트를 추가할 수 있습니다" ON public.posts FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "관리자만 포스트를 수정할 수 있습니다" ON public.posts;
CREATE POLICY "관리자만 포스트를 수정할 수 있습니다" ON public.posts FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);


-- ------------------------------------------
-- [추가] 8. 공지사항(Notices) 테이블 생성 및 보안 정책
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 누구나 공지사항 조회(SELECT) 가능
DROP POLICY IF EXISTS "누구나 공지사항을 조회할 수 있습니다" ON public.notices;
CREATE POLICY "누구나 공지사항을 조회할 수 있습니다" ON public.notices FOR SELECT 
USING (true);

-- 관리자(admin)만 공지사항 등록(INSERT) 가능
DROP POLICY IF EXISTS "관리자만 공지사항을 등록할 수 있습니다" ON public.notices;
CREATE POLICY "관리자만 공지사항을 등록할 수 있습니다" ON public.notices FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 관리자(admin)만 공지사항 수정(UPDATE) 가능
DROP POLICY IF EXISTS "관리자만 공지사항을 수정할 수 있습니다" ON public.notices;
CREATE POLICY "관리자만 공지사항을 수정할 수 있습니다" ON public.notices FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 관리자(admin)만 공지사항 삭제(DELETE) 가능
DROP POLICY IF EXISTS "관리자만 공지사항을 삭제할 수 있습니다" ON public.notices;
CREATE POLICY "관리자만 공지사항을 삭제할 수 있습니다" ON public.notices FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 초기 공지사항 더미 데이터 주입
INSERT INTO public.notices (title, content) VALUES
('[신메뉴 출시] 초여름 한정 리코타 꿀무화과 샐러드 론칭!', '홈메이드로 직접 굳혀 고소하고 꾸덕한 리코타 치즈와 톡톡 터지는 달콤함을 가진 벌꿀 무화과 샐러드가 론칭되었습니다. 많은 관심 부탁드립니다.'),
('[휴무 안내] 정기 휴무 및 정밀 위생 점검 공지', '매주 월요일은 최상의 신선도 공급 및 정밀 위생 방역을 위해 모티키친 정기 휴무일입니다. 이용에 참고하여 주시기 바랍니다.')
ON CONFLICT DO NOTHING;

-- ------------------------------------------
-- [추가] 9. 고객 후기(Reviews) 및 사장님 답변(Comments) 테이블 생성 및 보안 정책
-- ------------------------------------------

-- 9-1. reviews 테이블 생성
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 조회: 누구나 가능
DROP POLICY IF EXISTS "누구나 리뷰를 조회할 수 있습니다" ON public.reviews;
CREATE POLICY "누구나 리뷰를 조회할 수 있습니다" ON public.reviews FOR SELECT 
USING (true);

-- 등록: 로그인한 모든 유저 가능
DROP POLICY IF EXISTS "로그인한 유저는 리뷰를 등록할 수 있습니다" ON public.reviews;
CREATE POLICY "로그인한 유저는 리뷰를 등록할 수 있습니다" ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 수정: 작성자 본인만 가능
DROP POLICY IF EXISTS "리뷰 작성자 본인만 리뷰를 수정할 수 있습니다" ON public.reviews;
CREATE POLICY "리뷰 작성자 본인만 리뷰를 수정할 수 있습니다" ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- 삭제: 작성자 본인 또는 관리자(admin) 가능
DROP POLICY IF EXISTS "작성자 또는 관리자만 리뷰를 삭제할 수 있습니다" ON public.reviews;
CREATE POLICY "작성자 또는 관리자만 리뷰를 삭제할 수 있습니다" ON public.reviews FOR DELETE 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);


-- 9-2. review_comments 테이블 생성 (사장님 답변)
CREATE TABLE IF NOT EXISTS public.review_comments (
    id SERIAL PRIMARY KEY,
    review_id INT REFERENCES public.reviews(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

-- 조회: 누구나 가능
DROP POLICY IF EXISTS "누구나 답글을 조회할 수 있습니다" ON public.review_comments;
CREATE POLICY "누구나 답글을 조회할 수 있습니다" ON public.review_comments FOR SELECT 
USING (true);

-- 등록/수정/삭제: 오직 관리자(admin)만 가능
DROP POLICY IF EXISTS "관리자만 답글을 등록할 수 있습니다" ON public.review_comments;
CREATE POLICY "관리자만 답글을 등록할 수 있습니다" ON public.review_comments FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "관리자만 답글을 수정할 수 있습니다" ON public.review_comments;
CREATE POLICY "관리자만 답글을 수정할 수 있습니다" ON public.review_comments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "관리자만 답글을 삭제할 수 있습니다" ON public.review_comments;
CREATE POLICY "관리자만 답글을 삭제할 수 있습니다" ON public.review_comments FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);


-- 9-3. 초기 고객 후기 더미 데이터 주입
INSERT INTO public.reviews (user_id, user_email, title, content, rating, image_url) VALUES
(
    NULL,
    'wellbeing@naver.com',
    '아보카도 샌드위치 진짜 아삭하고 맛있어요!',
    '야채 신선도가 대박이네요. 아보카도도 잘 익어서 입안에서 살살 녹아요. 단골 예약입니다.',
    5,
    'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=600'
),
(
    NULL,
    'poke_lover@daum.net',
    '생연어 포케는 사랑입니다',
    '현미밥이랑 소스 조화가 정말 잘 맞네요. 다이어트 중에 가볍고 든든하게 먹을 수 있어 참 좋습니다.',
    4,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------
-- [추가] 10. posts 테이블에 status(노출 상태) 컬럼 추가
-- ------------------------------------------
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'draft'));

