-- 아이템 DB 관리 (Phase C)
-- 기본 아이템(코드 카탈로그 ~140종)은 코드에 유지하고, 이 테이블은
--   * 기본 아이템의 가격/활성 "오버라이드" (custom=false, svg null)
--   * 슈퍼가 등록한 "커스텀 아이템" (custom=true, svg 포함)
-- 를 담는다. 서버가 둘을 병합해 유효 카탈로그를 만든다(TTL 캐시).
create table if not exists public.shop_items (
  id         text primary key,          -- 아이템 id (기본 아이템과 동일 체계)
  slot       text not null,             -- hat/hair/faceAcc/top/bottom/shoes/handL/handR/decoL/decoR ...
  name       text,                      -- 커스텀: 필수 / 오버라이드: null이면 기본 이름
  price      integer,                   -- null이면 기본 가격
  svg        text,                      -- 커스텀만. 기본 아이템 오버라이드는 null
  rigid      boolean not null default false,
  active     boolean not null default true,
  custom     boolean not null default false,
  created_at timestamptz not null default now()
);
