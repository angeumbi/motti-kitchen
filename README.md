# 🥗 motti-kitchen (모티키친) Homepage Project

"건강, 신선, 단순"을 모토로 삼는 샌드위치·포케·샐러드 전문점 **motti-kitchen**의 웹 애플리케이션 프로젝트입니다. 
Next.js (App Router) 프론트엔드와 Supabase 백엔드/DB 스택을 조화롭게 사용하여 설계되었습니다.

---

## 📂 Next.js 프로젝트 폴더 구조 (App Router)

모티키친 프로젝트의 확장성 및 가독성을 극대화한 가장 깔끔한 기본 폴더 트리입니다.

```text
motti-kitchen/
├── public/                     # 정적 에셋 (로고, 일러스트, 폰트 등)
│   ├── images/
│   │   ├── logo.svg            # 모티키친 브랜드 로고
│   │   └── default-hero.jpg    # 메인 비주얼 이미지
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router (페이지 및 라우팅 정의)
│   │   ├── (auth)/             # 인증 관련 그룹 폴더 (동일 레이아웃 공유 가능)
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # 로그인 화면 페이지 (Email, SNS 로그인)
│   │   │   └── signup/
│   │   │       └── page.tsx    # 회원가입 화면 페이지 (가입 시 프로필 자동 트리거 연동)
│   │   ├── admin/              # 관리자 전용 대시보드 및 메뉴 관리 화면
│   │   │   ├── layout.tsx      # 관리자 화면 레이아웃 (어드민 내비바 포함)
│   │   │   └── page.tsx        # 관리자 대시보드 (메뉴 추가/수정/삭제 가능)
│   │   ├── menu/               # 공용 메뉴 탐색 화면
│   │   │   ├── page.tsx        # 샌드위치/포케/샐러드 필터링 및 리스트 목록 화면
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 개별 메뉴 상세 정보 (성분표, 칼로리, 설명)
│   │   ├── globals.css         # 글로벌 CSS 스타일 및 Tailwind/Variables 설정
│   │   ├── layout.tsx          # 루트 레이아웃 (공용 내비바 Header, 푸터 Footer 포함)
│   │   └── page.tsx            # 메인 홈 화면 (브랜드 스토리, 베스트 셀러 소개)
│   ├── components/             # 재사용 가능한 UI 및 비즈니스 컴포넌트
│   │   ├── common/             # 전체 레이아웃용 공통 컴포넌트
│   │   │   ├── Header.tsx      # 브랜드 헤더 (GNB, 로그인/프로필 상태 표시)
│   │   │   └── Footer.tsx      # 하단 푸터 (영업 시간, 매장 위치 등)
│   │   ├── ui/                 # 원자단위(Atomic) 기본 UI 요소
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── input.tsx
│   │   └── menu/               # 메뉴 특화 컴포넌트
│   │       ├── MenuCard.tsx    # 개별 메뉴 카드 컴포넌트 (가격, 칼로리, 이미지)
│   │       ├── MenuList.tsx    # 메뉴 카테고리별 그리드 목록
│   │       └── NutritionInfo.tsx # 칼로리 및 탄단지 영양성분표 컴포넌트
│   ├── hooks/                  # 커스텀 훅 폴더
│   │   ├── useAuth.ts          # Supabase 세션 관리 및 로그인/아웃 훅
│   │   └── useMenu.ts          # 메뉴 목록 패치 및 실시간 상태 관리 훅
│   ├── lib/                    # 외부 라이브러리 및 공통 유틸리티 설정
│   │   ├── supabase/           # Supabase JS Client 초기화 및 환경 설정
│   │   │   ├── client.ts       # 클라이언트 컴포넌트용 Supabase 인스턴스
│   │   │   ├── server.ts       # SSR/Server Action/Route Handler용 Supabase 인스턴스
│   │   │   └── middleware.ts   # 쿠키 및 세션 갱신을 담당하는 미들웨어
│   │   └── utils.ts            # 간단한 포맷터(금액 세자리 콤마 등) 및 스타일 병합 툴
│   ├── types/                  # 전역 TypeScript 파일
│   │   └── database.types.ts   # Supabase CLI로 자동 생성하는 DB 스키마 타입 선언
│   └── styles/                 # 추가 디자인/테마 파일 (선택사항)
├── .env.local                  # Supabase API Key 등 환경 변수 파일 (Git 배제)
├── next.config.js              # Next.js 프레임워크 설정 파일
├── package.json                # 의존성 정의 파일
├── tailwind.config.js          # TailwindCSS 환경설정 파일 (필요시)
└── tsconfig.json               # TypeScript 구성 파일
```

---

## 🗄️ Supabase 백엔드 데이터베이스 구축 방법

Supabase 웹 콘솔 또는 로컬 개발 환경에서 다음 단계를 통해 테이블 구조와 샘플 데이터를 주입할 수 있습니다.

### 1단계: Supabase SQL Editor 실행
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. 프로젝트 대시보드 왼쪽 메뉴의 **SQL Editor** 아이콘을 클릭합니다.
3. **New Query**를 선택해 새 편집창을 엽니다.

### 2단계: SQL 쿼리 복사 및 실행
동일 폴더 내 생성된 [supabase_setup.sql](file:///C:/Users/USER/.gemini/antigravity-ide/scratch/motti-kitchen/supabase_setup.sql) 파일의 내용을 전체 복사하여 SQL Editor에 붙여넣고, 우측 하단의 **Run** 버튼을 눌러 실행합니다.

이 스크립트는 다음 항목들을 생성하고 초기화합니다:
- **`user_role` ENUM:** 유저 등급 정의 (`admin`, `user`)
- **`profiles` 테이블:** 유저 메타데이터 관리 (`id`는 `auth.users`를 FK로 바라봄)
- **`menus` 테이블:** 메뉴 정보 관리 (이름, 이미지, 가격, 칼로리, 성분표 배열, 영양소 JSONB)
- **가입 자동 연동 트리거:** `auth.users` 테이블에 새 계정이 추가되면 자동으로 `profiles` 테이블에 `user` 역할로 행이 생성됩니다.
- **Row Level Security (RLS) 보안 정책:** 
  - 일반인/비회원은 활성화된 메뉴(`is_available = true`)를 조회만 가능
  - 관리자(`admin`) 권한이 확인된 세션만 메뉴 추가/수정/삭제 및 전체 유저 관리 가능
- **샘플 데이터 주입:** 브랜드 컨셉에 맞는 샌드위치 2종, 포케 2종, 샐러드 2종의 데이터 삽입

### 3단계: 관리자(Admin) 권한 부여하는 방법
자동으로 가입하는 유저는 모두 기본적으로 `'user'` 역할을 가집니다. 특정 가입자에게 어드민 권한을 주고 싶다면, Supabase SQL Editor에서 아래 쿼리를 수행해 역할을 `'admin'`으로 업데이트해 주십시오.

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@motti-kitchen.com'; -- 관리자로 승격하고 싶은 이메일 주소 기입
```
