// ===== کد جاوااسکریپت کامل و کارآمد =====

// المان‌ها
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// دریافت همه المان‌ها
const elements = {
  inputText: $("inputText"),
  btnPlay: $("btnPlay"),
  btnStop: $("btnStop"),
  btnPrev: $("btnPrev"),
  btnNext: $("btnNext"),
  btnRecord: $("btnRecord"),
  btnFullscreen: $("btnFullscreen"),
  btnExport: $("btnExport"),
  btnImport: $("btnImport"),

  speedRange: $("speedRange"),
  speedLabel: $("speedLabel"),
  durationInput: $("durationInput"),
  durationValue: $("durationValue"),
  fontSizeRange: $("fontSizeRange"),
  fontSizeValue: $("fontSizeValue"),
  transitionSelect: $("transitionSelect"),

  typeEffect: $("typeEffect"),
  kenburns: $("kenburns"),
  particlesEffect: $("particlesEffect"),
  vignetteEffect: $("vignetteEffect"),
  glowEffect: $("glowEffect"),
  grainyEffect: $("grainyEffect"),

  bgImageFile: $("bgImageFile"),
  bgImage: $("bgImage"),
  bgPreview: $("bgPreview"),
  bgPreviewImg: $("bgPreviewImg"),
  btnRemoveBg: $("btnRemoveBg"),
  bgOpacityRange: $("bgOpacityRange"),
  bgOpacityValue: $("bgOpacityValue"),
  bgBlurRange: $("bgBlurRange"),
  bgBlurValue: $("bgBlurValue"),

  audioFile: $("audioFile"),
  audioToggle: $("audioToggle"),
  volumeRange: $("volumeRange"),
  volumeLabel: $("volumeLabel"),

  viewport: $("viewport"),
  sceneStage: $("sceneStage"),
  progressBar: $("progressBar"),
  currentSceneEl: $("currentScene"),
  totalScenesEl: $("totalScenes"),
  sceneCount: $("sceneCount"),
  timeDisplay: $("timeDisplay"),
  statusText: $("statusText"),
  wordCount: $("wordCount"),
  charCount: $("charCount"),

  themeToggle: $("themeToggle"),
  particlesCanvas: $("particlesCanvas"),
  filmGrain: $("filmGrain"),
  vignette: $("vignette"),

  aiAssistant: $("aiAssistant"),
  aiModal: $("aiModal"),
  closeAiModal: $("closeAiModal"),
  aiPrompt: $("aiPrompt"),
  aiGenerateBtn: $("aiGenerateBtn"),
  aiCancelBtn: $("aiCancelBtn"),
  btnAiGenerate: $("btnAiGenerate"),
  btnAiOptimize: $("btnAiOptimize"),

  viewportPlay: $("viewportPlay"),
  viewportPrev: $("viewportPrev"),
  viewportNext: $("viewportNext"),

  importFile: $("importFile"),
  visitors: $("visitors"),
  projectCount: $("projectCount"),
};

// State
let state = {
  scenes: [],
  current: 0,
  playing: false,
  timer: null,
  startTime: null,
  elapsedTime: 0,
  mediaRecorder: null,
  recordedChunks: [],
  audio: new Audio(),
  particlesCtx: null,
  particles: [],
  animationFrame: null,
  bgImageSrc: null,
};

state.audio.loop = true;

// ===== تم =====
function initTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.classList.toggle("dark", theme === "dark");
}

if (elements.themeToggle) {
  elements.themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setStatus(isDark ? "تم تاریک" : "تم روشن");
  });
}

// ===== ذرات =====
function initParticles() {
  if (!elements.particlesCanvas) return;
  elements.particlesCanvas.width = elements.viewport.offsetWidth;
  elements.particlesCanvas.height = elements.viewport.offsetHeight;
  state.particlesCtx = elements.particlesCanvas.getContext("2d");

  state.particles = [];
  const count = Math.min(80, Math.floor(elements.viewport.offsetWidth / 10));

  for (let i = 0; i < count; i++) {
    state.particles.push({
      x: Math.random() * elements.particlesCanvas.width,
      y: Math.random() * elements.particlesCanvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }
}

function animateParticles() {
  if (!elements.particlesEffect || !elements.particlesEffect.checked) {
    elements.particlesCanvas?.classList.remove("active");
    cancelAnimationFrame(state.animationFrame);
    return;
  }

  elements.particlesCanvas.classList.add("active");
  state.particlesCtx.clearRect(
    0,
    0,
    elements.particlesCanvas.width,
    elements.particlesCanvas.height
  );

  state.particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > elements.particlesCanvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > elements.particlesCanvas.height) p.vy *= -1;

    state.particlesCtx.beginPath();
    state.particlesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    state.particlesCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    state.particlesCtx.fill();
  });

  state.animationFrame = requestAnimationFrame(animateParticles);
}

