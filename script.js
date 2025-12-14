/* =====================================================
   Cinematic Text Player Pro v4.0
   اسکریپت کامل با کامنت‌گذاری فارسی
   ===================================================== */

/* =====================================================
   1. المان‌های DOM
   ===================================================== */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// المان‌های اصلی
const inputText = $("inputText");
const btnPlay = $("btnPlay");
const btnStop = $("btnStop");
const btnPrev = $("btnPrev");
const btnNext = $("btnNext");
const btnRecord = $("btnRecord");
const btnFullscreen = $("btnFullscreen");

// تنظیمات
const speedRange = $("speedRange");
const speedLabel = $("speedLabel");
const durationInput = $("durationInput");
const durationValue = $("durationValue");
const fontSizeRange = $("fontSizeRange");
const fontSizeValue = $("fontSizeValue");
const transitionSelect = $("transitionSelect");

// افکت‌ها
const typeEffect = $("typeEffect");
const kenburns = $("kenburns");
const particlesEffect = $("particlesEffect");
const vignetteEffect = $("vignetteEffect");
const glowEffect = $("glowEffect");
const grainyEffect = $("grainyEffect");

// پس‌زمینه
const bgImageFile = $("bgImageFile");
const bgImage = $("bgImage");
const bgPreview = $("bgPreview");
const bgPreviewImg = $("bgPreviewImg");
const btnRemoveBg = $("btnRemoveBg");
const bgOpacityRange = $("bgOpacityRange");
const bgOpacityValue = $("bgOpacityValue");
const bgBlurRange = $("bgBlurRange");
const bgBlurValue = $("bgBlurValue");

// صدا
const audioFile = $("audioFile");
const audioToggle = $("audioToggle");
const volumeRange = $("volumeRange");
const volumeLabel = $("volumeLabel");

// Viewport
const viewport = $("viewport");
const sceneStage = $("sceneStage");
const progressBar = $("progressBar");
const currentSceneEl = $("currentScene");
const totalScenesEl = $("totalScenes");
const sceneCount = $("sceneCount");
const timeDisplay = $("timeDisplay");
const statusText = $("statusText");
const statusDot = document.querySelector(".status-dot");

// دیگر المان‌ها
const themeToggle = $("themeToggle");
const particlesCanvas = $("particlesCanvas");
const filmGrain = $("filmGrain");
const vignette = $("vignette");
const wordCount = $("wordCount");
const charCount = $("charCount");
const aiAssistant = $("aiAssistant");
const aiModal = $("aiModal");
const viewportPlay = $("viewportPlay");
const viewportPrev = $("viewportPrev");
const viewportNext = $("viewportNext");

/* =====================================================
   2. State (وضعیت)
   ===================================================== */
let scenes = [];
let current = 0;
let playing = false;
let timer = null;
let startTime = null;
let elapsedTime = 0;
let mediaRecorder = null;
let recordedChunks = [];
let audio = new Audio();
audio.loop = true;
let particlesCtx = null;
let particles = [];
let animationFrame = null;
let bgImageSrc = null;

/* =====================================================
   3. تم (Theme)
   ===================================================== */
function initTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.classList.toggle("dark", theme === "dark");
}

themeToggle?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  setStatus(isDark ? "تم تاریک" : "تم روشن", "success");
});

/* =====================================================
   4. ذرات (Particles)
   ===================================================== */
function initParticles() {
  if (!particlesCanvas) return;
  particlesCanvas.width = viewport.offsetWidth;
  particlesCanvas.height = viewport.offsetHeight;
  particlesCtx = particlesCanvas.getContext("2d");

  particles = [];
  const count = Math.min(100, Math.floor(viewport.offsetWidth / 8));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * particlesCanvas.width,
      y: Math.random() * particlesCanvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
}

