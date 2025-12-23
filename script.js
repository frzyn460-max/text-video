// اعمال فیلترهای رنگی
// ============================================
function applyColorFilters() {
  if (!els.viewport) return;
  const brightness = state.settings.brightness / 100;
  const contrast = state.settings.contrast / 100;
  const saturation = state.settings.saturation / 100;
  els.viewport.style.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

// ============================================
// اعمال نسبت تصویر
// ============================================
function applyAspectRatio() {
  if (!els.viewport) return;
  const ratio = state.settings.aspectRatio;
  const ratioMap = {
    "16:9": "16 / 9",
    "21:9": "21 / 9",
    "4:3": "4 / 3",
    "1:1": "1 / 1",
  };
  if (ratioMap[ratio]) {
    els.viewport.style.aspectRatio = ratioMap[ratio];
  }
}

// ============================================
// میانبرهای کیبورد
// ============================================
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        state.isPlaying ? (state.isPaused ? play() : pause()) : play();
        break;
      case "ArrowLeft":
        e.preventDefault();
        nextScene();
        break;
      case "ArrowRight":
        e.preventDefault();
        prevScene();
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "Escape":
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });
}

// ============================================
// پارس کردن صحنه‌ها
// ============================================
function parseScenes() {
  if (!els.inputText) return;
  const text = els.inputText.value.trim();

  if (!text) {
    state.scenes = [];
    updateSceneCount();
    return;
  }

  const sceneBlocks = text.split(/(?=صحنه)/);

  state.scenes = sceneBlocks
    .map((block) => {
      const lines = block.trim().split("\n").filter((l) => l.trim());
      if (lines.length === 0) return null;

      const title = lines[0].replace(/صحنه.*?:/i, "").trim();
      const content = lines
        .slice(1)
        .join(" ")
        .replace(/تصویر:|صدا:/gi, "")
        .trim();

      return { title, content };
    })
    .filter(Boolean);

  updateSceneCount();
}

// ============================================
// به‌روزرسانی آمار متن
// ============================================
function updateStats() {
  if (!els.inputText) return;
  const text = els.inputText.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  if (els.wordCount) els.wordCount.textContent = words;
  if (els.charCount) els.charCount.textContent = chars;
}

// ============================================
// به‌روزرسانی تعداد صحنه‌ها
// ============================================
function updateSceneCount() {
  const count = state.scenes.length;
  if (els.sceneCount) els.sceneCount.textContent = `${count} صحنه`;
  if (els.totalScenes) els.totalScenes.textContent = count;

  if (count > 0) {
    if (els.currentScene) els.currentScene.textContent = Math.min(state.currentScene + 1, count);
  } else {
    if (els.currentScene) els.currentScene.textContent = "0";
  }
}

// ============================================
// پخش صحنه‌ها
// ============================================
async function play() {
  if (state.scenes.length === 0) {
    showStatus("لطفاً ابتدا متن صحنه‌ها را وارد کنید", "error");
    return;
  }

  if (state.isPaused) {
    state.isPaused = false;
    state.isPlaying = true;
    updatePlayButton();
    showStatus("ادامه پخش...", "playing");
    await continuePlayback();
    return;
  }

  state.isPlaying = true;
  state.isPaused = false;
  updatePlayButton();
  showStatus("در حال پخش...", "playing");

  if (state.audio && state.audio.paused) {
    state.audio.play().catch(err => console.log("خطا در پخش موسیقی:", err));
  }

  await continuePlayback();
}

// ============================================
// ادامه پخش
// ============================================
async function continuePlayback() {
  for (let i = state.currentScene; i < state.scenes.length; i++) {
    if (!state.isPlaying || state.isPaused) break;

    state.currentScene = i;
    updateSceneCount();

    await showScene(state.scenes[i], i);

    if (i < state.scenes.length - 1 && !state.isPaused) {
      await wait((state.settings.duration * 1000) / state.settings.speed);
    }
  }

  if (state.isPlaying && !state.isPaused) {
    state.currentScene = 0;
    stop();
  }
}

// ============================================
// توقف موقت
// ============================================
function pause() {
  if (!state.isPlaying) return;
  state.isPaused = true;
  state.isPlaying = false;
  updatePlayButton();
  showStatus("توقف موقت", "paused");
  if (state.audio && !state.audio.paused) {
    state.audio.pause();
  }
}

// ============================================
// توقف پخش
// ============================================
function stop() {
  state.isPlaying = false;
  state.isPaused = false;
  state.currentScene = 0;
  updatePlayButton();
  updateSceneCount();
  if (els.sceneStage) els.sceneStage.innerHTML = "";
  if (els.progressBar) els.progressBar.style.width = "0%";
  showStatus("پخش متوقف شد", "stopped");
  if (state.audio) {
    state.audio.pause();
    state.audio.currentTime = 0;
  }
}

// ============================================
// صحنه قبلی
// ============================================
function prevScene() {
  if (state.currentScene > 0) {
    state.currentScene--;
    updateSceneCount();
    if (state.isPlaying && !state.isPaused) {
      showScene(state.scenes[state.currentScene], state.currentScene);
    }
  }
}

// ============================================
// صحنه بعدی
// ============================================
function nextScene() {
  if (state.currentScene < state.scenes.length - 1) {
    state.currentScene++;
    updateSceneCount();
    if (state.isPlaying && !state.isPaused) {
      showScene(state.scenes[state.currentScene], state.currentScene);
    }
  }
}

