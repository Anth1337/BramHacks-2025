// overlay.js — panels over the full-screen Earth.
// BASIC: diameter (km), per (years), q (AU), rot_per (h)
// ADVANCED: the rest. Button label auto-switches.
// Console: header is a draggable tab; centered hint; minimize never clips.

(function () {
  const $ = (id) => document.getElementById(id);
  const nowStamp = () => new Date().toLocaleTimeString();
  const cssVar = (name, value) => document.documentElement.style.setProperty(name, value);

  // 1) Build overlay DOM
  const container = document.getElementById('main-container');
  const overlay = document.createElement('div');
  overlay.id = 'ui-overlay';
  overlay.innerHTML = `
    <!-- LEFT: Form One -->
    <section id="panel-left" class="card">
      <h3>Form One — Input Fields</h3>

      <div class="subhead">Basic Parameters</div>
      <div class="grid2">
        <label class="field">
          <div class="lbl">Diameter (km)</div>
          <input id="f_diameter" class="inp" type="text" />
        </label>
        <label class="field">
          <div class="lbl">Period (years)</div>
          <input id="f_per" class="inp" type="text" />
        </label>
        <label class="field">
          <div class="lbl">Perihelion q (AU)</div>
          <input id="f_q" class="inp" type="text" />
        </label>
        <label class="field">
          <div class="lbl">Rotation period (h)</div>
          <input id="f_rot" class="inp" type="text" />
        </label>
      </div>

      <button id="btn-advanced" class="collapse">▸ Show Advanced</button>

      <div id="advanced-section" style="display:none;">
        <div class="subhead">Advanced Parameters</div>
        <div class="grid2">
          <label class="field"><div class="lbl">Name / Designation</div><input id="f_name" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Semi-major axis a (AU)</div><input id="f_a" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Eccentricity e</div><input id="f_e" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Inclination i (deg)</div><input id="f_i" class="inp" type="text" /></label>

          <label class="field"><div class="lbl">Aphelion ad (AU)</div><input id="f_ad" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Mean motion n (deg/day)</div><input id="f_n" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Mean anomaly ma (deg)</div><input id="f_ma" class="inp" type="text" /></label>

          <label class="field"><div class="lbl">Absolute magnitude H</div><input id="f_H" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Albedo</div><input id="f_albedo" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">GM (optional)</div><input id="f_gm" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Spectral (Bus/Tholen)</div><input id="f_specB" class="inp" type="text" /></label>
          <label class="field"><div class="lbl">Taxonomic class</div><input id="f_specT" class="inp" type="text" /></label>
        </div>
      </div>

      <div class="row" style="margin-top:12px;">
        <button id="btn-search" class="btn">Basic Search</button>
        <div id="form-warning" class="error" style="display:none;">If using a/e/i, require a&gt;0, 0≤e&lt;1, 0≤i≤180</div>
      </div>
    </section>

    <!-- RIGHT: Top 5 Near Misses / Hits -->
    <section id="panel-right" class="card">
      <h3>Top 5 — Near Misses / Hits (demo)</h3>
      <div id="near-list" class="list"></div>
      <p class="muted s" style="margin-top:8px;">
        Click an item to auto-fill Form One with available parameters.
      </p>
    </section>

    <!-- BOTTOM: Console -->
    <section id="panel-bottom" class="card console">
      <div class="row" id="console-header">
        <span class="grip" id="console-grip" title="Drag to resize"></span>
        <h3 id="console-title" style="margin:0;">Console</h3>
        <div class="center-hint" id="center-hint">⇵ drag to resize • scroll logs</div>
        <div class="grow"></div>
        <button id="btn-copy" class="btn ghost" title="Copy logs">Copy</button>
        <button id="btn-clear" class="btn ghost" title="Clear logs">Clear</button>
        <button id="btn-min" class="iconbtn" title="Minimize/Restore">–</button>
      </div>
      <div id="console-box" class="console-box">
        <div class="muted s">Console is empty. Actions and results will appear here.</div>
      </div>
    </section>
  `;
  container.appendChild(overlay);

  /* ---------- Layout & console resizing (drag) ---------- */
  const consolePanel = $('panel-bottom');
  const consoleHeader = $('console-header');
  const consoleBox = $('console-box');
  const minBtn = $('btn-min');

  let isMin = false;
  let dragging = false;
  let startY = 0;
  let startH = 0;
  let lastHeight = 240; // remember last non-minimized height
  let MIN_H = 200;      // computed from header height + card padding

  function currentConsoleH(){
    const hVar = getComputedStyle(document.documentElement).getPropertyValue('--consoleH').trim();
    const n = parseInt(hVar, 10);
    return Number.isFinite(n) ? n : consolePanel.offsetHeight || 240;
  }

  function computeMinHeight(){
    // Header + card paddings (16 top + 16 bottom) + a small cushion (4) to avoid edge clipping
    const headerH = consoleHeader?.offsetHeight || 44;
    MIN_H = headerH + 36;
  }

  function clampHeight(h){
    // Never exceed 60% of the viewport; never below the true header height
    const maxH = Math.floor(window.innerHeight * 0.6);
    return Math.max(MIN_H, Math.min(maxH, h));
  }

  function setHeight(h){
    const clamped = clampHeight(h);
    cssVar('--consoleH', clamped + 'px');
    lastHeight = clamped;
  }

  function setMinimized(state){
    isMin = state;
    consolePanel.classList.toggle('min', isMin);
    if (isMin) {
      computeMinHeight();
      cssVar('--consoleH', MIN_H + 'px');
      minBtn.textContent = '▢';  // restore icon
      minBtn.title = 'Restore console';
    } else {
      minBtn.textContent = '–';  // minimize icon
      minBtn.title = 'Minimize console';
      setHeight(lastHeight || 240);
    }
  }

  function beginDrag(clientY, target){
    if (target.closest('button')) return; // ignore drags starting on buttons
    dragging = true;
    startY = clientY;
    startH = currentConsoleH();
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }
  function duringDrag(clientY){
    if (!dragging) return;
    const delta = startY - clientY; // moving up => taller
    const newH = clampHeight(startH + delta);
    if (newH <= MIN_H + 1) {
      setMinimized(true);
    } else {
      if (isMin) setMinimized(false);
      setHeight(newH);
    }
  }
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // Draggable areas: whole header, the grip, and the title
  [ $('console-header'), $('console-grip'), $('console-title') ].filter(Boolean).forEach(el => {
    el.addEventListener('mousedown', (e) => beginDrag(e.clientY, e.target));
    el.addEventListener('touchstart', (e) => beginDrag(e.touches[0].clientY, e.target), { passive:false });
  });
  window.addEventListener('mousemove', (e) => duringDrag(e.clientY));
  window.addEventListener('touchmove', (e) => { duringDrag(e.touches[0].clientY); }, { passive:false });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
  window.addEventListener('mouseleave', endDrag);
  window.addEventListener('resize', () => {
    computeMinHeight();
    if (isMin) cssVar('--consoleH', MIN_H + 'px'); else setHeight(currentConsoleH());
  });

  // Minimize/restore button
  minBtn.addEventListener('click', () => setMinimized(!isMin));

  /* ---------- Console helpers ---------- */
  function appendLog(level, text){
    const line = document.createElement('div');
    line.className = `logline ${level.toLowerCase()}`;
    line.innerHTML = `<span class="ts">[${nowStamp()}]</span> <span class="lvl">${level}</span> `;
    const msgSpan = document.createElement('span');
    msgSpan.className = 'msg';
    msgSpan.textContent = text;
    line.appendChild(msgSpan);
    if (consoleBox.firstElementChild && consoleBox.firstElementChild.classList.contains('muted')) {
      consoleBox.innerHTML = '';
    }
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }
  $('btn-copy').addEventListener('click', () => {
    const s = Array.from(consoleBox.querySelectorAll('.logline')).map(l => l.textContent).join('\n');
    navigator.clipboard?.writeText(s);
  });
  $('btn-clear').addEventListener('click', () => {
    consoleBox.innerHTML = '<div class="muted s">Console is empty. Actions and results will appear here.</div>';
  });

  // Ensure min height stays correct as content / fonts settle
  new MutationObserver(() => { computeMinHeight(); if (isMin) cssVar('--consoleH', MIN_H + 'px'); })
    .observe(consoleBox, { childList: true, subtree: true });

  /* ---------- Near-miss demo list (unchanged) ---------- */
  const NEAR_EVENTS = [
    { id:'2025-AB', title:'2025 AB', kind:'Near Miss', date:'2025-11-05', distance_AU:0.0031, relVel_kms:18.2, H:22.1,
      params:{ name:'2025 AB', a:1.12, e:0.21, i:5.5, ma:0, per:1.19, n:0.986, H:22.1, albedo:0.23, diameter_km:0.11,
               q:1.12*(1-0.21), ad:1.12*(1+0.21), rot_per:null, GM:null, spec_B:'S', spec_T:'Sq' } },
    { id:'2024-XY', title:'2024 XY', kind:'Near Miss', date:'2024-12-13', distance_AU:0.0026, relVel_kms:11.4, H:24.5,
      params:{ name:'2024 XY', a:0.88, e:0.33, i:2.1, ma:180, per:0.83, n:1.17, H:24.5, albedo:0.15, diameter_km:0.06,
               q:0.88*(1-0.33), ad:0.88*(1+0.33), rot_per:6.2, GM:null, spec_B:'C', spec_T:'Ch' } },
    { id:'Bennu', title:'101955 Bennu', kind:'Reference', date:'Known', distance_AU:0.003, relVel_kms:12.6, H:20.2,
      params:{ name:'101955 Bennu', a:1.126, e:0.203, i:6.0, ma:0, per:1.20, n:0.985, H:20.2, albedo:0.045, diameter_km:0.492,
               q:1.126*(1-0.203), ad:1.126*(1+0.203), rot_per:4.3, GM:null, spec_B:'B', spec_T:'B' } },
    { id:'Apophis', title:'99942 Apophis', kind:'Near Miss (2029)', date:'2029-04-13', distance_AU:0.00026, relVel_kms:7.4, H:19.7,
      params:{ name:'99942 Apophis', a:0.922, e:0.191, i:3.3, ma:0, per:0.90, n:1.11, H:19.7, albedo:0.33, diameter_km:0.375,
               q:0.922*(1-0.191), ad:0.922*(1+0.191), rot_per:30.5, GM:null, spec_B:'Sq', spec_T:'Sq' } },
    { id:'Didymos', title:'65803 Didymos', kind:'Reference', date:'2022 DART', distance_AU:0.039, relVel_kms:6.1, H:18.2,
      params:{ name:'65803 Didymos', a:1.644, e:0.383, i:3.4, ma:0, per:2.11, n:0.468, H:18.2, albedo:0.15, diameter_km:0.78,
               q:1.644*(1-0.383), ad:1.644*(1+0.383), rot_per:2.26, GM:null, spec_B:'Xk', spec_T:'Xk' } },
  ];
  const nearList = $('near-list');
  NEAR_EVENTS.forEach((ev) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <div class="item-title">${ev.title}</div>
      <div class="item-sub">
        <span class="chip">${ev.kind}</span>
        <span class="sep">•</span>
        ${ev.date} <span class="sep">•</span> ${ev.distance_AU} AU
      </div>
      <div class="muted s">v_rel ${ev.relVel_kms} km/s <span class="sep">•</span> H ${ev.H}</div>
    `;
    item.addEventListener('click', () => fillFromEvent(ev));
    nearList.appendChild(item);
  });

  /* ---------- Form logic (unchanged) ---------- */
  const fields = {
    // BASIC
    diameter_km: $('f_diameter'),
    per: $('f_per'),
    q: $('f_q'),
    rot_per: $('f_rot'),
    // ADVANCED
    name: $('f_name'),
    a: $('f_a'), e: $('f_e'), i: $('f_i'),
    ad: $('f_ad'), n: $('f_n'), ma: $('f_ma'),
    H: $('f_H'), albedo: $('f_albedo'),
    GM: $('f_gm'), spec_B: $('f_specB'), spec_T: $('f_specT'),
  };
  const advancedKeys = ['name','a','e','i','ad','n','ma','H','albedo','GM','spec_B','spec_T'];

  function setField(id, value){ if(fields[id]) fields[id].value = value==null ? '' : String(value); }

  (function primeDefaults(){
    setField('diameter_km','0.49');
    setField('per','1.0');
    setField('q','0.90');
    setField('rot_per','4.3');
    advancedKeys.forEach(k => setField(k, ''));
    updateSearchButtonLabel();
  })();

  function syncDerived(){
    const a = parseFloat(fields.a?.value);
    const e = parseFloat(fields.e?.value);
    if (Number.isFinite(a) && Number.isFinite(e)) {
      setField('q', (a*(1-e)).toString());
      setField('ad',(a*(1+e)).toString());
    }
  }
  if (fields.a) fields.a.addEventListener('input', () => { syncDerived(); updateSearchButtonLabel(); });
  if (fields.e) fields.e.addEventListener('input', () => { syncDerived(); updateSearchButtonLabel(); });

  function isAdvancedUsed(){ return advancedKeys.some(k => fields[k] && fields[k].value.trim() !== ''); }
  function updateSearchButtonLabel(){ $('btn-search').textContent = isAdvancedUsed() ? 'Advanced Search' : 'Basic Search'; }
  advancedKeys.forEach(k => { if(fields[k]) fields[k].addEventListener('input', updateSearchButtonLabel); });

  function fillFromEvent(ev){
    if ('diameter_km' in ev.params) setField('diameter_km', ev.params.diameter_km);
    if ('per' in ev.params)        setField('per', ev.params.per);
    if ('q' in ev.params)          setField('q', ev.params.q);
    if ('rot_per' in ev.params)    setField('rot_per', ev.params.rot_per);
    Object.entries(ev.params).forEach(([k,v]) => {
      if (fields[k] && !['diameter_km','per','q','rot_per'].includes(k)) setField(k, v);
    });
    appendLog('INFO', `Loaded parameters from "${ev.title}" (dist ${ev.distance_AU} AU, ${ev.kind}).`);
    syncDerived();
    updateSearchButtonLabel();
  }

  const advBtn = $('btn-advanced');
  const advSection = $('advanced-section');
  let advOpen = false;
  advBtn.addEventListener('click', () => {
    advOpen = !advOpen;
    advSection.style.display = advOpen ? 'block' : 'none';
    advBtn.textContent = advOpen ? '▾ Hide Advanced' : '▸ Show Advanced';
  });

  function advancedIsValid(){
    if (!isAdvancedUsed()) return true;
    const a = parseFloat(fields.a.value);
    const e = parseFloat(fields.e.value);
    const i = parseFloat(fields.i.value);
    return (!fields.a.value || (Number.isFinite(a) && a > 0))
        && (!fields.e.value || (Number.isFinite(e) && e >= 0 && e < 1))
        && (!fields.i.value || (Number.isFinite(i) && i >= 0 && i <= 180));
  }

  function doSearch(){
    const basic = {
      diameter_km: parseFloat(fields.diameter_km.value || '0'),
      per: parseFloat(fields.per.value || '0'),
      q: parseFloat(fields.q.value || '0'),
      rot_per: fields.rot_per.value === '' ? null : parseFloat(fields.rot_per.value),
    };
    const usedAdv = advancedKeys.filter(k => (fields[k]?.value || '').trim() !== '');
    appendLog('INFO', `${isAdvancedUsed() ? 'Advanced' : 'Basic'} Search submitted.`);
    appendLog('INFO', `Basic={diameter:${basic.diameter_km}, per:${basic.per}, q:${basic.q}, rot_per:${basic.rot_per}}`);
    if (usedAdv.length) appendLog('INFO', `Advanced fields used: ${usedAdv.join(', ')}`);
  }

  $('btn-search').addEventListener('click', () => {
    const warn = $('form-warning');
    if (!advancedIsValid()){
      warn.style.display = 'block';
      appendLog('WARN','Advanced fields invalid (if used): need a>0, 0≤e<1, 0≤i≤180.');
      return;
    }
    warn.style.display = 'none';
    doSearch();
  });

  // Initial sizing
  computeMinHeight();
  setHeight(240);
  setMinimized(false);
})();