function animateParticles() {
  if (!particlesEffect?.checked) {
    particlesCanvas?.classList.remove("active");
    cancelAnimationFrame(animationFrame);
    return;
  }

  particlesCanvas.classList.add("active");
  particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > particlesCanvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > particlesCanvas.height) p.vy *= -1;

    particlesCtx.beginPath();
    particlesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    particlesCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    particlesCtx.fill();

    particles.forEach((p2) => {
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        particlesCtx.beginPath();
        particlesCtx.strokeStyle = `rgba(255, 255, 255, ${
          0.15 * (1 - dist / 100)
        })`;
        particlesCtx.lineWidth = 0.5;
        particlesCtx.moveTo(p.x, p.y);
        particlesCtx.lineTo(p2.x, p2.y);
        particlesCtx.stroke();
      }
    });
  });

  animationFrame = requestAnimationFrame(animateParticles);
}

particlesEffect?.addEventListener("change", () => {
  if (particlesEffect.checked) {
    initParticles();
    animateParticles();
  } else {
    particlesCanvas?.classList.remove("active");
    cancelAnimationFrame(animationFrame);
  }
});

vignetteEffect?.addEventListener("change", () => {
  vignette?.classList.toggle("active", vignetteEffect.checked);
});

grainyEffect?.addEventListener("change", () => {
  filmGrain?.classList.toggle("active", grainyEffect.checked);
});

window.addEventListener("resize", () => {
  if (particlesEffect?.checked) initParticles();
});

/* =====================================================
   5. توابع کمکی
   ===================================================== */
function parseScenes(text) {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function setStatus(text, type = "default") {
  if (!statusText) return;
  statusText.textContent = text;
  if (!statusDot) return;

  statusDot.className = "status-dot w-2 h-2 rounded-full";
  const colors = {
    default: "bg-emerald-500",
    playing: "bg-primary-500 animate-pulse",
    recording: "bg-red-500 animate-pulse",
    success: "bg-emerald-500",
    error: "bg-red-500",
  };
  statusDot.classList.add(colors[type] || colors.default);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function updateSceneCount() {
  scenes = parseScenes(inputText?.value || "");
  if (sceneCount) sceneCount.textContent = `${scenes.length} صحنه`;
  if (totalScenesEl) totalScenesEl.textContent = scenes.length || 1;
  if (currentSceneEl)
    currentSceneEl.textContent = Math.min(current + 1, scenes.length);
  updateWordCount();
}

function updateWordCount() {
  if (!inputText || !wordCount || !charCount) return;
  const text = inputText.value;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  wordCount.textContent = words;
  charCount.textContent = chars;
}

inputText?.addEventListener("input", updateSceneCount);

/* =====================================================
   6. رندر صحنه
   ===================================================== */
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
  if (glowEffect?.checked) m.classList.add("glow");
  if (fontSizeRange) m.style.fontSize = `${fontSizeRange.value}px`;
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
    const delay = 10;
    const step = Math.max(1, Math.floor(len / 50));
    let p = 0;

    const iv = setInterval(() => {
      p += step;
      if (p > len) p = len;
      el.textContent = text.slice(0, p);

      if (p >= len) {
        clearInterval(iv);
        setTimeout(resolve, 150);
      }
    }, delay / speed);
  });
}

async function showScene(i) {
  if (i < 0 || i >= scenes.length || !sceneStage) return;
  current = i;
  sceneStage.innerHTML = "";

  const { container, mainEl } = createSceneElement(scenes[i]);
  sceneStage.appendChild(container);

  const transition = transitionSelect?.value || "fade";
  container.classList.add(`transition-${transition}`, "enter");

  if (kenburns?.checked) {
    const zoom = 1 + Math.random() * 0.06;
    const rx = Math.random() * 12 - 6;
    const ry = Math.random() * 10 - 5;

    container.style.transformOrigin = `${50 + rx}% ${50 + ry}%`;
    container.classList.add("kb-zoom");

    requestAnimationFrame(() => {
      container.style.transform = `scale(${zoom + 0.1})`;
    });
  }

  if (typeEffect?.checked && mainEl) {
    await typeWrite(mainEl, mainEl.textContent, getSpeed());
  }

  updateProgress();

  const durMs = (getSceneDuration() * 1000) / getSpeed();

  return new Promise((resolve) => {
    timer = setTimeout(() => {
      container.classList.remove("enter");
      container.classList.add("exit");
      setTimeout(resolve, 600);
    }, durMs);
  });
}