// ============================================
// به‌روزرسانی دکمه پخش
// ============================================
function updatePlayButton() {
  const playBtn = document.getElementById("btnPlay");
  const pauseBtn = document.getElementById("btnPause");
  const viewportPlayBtn = document.getElementById("viewportPlay");

  if (state.isPlaying && !state.isPaused) {
    if (playBtn) playBtn.classList.add("hidden");
    if (pauseBtn) pauseBtn.classList.remove("hidden");
    if (viewportPlayBtn) {
      viewportPlayBtn.innerHTML = '<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    }
  } else {
    if (playBtn) playBtn.classList.remove("hidden");
    if (pauseBtn) pauseBtn.classList.add("hidden");
    if (viewportPlayBtn) {
      viewportPlayBtn.innerHTML = '<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
  }
}

// ============================================
// نمایش صحنه
// ============================================
async function showScene(scene, index) {
  if (!els.sceneStage) return;
  
  const transition = state.settings.transition;
  const outClass = `${transition}-out`;
  const inClass = `${transition}-in`;

  if (els.sceneStage.firstChild) {
    els.sceneStage.firstChild.classList.add(outClass);
    await wait(600);
    els.sceneStage.innerHTML = "";
  }

  const sceneEl = document.createElement("div");
  sceneEl.className = "text-center max-w-[90%]";
  sceneEl.style.opacity = "0";

  if (state.settings.textPosition === "top") {
    els.sceneStage.style.alignItems = "flex-start";
    els.sceneStage.style.paddingTop = "20%";
  } else if (state.settings.textPosition === "bottom") {
    els.sceneStage.style.alignItems = "flex-end";
    els.sceneStage.style.paddingBottom = "20%";
  } else {
    els.sceneStage.style.alignItems = "center";
    els.sceneStage.style.padding = "";
  }

  if (scene.title) {
    const titleEl = document.createElement("div");
    titleEl.className = "text-lg uppercase tracking-widest mb-4 opacity-90";
    titleEl.style.color = "var(--accent-400)";
    titleEl.textContent = scene.title;
    sceneEl.appendChild(titleEl);
  }

  const contentEl = document.createElement("div");
  contentEl.className = "font-black leading-tight";
  contentEl.style.fontSize = `${state.settings.fontSize}px`;
  contentEl.style.color = state.settings.textColor;

  if (state.settings.shake) contentEl.classList.add("shake-effect");
  if (state.settings.glitch) contentEl.classList.add("glitch-effect");
  if (state.settings.chromatic) {
    contentEl.classList.add("chromatic-effect");
    contentEl.setAttribute("data-text", scene.content);
  }

  if (state.settings.textShadow) {
    contentEl.style.textShadow = "0 4px 20px rgba(0,0,0,0.8)";
    if (state.settings.glow) {
      contentEl.style.textShadow += ", 0 0 20px rgba(255,255,255,0.8), 0 0 40px var(--primary-500)";
    }
  }

  sceneEl.appendChild(contentEl);
  els.sceneStage.appendChild(sceneEl);

  if (state.settings.kenburns && state.bgType === "image" && els.bgImage) {
    els.bgImage.style.transition = "transform 15s ease-out";
    els.bgImage.style.transform = index % 2 === 0 ? "scale(1.2)" : "scale(1)";
  }

  await wait(50);
  sceneEl.classList.add(inClass);
  sceneEl.style.opacity = "1";

  if (state.settings.typewriter) {
    await typewriter(contentEl, scene.content);
  } else {
    contentEl.textContent = scene.content;
  }

  const progress = ((index + 1) / state.scenes.length) * 100;
  if (els.progressBar) els.progressBar.style.width = `${progress}%`;

  const elapsed = (index + 1) * state.settings.duration;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  if (els.timeDisplay) els.timeDisplay.textContent = `${pad(minutes)}:${pad(seconds)}`;
}

// ============================================
// افکت تایپ‌نویس
// ============================================
async function typewriter(el, text) {
  const speed = 50 / state.settings.speed;
  for (let i = 0; i < text.length; i++) {
    if (!state.isPlaying) break;
    el.textContent += text[i];
    await wait(speed);
  }
}

// ============================================
// تابع تاخیر
// ============================================
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// فرمت عدد
// ============================================
function pad(num) {
  return num.toString().padStart(2, "0");
}

// ============================================
// راه‌اندازی ذرات
// ============================================
function initParticles() {
  if (!els.particlesCanvas) return;
  const canvas = els.particlesCanvas;
  const ctx = canvas.getContext("2d");

  function resize() {
    if (!els.viewport) return;
    canvas.width = els.viewport.offsetWidth;
    canvas.height = els.viewport.offsetHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  const particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
    });
  }

  function animate() {
    if (!state.settings.particles) {
      requestAnimationFrame(animate);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// Film Grain
// ============================================
function createFilmGrain() {
  if (!els.filmGrain) return;
  const grain = els.filmGrain;
  grain.style.background = `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`;
  grain.style.backgroundSize = "100% 4px";
  grain.style.animation = "grain 0.2s steps(10) infinite";
}

// ============================================
// ضبط ویدیو
// ============================================
async function toggleRecord() {
  if (!state.recording) {
    await startRecording();
  } else {
    stopRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: "screen" },
    });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scene-${Date.now()}.webm`;
      a.click();
      showStatus("ویدیو ذخیره شد", "success");
    };
    mediaRecorder.start();
    state.recording = true;
    state.mediaRecorder = mediaRecorder;
    const btnRecord = document.getElementById("btnRecord");
    if (btnRecord) {
      btnRecord.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg><span>توقف ضبط</span>';
    }
    showStatus("در حال ضبط...", "recording");
  } catch (err) {
    console.error("خطا:", err);
    showStatus("خطا در ضبط", "error");
  }
}

function stopRecording() {
  if (state.mediaRecorder) {
    state.mediaRecorder.stop();
    state.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    state.recording = false;
    const btnRecord = document.getElementById("btnRecord");
    if (btnRecord) {
      btnRecord.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg><span>ضبط</span>';
    }
    showStatus("ضبط متوقف شد", "stopped");
  }
}

// ============================================
// خروجی پروژه
// ============================================
function exportProject() {
  if (!els.inputText) return;
  const project = {
    version: "4.5",
    text: els.inputText.value,
    settings: state.settings,
    bgImage: state.bgImage,
    bgVideo: state.bgVideo,
    bgType: state.bgType,
    timestamp: Date.now(),
  };
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project-${Date.now()}.json`;
  a.click();
  showStatus("پروژه صادر شد", "success");
}

// ============================================
// ورودی پروژه
// ============================================
function importProject(e) {
  const file = e.target.files[0];
  if (!file || !els.inputText) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const project = JSON.parse(event.target.result);
      els.inputText.value = project.text || "";
      state.settings = { ...state.settings, ...project.settings };
      if (project.bgImage) {
        state.bgImage = project.bgImage;
        state.bgType = "image";
        if (els.bgImage) {
          els.bgImage.src = project.bgImage;
          els.bgImage.classList.remove("hidden");
        }
        if (els.bgPreviewImg) {
          els.bgPreviewImg.src = project.bgImage;
          els.bgPreviewImg.classList.remove("hidden");
        }
        if (els.bgPreview) els.bgPreview.classList.remove("hidden");
        const btnRemove = document.getElementById("btnRemoveBg");
        if (btnRemove) btnRemove.classList.remove("hidden");
      }
      if (project.bgVideo) {
        state.bgVideo = project.bgVideo;
        state.bgType = "video";
        if (els.bgVideo) {
          els.bgVideo.src = project.bgVideo;
          els.bgVideo.classList.remove("hidden");
        }
        if (els.bgPreviewVideo) {
          els.bgPreviewVideo.src = project.bgVideo;
          els.bgPreviewVideo.classList.remove("hidden");
        }
        if (els.bgPreview) els.bgPreview.classList.remove("hidden");
        const btnRemove = document.getElementById("btnRemoveBg");
        if (btnRemove) btnRemove.classList.remove("hidden");
      }
      syncSettingsToUI();
      parseScenes();
      updateStats();
      showStatus("پروژه بارگذاری شد", "success");
    } catch (err) {
      console.error("خطا:", err);
      showStatus("خطا در بارگذاری", "error");
    }
  };
  reader.readAsText(file);
}