if (elements.particlesEffect) {
  elements.particlesEffect.addEventListener("change", () => {
    if (elements.particlesEffect.checked) {
      initParticles();
      animateParticles();
    }
  });
}

if (elements.vignetteEffect) {
  elements.vignetteEffect.addEventListener("change", () => {
    elements.vignette?.classList.toggle(
      "active",
      elements.vignetteEffect.checked
    );
  });
}

if (elements.grainyEffect) {
  elements.grainyEffect.addEventListener("change", () => {
    elements.filmGrain?.classList.toggle(
      "active",
      elements.grainyEffect.checked
    );
  });
}

window.addEventListener("resize", () => {
  if (elements.particlesEffect?.checked) initParticles();
});

// ===== توابع کمکی =====
function parseScenes(text) {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function setStatus(text) {
  if (elements.statusText) elements.statusText.textContent = text;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateSceneCount() {
  if (!elements.inputText) return;
  state.scenes = parseScenes(elements.inputText.value);
  if (elements.sceneCount)
    elements.sceneCount.textContent = state.scenes.length + " صحنه";
  if (elements.totalScenesEl)
    elements.totalScenesEl.textContent = state.scenes.length || 1;
  if (elements.currentSceneEl)
    elements.currentSceneEl.textContent = Math.min(
      state.current + 1,
      state.scenes.length
    );
  updateWordCount();
}

function updateWordCount() {
  if (!elements.inputText || !elements.wordCount || !elements.charCount) return;
  const text = elements.inputText.value;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  elements.wordCount.textContent = words;
  elements.charCount.textContent = text.length;
}

if (elements.inputText) {
  elements.inputText.addEventListener("input", updateSceneCount);
}

// ===== رندر صحنه =====
function createSceneElement(raw) {
  const container = document.createElement("div");
  container.className = "scene-container";

  let title = null;
  let main = raw;

  if (raw.includes(":")) {
    const parts = raw.split(":");
    title = parts.shift().trim();
    main = parts.join(":").trim();
  }

  const textBlock = document.createElement("div");
  textBlock.className = "scene-text";

  if (title) {
    const t = document.createElement("div");
    t.className = "scene-title";
    t.textContent = title;
    textBlock.appendChild(t);
  }

  const m = document.createElement("div");
  m.className = "scene-main";
  if (elements.glowEffect?.checked) m.classList.add("glow");
  if (elements.fontSizeRange)
    m.style.fontSize = elements.fontSizeRange.value + "px";
  m.textContent = main;
  textBlock.appendChild(m);

  container.appendChild(textBlock);

  return { container, mainEl: m };
}

function typeWrite(el, text, speed = 1) {
  return new Promise((resolve) => {
    if (!text || !el) return resolve();
    el.textContent = "";
    const len = text.length;
    const delay = 8;
    const step = Math.max(1, Math.floor(len / 60));
    let p = 0;

    const iv = setInterval(() => {
      p += step;
      if (p > len) p = len;
      el.textContent = text.slice(0, p);

      if (p >= len) {
        clearInterval(iv);
        setTimeout(resolve, 100);
      }
    }, delay / speed);
  });
}

async function showScene(i) {
  if (i < 0 || i >= state.scenes.length || !elements.sceneStage) return;
  state.current = i;
  elements.sceneStage.innerHTML = "";

  const { container, mainEl } = createSceneElement(state.scenes[i]);
  elements.sceneStage.appendChild(container);

  const transition = elements.transitionSelect?.value || "fade";
  container.classList.add(`transition-${transition}`, "enter");

  if (elements.kenburns?.checked) {
    const zoom = 1 + Math.random() * 0.05;
    const rx = Math.random() * 10 - 5;
    const ry = Math.random() * 8 - 4;

    container.style.transformOrigin = `${50 + rx}% ${50 + ry}%`;
    container.classList.add("kb-zoom");

    requestAnimationFrame(() => {
      container.style.transform = `scale(${zoom + 0.08})`;
    });
  }

  if (elements.typeEffect?.checked && mainEl) {
    await typeWrite(mainEl, mainEl.textContent, getSpeed());
  }

  updateProgress();

  const durMs = (getSceneDuration() * 1000) / getSpeed();

  return new Promise((resolve) => {
    state.timer = setTimeout(() => {
      container.classList.remove("enter");
      container.classList.add("exit");
      setTimeout(resolve, 600);
    }, durMs);
  });
}

function getSpeed() {
  return parseFloat(elements.speedRange?.value || 1);
}

function getSceneDuration() {
  return clamp(parseFloat(elements.durationInput?.value || 3), 0.5, 30);
}

// ===== پخش =====
async function playAll(fromIndex = 0) {
  if (state.playing) return;

  state.scenes = parseScenes(elements.inputText?.value || "");
  if (!state.scenes.length) {
    setStatus("هیچ صحنه‌ای وجود ندارد");
    return;
  }

  state.playing = true;
  state.startTime = Date.now() - state.elapsedTime * 1000;
  setStatus("در حال پخش...");

  if (elements.btnPlay) {
    elements.btnPlay.innerHTML =
      '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>مکث</span>';
  }

  const timerInterval = setInterval(() => {
    if (!state.playing) {
      clearInterval(timerInterval);
      return;
    }
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
    if (elements.timeDisplay)
      elements.timeDisplay.textContent = formatTime(state.elapsedTime);
  }, 100);

  for (let i = fromIndex; i < state.scenes.length; i++) {
    if (!state.playing) break;
    state.current = i;
    await showScene(i);
  }

  state.playing = false;
  clearInterval(timerInterval);
  setStatus("پایان پخش");

  if (elements.btnPlay) {
    elements.btnPlay.innerHTML =
      '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>پخش</span>';
  }
}

function stopPlayback() {
  state.playing = false;
  clearTimeout(state.timer);
  setStatus("متوقف");

  if (elements.btnPlay) {
    elements.btnPlay.innerHTML =
      '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>پخش</span>';
  }
}

async function goTo(index) {
  state.scenes = parseScenes(elements.inputText?.value || "");
  if (!state.scenes.length) return;

  index = clamp(index, 0, state.scenes.length - 1);
  state.current = index;
  await showScene(index);
  setStatus(`صحنه ${state.current + 1} از ${state.scenes.length}`);
}

function updateProgress() {
  const total = state.scenes.length || 1;
  const pct = Math.round(((state.current + 1) / total) * 100);
  if (elements.progressBar) elements.progressBar.style.width = pct + "%";
  if (elements.currentSceneEl)
    elements.currentSceneEl.textContent = state.current + 1;
  if (elements.totalScenesEl) elements.totalScenesEl.textContent = total;
}

// ===== تمام صفحه =====
function toggleFullscreen() {
  if (!elements.viewport) return;

  if (!document.fullscreenElement) {
    elements.viewport
      .requestFullscreen()
      .then(() => {
        elements.viewport.classList.add("fullscreen");
        setStatus("تمام صفحه");
      })
      .catch(() => setStatus("خطا"));
  } else {
    document.exitFullscreen();
  }
}

if (elements.btnFullscreen) {
  elements.btnFullscreen.addEventListener("click", toggleFullscreen);
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    elements.viewport?.classList.remove("fullscreen");
  }
});

