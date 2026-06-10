// 상점 / 인벤토리 / 얼굴 탭 UI

const GHOST_SLOTS = new Set([
  "hair", "hat", "faceAcc", "beard", "top", "bottom", "shoes", "handL", "handR",
]);

const COIN_MINI = `<svg class="mini-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffd24d" stroke="#e0a92e" stroke-width="2"/></svg>`;

function updateCoinUI() {
  document.getElementById("coin-amount").textContent =
    State.data.coins.toLocaleString("ko-KR");
  const box = document.getElementById("coin-box");
  box.classList.remove("pulse");
  requestAnimationFrame(() => box.classList.add("pulse"));
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

// 아이템 미리보기: 슬롯별 zoom 영역을 잘라서 보여주고,
// 착용류는 위치 감을 주기 위해 흐린 몸체(고스트)를 함께 그린다.
function itemPreviewSvg(slot, item) {
  const ghost = GHOST_SLOTS.has(slot.id)
    ? `<g opacity="0.22">${BODY_SVG}</g>`
    : "";
  return `<svg viewBox="${slot.zoom}" preserveAspectRatio="xMidYMid meet">${ghost}${item.svg}</svg>`;
}

function facePreviewSvg(section, opt) {
  return `<svg viewBox="${section.zoom}" preserveAspectRatio="xMidYMid meet">
    <circle cx="160" cy="120" r="56" fill="#ffe7cd"/>${opt.svg}</svg>`;
}

const Shop = {
  tab: "face",
  shopSlot: "hair",
  invSlot: "all",

  init() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.tab = btn.dataset.tab;
        this.clearPreview();
        document.querySelectorAll(".tab").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
        this.render();
      });
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("정말 처음부터 다시 시작할까요? 코인과 아이템이 모두 초기화됩니다.")) {
        State.reset();
        renderCharacter();
        updateCoinUI();
        this.render();
        toast("처음부터 다시 시작!");
      }
    });

    // 패널 클릭 위임
    document.getElementById("panel-body").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) {
        if (chip.dataset.inv) this.invSlot = chip.dataset.inv;
        else this.shopSlot = chip.dataset.slot;
        this.clearPreview();
        this.render();
        return;
      }
      const card = e.target.closest(".card");
      if (!card) return;
      const { kind, slot, item } = card.dataset;
      // 구매 버튼은 카드 클릭(입어보기)과 별도로 동작
      if (e.target.closest(".action.buy")) {
        this.onBuy(slot, item);
        return;
      }
      if (kind === "face") this.onFacePick(slot, item);
      else if (kind === "shop" || kind === "inv") this.onItemClick(slot, item);
    });

    this.render();
  },

  onFacePick(part, optionId) {
    State.setFace(part, optionId);
    renderCharacter();
    this.render();
  },

  // 입어보기 상태 전체 해제
  clearPreview() {
    if (Object.keys(State.preview).length === 0) return;
    State.preview = {};
    renderCharacter();
  },

  onItemClick(slotId, itemId) {
    const item = (ITEMS[slotId] || []).find((i) => i.id === itemId);
    if (!item) return;

    if (!State.isOwned(itemId)) {
      // 미보유 → 입어보기 토글 (구매는 구매 버튼으로만)
      if (State.preview[slotId] === itemId) {
        delete State.preview[slotId];
        renderCharacter();
        this.render();
        toast(`'${item.name}' 입어보기 취소`);
      } else {
        State.preview[slotId] = itemId;
        renderCharacter();
        popLayer(slotId);
        this.render();
        toast(`'${item.name}' 입어보는 중! 마음에 들면 구매를 눌러요 👀`);
      }
      return;
    }

    // 보유 중 → 장착/해제 토글
    delete State.preview[slotId];
    if (State.isEquipped(slotId, itemId)) {
      State.unequip(slotId);
      renderCharacter();
      this.render();
      toast(`'${item.name}' 해제`);
    } else {
      State.equip(slotId, itemId);
      renderCharacter();
      popLayer(slotId);
      this.render();
      toast(`'${item.name}' 장착!`);
    }
  },

  // 구매 버튼 → 결제 후 정식 장착
  onBuy(slotId, itemId) {
    const item = (ITEMS[slotId] || []).find((i) => i.id === itemId);
    if (!item || State.isOwned(itemId)) return;
    if (!State.spend(item.price)) {
      toast(`코인이 부족해요! (${item.price - State.data.coins}코인 더 필요)`);
      return;
    }
    delete State.preview[slotId];
    State.own(itemId);
    State.equip(slotId, itemId);
    renderCharacter();
    popLayer(slotId);
    updateCoinUI();
    this.render();
    toast(`'${item.name}' 구매 완료! 바로 장착했어요 ✨`);
  },

  render() {
    const body = document.getElementById("panel-body");
    if (this.tab === "face") body.innerHTML = this.renderFace();
    else if (this.tab === "shop") body.innerHTML = this.renderShop();
    else body.innerHTML = this.renderInventory();
  },

  renderFace() {
    return FACE_SECTIONS.map((section) => {
      const cards = FACE_OPTIONS[section.id]
        .map((opt) => {
          const selected = State.data.face[section.id] === opt.id;
          return `<div class="card ${selected ? "selected" : ""}" data-kind="face" data-slot="${section.id}" data-item="${opt.id}">
            <div class="preview">${facePreviewSvg(section, opt)}</div>
            <div class="name">${opt.name}</div>
            <button class="action free">${selected ? "선택중 ✓" : "무료 선택"}</button>
          </div>`;
        })
        .join("");
      return `<div class="section-title">${section.name} 고르기</div><div class="grid">${cards}</div>`;
    }).join("");
  },

  renderShop() {
    const chips = SLOTS.map(
      (s) =>
        `<button class="chip ${s.id === this.shopSlot ? "active" : ""}" data-slot="${s.id}">${s.name}</button>`
    ).join("");

    const slot = SLOTS.find((s) => s.id === this.shopSlot);
    const cards = ITEMS[slot.id]
      .map((item) => {
        const owned = State.isOwned(item.id);
        const equipped = State.isEquipped(slot.id, item.id);
        const previewing = State.preview[slot.id] === item.id;
        const canBuy = State.data.coins >= item.price;
        let badge = "";
        if (equipped) badge = `<span class="badge">장착중</span>`;
        else if (previewing) badge = `<span class="badge preview">입어보는 중</span>`;
        else if (owned) badge = `<span class="badge own">보유</span>`;
        let action;
        if (equipped) action = `<button class="action unequip">해제하기</button>`;
        else if (owned) action = `<button class="action equip">장착하기</button>`;
        else
          action = `<button class="action buy ${canBuy ? "" : "cant"}">구매 ${COIN_MINI}${item.price.toLocaleString("ko-KR")}</button>`;
        return `<div class="card ${equipped ? "equipped" : ""} ${previewing ? "previewing" : ""}" data-kind="shop" data-slot="${slot.id}" data-item="${item.id}">
          ${badge}
          <div class="preview">${itemPreviewSvg(slot, item)}</div>
          <div class="name">${item.name}</div>
          ${action}
        </div>`;
      })
      .join("");

    return `<div class="chips">${chips}</div><div class="grid">${cards}</div>`;
  },

  renderInventory() {
    // 상점처럼 상단 카테고리 칩 — 보유 아이템이 있는 카테고리만 노출
    const ownedCount = (slot) =>
      ITEMS[slot.id].filter((i) => State.isOwned(i.id)).length;
    const chips = [
      `<button class="chip ${this.invSlot === "all" ? "active" : ""}" data-inv="all">전체</button>`,
      ...SLOTS.filter((s) => ownedCount(s) > 0).map(
        (s) =>
          `<button class="chip ${this.invSlot === s.id ? "active" : ""}" data-inv="${s.id}">${s.name} (${ownedCount(s)})</button>`
      ),
    ].join("");

    const visibleSlots =
      this.invSlot === "all"
        ? SLOTS
        : SLOTS.filter((s) => s.id === this.invSlot);

    const sections = visibleSlots.map((slot) => {
      const ownedItems = ITEMS[slot.id].filter((i) => State.isOwned(i.id));
      if (ownedItems.length === 0) return "";
      const cards = ownedItems
        .map((item) => {
          const equipped = State.isEquipped(slot.id, item.id);
          return `<div class="card ${equipped ? "equipped" : ""}" data-kind="inv" data-slot="${slot.id}" data-item="${item.id}">
            ${equipped ? `<span class="badge">장착중</span>` : ""}
            <div class="preview">${itemPreviewSvg(slot, item)}</div>
            <div class="name">${item.name}</div>
            <button class="action ${equipped ? "unequip" : "equip"}">${equipped ? "해제하기" : "장착하기"}</button>
          </div>`;
        })
        .join("");
      return `<div class="section-title">${slot.name} (${ownedItems.length})</div><div class="grid">${cards}</div>`;
    })
      .filter(Boolean)
      .join("");

    return (
      `<div class="chips">${chips}</div>` +
      (sections ||
        `<p style="color:#8a8378;text-align:center;padding:40px 0;">
        아직 보유한 아이템이 없어요.<br/>🛒 상점에서 첫 아이템을 구매해 보세요!</p>`)
    );
  },
};