// ============================================
// همگام‌سازی
// ============================================
function syncSettingsToUI() {
  const speedRange = document.getElementById("speedRange");
  const durationInput = document.getElementById("durationInput");
  const transitionSelect = document.getElementById("transitionSelect");
  const fontSizeRange = document.getElementById("fontSizeRange");
  const bgOpacityRange = document.getElementById("bgOpacityRange");
  const bgBlurRange = document.getElementById("bgBlurRange");
  const volumeRange = document.getElementById("volumeRange");

  if (speedRange) speedRange.value = state.settings.speed;
  if (els.speedLabel) els.speedLabel.textContent = `${state.settings.speed}×`;
  if (durationInput) durationInput.value = state.settings.duration;
  if (els.durationValue) els.durationValue.textContent = state.settings.duration.toFixed(1);
  if (transitionSelect) transitionSelect.value = state.settings.transition;
  if (fontSizeRange) fontSizeRange.value = state.settings.fontSize;
  if (els.fontSizeValue) els.fontSizeValue.textContent = state.settings.fontSize;
  if (bgOpacityRange) bgOpacityRange.value = state.settings.bgOpacity;
  if (els.bgOpacityValue) els.bgOpacityValue.textContent = state.settings.bgOpacity;
  if (bgBlurRange) bgBlurRange.value = state.settings.bgBlur;
  if (els.bgBlurValue) els.bgBlurValue.textContent = state.settings.bgBlur;
  if (volumeRange) volumeRange.value = state.settings.volume;
  if (els.volumeLabel) els.volumeLabel.textContent = `${state.settings.volume}%`;

  const effects = [
    "typeEffect", "kenburns", "particlesEffect", "vignetteEffect",
    "glowEffect", "grainyEffect", "shakeEffect", "glitchEffect", "chromaticEffect"
  ];
  const keys = [
    "typewriter", "kenburns", "particles", "vignette",
    "glow", "grainy", "shake", "glitch", "chromatic"
  ];

  effects.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.checked = state.settings[keys[i]];
  });
}

// ============================================
// اشتراک‌گذاری
// ============================================
function shareProject() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ 
      title: "پخش‌کننده متن Pro", 
      text: "ابزار تبدیل متن به ویدیو", 
      url 
    }).catch(err => console.log(err));
  } else {
    navigator.clipboard.writeText(url);
    showStatus("لینک کپی شد", "success");
  }
}

// ============================================
// تمام صفحه
// ============================================
function toggleFullscreen() {
  if (!els.viewport) return;
  if (!document.fullscreenElement) {
    els.viewport.requestFullscreen().catch(err => console.error(err));
  } else {
    document.exitFullscreen();
  }
}

// ============================================
// مودال AI
// ============================================
function openAiModal() {
  const modal = document.getElementById("aiModal");
  if (modal) {
    modal.classList.remove("hidden");
    const promptInput = document.getElementById("aiPrompt");
    if (promptInput) promptInput.focus();
  }
}

function closeAiModal_func() {
  const modal = document.getElementById("aiModal");
  if (modal) {
    modal.classList.add("hidden");
    const promptInput = document.getElementById("aiPrompt");
    if (promptInput) promptInput.value = "";
  }
}

// ============================================
// تولید با AI
// ============================================
async function generateWithAi() {
  const promptInput = document.getElementById("aiPrompt");
  if (!promptInput || !els.inputText) return;
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showStatus("لطفاً درخواست خود را وارد کنید", "error");
    return;
  }
  showStatus("در حال تولید...", "processing");
  closeAiModal_func();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "anthropic-version": "2023-06-01",
        "x-api-key": "YOUR_API_KEY_HERE"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ 
          role: "user", 
          content: `به فارسی در قالب صحنه‌های سینمایی پاسخ بده. هر صحنه با "صحنه اول:"، "صحنه دوم:" شروع شود.\n\nدرخواست: ${prompt}\n\nفقط متن صحنه‌ها.` 
        }],
      }),
    });
    if (!response.ok) throw new Error(`خطا: ${response.status}`);
    const data = await response.json();
    if (data.content && Array.isArray(data.content)) {
      const text = data.content.map(item => item.type === "text" ? item.text : "").join("\n").trim();
      if (text) {
        els.inputText.value = text;
        parseScenes();
        updateStats();
        showStatus("تولید شد", "success");
      } else throw new Error("پاسخ خالی");
    } else throw new Error("فرمت نامعتبر");
  } catch (err) {
    console.error(err);
    showStatus("خطا: برای استفاده از AI باید API Key خود را در کد قرار دهید", "error");
  }
}