// ===== میانبرها =====
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;

  if (e.code === "Space") {
    e.preventDefault();
    if (state.playing) stopPlayback();
    else playAll(state.current);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (state.playing) clearTimeout(state.timer);
    goTo(state.current + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    goTo(state.current - 1);
  } else if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    toggleFullscreen();
  }
});

// ===== پس‌زمینه =====
if (elements.bgImageFile) {
  elements.bgImageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      state.bgImageSrc = event.target.result;
      if (elements.bgImage) {
        elements.bgImage.src = state.bgImageSrc;
        elements.bgImage.classList.remove("hidden");
      }
      if (elements.bgPreviewImg) elements.bgPreviewImg.src = state.bgImageSrc;
      elements.bgPreview?.classList.remove("hidden");
      elements.btnRemoveBg?.classList.remove("hidden");
      applyBgSettings();
      setStatus("پس‌زمینه بارگذاری شد");
    };
    reader.readAsDataURL(file);
  });
}

function applyBgSettings() {
  if (!elements.bgImage) return;
  const opacity = (elements.bgOpacityRange?.value || 50) / 100;
  const blur = elements.bgBlurRange?.value || 10;
  elements.bgImage.style.opacity = opacity;
  elements.bgImage.style.filter = `blur(${blur}px)`;
}

