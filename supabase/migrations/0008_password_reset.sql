-- 비밀번호 초기화 플래그 (Phase 4.1)
-- 관리자/슈퍼가 "비밀번호 초기화"를 누르면 true 로 설정된다.
--  → 해당 사용자는 즉시 로그아웃되고(getCurrentUser 가 null 반환),
--     기존 비밀번호로는 로그인할 수 없으며,
--     로그인 화면의 "비밀번호 재설정"에서 아이디 입력 → 새 비밀번호 설정 시 false 로 해제된다.
alter table users
  add column if not exists needs_password_reset boolean not null default false;
