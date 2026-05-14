// project-gallery.js — click-to-open gallery for project cards.
// Each project: cover + 4 image slots + 1 media slot (image OR video).
//
// IMPORTANT: image-slot persists via a .image-slots.state.json sidecar and
// expects exactly ONE element per id in the DOM. We MOVE the live <image-slot>
// element between the project card and the modal stage instead of cloning.

(function () {
  const VIDEO_LS_PREFIX = 'project-video-';
  const STATE_FILE = '.image-slots.state.json';

  // ---------- sidecar cache ----------
  // Fetch independently so thumbnail previews don't depend on shadow-DOM timing.
  let _sidecar = null;
  function fetchSidecar() {
    return fetch(STATE_FILE)
      .then(r => (r.ok ? r.json() : {}))
      .then(j => { _sidecar = j || {}; })
      .catch(() => { _sidecar = {}; });
  }
  fetchSidecar();

  function getSlotImageUrl(slotId) {
    // Shadow DOM first (in-memory, most current after a new drop)
    const slot = document.getElementById(slotId);
    if (slot && slot.shadowRoot) {
      const img = slot.shadowRoot.querySelector('img[part="image"]');
      if (img && img.src && img.src.startsWith('data:')) return img.src;
    }
    // Sidecar fallback (persisted across reloads)
    if (_sidecar) {
      const v = _sidecar[slotId];
      if (v) return typeof v === 'string' ? v : (v.u || null);
    }
    return null;
  }

  // ---------- video URL → embed HTML ----------
  function parseVideoUrl(url) {
    if (!url) return null;
    url = url.trim();
    if (!url) return null;
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{6,})/);
    if (m) return { kind: 'iframe', src: `https://www.youtube.com/embed/${m[1]}` };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return { kind: 'video', src: url };
    return { kind: 'link', src: url };
  }

  function videoFrameHTML(url) {
    const parsed = parseVideoUrl(url);
    if (!parsed) return null;
    if (parsed.kind === 'iframe') {
      return `<iframe src="${parsed.src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;background:#000;"></iframe>`;
    }
    if (parsed.kind === 'video') {
      return `<video src="${parsed.src}" controls playsinline style="width:100%;height:100%;background:#000;object-fit:contain;"></video>`;
    }
    return `<div style="display:grid;place-items:center;width:100%;height:100%;background:#0a1a33;color:#fff;padding:24px;text-align:center;">
      <div>
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:8px;">External link</div>
        <a href="${parsed.src}" target="_blank" rel="noopener" style="color:#7FCFE3;word-break:break-all;">${parsed.src}</a>
      </div>
    </div>`;
  }

  // ---------- modal ----------
  const dialog = document.createElement('dialog');
  dialog.id = 'project-gallery-modal';
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'pgm-modal-title');
  dialog.innerHTML = `
    <button class="pgm-close" type="button" aria-label="Close gallery">&times;</button>
    <div class="pgm-inner">
      <header class="pgm-head">
        <div>
          <div class="pgm-type"></div>
          <h2 class="pgm-title" id="pgm-modal-title"></h2>
        </div>
        <div class="pgm-state"></div>
      </header>
      <div class="pgm-stage"></div>
      <div class="pgm-strip" role="tablist"></div>
    </div>
  `;
  document.body.appendChild(dialog);

  const closeBtn = dialog.querySelector('.pgm-close');
  const titleEl  = dialog.querySelector('.pgm-title');
  const typeEl   = dialog.querySelector('.pgm-type');
  const stateEl  = dialog.querySelector('.pgm-state');
  const stage    = dialog.querySelector('.pgm-stage');
  const strip    = dialog.querySelector('.pgm-strip');

  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') setActive(activeIndex + 1);
    if (e.key === 'ArrowLeft')  setActive(activeIndex - 1);
  });
  dialog.addEventListener('close', returnAllSlots);

  // ---------- state ----------
  // currentMedia items: {kind:'image', slotId, home, label}
  //                   | {kind:'media', slotId, home, videoKey, label}
  let currentMedia = [];
  let activeIndex  = 0;
  let _stripObserver = null;

  function returnAllSlots() {
    currentMedia.forEach(m => {
      if (m.kind !== 'image' && m.kind !== 'media') return;
      const slot = document.getElementById(m.slotId);
      if (slot && m.home && slot.parentNode !== m.home) {
        slot.style.removeProperty('width');
        slot.style.removeProperty('height');
        slot.style.removeProperty('aspect-ratio');
        m.home.appendChild(slot);
      }
    });
  }

  // Move an image-slot element into the stage at full size.
  function moveSlotToStage(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    slot.style.width       = '100%';
    slot.style.height      = '100%';
    slot.style.aspectRatio = 'auto';
    stage.appendChild(slot);
  }

  // Park all image/media slots that aren't the active one.
  function parkOtherSlots(activeMedia) {
    currentMedia.forEach(m => {
      if (m.kind !== 'image' && m.kind !== 'media') return;
      if (m === activeMedia) return;
      const slot = document.getElementById(m.slotId);
      if (slot && m.home && slot.parentNode !== m.home) {
        slot.style.removeProperty('width');
        slot.style.removeProperty('height');
        slot.style.removeProperty('aspect-ratio');
        m.home.appendChild(slot);
      }
    });
  }

  // ---------- video URL inline form (shown inside stage as overlay) ----------
  function buildVideoOverlay(m) {
    const existing = stage.querySelector('.pgm-video-overlay');
    if (existing) { existing.remove(); return; }

    const url = localStorage.getItem(VIDEO_LS_PREFIX + m.videoKey) || '';
    const overlay = document.createElement('div');
    overlay.className = 'pgm-video-overlay';
    overlay.innerHTML = `
      <div class="pgm-video-overlay-label">Video URL</div>
      <input type="url" class="pgm-video-input" value="${url.replace(/"/g, '&quot;')}" placeholder="Paste a YouTube, Vimeo, or .mp4 URL…">
      <div class="pgm-video-overlay-actions">
        <button type="button" class="pgm-btn-save">Save</button>
        ${url ? '<button type="button" class="pgm-btn-remove">Remove video</button>' : ''}
        <button type="button" class="pgm-btn-cancel">Cancel</button>
      </div>
    `;
    const input     = overlay.querySelector('.pgm-video-input');
    const saveBtn   = overlay.querySelector('.pgm-btn-save');
    const removeBtn = overlay.querySelector('.pgm-btn-remove');
    const cancelBtn = overlay.querySelector('.pgm-btn-cancel');

    const commit = () => {
      const val = input.value.trim();
      if (val) localStorage.setItem(VIDEO_LS_PREFIX + m.videoKey, val);
      else     localStorage.removeItem(VIDEO_LS_PREFIX + m.videoKey);
      renderStage();
      renderStrip();
    };
    saveBtn.addEventListener('click', commit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
    if (removeBtn) removeBtn.addEventListener('click', () => {
      localStorage.removeItem(VIDEO_LS_PREFIX + m.videoKey);
      renderStage();
      renderStrip();
    });
    cancelBtn.addEventListener('click', () => overlay.remove());

    stage.appendChild(overlay);
    input.focus();
    input.select();
  }

  // ---------- bottom video URL bar (shown in empty media stage) ----------
  function buildVideoBar(m) {
    const url = localStorage.getItem(VIDEO_LS_PREFIX + m.videoKey) || '';
    const bar = document.createElement('div');
    bar.className = 'pgm-video-bar';
    bar.innerHTML = `
      <input type="url" class="pgm-video-input" placeholder="Or paste a YouTube, Vimeo, or .mp4 URL…" value="${url.replace(/"/g, '&quot;')}">
      <button type="button" class="pgm-btn-save">${url ? 'Update' : 'Add video'}</button>
      ${url ? '<button type="button" class="pgm-btn-remove">Remove</button>' : ''}
    `;
    const input     = bar.querySelector('.pgm-video-input');
    const saveBtn   = bar.querySelector('.pgm-btn-save');
    const removeBtn = bar.querySelector('.pgm-btn-remove');

    const commit = () => {
      const val = input.value.trim();
      if (val) localStorage.setItem(VIDEO_LS_PREFIX + m.videoKey, val);
      else     localStorage.removeItem(VIDEO_LS_PREFIX + m.videoKey);
      renderStage();
      renderStrip();
    };
    saveBtn.addEventListener('click', commit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
    if (removeBtn) removeBtn.addEventListener('click', () => {
      localStorage.removeItem(VIDEO_LS_PREFIX + m.videoKey);
      renderStage();
      renderStrip();
    });
    return bar;
  }

  // ---------- stage rendering ----------
  function renderStage() {
    const m = currentMedia[activeIndex];
    if (!m) return;

    parkOtherSlots(m);
    stage.innerHTML = '';

    if (m.kind === 'image') {
      moveSlotToStage(m.slotId);

    } else if (m.kind === 'media') {
      const slot     = document.getElementById(m.slotId);
      const hasImage = slot && slot.hasAttribute('data-filled');
      const videoUrl = localStorage.getItem(VIDEO_LS_PREFIX + m.videoKey) || '';

      if (hasImage) {
        // Image wins — show it full-screen; video URL is secondary
        moveSlotToStage(m.slotId);
        const editBtn = document.createElement('button');
        editBtn.type      = 'button';
        editBtn.className = 'pgm-video-edit';
        editBtn.textContent = videoUrl ? 'Edit video URL' : 'Set video URL';
        editBtn.addEventListener('click', () => buildVideoOverlay(m));
        stage.appendChild(editBtn);

      } else if (videoUrl) {
        // No image, but video URL — show the embed
        const wrap = document.createElement('div');
        wrap.style.cssText = 'width:100%;height:100%;position:relative;';
        const html = videoFrameHTML(videoUrl);
        if (html) wrap.innerHTML = html;

        const editBtn = document.createElement('button');
        editBtn.type      = 'button';
        editBtn.className = 'pgm-video-edit';
        editBtn.textContent = 'Edit video URL';
        editBtn.addEventListener('click', () => { stage.innerHTML = ''; stage.appendChild(wrap); buildVideoOverlay(m); });
        wrap.appendChild(editBtn);

        // "Drop an image instead" — show image-slot drop zone above the bar
        const imgBtn = document.createElement('button');
        imgBtn.type      = 'button';
        imgBtn.className = 'pgm-video-edit pgm-video-edit-left';
        imgBtn.textContent = '+ Drop an image';
        imgBtn.addEventListener('click', () => {
          stage.innerHTML = '';
          moveSlotToStage(m.slotId);
          stage.appendChild(buildVideoBar(m));
        });
        wrap.appendChild(imgBtn);

        stage.appendChild(wrap);

      } else {
        // Completely empty — show image-slot drop zone + video URL bar
        moveSlotToStage(m.slotId);
        stage.appendChild(buildVideoBar(m));
      }
    }
  }

  // ---------- strip rendering ----------
  function renderStrip() {
    strip.innerHTML = '';
    currentMedia.forEach((m, i) => {
      const t = document.createElement('button');
      t.type      = 'button';
      t.className = 'pgm-thumb' + (i === activeIndex ? ' is-active' : '');
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      t.addEventListener('click', () => setActive(i));

      if (m.kind === 'image' || m.kind === 'media') {
        const imgUrl   = getSlotImageUrl(m.slotId);
        const videoUrl = m.kind === 'media' ? (localStorage.getItem(VIDEO_LS_PREFIX + m.videoKey) || '') : '';

        if (imgUrl) {
          t.style.backgroundImage    = `url("${imgUrl.replace(/"/g, '%22')}")`;
          t.style.backgroundSize     = 'cover';
          t.style.backgroundPosition = 'center';
          const lbl = document.createElement('div');
          lbl.className   = 'pgm-thumb-img-label';
          lbl.textContent = m.label;
          t.appendChild(lbl);
        } else if (m.kind === 'media' && videoUrl) {
          t.classList.add('is-video');
          t.innerHTML = `<div class="pgm-thumb-video">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <span>Video</span>
          </div>`;
        } else if (m.kind === 'media') {
          // Empty media slot: combined photo+video icon
          t.innerHTML = `<div class="pgm-thumb-photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span>${m.label}</span>
          </div>`;
        } else {
          t.innerHTML = `<div class="pgm-thumb-photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
            </svg>
            <span>${m.label}</span>
          </div>`;
        }
      }

      strip.appendChild(t);
    });
  }

  function watchSlotsForUpdates(mediaConfig) {
    if (_stripObserver) _stripObserver.disconnect();
    _stripObserver = new MutationObserver((mutations) => {
      fetchSidecar().then(() => {
        renderStrip();
        // Re-render stage if the active media slot's fill state changed
        mutations.forEach(mut => {
          const m = currentMedia[activeIndex];
          if (m && m.kind === 'media' && m.slotId === mut.target.id) {
            renderStage();
          }
        });
      });
    });
    mediaConfig.forEach(m => {
      if (m.kind !== 'image' && m.kind !== 'media') return;
      const slot = document.getElementById(m.slotId);
      if (slot) _stripObserver.observe(slot, { attributes: true, attributeFilter: ['data-filled'] });
    });
  }

  function setActive(i) {
    if (!currentMedia.length) return;
    activeIndex = ((i % currentMedia.length) + currentMedia.length) % currentMedia.length;
    renderStage();
    const thumbs = strip.querySelectorAll('.pgm-thumb');
    thumbs.forEach((el, idx) => {
      el.classList.toggle('is-active', idx === activeIndex);
      el.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
    });
    if (thumbs[activeIndex]) {
      thumbs[activeIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function open(project) {
    titleEl.textContent = project.title;
    typeEl.textContent  = project.type;
    stateEl.textContent = project.state;
    currentMedia = project.media;
    activeIndex  = 0;
    // Re-fetch sidecar so thumbnails reflect the latest persisted state
    fetchSidecar().then(() => {
      watchSlotsForUpdates(currentMedia);
      renderStrip();
      renderStage();
    });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  // ---------- wire up project cards ----------
  function ensureGallerySlots(card, id) {
    let park = card.querySelector('.project-gallery-park');
    if (!park) {
      park = document.createElement('div');
      park.className = 'project-gallery-park';
      park.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);pointer-events:none;opacity:0;';
      park.setAttribute('aria-hidden', 'true');
      card.appendChild(park);

      for (let i = 1; i <= 9; i++) {
        const s = document.createElement('image-slot');
        s.id = `proj-${id}-g${i}`;
        s.setAttribute('shape', 'rect');
        s.setAttribute('placeholder', i === 9 ? 'Drop a photo here' : 'Drop a photo');
        park.appendChild(s);
      }
    }
    return park;
  }

  function init() {
    document.querySelectorAll('.project[data-project-id]').forEach(card => {
      const id        = card.dataset.projectId;
      const cover     = card.querySelector('image-slot');
      const coverWrap = card.querySelector('.project-img-wrap');
      const coverSlotId = cover?.id || `project-${id}`;

      const park = ensureGallerySlots(card, id);

      const mediaConfig = [
        { kind: 'image', slotId: coverSlotId,      home: coverWrap, label: 'Cover'        },
        { kind: 'image', slotId: `proj-${id}-g1`,  home: park,      label: 'Photo 2'      },
        { kind: 'image', slotId: `proj-${id}-g2`,  home: park,      label: 'Photo 3'      },
        { kind: 'image', slotId: `proj-${id}-g3`,  home: park,      label: 'Photo 4'      },
        { kind: 'image', slotId: `proj-${id}-g4`,  home: park,      label: 'Photo 5'      },
        { kind: 'image', slotId: `proj-${id}-g5`,  home: park,      label: 'Photo 6'      },
        { kind: 'image', slotId: `proj-${id}-g6`,  home: park,      label: 'Photo 7'      },
        { kind: 'image', slotId: `proj-${id}-g7`,  home: park,      label: 'Photo 8'      },
        { kind: 'image', slotId: `proj-${id}-g8`,  home: park,      label: 'Photo 9'      },
        { kind: 'media', slotId: `proj-${id}-g9`,  home: park,      videoKey: `proj-${id}`, label: 'Photo / Video' },
      ];

      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.style.cursor = 'pointer';

      const openCard = () => open({
        title: card.dataset.projectTitle || card.querySelector('.project-title')?.textContent || 'Project',
        type:  card.dataset.projectType  || card.querySelector('.project-type')?.textContent  || '',
        state: card.dataset.projectState || card.querySelector('.project-meta')?.textContent  || '',
        media: mediaConfig,
      });

      card.addEventListener('click', e => {
        if (e.target.closest('image-slot')) return;
        openCard();
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); }
      });

      if (coverWrap && !coverWrap.querySelector('.project-open')) {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'project-open';
        btn.setAttribute('aria-label', 'Open gallery');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
          </svg>
          <span>Open gallery</span>
        `;
        btn.addEventListener('click', e => { e.stopPropagation(); openCard(); });
        coverWrap.appendChild(btn);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