// ============================================
// بهینه‌سازی
// ============================================
async function optimizeWithAi() {
  if (!els.inputText) return;
  const text = els.inputText.value.trim();
  if (!text) {
    showStatus("متن خالی است", "error");
    return;
  }
  showStatus("در حال بهینه‌سازی...", "processing");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "anthropic-version": "2023-06-01",
        "x-api-key": "YOUR_API_KEY_HERE"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ 
          role: "user", 
          content: `این متن را برای نمایش سینمایی بهینه کن:\n\n${text}\n\nفقط متن بهینه‌شده.` 
        }],
      }),
    });
    if (!response.ok) throw new Error(`خطا: ${response.status}`);
    const data = await response.json();
    if (data.content && Array.isArray(data.content)) {
      const optimized = data.content.map(item => item.type === "text" ? item.text : "").join("\n").trim();
      if (optimized) {
        els.inputText.value = optimized;
        parseScenes();
        updateStats();
        showStatus("بهینه شد", "success");
      } else throw new Error("پاسخ خالی");
    } else throw new Error("فرمت نامعتبر");
  } catch (err) {
    console.error(err);
    showStatus("خطا: برای استفاده از AI باید API Key خود را در کد قرار دهید", "error");
  }
}

// ============================================
// راهنما
// ============================================
function showHelp() {
  alert(`🎬 راهنما

📝 صحنه:
"صحنه اول:", "صحنه دوم:"

⚡ افکت‌ها:
تایپ، Ken Burns، Shake، Glitch

⌨️ میانبرها:
Space: پخش
←/→: صحنه
F: تمام صفحه`);
}

// ============================================
// تنظیمات
// ============================================
function showSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.remove("hidden");
}

function closeSettingsModal_func() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.add("hidden");
}

// ============================================
// وضعیت
// ============================================
function showStatus(message, type = "info") {
  if (els.statusText) els.statusText.textContent = message;
  const badge = document.getElementById("statusBadge");
  if (!badge) return;
  const dot = badge.querySelector(".status-dot");
  if (!dot) return;
  dot.className = "w-2 h-2 rounded-full";
  const colors = {
    success: "bg-emerald-500 animate-pulse",
    error: "bg-red-500 animate-pulse",
    playing: "bg-blue-500 animate-pulse",
    recording: "bg-red-500 animate-ping",
    processing: "bg-yellow-500 animate-pulse",
    stopped: "bg-gray-500 animate-pulse",
    paused: "bg-gray-500 animate-pulse",
  };
  dot.className += " " + (colors[type] || colors.success);
  if (!["playing", "recording"].includes(type)) {
    setTimeout(() => {
      if (els.statusText && els.statusText.textContent === message) {
        els.statusText.textContent = "آماده";
        dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
      }
    }, 3000);
  }
}

// ============================================
// شمارنده
// ============================================
function startOnlineCounter() {
  const updateOnline = () => {
    const count = 150 + Math.floor(Math.random() * 150);
    if (els.onlineUsers) els.onlineUsers.textContent = count.toLocaleString("fa-IR");
  };
  const updateProjects = () => {
    const count = 45 + Math.floor(Math.random() * 20);
    if (els.todayProjects) els.todayProjects.textContent = count.toLocaleString("fa-IR");
  };
  updateOnline();
  updateProjects();
  setInterval(updateOnline, 10000);
  setInterval(updateProjects, 15000);
}

// ============================================
// متن نمونه
// ============================================
function loadSampleText() {
  if (!els.inputText) return;
  els.inputText.value = `صحنه اول: شروع سفر
تصویر: جاده‌ای بی‌پایان به سوی افق

صحنه دوم: آرامش
صدای باران و قدم‌های آرام

صحنه سوم: امید
طلوع خورشید پشت کوه‌ها

صحنه چهارم: پایان
و سفر ادامه دارد...`;
  parseScenes();
  updateStats();
}

