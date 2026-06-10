// 앱 초기화 — 모든 스크립트가 로드된 뒤 실행 (index.html 맨 마지막 script)

document.addEventListener("DOMContentLoaded", () => {
  State.load();
  renderCharacter();
  updateCoinUI();
  Shop.init();
  Interactive.init();
});