function getSpeed() {
  return parseFloat(speedRange?.value || 1);
}

function getSceneDuration() {
  return clamp(parseFloat(durationInput?.value || 3), 0.5, 30);
}

/* =====================================================
   7. کنترل پخش
   ===================================================== */
async function playAll(fromIndex = 0) {
  if (playing) return;

  scenes = parseScenes(inputText?.value || "");
  if (!scenes.length) {
    setStatus("هیچ صحنه‌ای وجود ندارد", "error");
    return;
  }

  playing = true;
  startTime = Date.now() - elapsedTime * 1000;
  setStatus("در حال پخش...", "playing");
  updatePlayButton(true);

  const timerInterval = setInterval(() => {
    if (!playing) {
      clearInterval(timerInterval);
      return;
    }
    elapsedTime = (Date.now() - startTime) / 1000;
    if (timeDisplay) timeDisplay.textContent = formatTime(elapsedTime);
  }, 100);

  for (let i = fromIndex; i < scenes.length; i++) {
    if (!playing) break;
    current = i;
    await showScene(i);
  }

  playing = false;
  clearInterval(timerInterval);
  setStatus("پایان پخش", "success");
  updatePlayButton(false);
}

function stopPlayback() {
  playing = false;
  clearTimeout(timer);
  setStatus("متوقف");
  updatePlayButton(false);
}

function updatePlayButton(isPlaying) {
  const playIcon =
    '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  const pauseIcon =
    '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

  if (btnPlay) {
    btnPlay.innerHTML =
      (isPlaying ? pauseIcon : playIcon) +
      "<span>" +
      (isPlaying ? "مکث" : "پخش") +
      "</span>";
  }
  if (viewportPlay) {
    viewportPlay.innerHTML = isPlaying ? pauseIcon : playIcon;
  }
}

async function goTo(index) {
  scenes = parseScenes(inputText?.value || "");
  if (!scenes.length) return;

  index = clamp(index, 0, scenes.length - 1);
  current = index;
  await showScene(index);
  setStatus(`صحنه ${current + 1} از ${scenes.length}`);
}

function updateProgress() {
  const total = scenes.length || 1;
  const pct = Math.round(((current + 1) / total) * 100);
  if (progressBar) progressBar.style.width = pct + "%";
  if (currentSceneEl) currentSceneEl.textContent = current + 1;
  if (totalScenesEl) totalScenesEl.textContent = total;
}

/* =====================================================
   8. تمام صفحه
   ===================================================== */
function toggleFullscreen() {
  if (!viewport) return;

  if (!document.fullscreenElement) {
    viewport
      .requestFullscreen()
      .then(() => {
        viewport.classList.add("fullscreen");
        setStatus("تمام صفحه", "success");
      })
      .catch(() => setStatus("خطا در تمام صفحه", "error"));
  } else {
    document.exitFullscreen().then(() => {
      viewport.classList.remove("fullscreen");
      setStatus("خروج از تمام صفحه");
    });
  }
}

btnFullscreen?.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    viewport?.classList.remove("fullscreen");
  }
});

/* =====================================================
   9. میانبرها
   ===================================================== */
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;

  if (e.code === "Space") {
    e.preventDefault();
    if (playing) stopPlayback();
    else playAll(current);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (playing) clearTimeout(timer);
    goTo(current + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    goTo(current - 1);
  } else if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    toggleFullscreen();
  } else if (e.key === "Escape" && document.fullscreenElement) {
    document.exitFullscreen();
  }
});