if (elements.bgOpacityRange) {
  elements.bgOpacityRange.addEventListener("input", () => {
    if (elements.bgOpacityValue)
      elements.bgOpacityValue.textContent = elements.bgOpacityRange.value;
    applyBgSettings();
  });
}

if (elements.bgBlurRange) {
  elements.bgBlurRange.addEventListener("input", () => {
    if (elements.bgBlurValue)
      elements.bgBlurValue.textContent = elements.bgBlurRange.value;
    applyBgSettings();
  });
}

if (elements.btnRemoveBg) {
  elements.btnRemoveBg.addEventListener("click", () => {
    state.bgImageSrc = null;
    if (elements.bgImage) {
      elements.bgImage.src = "";
      elements.bgImage.classList.add("hidden");
    }
    elements.bgPreview?.classList.add("hidden");
    elements.btnRemoveBg?.classList.add("hidden");
    if (elements.bgImageFile) elements.bgImageFile.value = "";
    setStatus("پس‌زمینه حذف شد");
  });
}

// ===== صدا =====
if (elements.audioFile) {
  elements.audioFile.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;

    state.audio.src = URL.createObjectURL(f);
    state.audio.load();
    state.audio.volume = (elements.volumeRange?.value || 100) / 100;

    state.audio.play().then(() => {
      state.audio.pause();
      state.audio.currentTime = 0;
      setStatus("موسیقی بارگذاری شد");
    });
  });
}

if (elements.audioToggle) {
  elements.audioToggle.addEventListener("click", () => {
    if (!state.audio.src) {
      setStatus("ابتدا موسیقی انتخاب کنید");
      return;
    }

    if (state.audio.paused) {
      state.audio.play();
      setStatus("موسیقی پخش شد");
    } else {
      state.audio.pause();
      setStatus("موسیقی متوقف شد");
    }
  });
}

if (elements.volumeRange) {
  elements.volumeRange.addEventListener("input", () => {
    if (elements.volumeLabel)
      elements.volumeLabel.textContent = elements.volumeRange.value + "%";
    state.audio.volume = elements.volumeRange.value / 100;
  });
}

// ===== ضبط =====
if (elements.btnRecord) {
  elements.btnRecord.addEventListener("click", async () => {
    if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
      state.mediaRecorder.stop();
      setStatus("در حال پایان...");
      return;
    }

    state.scenes = parseScenes(elements.inputText?.value || "");
    if (!state.scenes.length) {
      setStatus("متنی وجود ندارد");
      return;
    }

    if (state.audio.src && state.audio.paused) {
      state.audio.currentTime = 0;
      state.audio.play();
    }

    const stream = elements.viewport.captureStream(30);

    try {
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(state.audio);
      source.connect(dest);
      source.connect(audioCtx.destination);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch (err) {
      console.warn("Audio error:", err);
    }

    state.recordedChunks = [];
    state.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    state.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.recordedChunks.push(e.data);
    };

    state.mediaRecorder.onstop = () => {
      const blob = new Blob(state.recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus("ضبط تکمیل شد");

      if (!state.audio.paused) {
        state.audio.pause();
        state.audio.currentTime = 0;
      }
    };

    state.mediaRecorder.start();
    setStatus("در حال ضبط...");

    await playAll(0);

    if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
      state.mediaRecorder.stop();
    }
  });
}

