// 인터렉티브 요소: 눈동자 마우스 추적, 깜빡임, 클릭 반응(+코인), 플로팅 텍스트

const Interactive = {
  init() {
    this.initPupilTracking();
    this.initBlink();
    this.initClickReward();
    this.initActions();
  },

  // --- 동작 시스템: 걷기/달리기/춤/인사/점프 + 연속 재생 ---
  initActions() {
    const svg = document.getElementById("stage-svg");
    const bar = document.getElementById("action-bar");
    const ACTIONS = ["walk", "run", "dance", "wave", "hop"];
    let loopTimer = null;
    let loopIdx = 0;

    const apply = (name) => {
      ACTIONS.forEach((a) => svg.classList.toggle("action-" + a, a === name));
      bar.querySelectorAll(".act-btn").forEach((b) => {
        if (b.dataset.action === "__loop") b.classList.toggle("active", !!loopTimer);
        else b.classList.toggle("active", b.dataset.action === name);
      });
    };

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".act-btn");
      if (!btn) return;
      const act = btn.dataset.action;

      if (act === "__loop") {
        if (loopTimer) {
          clearInterval(loopTimer);
          loopTimer = null;
          apply(null);
        } else {
          loopIdx = 0;
          loopTimer = setInterval(() => {
            loopIdx = (loopIdx + 1) % ACTIONS.length;
            apply(ACTIONS[loopIdx]);
          }, 4000);
          apply(ACTIONS[0]);
        }
        return;
      }

      // 개별 동작: 연속 재생 중이면 끄고, 같은 동작 재클릭 시 정지
      if (loopTimer) {
        clearInterval(loopTimer);
        loopTimer = null;
      }
      const isOn = svg.classList.contains("action-" + act);
      apply(isOn ? null : act);
    });
  },

  // --- 눈동자가 커서를 따라옴 ---
  initPupilTracking() {
    const stage = document.getElementById("stage");
    const svg = document.getElementById("stage-svg");
    let raf = null;

    document.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rect = stage.getBoundingClientRect();
        // 얼굴 중심(160,110)의 화면 좌표
        const faceX = rect.left + (160 / 320) * rect.width;
        const faceY = rect.top + (110 / 400) * rect.height;
        const dx = e.clientX - faceX;
        const dy = e.clientY - faceY;
        const dist = Math.hypot(dx, dy) || 1;
        const max = 3.2; // 눈동자 최대 이동(SVG 좌표)
        const ox = (dx / dist) * Math.min(max, dist / 40);
        const oy = (dy / dist) * Math.min(max, dist / 40);
        svg.querySelectorAll(".pupil").forEach((p) => {
          p.setAttribute("transform", `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`);
        });
      });
    });
  },

  // --- 자연스러운 눈 깜빡임 ---
  initBlink() {
    const blinkOnce = () => {
      const eyes = document.querySelector("#stage-svg .eyes");
      if (eyes) {
        eyes.classList.add("blink");
        setTimeout(() => eyes.classList.remove("blink"), 140);
      }
      // 다음 깜빡임은 2~6초 사이 랜덤
      setTimeout(blinkOnce, 2000 + Math.random() * 4000);
    };
    setTimeout(blinkOnce, 1800);
  },

  // --- 캐릭터 클릭 → 점프 + 코인 ---
  initClickReward() {
    const stage = document.getElementById("stage");
    const svg = document.getElementById("stage-svg");

    svg.addEventListener("click", (e) => {
      const char = e.target.closest("#char");
      if (!char) return;

      // 점프 애니메이션 (idle과 교대)
      char.classList.remove("jump");
      requestAnimationFrame(() => char.classList.add("jump"));
      char.addEventListener(
        "animationend",
        () => char.classList.remove("jump"),
        { once: true }
      );

      // 코인 지급: 기본 +10, 10% 확률 행운 +100
      const lucky = Math.random() < 0.1;
      const gain = lucky ? 100 : 10;
      State.addCoins(gain);
      updateCoinUI();

      // 클릭 위치에 플로팅 텍스트
      const rect = stage.getBoundingClientRect();
      const label = document.createElement("span");
      label.className = "float-label" + (lucky ? " lucky" : "");
      label.textContent = lucky ? "행운! +100 🍀" : "+10";
      label.style.left = `${e.clientX - rect.left - 10}px`;
      label.style.top = `${e.clientY - rect.top - 20}px`;
      stage.appendChild(label);
      setTimeout(() => label.remove(), 950);
    });
  },
};