// ============================================
// استایل
// ============================================
function loadStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -10%); }
      20% { transform: translate(-15%, 5%); }
      30% { transform: translate(7%, -25%); }
      40% { transform: translate(-5%, 25%); }
      50% { transform: translate(-15%, 10%); }
      60% { transform: translate(15%, 0%); }
      70% { transform: translate(0%, 15%); }
      80% { transform: translate(3%, 35%); }
      90% { transform: translate(-10%, 10%); }
    }
  `;
  document.head.appendChild(style);
}

console.log("🎬 پخش‌کننده فیلم‌وار متن Pro v4.5");
console.log("✅ برنامه آماده است!");
console.log("📝 توجه: برای استفاده از AI باید API Key خود را در کد قرار دهید");// ============================================
// مدیریت وضعیت برنامه
// ============================================
const state = {
  scenes: [],
  currentScene: 0,
  isPlaying: false,
  isPaused: false,
  settings: {
    speed: 1,
    duration: 5,
    transition: "fade",
    fontSize: 48,
    typewriter: true,
    kenburns: true,
    particles: false,
    vignette: true,
    glow: true,
    grainy: false,
    shake: false,
    glitch: false,
    chromatic: false,
    bgOpacity: 50,
    bgBlur: 10,
    volume: 100,
    videoQuality: "1080p",
    aspectRatio: "16:9",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    textPosition: "center",
    textColor: "#ffffff",
    textShadow: true,
  },
  bgImage: null,
  bgVideo: null,
  bgType: null,
  audio: null,
  recording: false,
  mediaRecorder: null,
};

// ============================================
// عناصر DOM
// ============================================
const els = {
  inputText: document.getElementById("inputText"),
  viewport: document.getElementById("viewport"),
  sceneStage: document.getElementById("sceneStage"),
  currentScene: document.getElementById("currentScene"),
  totalScenes: document.getElementById("totalScenes"),
  timeDisplay: document.getElementById("timeDisplay"),
  progressBar: document.getElementById("progressBar"),
  sceneCount: document.getElementById("sceneCount"),
  wordCount: document.getElementById("wordCount"),
  charCount: document.getElementById("charCount"),
  onlineUsers: document.getElementById("onlineUsers"),
  todayProjects: document.getElementById("todayProjects"),
  statusText: document.getElementById("statusText"),
  speedLabel: document.getElementById("speedLabel"),
  durationValue: document.getElementById("durationValue"),
  fontSizeValue: document.getElementById("fontSizeValue"),
  bgOpacityValue: document.getElementById("bgOpacityValue"),
  bgBlurValue: document.getElementById("bgBlurValue"),
  volumeLabel: document.getElementById("volumeLabel"),
  bgImage: document.getElementById("bgImage"),
  bgVideo: document.getElementById("bgVideo"),
  bgPreview: document.getElementById("bgPreview"),
  bgPreviewImg: document.getElementById("bgPreviewImg"),
  bgPreviewVideo: document.getElementById("bgPreviewVideo"),
  particlesCanvas: document.getElementById("particlesCanvas"),
  vignette: document.getElementById("vignette"),
  filmGrain: document.getElementById("filmGrain"),
  audioPlayer: document.getElementById("audioPlayer"),
  audioProgress: document.getElementById("audioProgress"),
  audioCurrentTime: document.getElementById("audioCurrentTime"),
  audioTimeStart: document.getElementById("audioTimeStart"),
  audioTimeEnd: document.getElementById("audioTimeEnd"),
  audioPlayIcon: document.getElementById("audioPlayIcon"),
  audioPauseIcon: document.getElementById("audioPauseIcon"),
  audioToggleText: document.getElementById("audioToggleText"),
};

// ============================================
// شروع برنامه
// ============================================
document.addEventListener("DOMContentLoaded", init);

function init() {
  console.log("🎬 شروع برنامه...");
  setupTheme();
  setupTabs();
  setupEventListeners();
  setupKeyboardShortcuts();
  loadStyles();
  parseScenes();
  updateStats();
  initParticles();
  createFilmGrain();
  startOnlineCounter();
  loadSampleText();
  
  // فعال کردن افکت Vignette
  if (state.settings.vignette && els.vignette) {
    els.vignette.style.opacity = "1";
    els.vignette.style.background = "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.7) 100%)";
  }
  
  console.log("✅ برنامه آماده است!");
}

// ============================================
// مدیریت تم
// ============================================
function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    showStatus(isDark ? "تم تاریک فعال شد" : "تم روشن فعال شد", "success");
  });
}

// ============================================
// مدیریت تب‌ها
// ============================================
function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const content = document.querySelector(`[data-content="${tab}"]`);
      if (content) content.classList.add("active");
    });
  });
}

// ============================================
// راه‌اندازی رویدادها
// ============================================
function setupEventListeners() {
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStop = document.getElementById("btnStop");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnRecord = document.getElementById("btnRecord");

  if (btnPlay) btnPlay.addEventListener("click", play);
  if (btnPause) btnPause.addEventListener("click", pause);
  if (btnStop) btnStop.addEventListener("click", stop);
  if (btnPrev) btnPrev.addEventListener("click", prevScene);
  if (btnNext) btnNext.addEventListener("click", nextScene);
  if (btnRecord) btnRecord.addEventListener("click", toggleRecord);

  const viewportPlay = document.getElementById("viewportPlay");
  const viewportPrev = document.getElementById("viewportPrev");
  const viewportNext = document.getElementById("viewportNext");
  
  if (viewportPlay) viewportPlay.addEventListener("click", play);
  if (viewportPrev) viewportPrev.addEventListener("click", prevScene);
  if (viewportNext) viewportNext.addEventListener("click", nextScene);

  if (els.inputText) {
    els.inputText.addEventListener("input", () => {
      parseScenes();
      updateStats();
    });
  }

  setupEffectControls();
  setupMediaControls();
  setupTemplates();
  setupHeaderButtons();
  setupAIControls();
  setupAdvancedSettings();
}

// ============================================
// راه‌اندازی کنترل‌های افکت
// ============================================
function setupEffectControls() {
  const speedRange = document.getElementById("speedRange");
  const durationInput = document.getElementById("durationInput");
  const transitionSelect = document.getElementById("transitionSelect");
  const fontSizeRange = document.getElementById("fontSizeRange");
  
  if (speedRange) {
    speedRange.addEventListener("input", (e) => {
      state.settings.speed = parseFloat(e.target.value);
      if (els.speedLabel) els.speedLabel.textContent = `${state.settings.speed}×`;
    });
  }

  if (durationInput) {
    durationInput.addEventListener("input", (e) => {
      state.settings.duration = parseFloat(e.target.value);
      if (els.durationValue) els.durationValue.textContent = state.settings.duration.toFixed(1);
    });
  }

  if (transitionSelect) {
    transitionSelect.addEventListener("change", (e) => {
      state.settings.transition = e.target.value;
    });
  }

  if (fontSizeRange) {
    fontSizeRange.addEventListener("input", (e) => {
      state.settings.fontSize = parseInt(e.target.value);
      if (els.fontSizeValue) els.fontSizeValue.textContent = state.settings.fontSize;
    });
  }

  const effects = [
    { id: "typeEffect", key: "typewriter" },
    { id: "kenburns", key: "kenburns" },
    { id: "particlesEffect", key: "particles" },
    { id: "vignetteEffect", key: "vignette" },
    { id: "glowEffect", key: "glow" },
    { id: "grainyEffect", key: "grainy" },
    { id: "shakeEffect", key: "shake" },
    { id: "glitchEffect", key: "glitch" },
    { id: "chromaticEffect", key: "chromatic" },
  ];

  effects.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) => {
        state.settings[key] = e.target.checked;
        
        if (key === "particles" && els.particlesCanvas) {
          els.particlesCanvas.style.opacity = e.target.checked ? "1" : "0";
        }
        if (key === "vignette" && els.vignette) {
          els.vignette.style.opacity = e.target.checked ? "1" : "0";
        }
        if (key === "grainy" && els.filmGrain) {
          els.filmGrain.style.opacity = e.target.checked ? "0.15" : "0";
        }
      });
    }
  });
}

// ============================================
// راه‌اندازی کنترل‌های مدیا
// ============================================
function setupMediaControls() {
  const btnSelectImage = document.getElementById("btnSelectImage");
  const btnSelectVideo = document.getElementById("btnSelectVideo");
  const bgImageFile = document.getElementById("bgImageFile");
  const bgVideoFile = document.getElementById("bgVideoFile");
  const btnRemoveBg = document.getElementById("btnRemoveBg");

  if (btnSelectImage) {
    btnSelectImage.addEventListener("click", () => {
      if (bgImageFile) bgImageFile.click();
    });
  }

  if (btnSelectVideo) {
    btnSelectVideo.addEventListener("click", () => {
      if (bgVideoFile) bgVideoFile.click();
    });
  }

  if (bgImageFile) bgImageFile.addEventListener("change", handleBgImage);
  if (bgVideoFile) bgVideoFile.addEventListener("change", handleBgVideo);
  if (btnRemoveBg) btnRemoveBg.addEventListener("click", removeBgMedia);

  const bgOpacityRange = document.getElementById("bgOpacityRange");
  const bgBlurRange = document.getElementById("bgBlurRange");

  if (bgOpacityRange) {
    bgOpacityRange.addEventListener("input", (e) => {
      state.settings.bgOpacity = parseInt(e.target.value);
      if (els.bgOpacityValue) els.bgOpacityValue.textContent = state.settings.bgOpacity;
      updateBackgroundStyle();
    });
  }

  if (bgBlurRange) {
    bgBlurRange.addEventListener("input", (e) => {
      state.settings.bgBlur = parseInt(e.target.value);
      if (els.bgBlurValue) els.bgBlurValue.textContent = state.settings.bgBlur;
      updateBackgroundStyle();
    });
  }

  const audioFile = document.getElementById("audioFile");
  const audioToggle = document.getElementById("audioToggle");
  const volumeRange = document.getElementById("volumeRange");

  if (audioFile) audioFile.addEventListener("change", handleAudio);
  if (audioToggle) audioToggle.addEventListener("click", toggleAudio);

  if (volumeRange) {
    volumeRange.addEventListener("input", (e) => {
      state.settings.volume = parseInt(e.target.value);
      if (els.volumeLabel) els.volumeLabel.textContent = `${state.settings.volume}%`;
      if (state.audio) state.audio.volume = state.settings.volume / 100;
    });
  }

  if (els.audioProgress) {
    els.audioProgress.addEventListener("input", (e) => {
      if (state.audio && state.audio.duration) {
        const seekTime = (e.target.value / 100) * state.audio.duration;
        state.audio.currentTime = seekTime;
      }
    });
  }
}

// ============================================
// مدیریت پس‌زمینه تصویری
// ============================================
function handleBgImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    removeBgMedia();
    state.bgImage = event.target.result;
    state.bgType = "image";
    
    if (els.bgImage) {
      els.bgImage.src = event.target.result;
      els.bgImage.classList.remove("hidden");
    }
    
    if (els.bgPreviewImg) {
      els.bgPreviewImg.src = event.target.result;
      els.bgPreviewImg.classList.remove("hidden");
    }
    
    if (els.bgPreview) els.bgPreview.classList.remove("hidden");
    
    const btnRemove = document.getElementById("btnRemoveBg");
    if (btnRemove) btnRemove.classList.remove("hidden");
    
    updateBackgroundStyle();
    showStatus("تصویر پس‌زمینه اضافه شد", "success");
  };
  reader.readAsDataURL(file);
}

// ============================================
// مدیریت پس‌زمینه ویدیویی
// ============================================
function handleBgVideo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    removeBgMedia();
    state.bgVideo = event.target.result;
    state.bgType = "video";
    
    if (els.bgVideo) {
      els.bgVideo.src = event.target.result;
      els.bgVideo.classList.remove("hidden");
      els.bgVideo.play().catch(err => console.log("خطا در پخش ویدیو:", err));
    }
    
    if (els.bgPreviewVideo) {
      els.bgPreviewVideo.src = event.target.result;
      els.bgPreviewVideo.classList.remove("hidden");
    }
    
    if (els.bgPreview) els.bgPreview.classList.remove("hidden");
    
    const btnRemove = document.getElementById("btnRemoveBg");
    if (btnRemove) btnRemove.classList.remove("hidden");
    
    updateBackgroundStyle();
    showStatus("ویدیوی پس‌زمینه اضافه شد", "success");
  };
  reader.readAsDataURL(file);
}

// ============================================
// حذف پس‌زمینه
// ============================================
function removeBgMedia() {
  state.bgImage = null;
  state.bgVideo = null;
  state.bgType = null;
  
  if (els.bgImage) els.bgImage.classList.add("hidden");
  if (els.bgVideo) {
    els.bgVideo.classList.add("hidden");
    els.bgVideo.pause();
  }
  if (els.bgPreviewImg) els.bgPreviewImg.classList.add("hidden");
  if (els.bgPreviewVideo) els.bgPreviewVideo.classList.add("hidden");
  if (els.bgPreview) els.bgPreview.classList.add("hidden");
  
  const btnRemove = document.getElementById("btnRemoveBg");
  if (btnRemove) btnRemove.classList.add("hidden");
  
  const bgImageFile = document.getElementById("bgImageFile");
  const bgVideoFile = document.getElementById("bgVideoFile");
  if (bgImageFile) bgImageFile.value = "";
  if (bgVideoFile) bgVideoFile.value = "";
  
  showStatus("پس‌زمینه حذف شد", "success");
}

// ============================================
// به‌روزرسانی استایل پس‌زمینه
// ============================================
function updateBackgroundStyle() {
  const opacity = state.settings.bgOpacity / 100;
  const blur = state.settings.bgBlur;

  if (state.bgType === "image" && els.bgImage) {
    els.bgImage.style.opacity = opacity;
    els.bgImage.style.filter = `blur(${blur}px)`;
  } else if (state.bgType === "video" && els.bgVideo) {
    els.bgVideo.style.opacity = opacity;
    els.bgVideo.style.filter = `blur(${blur}px)`;
  }
}

// ============================================
// مدیریت فایل صوتی
// ============================================
function handleAudio(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (state.audio) {
      state.audio.pause();
      state.audio = null;
    }

    state.audio = new Audio(event.target.result);
    state.audio.loop = true;
    state.audio.volume = state.settings.volume / 100;
    
    if (els.audioPlayer) els.audioPlayer.classList.remove("hidden");

    state.audio.addEventListener("loadedmetadata", () => {
      if (els.audioTimeEnd) els.audioTimeEnd.textContent = formatTime(state.audio.duration);
    });

    state.audio.addEventListener("timeupdate", () => {
      if (state.audio && state.audio.duration) {
        const progress = (state.audio.currentTime / state.audio.duration) * 100;
        if (els.audioProgress) els.audioProgress.value = progress;
        if (els.audioCurrentTime) els.audioCurrentTime.textContent = formatTime(state.audio.currentTime);
        if (els.audioTimeStart) els.audioTimeStart.textContent = formatTime(state.audio.currentTime);
      }
    });

    showStatus("فایل صوتی اضافه شد", "success");
  };
  reader.readAsDataURL(file);
}

// ============================================
// تغییر وضعیت پخش موسیقی
// ============================================
function toggleAudio() {
  if (!state.audio) {
    showStatus("لطفاً ابتدا یک فایل صوتی انتخاب کنید", "error");
    return;
  }

  if (state.audio.paused) {
    state.audio.play();
    if (els.audioPlayIcon) els.audioPlayIcon.classList.add("hidden");
    if (els.audioPauseIcon) els.audioPauseIcon.classList.remove("hidden");
    if (els.audioToggleText) els.audioToggleText.textContent = "توقف";
  } else {
    state.audio.pause();
    if (els.audioPlayIcon) els.audioPlayIcon.classList.remove("hidden");
    if (els.audioPauseIcon) els.audioPauseIcon.classList.add("hidden");
    if (els.audioToggleText) els.audioToggleText.textContent = "پخش";
  }
}

// ============================================
// فرمت زمان
// ============================================
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================
// راه‌اندازی قالب‌های آماده
// ============================================
function setupTemplates() {
  document.querySelectorAll(".template-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const template = btn.dataset.template;
      if (template) loadTemplate(template);
    });
  });
}

// ============================================
// بارگذاری قالب
// ============================================
function loadTemplate(type) {
  const templates = {
    movie: `صحنه اول: شروع داستان