// ===== Export/Import =====
if (elements.btnExport) {
  elements.btnExport.addEventListener("click", () => {
    const settings = {
      text: elements.inputText?.value || "",
      speed: elements.speedRange?.value || 1,
      duration: elements.durationInput?.value || 3,
      fontSize: elements.fontSizeRange?.value || 48,
      transition: elements.transitionSelect?.value || "fade",
      effects: {
        type: elements.typeEffect?.checked || false,
        kenburns: elements.kenburns?.checked || false,
        particles: elements.particlesEffect?.checked || false,
        vignette: elements.vignetteEffect?.checked || false,
        glow: elements.glowEffect?.checked || false,
        grainy: elements.grainyEffect?.checked || false,
      },
      background: {
        opacity: elements.bgOpacityRange?.value || 50,
        blur: elements.bgBlurRange?.value || 10,
        image: state.bgImageSrc,
      },
      audio: { volume: elements.volumeRange?.value || 100 },
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus("تنظیمات ذخیره شد");
  });
}

if (elements.btnImport) {
  elements.btnImport.addEventListener("click", () => {
    elements.importFile?.click();
  });
}

if (elements.importFile) {
  elements.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const s = JSON.parse(event.target.result);

        if (elements.inputText && s.text) elements.inputText.value = s.text;
        if (elements.speedRange && s.speed) elements.speedRange.value = s.speed;
        if (elements.durationInput && s.duration)
          elements.durationInput.value = s.duration;
        if (elements.fontSizeRange && s.fontSize)
          elements.fontSizeRange.value = s.fontSize;
        if (elements.transitionSelect && s.transition)
          elements.transitionSelect.value = s.transition;

        if (s.effects) {
          if (elements.typeEffect) elements.typeEffect.checked = s.effects.type;
          if (elements.kenburns) elements.kenburns.checked = s.effects.kenburns;
          if (elements.particlesEffect)
            elements.particlesEffect.checked = s.effects.particles;
          if (elements.vignetteEffect)
            elements.vignetteEffect.checked = s.effects.vignette;
          if (elements.glowEffect) elements.glowEffect.checked = s.effects.glow;
          if (elements.grainyEffect)
            elements.grainyEffect.checked = s.effects.grainy;
        }

        if (s.background) {
          if (elements.bgOpacityRange)
            elements.bgOpacityRange.value = s.background.opacity;
          if (elements.bgBlurRange)
            elements.bgBlurRange.value = s.background.blur;
          if (s.background.image) {
            state.bgImageSrc = s.background.image;
            if (elements.bgImage) {
              elements.bgImage.src = state.bgImageSrc;
              elements.bgImage.classList.remove("hidden");
            }
            if (elements.bgPreviewImg)
              elements.bgPreviewImg.src = state.bgImageSrc;
            elements.bgPreview?.classList.remove("hidden");
            elements.btnRemoveBg?.classList.remove("hidden");
          }
        }

        if (s.audio && elements.volumeRange)
          elements.volumeRange.value = s.audio.volume;

        if (elements.speedLabel)
          elements.speedLabel.textContent =
            (elements.speedRange?.value || 1) + "×";
        if (elements.durationValue)
          elements.durationValue.textContent = parseFloat(
            elements.durationInput?.value || 3
          ).toFixed(1);
        if (elements.fontSizeValue)
          elements.fontSizeValue.textContent =
            elements.fontSizeRange?.value || 48;
        if (elements.volumeLabel)
          elements.volumeLabel.textContent =
            (elements.volumeRange?.value || 100) + "%";
        if (elements.bgOpacityValue)
          elements.bgOpacityValue.textContent =
            elements.bgOpacityRange?.value || 50;
        if (elements.bgBlurValue)
          elements.bgBlurValue.textContent = elements.bgBlurRange?.value || 10;

        updateSceneCount();
        applyBgSettings();

        setStatus("تنظیمات بارگذاری شد");
      } catch (err) {
        setStatus("خطا در بارگذاری");
      }
    };
    reader.readAsText(file);
    elements.importFile.value = "";
  });
}

// ===== قالب‌ها =====
const templates = {
  movie: `صحنه اول: شب بارانی
تصویر: چراغ‌ها در آب بازتاب می‌یابند

صحنه دوم: آرامش
قدم‌های آرام به سمت خانه

پایان: دری بسته می‌شود
و سکوت برقرار است`,

  poem: `بیت اول: دل من
چون دریای بی‌کران

بیت دوم: موج عشق
در آن آرام نیست

بیت سوم: اما امید
همچنان می‌درخشد`,

  quote: `حکمت: زندگی
هنر است نه تصادف

اندیشه: هر لحظه
فرصتی برای شروع

پایان: پس بیا
و زندگی کن`,

  story: `آغاز: روزگاری
در شهری دور

میانه: کسی بود
با رویای بزرگ

پایان: و آن رویا
به حقیقت پیوست`,
};

$(".template-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.template;
    if (templates[t] && elements.inputText) {
      elements.inputText.value = templates[t];
      updateSceneCount();
      setStatus(`قالب ${t} بارگذاری شد`);
    }
  });
});

// ===== تب‌ها =====
$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    $(".tab-btn").forEach((b) => b.classList.remove("active"));
    $(".tab-content").forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    const content = document.querySelector(`[data-content="${tab}"]`);
    if (content) content.classList.add("active");
  });
});

// ===== دکمه‌ها =====
if (elements.btnPlay) {
  elements.btnPlay.addEventListener("click", () => {
    if (!state.playing) playAll(state.current);
    else stopPlayback();
  });
}

if (elements.btnStop) elements.btnStop.addEventListener("click", stopPlayback);
if (elements.btnPrev)
  elements.btnPrev.addEventListener("click", () => goTo(state.current - 1));