/* =====================================================
   10. پس‌زمینه
   ===================================================== */
bgImageFile?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    bgImageSrc = event.target.result;
    if (bgImage) {
      bgImage.src = bgImageSrc;
      bgImage.style.display = "block";
    }
    if (bgPreviewImg) bgPreviewImg.src = bgImageSrc;
    bgPreview?.classList.remove("hidden");
    btnRemoveBg?.classList.remove("hidden");
    applyBgSettings();
    setStatus("پس‌زمینه بارگذاری شد", "success");
  };
  reader.readAsDataURL(file);
});

function applyBgSettings() {
  if (!bgImage) return;
  const opacity = bgOpacityRange?.value || 50;
  const blur = bgBlurRange?.value || 10;
  bgImage.style.opacity = opacity / 100;
  bgImage.style.filter = `blur(${blur}px)`;
}

bgOpacityRange?.addEventListener("input", () => {
  if (bgOpacityValue) bgOpacityValue.textContent = bgOpacityRange.value;
  applyBgSettings();
});

bgBlurRange?.addEventListener("input", () => {
  if (bgBlurValue) bgBlurValue.textContent = bgBlurRange.value;
  applyBgSettings();
});

btnRemoveBg?.addEventListener("click", () => {
  bgImageSrc = null;
  if (bgImage) {
    bgImage.src = "";
    bgImage.style.display = "none";
  }
  bgPreview?.classList.add("hidden");
  btnRemoveBg?.classList.add("hidden");
  if (bgImageFile) bgImageFile.value = "";
  setStatus("پس‌زمینه حذف شد", "success");
});

/* =====================================================
   11. صدا
   ===================================================== */
audioFile?.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;

  audio.src = URL.createObjectURL(f);
  audio.load();
  audio.volume = (volumeRange?.value || 100) / 100;

  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      setStatus("موسیقی بارگذاری شد", "success");
    })
    .catch(() => setStatus("موسیقی آماده", "success"));
});

audioToggle?.addEventListener("click", () => {
  if (!audio.src) {
    setStatus("ابتدا موسیقی انتخاب کنید", "error");
    return;
  }

  if (audio.paused) {
    audio.play();
    setStatus("موسیقی پخش شد", "success");
  } else {
    audio.pause();
    setStatus("موسیقی متوقف شد");
  }
});

volumeRange?.addEventListener("input", () => {
  const vol = volumeRange.value;
  if (volumeLabel) volumeLabel.textContent = vol + "%";
  audio.volume = vol / 100;
});

/* =====================================================
   12. ضبط
   ===================================================== */
btnRecord?.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    setStatus("در حال پایان...", "recording");
    return;
  }

  scenes = parseScenes(inputText?.value || "");
  if (!scenes.length) {
    setStatus("متنی وجود ندارد", "error");
    return;
  }

  if (audio.src && audio.paused) {
    audio.currentTime = 0;
    audio.play();
  }

  const stream = viewport.captureStream(30);

  try {
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(dest);
    source.connect(audioCtx.destination);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch (err) {
    console.warn("Audio mix error:", err);
  }

  recordedChunks = [];
  const options = { mimeType: "video/webm;codecs=vp9,opus" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = "video/webm";
  }

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinematic_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus("ضبط تکمیل شد", "success");

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  mediaRecorder.start();
  setStatus("در حال ضبط...", "recording");

  await playAll(0);

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
});

/* =====================================================
   13. Export/Import
   ===================================================== */