تصویر: شهر در شب، نورهای رنگارنگ خیابان‌ها

صحنه دوم: تنش و هیجان
صدا: ضربان قلب تند و تندتر می‌شود

صحنه سوم: اوج داستان
تصویر: دویدن سریع در کوچه‌های تاریک شهر

صحنه چهارم: پایان
آرامش دوباره به شهر بازمی‌گردد`,

    poem: `صحنه اول: آغاز
دلم گرفته از این روزگار بی‌رحم

صحنه دوم: تأمل و اندیشه
چشمانت دریایی بی‌کران از رازها

صحنه سوم: احساس عمیق
و دلم می‌خواهد پرواز کند با تو

صحنه چهارم: پایان
و باران همچنان می‌بارد بر این شهر تنها`,

    quote: `صحنه اول: حکمت اول
زندگی کوتاه است، آن را هدر نده

صحنه دوم: درس دوم
پس لحظه‌ها را با عشق زندگی کن

صحنه سوم: الهام نهایی
و عشق بورز به همه چیز و همه کس`,

    story: `صحنه اول: روزی روزگاری
در شهری دور، دختری زندگی می‌کرد

صحنه دوم: شروع ماجراجویی
او تصمیم گرفت به دنبال رویاهایش برود

صحنه سوم: مسیر سخت
راه پر از چالش بود اما او تسلیم نشد

