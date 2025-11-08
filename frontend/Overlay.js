// overlay.js — overlays three panels over the full-screen Earth.
// Basic fields: diameter, per, q, rot_per. Everything else is Advanced.
// The main button shows "Basic Search" unless any Advanced field is filled.

(function () {
  const $ = (id) => document.getElementById(id);
  const nowStamp = () => new Date().toLocaleTimeString();

  // 1) Inject overlay DOM
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
        <div id="form-warning" class="error" style="display:none;">Check inputs: if using a/e/i, a&gt;0, 0≤e&lt;1, 0≤i≤180</div>
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
      <div class="row">
        <h3 style="margin:0;">Console</h3>
        <div class="grow"></div>
        <button id="btn-copy" class="btn ghost">Copy</button>
        <button id="btn-clear" class="btn ghost">Clear</button>
      </div>
      <div id="console-box" class="console-box">
        <div class="muted s">Console is empty. Actions and results will appear here.</div>
      </div>
    </section>
  `;
  container.appendChild(overlay);

  // 2) Keep panels in-viewport (if console height changes, recompute)
  function layoutPanels(){
    const bottom = document.getElementById('panel-bottom');
    const h = Math.max(bottom?.offsetHeight || 0, 200);
    document.documentElement.style.setProperty('--consoleH', `${h}px`);
  }
  window.addEventListener('resize', layoutPanels);
  setTimeout(layoutPanels, 0);

  // 3) Console helpers
  const consoleBox = $('console-box');
  const appendLog = (level, text) => {
    const line = document.createElement('div');
    line.className = `logline ${level.toLowerCase()}`;
    line.innerHTML = `<span class="ts">[${nowStamp()}]</span> <span class="lvl">${level}</span> ${text}`;
    if (consoleBox.firstElementChild && consoleBox.firstElementChild.classList.contains('muted')) {
      consoleBox.innerHTML = '';
    }
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  };
  $('btn-copy').addEventListener('click', () => {
    const s = Array.from(consoleBox.querySelectorAll('.logline')).map(l => l.textContent).join('\n');
    navigator.clipboard?.writeText(s);
  });
  $('btn-clear').addEventListener('click', () => {
    consoleBox.innerHTML = '<div class="muted s">Console is empty. Actions and results will appear here.</div>';
    layoutPanels();
  });

  // 4) Near-miss demo list (same data)
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

  // 5) Form logic
  const fields = {
    // BASIC
    diameter_km: $('f_diameter'),
    per: $('f_per'),
    q: $('f_q'),
    rot_per: $('f_rot'),
    // ADVANCED
    name: $('f_name'),
    a: $('f_a'), e: $('f_e'), i: $('f_i'),
    H: $('f_H'), albedo: $('f_albedo'),
    ad: $('f_ad'), n: $('f_n'), ma: $('f_ma'),
    GM: $('f_gm'), spec_B: $('f_specB'), spec_T: $('f_specT'),
  };

  function setField(id, value){ if(fields[id]) fields[id].value = value==null ? '' : String(value); }

  // Defaults for a nice starting point
  (function primeDefaults(){
    setField('diameter_km','0.49');
    setField('per','1.0');
    setField('q','0.9');
    setField('rot_per','4.3');

    // Advanced left blank by default; when filled they’ll switch button label
    setField('a',''); setField('e',''); setField('i','');
    setField('H',''); setField('albedo',''); setField('ad','');
    setField('n',''); setField('ma',''); setField('GM','');
    setField('spec_B',''); setField('spec_T','');
    updateSearchButtonLabel();
  })();

  // If user fills in a/e, we can recompute q/ad (q is BASIC, ad is ADV)
  function syncDerived(){
    const a = parseFloat(fields.a?.value);
    const e = parseFloat(fields.e?.value);
    if (Number.isFinite(a) && Number.isFinite(e)) {
      setField('q', (a*(1-e)).toString());
      setField('ad',(a*(1+e)).toString());
    }
  }
  if (fields.a) fields.a.addEventListener('input', ()=>{ syncDerived(); updateSearchButtonLabel(); });
  if (fields.e) fields.e.addEventListener('input', ()=>{ syncDerived(); updateSearchButtonLabel(); });

  // Any advanced input toggles the button label
  const advancedKeys = ['name','a','e','i','H','albedo','ad','n','ma','GM','spec_B','spec_T'];
  advancedKeys.forEach(k => { if(fields[k]) fields[k].addEventListener('input', updateSearchButtonLabel); });

  function isAdvancedUsed(){
    return advancedKeys.some(k => fields[k] && fields[k].value.trim() !== '');
  }
  function updateSearchButtonLabel(){
    $('btn-search').textContent = isAdvancedUsed() ? 'Advanced Search' : 'Basic Search';
  }

  // Fill from near-miss item
  function fillFromEvent(ev){
    // Basic fields first
    if (typeof ev.params.diameter_km !== 'undefined') setField('diameter_km', ev.params.diameter_km);
    if (typeof ev.params.per !== 'undefined')         setField('per', ev.params.per);
    if (typeof ev.params.q !== 'undefined')           setField('q', ev.params.q);
    if (typeof ev.params.rot_per !== 'undefined')     setField('rot_per', ev.params.rot_per);

    // Advanced fields next
    Object.entries(ev.params).forEach(([k,v]) => { if(fields[k] && !['diameter_km','per','q','rot_per'].includes(k)) setField(k, v); });

    appendLog('INFO', `Loaded parameters from "${ev.title}" (dist ${ev.distance_AU} AU, ${ev.kind}).`);
    updateSearchButtonLabel();
    syncDerived();
  }

  // Advanced toggle
  const advBtn = $('btn-advanced');
  const advSection = $('advanced-section');
  let advOpen = false;
  advBtn.addEventListener('click', () => {
    advOpen = !advOpen;
    advSection.style.display = advOpen ? 'block' : 'none';
    advBtn.textContent = advOpen ? '▾ Hide Advanced' : '▸ Show Advanced';
    layoutPanels();
  });

  // Validation (only if user uses a/e/i in Advanced)
  function advancedIsValid(){
    if (!isAdvancedUsed()) return true; // no advanced → valid
    const a = parseFloat(fields.a.value);
    const e = parseFloat(fields.e.value);
    const i = parseFloat(fields.i.value);
    return (!fields.a.value || (Number.isFinite(a) && a>0))
        && (!fields.e.value || (Number.isFinite(e) && e>=0 && e<1))
        && (!fields.i.value || (Number.isFinite(i) && i>=0 && i<=180));
  }

  // Mock “search”
  function doSearch(){
    const basic = {
      diameter_km: parseFloat(fields.diameter_km.value || '0'),
      per:         parseFloat(fields.per.value || '0'),
      q:           parseFloat(fields.q.value || '0'),
      rot_per:     fields.rot_per.value === '' ? null : parseFloat(fields.rot_per.value),
    };
    const adv = Object.fromEntries(advancedKeys.map(k => [k, fields[k]?.value ?? '']));
    const mode = isAdvancedUsed() ? 'Advanced' : 'Basic';
    appendLog('INFO', `${mode} Search submitted.`);
    appendLog('INFO', `Basic={diameter:${basic.diameter_km}, per:${basic.per}, q:${basic.q}, rot_per:${basic.rot_per}}`);
    if (mode === 'Advanced') {
      appendLog('INFO', `Advanced fields used: ${advancedKeys.filter(k => (fields[k]?.value||'').trim() !== '').join(', ') || '(none)'}`);
    }
  }

  // Button click
  $('btn-search').addEventListener('click', () => {
    const warn = $('form-warning');
    if (!advancedIsValid()){
      warn.style.display = 'block';
      appendLog('WARN','Advanced fields invalid (if used): require a>0, 0≤e<1, 0≤i≤180.');
      return;
    }
    warn.style.display = 'none';
    doSearch();
  });

  // Console utils
  function appendLog(level, text){
    const box = $('console-box');
    const line = document.createElement('div');
    line.className = `logline ${level.toLowerCase()}`;
    line.innerHTML = `<span class="ts">[${nowStamp()}]</span> <span class="lvl">${level}</span> ${text}`;
    if (box.firstElementChild && box.firstElementChild.classList.contains('muted')) box.innerHTML = '';
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  // Initial layout
  layoutPanels();
})();