$("btnExport")?.addEventListener("click", () => {
  const settings = {
    text: inputText?.value || "",
    speed: speedRange?.value || 1,
    duration: durationInput?.value || 3,
    fontSize: fontSizeRange?.value || 48,
    transition: transitionSelect?.value || "fade",
    effects: {
      type: typeEffect?.checked || false,
      kenburns: kenburns?.checked || false,
      particles: particlesEffect?.checked || false,
      vignette: vignetteEffect?.checked || false,
      glow: glowEffect?.checked || false,
      grain: grainyEffect?.checked || false,
    },
    background: {
      opacity: bgOpacityRange?.value || 50,
      blur: bgBlurRange?.value || 10,
      image: bgImageSrc,
    },
    audio: {
      volume: volumeRange?.value || 100,
    },
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

  setStatus("تنظیمات خروجی گرفته شد", "success");
});

$("btnImport")?.addEventListener("click", () => {
  $("importFile")?.click();
});

$("importFile")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const settings = JSON.parse(event.target.result);

      if (inputText && settings.text) inputText.value = settings.text;
      if (speedRange && settings.speed) speedRange.value = settings.speed;
      if (durationInput && settings.duration)
        durationInput.value = settings.duration;
      if (fontSizeRange && settings.fontSize)
        fontSizeRange.value = settings.fontSize;
      if (transitionSelect && settings.transition)
        transitionSelect.value = settings.transition;

      if (settings.effects) {
        if (typeEffect) typeEffect.checked = settings.effects.type;
        if (kenburns) kenburns.checked = settings.effects.kenburns;
        if (particlesEffect)
          particlesEffect.checked = settings.effects.particles;
        if (vignetteEffect) vignetteEffect.checked = settings.effects.vignette;
        if (glowEffect) glowEffect.checked = settings.effects.glow;
        if (grainyEffect) grainyEffect.checked = settings.effects.grain;
      }

      if (settings.background) {
        if (bgOpacityRange) bgOpacityRange.value = settings.background.opacity;
        if (bgBlurRange) bgBlurRange.value = settings.background.blur;
        if (settings.background.image) {
          bgImageSrc = settings.background.image;
          if (bgImage) {
            bgImage.src = bgImageSrc;
            bgImage.style.display = "block";
          }
          if (bgPreviewImg) bgPreviewImg.src = bgImageSrc;
          bgPreview?.classList.remove("hidden");
          btnRemoveBg?.classList.remove("hidden");
        }
      }

      if (settings.audio && volumeRange) {
        volumeRange.value = settings.audio.volume;
      }

      if (speedLabel) speedLabel.textContent = (speedRange?.value || 1) + "×";
      if (durationValue)
        durationValue.textContent = parseFloat(
          durationInput?.value || 3
        ).toFixed(1);
      if (fontSizeValue) fontSizeValue.textContent = fontSizeRange?.value || 48;
      if (volumeLabel)
        volumeLabel.textContent = (volumeRange?.value || 100) + "%";
      if (bgOpacityValue)
        bgOpacityValue.textContent = bgOpacityRange?.value || 50;
      if (bgBlurValue) bgBlurValue.textContent = bgBlurRange?.value || 10;

      updateSceneCount();
      applyBgSettings();

      setStatus("تنظیمات بارگذاری شد", "success");
    } catch (err) {
      setStatus("خطا در بارگذاری", "error");
      console.error(err);
    }
  };
  reader.readAsText(file);

  if ($("importFile")) $("importFile").value = "";
});

/* =====================================================
   14. قالب‌ها
   ===================================================== */
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

$$(".template-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const template = btn.dataset.template;
    if (inputText && templates[template]) {
      inputText.value = templates[template];
      updateSceneCount();
      setStatus(`قالب ${template} بارگذاری شد`, "success");
    }
  });
});

/* =====================================================
   15. تب‌ها
   ===================================================== */
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

/* =====================================================
   16. دکمه‌ها
   ===================================================== */
btnPlay?.addEventListener("click", () => {
  if (!playing) playAll(current);
  else stopPlayback();
});

btnStop?.addEventListener("click", stopPlayback);
btnPrev?.addEventListener("click", () => goTo(current - 1));
btnNext?.addEventListener("click", () => goTo(current + 1));