صحنه چهارم: پایان خوش
و سرانجام آرامش و شادی را یافت`,
  };

  if (els.inputText) {
    els.inputText.value = templates[type] || templates.movie;
    parseScenes();
    updateStats();
    showStatus("قالب بارگذاری شد", "success");
  }
}

// ============================================
// راه‌اندازی دکمه‌های هدر
// ============================================
function setupHeaderButtons() {
  const btnHelp = document.getElementById("btnHelp");
  const btnSettings = document.getElementById("btnSettings");
  const btnExport = document.getElementById("btnExport");
  const btnImport = document.getElementById("btnImport");
  const btnShare = document.getElementById("btnShare");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const importFile = document.getElementById("importFile");

  if (btnHelp) btnHelp.addEventListener("click", showHelp);
  if (btnSettings) btnSettings.addEventListener("click", showSettings);
  if (btnExport) btnExport.addEventListener("click", exportProject);
  if (btnImport) {
    btnImport.addEventListener("click", () => {
      if (importFile) importFile.click();
    });
  }
  if (importFile) importFile.addEventListener("change", importProject);
  if (btnShare) btnShare.addEventListener("click", shareProject);
  if (btnFullscreen) btnFullscreen.addEventListener("click", toggleFullscreen);
}

// ============================================
// راه‌اندازی کنترل‌های AI
// ============================================
function setupAIControls() {
  const aiAssistant = document.getElementById("aiAssistant");
  const btnAiGenerate = document.getElementById("btnAiGenerate");
  const btnAiOptimize = document.getElementById("btnAiOptimize");
  const closeAiModal = document.getElementById("closeAiModal");
  const aiCancelBtn = document.getElementById("aiCancelBtn");
  const aiGenerateBtn = document.getElementById("aiGenerateBtn");

  if (aiAssistant) aiAssistant.addEventListener("click", openAiModal);
  if (btnAiGenerate) btnAiGenerate.addEventListener("click", openAiModal);
  if (btnAiOptimize) btnAiOptimize.addEventListener("click", optimizeWithAi);
  if (closeAiModal) closeAiModal.addEventListener("click", closeAiModal_func);
  if (aiCancelBtn) aiCancelBtn.addEventListener("click", closeAiModal_func);
  if (aiGenerateBtn) aiGenerateBtn.addEventListener("click", generateWithAi);
}

// ============================================
// راه‌اندازی تنظیمات پیشرفته
// ============================================
function setupAdvancedSettings() {
  const closeSettingsModal = document.getElementById("closeSettingsModal");
  const cancelSettings = document.getElementById("cancelSettings");
  const saveSettings = document.getElementById("saveSettings");

  if (closeSettingsModal) {
    closeSettingsModal.addEventListener("click", closeSettingsModal_func);
  }
  
  if (cancelSettings) {
    cancelSettings.addEventListener("click", closeSettingsModal_func);
  }

  const videoQuality = document.getElementById("videoQuality");
  const aspectRatio = document.getElementById("aspectRatio");
  const brightnessRange = document.getElementById("brightnessRange");
  const contrastRange = document.getElementById("contrastRange");
  const saturationRange = document.getElementById("saturationRange");
  const textPosition = document.getElementById("textPosition");
  const textColor = document.getElementById("textColor");
  const textShadow = document.getElementById("textShadow");

  if (videoQuality) {
    videoQuality.addEventListener("change", (e) => {
      state.settings.videoQuality = e.target.value;
    });
  }

  if (aspectRatio) {
    aspectRatio.addEventListener("change", (e) => {
      state.settings.aspectRatio = e.target.value;
      applyAspectRatio();
    });
  }

  if (brightnessRange) {
    brightnessRange.addEventListener("input", (e) => {
      state.settings.brightness = parseInt(e.target.value);
      const brightnessValue = document.getElementById("brightnessValue");
      if (brightnessValue) brightnessValue.textContent = state.settings.brightness;
      applyColorFilters();
    });
  }

  if (contrastRange) {
    contrastRange.addEventListener("input", (e) => {
      state.settings.contrast = parseInt(e.target.value);
      const contrastValue = document.getElementById("contrastValue");
      if (contrastValue) contrastValue.textContent = state.settings.contrast;
      applyColorFilters();
    });
  }

  if (saturationRange) {
    saturationRange.addEventListener("input", (e) => {
      state.settings.saturation = parseInt(e.target.value);
      const saturationValue = document.getElementById("saturationValue");
      if (saturationValue) saturationValue.textContent = state.settings.saturation;
      applyColorFilters();
    });
  }

  if (textPosition) {
    textPosition.addEventListener("change", (e) => {
      state.settings.textPosition = e.target.value;
    });
  }

  if (textColor) {
    textColor.addEventListener("input", (e) => {
      state.settings.textColor = e.target.value;
    });
  }

  if (textShadow) {
    textShadow.addEventListener("change", (e) => {
      state.settings.textShadow = e.target.checked;
    });
  }

  if (saveSettings) {
    saveSettings.addEventListener("click", () => {
      try {
        localStorage.setItem("advancedSettings", JSON.stringify(state.settings));
        showStatus("تنظیمات ذخیره شد", "success");
        closeSettingsModal_func();
      } catch (err) {
        console.error("خطا:", err);
        showStatus("خطا در ذخیره", "error");
      }
    });
  }

  loadAdvancedSettings();
}

// ============================================
// بارگذاری تنظیمات پیشرفته
// ============================================
function loadAdvancedSettings() {
  try {
    const saved = localStorage.getItem("advancedSettings");
    if (saved) {
      const settings = JSON.parse(saved);
      Object.assign(state.settings, settings);

      const videoQuality = document.getElementById("videoQuality");
      const aspectRatio = document.getElementById("aspectRatio");
      const brightnessRange = document.getElementById("brightnessRange");
      const contrastRange = document.getElementById("contrastRange");
      const saturationRange = document.getElementById("saturationRange");
      const textPosition = document.getElementById("textPosition");
      const textColor = document.getElementById("textColor");
      const textShadow = document.getElementById("textShadow");

      if (videoQuality) videoQuality.value = settings.videoQuality || "1080p";
      if (aspectRatio) aspectRatio.value = settings.aspectRatio || "16:9";
      if (brightnessRange) brightnessRange.value = settings.brightness || 100;
      if (contrastRange) contrastRange.value = settings.contrast || 100;
      if (saturationRange) saturationRange.value = settings.saturation || 100;
      if (textPosition) textPosition.value = settings.textPosition || "center";
      if (textColor) textColor.value = settings.textColor || "#ffffff";
      if (textShadow) textShadow.checked = settings.textShadow !== false;

      applyColorFilters();
      applyAspectRatio();
    }
  } catch (err) {
    console.error("خطا:", err);
  }
}

// ============================================
// اعمال فیلترهای رن