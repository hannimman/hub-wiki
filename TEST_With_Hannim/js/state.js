// 게임 상태 + localStorage 저장/로드
// 저장 구조: { version, coins, owned: [itemId], equipped: {slotId: itemId|null}, face: {eyes, nose, mouth} }

const STORE_KEY = "avatar-shop-v1";
const START_COINS = 5000;

function defaultState() {
  const equipped = {};
  SLOTS.forEach((s) => (equipped[s.id] = null));
  return {
    version: 1,
    bonusV2: true, // 신규 게임은 지원금 중복 지급 방지
    coins: START_COINS,
    owned: [],
    equipped,
    face: { eyes: "eyes-basic", nose: "nose-dot", mouth: "mouth-smile" },
  };
}

const State = {
  data: defaultState(),

  // 입어보기(미리보기) 상태 — 저장하지 않는 임시 상태 {slotId: itemId}
  preview: {},

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1) return; // 스키마 불일치 → 초기 상태 유지
      // 슬롯이 추가/삭제돼도 깨지지 않게 기본값 위에 병합
      const base = defaultState();
      this.data = {
        ...base,
        ...parsed,
        equipped: { ...base.equipped, ...(parsed.equipped || {}) },
        face: { ...base.face, ...(parsed.face || {}) },
      };
      // 경제 버프 이전에 시작한 세이브에 1회성 지원금 지급
      // (병합 후에는 defaultState의 플래그가 덮어쓰므로 저장 원본(parsed) 기준으로 판정)
      if (!parsed.bonusV2) {
        this.data.bonusV2 = true;
        this.data.coins += 3500;
        this.save();
      }
    } catch (e) {
      console.warn("저장 데이터를 불러오지 못했습니다. 초기화합니다.", e);
      this.data = defaultState();
    }
  },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("저장 실패", e);
    }
  },

  addCoins(n) {
    this.data.coins += n;
    this.save();
  },

  // 잔액이 충분하면 차감하고 true, 부족하면 false
  spend(n) {
    if (this.data.coins < n) return false;
    this.data.coins -= n;
    this.save();
    return true;
  },

  isOwned(itemId) {
    return this.data.owned.includes(itemId);
  },

  own(itemId) {
    if (!this.isOwned(itemId)) {
      this.data.owned.push(itemId);
      this.save();
    }
  },

  equip(slotId, itemId) {
    this.data.equipped[slotId] = itemId;
    this.save();
  },

  unequip(slotId) {
    this.data.equipped[slotId] = null;
    this.save();
  },

  isEquipped(slotId, itemId) {
    return this.data.equipped[slotId] === itemId;
  },

  setFace(part, optionId) {
    this.data.face[part] = optionId;
    this.save();
  },

  reset() {
    this.data = defaultState();
    this.preview = {};
    this.save();
  },
};
