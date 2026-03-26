(() => {
  'use strict';

  /* ===== SVG Icons ===== */
  const ICON = {
    play:    '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause:   '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    volHigh: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volLow:  '<svg viewBox="0 0 24 24"><path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
    volMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A9 9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a7.95 7.95 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    fsEnter: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    fsExit:  '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    pip:     '<svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14z"/></svg>',
  };

  /* ===== DOM ===== */
  const $ = (id) => document.getElementById(id);

  const player       = $('player');
  const video        = $('video');
  const overlay      = $('overlay');
  const bigPlayBtn   = $('bigPlayBtn');
  const spinner      = $('spinner');
  const actionIcon   = $('actionIcon');
  const controls     = $('controls');
  const progressArea = $('progressArea');
  const bufferBar    = $('bufferBar');
  const filledBar    = $('filledBar');
  const tooltip      = $('tooltip');
  const playBtn      = $('playBtn');
  const timeDisplay  = $('timeDisplay');
  const speedBtn     = $('speedBtn');
  const speedMenu    = $('speedMenu');
  const speedWrapper = $('speedWrapper');
  const volBtn       = $('volBtn');
  const volWrap      = $('volWrap');
  const volTrack     = $('volTrack');
  const volFilled    = $('volFilled');
  const pipBtn       = $('pipBtn');
  const fsBtn        = $('fsBtn');
  const videoURLInput  = $('videoURL');
  const changeVideoBtn = $('changeVideoBtn');
  const errorMsg       = $('errorMsg');

  /* ===== State ===== */
  let isDraggingProgress = false;
  let isDraggingVolume   = false;
  let hideTimer          = null;
  let lastVolume         = 1;

  /* ===== Init Icons ===== */
  playBtn.innerHTML = ICON.play;
  volBtn.innerHTML  = ICON.volHigh;
  fsBtn.innerHTML   = ICON.fsEnter;
  pipBtn.innerHTML  = ICON.pip;
  if (!document.pictureInPictureEnabled) pipBtn.style.display = 'none';

  /* ===== Helpers ===== */
  function fmt(sec) {
    if (!isFinite(sec) || isNaN(sec)) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  }

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
    setTimeout(() => { errorMsg.hidden = true; }, 4000);
  }

  function isValidURL(s) {
    try { const u = new URL(s); return /^https?:$/.test(u.protocol); }
    catch { return false; }
  }

  function clientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  /* ==========================================
     ★ Play / Pause（修復：直接綁定 handler）
     ========================================== */
  function togglePlay() {
    video.paused || video.ended ? video.play().catch(() => {}) : video.pause();
  }

  function bubble(svg) {
    const el = document.createElement('div');
    el.className = 'player__action-bubble';
    el.innerHTML = svg;
    actionIcon.innerHTML = '';
    actionIcon.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // ★ 修復：playBtn 直接綁定
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
  });

  // ★ bigPlayBtn 也明確綁定
  bigPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
  });

  video.addEventListener('play', () => {
    overlay.classList.add('hidden');
    playBtn.innerHTML = ICON.pause;
    bubble(ICON.play);
    startHide();
  });

  video.addEventListener('pause', () => {
    playBtn.innerHTML = ICON.play;
    bubble(ICON.pause);
    showCtrl();
    clearHide();
  });

  video.addEventListener('ended', () => {
    overlay.classList.remove('hidden');
    playBtn.innerHTML = ICON.play;
    showCtrl();
    clearHide();
  });

  // 點擊影片區域（排除控制列）
  player.addEventListener('click', (e) => {
    if (!controls.contains(e.target)) togglePlay();
  });

  // 雙擊全螢幕
  player.addEventListener('dblclick', (e) => {
    if (!controls.contains(e.target)) toggleFS();
  });

  /* ===== Progress ===== */
  function updateProgress() {
    if (!isDraggingProgress && video.duration) {
      filledBar.style.width = (video.currentTime / video.duration * 100) + '%';
    }
    timeDisplay.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  }

  function updateBuffer() {
    if (video.buffered.length && video.duration) {
      const end = video.buffered.end(video.buffered.length - 1);
      bufferBar.style.width = (end / video.duration * 100) + '%';
    }
  }

  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('progress', updateBuffer);
  video.addEventListener('loadedmetadata', () => { updateProgress(); updateBuffer(); });

  function progressPct(e) {
    const r = progressArea.getBoundingClientRect();
    return clamp((clientX(e) - r.left) / r.width, 0, 1);
  }

  function seekTo(pct) {
    if (video.duration) video.currentTime = pct * video.duration;
  }

  function onProgressDown(e) {
    isDraggingProgress = true;
    progressArea.classList.add('dragging');
    const p = progressPct(e);
    filledBar.style.width = p * 100 + '%';
    seekTo(p);
  }

  progressArea.addEventListener('mousedown', onProgressDown);
  progressArea.addEventListener('touchstart', onProgressDown, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingProgress) return;
    filledBar.style.width = progressPct(e) * 100 + '%';
    seekTo(progressPct(e));
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDraggingProgress) return;
    filledBar.style.width = progressPct(e) * 100 + '%';
    seekTo(progressPct(e));
  }, { passive: true });

  function onProgressUp() {
    if (!isDraggingProgress) return;
    isDraggingProgress = false;
    progressArea.classList.remove('dragging');
  }

  document.addEventListener('mouseup', onProgressUp);
  document.addEventListener('touchend', onProgressUp);

  progressArea.addEventListener('mousemove', (e) => {
    if (!video.duration) return;
    const r = progressArea.getBoundingClientRect();
    const pct = clamp((e.clientX - r.left) / r.width, 0, 1);
    tooltip.textContent = fmt(pct * video.duration);
    tooltip.style.left = (pct * 100) + '%';
  });

  /* ==========================================
     ★ Speed Menu（改為選單式）
     ========================================== */
  function openSpeedMenu() {
    speedMenu.classList.add('open');
  }

  function closeSpeedMenu() {
    speedMenu.classList.remove('open');
  }

  function toggleSpeedMenu() {
    speedMenu.classList.toggle('open');
  }

  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSpeedMenu();
  });

  // 點選速度選項
  speedMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const opt = e.target.closest('.player__speed-option');
    if (!opt) return;

    const rate = parseFloat(opt.dataset.speed);
    video.playbackRate = rate;

    // 更新 active 狀態
    speedMenu.querySelectorAll('.player__speed-option').forEach((el) => {
      el.classList.toggle('active', el === opt);
    });

    // 更新按鈕文字
    speedBtn.textContent = rate === 1 ? '1x' : rate + 'x';

    closeSpeedMenu();
  });

  // 點擊其他區域關閉選單
  document.addEventListener('click', (e) => {
    if (!speedWrapper.contains(e.target)) closeSpeedMenu();
  });

  /* ===== Volume ===== */
  function updateVolUI() {
    const v = video.muted ? 0 : video.volume;
    volFilled.style.width = (v * 100) + '%';
    volBtn.innerHTML = v === 0 ? ICON.volMute : v < 0.5 ? ICON.volLow : ICON.volHigh;
  }

  volBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = lastVolume || 0.5;
    } else {
      lastVolume = video.volume;
      video.muted = true;
    }
    updateVolUI();
  });

  let volTimer = null;
  const openVol  = () => { clearTimeout(volTimer); volWrap.classList.add('open'); };
  const closeVol = () => { volTimer = setTimeout(() => volWrap.classList.remove('open'), 400); };

  volBtn.addEventListener('mouseenter', openVol);
  volWrap.addEventListener('mouseenter', openVol);
  volBtn.addEventListener('mouseleave', closeVol);
  volWrap.addEventListener('mouseleave', closeVol);

  function volPct(e) {
    const r = volTrack.getBoundingClientRect();
    return clamp((clientX(e) - r.left) / r.width, 0, 1);
  }

  volTrack.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isDraggingVolume = true;
    setVol(volPct(e));
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingVolume) return;
    setVol(volPct(e));
  });

  document.addEventListener('mouseup', () => { isDraggingVolume = false; });

  function setVol(pct) {
    video.muted = false;
    video.volume = pct;
    lastVolume = pct || lastVolume;
    updateVolUI();
  }

  /* ===== Fullscreen ===== */
  function toggleFS() {
    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFS(); });

  document.addEventListener('fullscreenchange', () => {
    fsBtn.innerHTML = document.fullscreenElement ? ICON.fsExit : ICON.fsEnter;
  });

  /* ===== PiP ===== */
  pipBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await video.requestPictureInPicture();
    } catch {}
  });

  /* ===== Spinner ===== */
  const showSpin = () => spinner.classList.add('visible');
  const hideSpin = () => spinner.classList.remove('visible');

  video.addEventListener('waiting', showSpin);
  video.addEventListener('canplay', hideSpin);
  video.addEventListener('playing', hideSpin);
  video.addEventListener('error', () => {
    hideSpin();
    showError('影片載入失敗，請確認連結是否正確且格式受瀏覽器支援。');
  });

  /* ===== Auto-hide Controls ===== */
  function showCtrl() { player.classList.remove('hide-controls'); }

  function hideCtrl() {
    if (!video.paused && !isDraggingProgress && !isDraggingVolume && !speedMenu.classList.contains('open')) {
      player.classList.add('hide-controls');
    }
  }

  function clearHide() { clearTimeout(hideTimer); }

  function startHide() {
    clearHide();
    hideTimer = setTimeout(hideCtrl, 3000);
  }

  player.addEventListener('mousemove', () => {
    showCtrl();
    if (!video.paused) startHide();
  });

  player.addEventListener('mouseleave', () => {
    if (!video.paused) hideTimer = setTimeout(hideCtrl, 800);
  });

  player.addEventListener('touchstart', () => {
    if (player.classList.contains('hide-controls')) { showCtrl(); startHide(); }
  }, { passive: true });

  controls.addEventListener('click', (e) => e.stopPropagation());

  /* ===== Keyboard ===== */
  document.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;

    switch (e.key) {
      case ' ': case 'k': case 'K':
        e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft':
        e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); break;
      case 'ArrowRight':
        e.preventDefault(); video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); break;
      case 'ArrowUp':
        e.preventDefault(); video.volume = clamp(video.volume + 0.05, 0, 1); video.muted = false; updateVolUI(); break;
      case 'ArrowDown':
        e.preventDefault(); video.volume = clamp(video.volume - 0.05, 0, 1); updateVolUI(); break;
      case 'f': case 'F':
        e.preventDefault(); toggleFS(); break;
      case 'm': case 'M':
        e.preventDefault();
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 0.5;
        updateVolUI();
        break;
    }
  });

  /* ===== Change Video ===== */
  function changeVideo() {
    errorMsg.hidden = true;
    const url = videoURLInput.value.trim();
    if (!url) { showError('請輸入影片連結！'); videoURLInput.focus(); return; }
    if (!isValidURL(url)) { showError('請輸入有效的網址（需以 http:// 或 https:// 開頭）。'); videoURLInput.focus(); return; }

    overlay.classList.remove('hidden');
    showSpin();
    video.src = url;
    video.load();
    video.play().catch(() => {});
  }

  changeVideoBtn.addEventListener('click', changeVideo);
  videoURLInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); changeVideo(); }
  });

})();