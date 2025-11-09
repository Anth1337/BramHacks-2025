// Overlay redesigned for asteroid miners — mission planner + quick transfer estimator
// Purpose: provide quick access to asteroid properties, launch parameters (launch site/date/payload),
// and a simple Hohmann-transfer estimator between Earth's orbit and the asteroid's semi-major axis.
// This overlay intentionally does not modify camera, zoom, or view.

(function () {
  const $ = (id) => document.getElementById(id);
  const nowStamp = () => new Date().toLocaleTimeString();
  const container = document.getElementById('main-container');

  const overlay = document.createElement('div');
  overlay.id = 'ui-overlay';
  overlay.innerHTML = `
    <section id="panel-left" class="card">
      <h3>Mission Planner</h3>
      <div class="subhead">Target & Launch (auto)</div>
      <div class="field">
        <label>Asteroid</label>
        <input id="mp_target" class="inp" type="text" readonly style="cursor:default;" value="Loading..." />
      </div>

      <div class="subhead">Launch Site (lat/lon)</div>
      <div class="grid2">
        <label class="field"><div class="lbl">Latitude</div><input id="mp_lat" class="inp" type="number" step="0.01" value="28.5721" /></label>
        <label class="field"><div class="lbl">Longitude</div><input id="mp_lon" class="inp" type="number" step="0.01" value="-80.6480" /></label>
      </div>

      <div class="subhead">Vehicle / Payload</div>
      <div class="grid2">
        <label class="field"><div class="lbl">Payload mass (kg)</div><input id="mp_payload" class="inp" type="number" step="1" value="1000" /></label>
        <label class="field"><div class="lbl">Vehicle ISP (s)</div><input id="mp_isp" class="inp" type="number" step="1" value="320" /></label>
      </div>

      <div style="margin-top:10px;">
        <button id="mp_compute" class="btn" style="width:100%; display:block;">Compute transfer (Hohmann est.)</button>
      </div>
    </section>

    <section id="panel-right" class="card">
      <h3>Asteroid Info</h3>
      <div id="ai_name" class="muted s">Select an asteroid to see properties</div>
      <div id="ai_table" style="margin-top:8px"></div>
    </section>

  <section id="panel-bottom" class="card console results">
      <div class="row" id="results-header">
        <h3 id="results-title" style="margin:0;">Estimates & Results</h3>
        <div class="grow"></div>
        <button id="results_clear" class="btn ghost">Clear</button>
      </div>
      <div id="results-box" class="results-box" style="padding:12px;">
        <div style="display:grid;grid-template-columns:1fr;gap:8px;">
          <div id="res_quick" style="font-size:14px;line-height:1.35;">
            <div><strong>Δv</strong>: <span id="res_dv">—</span> km/s (heliocentric, excl. Earth escape)</div>
            <div><strong>Transfer</strong>: <span id="res_transfer">—</span> days</div>
            <div><strong>Estimated ideal launch</strong>: <span id="res_launch">—</span></div>
            <div><strong>Mission success</strong>: <span id="res_success">—</span> • <strong>Difficulty</strong>: <span id="res_difficulty">—</span></div>
            <div><strong>Composition</strong>: <span id="res_composition">—</span></div>
            <div><strong>Yarkovsky drift est.</strong>: <span id="res_yark">—</span> — viable ~ <span id="res_yark_years">—</span> years</div>
          </div>
          <div id="results_history" style="max-height:160px; overflow:auto; border-top:1px solid rgba(0,0,0,0.06); padding-top:8px;" class="muted s">
            <div class="muted s">Actions and recent estimates will appear here.</div>
          </div>
        </div>
      </div>
    </section>
  `;
  container.appendChild(overlay);

  // Load the selected asteroid from localStorage (set by selection page)
  let selectedAsteroid = null;
  
  function loadSelectedAsteroid() {
    try {
      const storedData = localStorage.getItem('selectedAsteroid');
      if (storedData) {
        selectedAsteroid = JSON.parse(storedData);
        console.log('Loaded selected asteroid from localStorage:', selectedAsteroid);
        
        // Update the display
        const targetInput = $('mp_target');
        if (selectedAsteroid) {
          targetInput.value = selectedAsteroid.name || 'Unknown Asteroid';
        } else {
          targetInput.value = 'No asteroid selected';
        }
        
        // Update asteroid info panel
        showAsteroidInfo();
      }
    } catch (error) {
      console.error('Failed to load selected asteroid from localStorage:', error);
    }
  }
  
  // Initial load
  loadSelectedAsteroid();
  
  // Listen for custom asteroid selection event (dispatched from selection page)
  window.addEventListener('asteroidSelected', (e) => {
    console.log('Asteroid selected event received:', e.detail);
    loadSelectedAsteroid();
  });
  
  // Listen for storage changes (when asteroid is selected from another page/tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'selectedAsteroid') {
      console.log('Detected asteroid selection change');
      loadSelectedAsteroid();
    }
  });
  
  // Also check when window gains focus (covers same-tab navigation)
  window.addEventListener('focus', () => {
    console.log('Window focused, checking for asteroid updates');
    loadSelectedAsteroid();
  });

  const resultsHistory = $('results_history');
  function appendLog(text){
    const line = document.createElement('div');
    line.className = 'logline';
    line.style.padding = '6px 0';
    line.textContent = `[${nowStamp()}] ${text}`;
    if (resultsHistory.firstElementChild && resultsHistory.firstElementChild.classList.contains('muted')) resultsHistory.innerHTML='';
    resultsHistory.insertBefore(line, resultsHistory.firstChild);
  }
  $('results_clear').addEventListener('click', () => { resultsHistory.innerHTML = '<div class="muted s">Actions and recent estimates will appear here.</div>'; 
    // clear results display
    ['res_dv','res_transfer','res_launch','res_success','res_difficulty','res_composition','res_yark','res_yark_years'].forEach(id=>{ const el = document.getElementById(id); if(el) el.textContent='—'; });
  });

  // Display selected asteroid properties
  function showAsteroidInfo(){
    const t = selectedAsteroid;
    const table = $('ai_table');
    if (!t){ 
      table.innerHTML=''; 
      $('ai_name').textContent='No asteroid selected'; 
      return; 
    }
    $('ai_name').textContent = t.name;
    const epoch = t.ephem && t.ephem.epoch ? t.ephem.epoch : 'n/a';
    const ma = t.ephem && (t.ephem.ma !== undefined) ? t.ephem.ma : 'n/a';
    const a = t.ephem && t.ephem.a ? t.ephem.a : (t.orbitRadius || 'n/a');
    const e = t.ephem && t.ephem.e ? t.ephem.e : 'n/a';
    const i = t.ephem && t.ephem.i ? t.ephem.i : 'n/a';
    
    table.innerHTML = `
      <div class="muted">Diameter: ${t.diameter_km ? t.diameter_km.toFixed(3) : 'n/a'} km</div>
      <div class="muted">a: ${a} AU • e: ${e} • i: ${i}°</div>
      <div class="muted">Epoch: ${epoch} • Mean anomaly (ma): ${ma}°</div>
      <div class="muted">Composition: ${t.composition || 'unknown'}</div>
      <div class="muted">Weight: ${formatWeight(t.weight || 0)}</div>
      <div class="muted">Magnitude (H): ${t.magnitude || 'n/a'}</div>
      <div class="muted">Distance (MOID): ${t.distance || 'n/a'}</div>
    `;
  }
  
  // Format weight for display
  function formatWeight(weight) {
    if (weight >= 1000000) {
      return `${(weight / 1000000).toFixed(1)}M tons`;
    } else if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}K tons`;
    } else {
      return `${weight.toFixed(0)} tons`;
    }
  }

  // Simple Hohmann estimator (heliocentric circular approx). Returns {dv_kms, t_days}
  function hohmannFromEarth(aAU){
    const AU_KM = 149597870.7;
    const muSun = 1.32712440018e11; // km^3 / s^2
    const r1 = 1.0 * AU_KM;
    const r2 = aAU * AU_KM;
    // circular speeds
    const v1 = Math.sqrt(muSun / r1);
    const v2 = Math.sqrt(muSun / r2);
    const dv1 = Math.abs(v1 * (Math.sqrt(2 * r2 / (r1 + r2)) - 1));
    const dv2 = Math.abs(v2 * (1 - Math.sqrt(2 * r1 / (r1 + r2))));
    const totalDv = dv1 + dv2;
    const transferTimeSec = Math.PI * Math.sqrt(Math.pow((r1 + r2) / 2, 3) / muSun);
    const transferDays = transferTimeSec / 86400;
    return { dv_kms: +(totalDv/1000).toFixed(3), t_days: +transferDays.toFixed(1) };
  }

  // Estimate ideal launch date/time (very approximate):
  // - Use circular-orbit mean motions (years) and Hohmann transfer time.
  // - Compute required phase angle phi = pi - n_target * t_transfer
  // - Estimate wait time = phi / (n_target - n_earth) (years); fallback to synodic/4
  function estimateLaunchEpoch(aAU){
    const now = new Date();
    const Tearth = 1.0; // years
    const Ttarget = Math.pow(aAU, 1.5); // years (Kepler's third law, solar)
    const nEarth = 2*Math.PI / Tearth; // rad/yr
    const nTarget = 2*Math.PI / Ttarget;

    // transfer time in years (use hohmannFromEarth helper)
    const ho = hohmannFromEarth(aAU);
    const t_transfer_years = ho.t_days / 365.25;

    // required phase angle (radians)
    const phi = Math.PI - (nTarget * t_transfer_years);

    let denom = (nTarget - nEarth);
    let wait_years = null;
    if (Math.abs(denom) > 1e-6) {
      // normalize phi to 0..2pi
      const phiNorm = ((phi % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
      wait_years = phiNorm / Math.abs(denom);
      // reduce to nearest positive time
      wait_years = wait_years % (2*Math.PI / Math.abs(denom));
    }
    // fallback: use quarter synodic period
    if (!wait_years || !isFinite(wait_years) || wait_years <= 0) {
      const synodic = Math.abs(1 / Math.abs(1/Tearth - 1/Ttarget));
      wait_years = Math.max(0.01, synodic * 0.25);
    }

    const launchDate = new Date(now.getTime() + wait_years * 365.25 * 24*3600*1000);
    return { launchDate, wait_years };
  }

  // Heuristic mission scoring: combine DV, inclination, size/payload to derive
  // mission success probability (0-100) and difficulty (Easy/Moderate/Hard).
  function missionMetrics(aAU, dv_kms, inclination_deg, diameter_km, payload_kg){
    // DV score: lower dv => better
    let dvScore = Math.max(0, 1 - (dv_kms / 12)); // 0..1 (assume 12 km/s very hard)
    // Inclination penalty
    let incScore = Math.max(0, 1 - (Math.abs(inclination_deg) / 60));
    // Size: smaller asteroids are harder to interact with (capture/attachment)
    let sizeScore = Math.min(1, Math.log10(Math.max(diameter_km*1000, 1)) / 3); // rough
    // Payload adequacy: naive check — more payload increases success
    let payloadScore = Math.min(1, payload_kg / 5000);

    // Composition multiplier: easier to mine metal-rich; carbonaceous harder to process
    let compMult = 1.0;
    // if diameter small treat as harder
    const base = (0.5*dvScore + 0.2*incScore + 0.2*sizeScore + 0.1*payloadScore) * compMult;
    const successPct = Math.round(Math.max(1, Math.min(99, base * 100)));

    let difficulty = 'Moderate';
    if (successPct > 75) difficulty = 'Easy';
    else if (successPct < 35) difficulty = 'Hard';

    return { successPct, difficulty };
  }

  // Yarkovsky lifetime estimate using the ML-based prediction endpoint:
  // - Calls the FastAPI /predict endpoint with asteroid parameters
  // - Uses the returned da/dt (in AU/Myr) to estimate orbital drift timeline
  async function yarkovskyEstimateYears(asteroid, threshold_au=0.01){
    try {
      // Prepare payload for the API
      // H (absolute magnitude) can be estimated from diameter if not available
      // H = 5 * log10(1329/D/sqrt(pv)) where pv ~ 0.14 for unknown
      const D_km = asteroid.diameter_km;
      const H = asteroid.H || (5 * Math.log10(1329 / D_km / Math.sqrt(0.14)));
      
      const payload = {
        H: H,
        a: asteroid.a,
        e: asteroid.e,
        Tax: asteroid.composition || "UNKNOWN",
        D_km: D_km
      };

      const response = await fetch('http://localhost:8080/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      // data.da_dt is in AU/Myr
      const rate_AU_per_Myr = Math.abs(data.da_dt);
      const rate_AU_per_year = rate_AU_per_Myr / 1e6;
      const years = Math.abs(threshold_au / rate_AU_per_year);
      
      return { rate_AU_per_year, years };
    } catch (error) {
      console.error('Yarkovsky API call failed, falling back to heuristic:', error);
      // Fallback to simple heuristic if API fails
      const base_AU_per_Myr_for_0_1km = 1e-4;
      const rate_AU_per_Myr = base_AU_per_Myr_for_0_1km * (0.1 / Math.max(0.01, asteroid.diameter_km));
      const rate_AU_per_year = rate_AU_per_Myr / 1e6;
      const years = Math.abs(threshold_au / rate_AU_per_year);
      return { rate_AU_per_year, years };
    }
  }

  // Compute button handler
  $('mp_compute').addEventListener('click', async () => {
    const t = selectedAsteroid;
    if (!t) { 
      appendLog('No asteroid selected'); 
      alert('Please select an asteroid from the selection page first.');
      return; 
    }
    
    // Get orbital parameters from ephem if available
    const a = t.ephem && t.ephem.a ? t.ephem.a : t.orbitRadius;
    const e = t.ephem && t.ephem.e ? t.ephem.e : 0;
    const i = t.ephem && t.ephem.i ? t.ephem.i : 0;
    
    if (!a || a <= 0) {
      appendLog('Invalid orbital parameters for this asteroid');
      return;
    }
    
    appendLog(`Computing Hohmann estimate to ${t.name} (a=${a} AU)`);
    const res = hohmannFromEarth(a);
    // ideal launch date estimate
    const est = estimateLaunchEpoch(a);
    const ld = est.launchDate.toISOString().replace('T', ' ').slice(0,19) + ' UTC';
    const wait_days = Math.round(est.wait_years * 365.25);

    // mission metrics
    const metrics = missionMetrics(a, res.dv_kms, i, t.diameter_km || 0, parseFloat($('mp_payload').value || '1000'));
    
    // Prepare asteroid object for Yarkovsky calculation
    const asteroidForYark = {
      diameter_km: t.diameter_km || 0,
      H: t.magnitude,
      a: a,
      e: e,
      composition: t.composition || 'unknown'
    };
    const yark = await yarkovskyEstimateYears(asteroidForYark, 0.01);

    // Populate results panel
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('res_dv', res.dv_kms);
    set('res_transfer', res.t_days);
    set('res_launch', `${ld} (in ~${wait_days} days)`);
    set('res_success', `${metrics.successPct}%`);
    set('res_difficulty', metrics.difficulty);
    set('res_composition', t.composition || 'unknown');
    set('res_yark', (yark.rate_AU_per_year).toExponential(2) + ' AU/yr');
    set('res_yark_years', Math.round(yark.years).toLocaleString());

    appendLog(`Estimate: Δv ${res.dv_kms} km/s, one-way ${res.t_days} days; ideal launch ${ld}`);
  });

  // Styling/layout helpers are intentionally minimal — the project provides CSS.
})();