viewportPlay?.addEventListener("click", () => {
  if (!playing) playAll(current);
  else stopPlayback();
});

viewportPrev?.addEventListener("click", () => goTo(current - 1));
viewportNext?.addEventListener("click", () => goTo(current + 1));

speedRange?.addEventListener("input", () => {
  if (speedLabel) speedLabel.textContent = speedRange.value + "×";
});

durationInput?.addEventListener("input", () => {
  const val = parseFloat(durationInput.value);
  if (durationValue) durationValue.textContent = val.toFixed(1);
});

fontSizeRange?.addEventListener("input", () => {
  if (fontSizeValue) fontSizeValue.textContent = fontSizeRange.value;
});

/* =====================================================
   17. AI Modal
   ===================================================== */
aiAssistant?.addEventListener("click", () => {
  aiModal?.classList.remove("hidden");
});

$("closeAiModal")?.addEventListener("click", () => {
  aiModal?.classList.add("hidden");
});

$("aiCancelBtn")?.addEventListener("click", () => {
  aiModal?.classList.add("hidden");
});

$("aiGenerateBtn")?.addEventListener("click", () => {
  const prompt = $("aiPrompt")?.value;
  if (!prompt) {
    setStatus("لطفاً توضیحات را وارد کنید", "error");
    return;
  }

  // شبیه‌سازی تولید AI
  setStatus("در حال تولید با AI...", "playing");

  setTimeout(() => {
    const aiGenerated = `صحنه AI: ${prompt}
تصویر: تولید شده با هوش مصنوعی
پایان: صحنه پایان می‌یابد`;

    if (inputText) {
      inputText.value += (inputText.value ? "\n\n" : "") + aiGenerated;
      updateSceneCount();
    }

    aiModal?.classList.add("hidden");
    setStatus("محتوای AI تولید شد", "success");
  }, 1500);
});

$("btnAiGenerate")?.addEventListener("click", () => {
  aiModal?.classList.remove("hidden");
});

$("btnAiOptimize")?.addEventListener("click", () => {
  scenes = parseScenes(inputText?.value || "");
  if (!scenes.length) {
    setStatus("متنی وجود ندارد", "error");
    return;
  }

  setStatus("در حال بهینه‌سازی...", "playing");

  setTimeout(() => {
    // بهینه‌سازی ساده: حذف خطوط خالی اضافی
    if (inputText) {
      inputText.value = inputText.value.replace(/\n{3,}/g, "\n\n").trim();
      updateSceneCount();
    }
    setStatus("متن بهینه شد", "success");
  }, 1000);
});

/* =====================================================
   18. مقداردهی اولیه
   ===================================================== */
function init() {
  initTheme();

  if (inputText && !inputText.value.trim()) {
    inputText.value = templates.movie;
  }

  updateSceneCount();
  scenes = parseScenes(inputText?.value || "");

  if (scenes.length && sceneStage) {
    showScene(0);
    setStatus("آماده برای پخش", "success");
  }

  if (vignetteEffect?.checked) {
    vignette?.classList.add("active");
  }

  elapsedTime = 0;
  if (timeDisplay) timeDisplay.textContent = "00:00";

  // شبیه‌سازی آمار
  const updateStats = () => {
    const visitors = $("visitors");
    const projectCount = $("projectCount");
    if (visitors) visitors.textContent = Math.floor(Math.random() * 500 + 1000);
    if (projectCount)
      projectCount.textContent = Math.floor(Math.random() * 50 + 50);
  };
  updateStats();
  setInterval(updateStats, 5000);

  console.log(
    "%c🎬 Cinematic Text Player Pro v4.0",
    "color: #ff6b6b; font-size: 18px; font-weight: bold;"
  );
  console.log("%c✨ تمام سیستم‌ها آماده!", "color: #4ecdc4; font-size: 14px;");
}

// شروع
init();
