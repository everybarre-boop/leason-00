# 뚝딱 레슨문의 프로그램

레슨 문의 리드(이름, 이메일, 전화번호, 문의 내용)를 수집하는 웹 애플리케이션.

## 기술 스택

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL)
- **Drizzle ORM** (drizzle-kit)
- **npm**

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고하여 `.env.local`에 Supabase 값을 채웁니다.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 대시보드 > Project Settings > API
- `DATABASE_URL` — Supabase 대시보드 > Project Settings > Database > Connection string (pooler, 포트 6543)

### 3. 데이터베이스 스키마 적용

```bash
npm run db:push      # 스키마를 DB에 바로 반영
# 또는 마이그레이션 파일 기반
npm run db:generate  # 마이그레이션 SQL 생성
npm run db:migrate   # 마이그레이션 적용
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## 프로젝트 구조

```
app/            Next.js App Router (layout, page, globals.css)
db/
  schema.ts     Drizzle 스키마 (leads 테이블)
  index.ts      Drizzle DB 클라이언트
lib/
  supabase.ts   Supabase 클라이언트
drizzle.config.ts
```

## 데이터 모델

`leads` 테이블

| 컬럼        | 타입        | 설명          |
| ----------- | ----------- | ------------- |
| id          | uuid        | 기본 키       |
| name        | text        | 이름          |
| email       | text        | 이메일        |
| phone       | text        | 전화번호      |
| message     | text        | 문의 내용     |
| created_at  | timestamptz | 생성 시각     |

> 현재는 초기화 단계로, 리드 수집 폼과 저장 로직(기능)은 아직 구현하지 않았습니다.