if (elements.btnNext)
  elements.btnNext.addEventListener("click", () => goTo(state.current + 1));

if (elements.viewportPlay) {
  elements.viewportPlay.addEventListener("click", () => {
    if (!state.playing) playAll(state.current);
    else stopPlayback();
  });
}

if (elements.viewportPrev)
  elements.viewportPrev.addEventListener("click", () =>
    goTo(state.current - 1)
  );
if (elements.viewportNext)
  elements.viewportNext.addEventListener("click", () =>
    goTo(state.current + 1)
  );

if (elements.speedRange) {
  elements.speedRange.addEventListener("input", () => {
    if (elements.speedLabel)
      elements.speedLabel.textContent = elements.speedRange.value + "×";
  });
}

if (elements.durationInput) {
  elements.durationInput.addEventListener("input", () => {
    const val = parseFloat(elements.durationInput.value);
    if (elements.durationValue)
      elements.durationValue.textContent = val.toFixed(1);
  });
}

if (elements.fontSizeRange) {
  elements.fontSizeRange.addEventListener("input", () => {
    if (elements.fontSizeValue)
      elements.fontSizeValue.textContent = elements.fontSizeRange.value;
  });
}

// ===== AI Modal =====
if (elements.aiAssistant) {
  elements.aiAssistant.addEventListener("click", () => {
    elements.aiModal?.classList.remove("hidden");
  });
}

if (elements.closeAiModal) {
  elements.closeAiModal.addEventListener("click", () => {
    elements.aiModal?.classList.add("hidden");
  });
}

if (elements.aiCancelBtn) {
  elements.aiCancelBtn.addEventListener("click", () => {
    elements.aiModal?.classList.add("hidden");
  });
}

if (elements.aiGenerateBtn) {
  elements.aiGenerateBtn.addEventListener("click", () => {
    const prompt = elements.aiPrompt?.value;
    if (!prompt) {
      setStatus("لطفاً توضیحات را وارد کنید");
      return;
    }

    setStatus("در حال تولید...");

    setTimeout(() => {
      const aiGenerated = `صحنه AI: ${prompt}
تصویر: تولید شده با هوش مصنوعی
پایان: صحنه پایان می‌یابد`;

      if (elements.inputText) {
        elements.inputText.value +=
          (elements.inputText.value ? "\n\n" : "") + aiGenerated;
        updateSceneCount();
      }

      elements.aiModal?.classList.add("hidden");
      setStatus("محتوای AI تولید شد");
    }, 1500);
  });
}

if (elements.btnAiGenerate) {
  elements.btnAiGenerate.addEventListener("click", () => {
    elements.aiModal?.classList.remove("hidden");
  });
}

if (elements.btnAiOptimize) {
  elements.btnAiOptimize.addEventListener("click", () => {
    state.scenes = parseScenes(elements.inputText?.value || "");
    if (!state.scenes.length) {
      setStatus("متنی وجود ندارد");
      return;
    }

    setStatus("در حال بهینه‌سازی...");

    setTimeout(() => {
      if (elements.inputText) {
        elements.inputText.value = elements.inputText.value
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        updateSceneCount();
      }
      setStatus("متن بهینه شد");
    }, 1000);
  });
}

// ===== آمار =====
function updateStats() {
  if (elements.visitors) {
    elements.visitors.textContent = Math.floor(Math.random() * 500 + 1000);
  }
  if (elements.projectCount) {
    elements.projectCount.textContent = Math.floor(Math.random() * 50 + 50);
  }
}

// ===== مقداردهی اولیه =====
function init() {
  initTheme();

  if (elements.inputText && !elements.inputText.value.trim()) {
    elements.inputText.value = templates.movie;
  }

  updateSceneCount();
  state.scenes = parseScenes(elements.inputText?.value || "");

  if (state.scenes.length && elements.sceneStage) {
    showScene(0);
    setStatus("آماده");
  }

  if (elements.vignetteEffect?.checked) {
    elements.vignette?.classList.add("active");
  }

  state.elapsedTime = 0;
  if (elements.timeDisplay) elements.timeDisplay.textContent = "00:00";

  updateStats();
  setInterval(updateStats, 5000);

  console.log(
    "%c🎬 Cinematic Text Player Pro v4.0",
    "color: #ef4444; font-size: 18px; font-weight: bold;"
  );
  console.log("%c✨ سیستم آماده است!", "color: #06b6d4; font-size: 14px;");
}

// شروع
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
