// ─── SANITIZE COMPOUND
// Évite les classes CSS invalides (.compound-?, .compound-null, etc.)
function sanitizeCompound(c) {
  const known = ['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'];
  const up = (c || '').toUpperCase().trim();
  return known.includes(up) ? up : 'UNKNOWN';
}

// ─── CONFIG
const API = 'https://api.openf1.org/v1';
const TEAM_COLORS = {
  'Red Bull Racing':'#3671c6','Ferrari':'#e8002d','Mercedes':'#27f4d2',
  'McLaren':'#ff8000','Aston Martin':'#229971','Alpine':'#ff87bc',
  'Williams':'#64c4ff','RB':'#6692ff','Kick Sauber':'#52e252',
  'Haas F1 Team':'#b6babd','Haas':'#b6babd'
};
const DRIVER_COLORS = ['#e10600','#ff8700','#ffcc00','#00d2be','#0067ff','#9b59b6',
  '#1abc9c','#e74c3c','#f39c12','#3498db','#2ecc71','#e67e22','#27ae60',
  '#8e44ad','#16a085','#c0392b','#d35400','#2980b9','#7f8c8d','#bdc3c7'];

// ─── STATE
let S = {
  meetingKey:null, sessionKey:null, drivers:[], laps:[], stints:[],
  positions:[], pits:[], weather:[], rc:[], radio:[], intervals:[], isLive:false
};
let autoRefreshTimer = null;
let telemTimers = {};

// ─── CLOCK
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toUTCString().slice(17,25);
}, 1000);

// ─── TABS
function showTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
}

// ─── API
async function apiFetch(path) {
  try {
    const r = await fetch(API+path);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ─── MEETINGS
async function loadMeetings() {
  const yr = new Date().getFullYear();
  const [a,b,c] = await Promise.all([
    apiFetch('/meetings?year='+yr),
    apiFetch('/meetings?year='+(yr-1)),
    apiFetch('/meetings?year='+(yr-2))
  ]);
  const all = [...(a||[]),...(b||[]),...(c||[])].reverse();
  const sel = document.getElementById('sel-meeting');
  sel.innerHTML = all.map(m =>
    `<option value="${m.meeting_key}">${m.year} — ${m.meeting_name} (${m.country_name})</option>`
  ).join('');
  await onMeetingChange();
}

async function onMeetingChange() {
  const mk = document.getElementById('sel-meeting').value;
  if (!mk) return;
  const sessions = await apiFetch('/sessions?meeting_key='+mk);
  const sel = document.getElementById('sel-session');
  const order = ['Practice 1','Practice 2','Practice 3','Sprint Shootout','Sprint','Qualifying','Race'];
  const sorted = (sessions||[]).sort((a,b) =>
    order.indexOf(a.session_name) - order.indexOf(b.session_name)
  );
  sel.innerHTML = sorted.map(s =>
    `<option value="${s.session_key}">${s.session_name} — ${s.session_type}</option>`
  ).join('');
}

// ─── LIVE DETECTION
async function loadLiveOrLatest() {
  const yr = new Date().getFullYear();
  const [a,b] = await Promise.all([
    apiFetch('/sessions?year='+yr),
    apiFetch('/sessions?year='+(yr-1))
  ]);
  const all = [...(a||[]),...(b||[])];
  const now = new Date();
  let session = all.find(s => {
    const start = s.date_start ? new Date(s.date_start) : null;
    const end   = s.date_end   ? new Date(s.date_end)   : null;
    return start && end && now >= start && now <= end;
  });
  const isLive = !!session;
  if (!session) {
    session = all
      .filter(s => s.date_start && new Date(s.date_start) < now)
      .sort((a,b) => new Date(b.date_start)-new Date(a.date_start))[0];
  }
  if (!session) { alert('Aucune session trouvée'); return; }
  S.sessionKey = session.session_key;
  S.meetingKey = session.meeting_key;
  S.isLive = isLive;
  document.getElementById('session-info').textContent =
    `${session.meeting_name||''} — ${session.session_name}`;
  updateLiveUI();
  await loadAll();
  if (S.isLive) {
    const cb = document.getElementById('auto-refresh-toggle');
    cb.checked = true;
    document.getElementById('refresh-interval').value = '15000';
    toggleAutoRefresh(cb);
  }
}

function updateLiveUI() {
  const badge = document.getElementById('live-badge');
  const ind   = document.getElementById('live-indicator');
  if (S.isLive) { badge.classList.remove('inactive'); ind.classList.add('active'); }
  else          { badge.classList.add('inactive');    ind.classList.remove('active'); }
}

// ─── LOAD ALL
async function loadAll() {
  const sk = document.getElementById('sel-session').value;
  const mk = document.getElementById('sel-meeting').value;
  if (sk) {
    S.sessionKey = sk; S.meetingKey = mk;
    const sess = await apiFetch('/sessions?session_key='+sk);
    if (sess && sess[0]) {
      const s = sess[0];
      document.getElementById('session-info').textContent =
        `${s.meeting_name||''} — ${s.session_name}`;
      const now   = new Date();
      const start = s.date_start ? new Date(s.date_start) : null;
      const end   = s.date_end   ? new Date(s.date_end)   : null;
      S.isLive = !!(start && end && now >= start && now <= end);
      updateLiveUI();
    }
  }
  if (!S.sessionKey) return;
  const [drivers,laps,stints,positions,pits,weather,rc,radio,intervals] = await Promise.all([
    apiFetch('/drivers?session_key='+S.sessionKey),
    apiFetch('/laps?session_key='+S.sessionKey),
    apiFetch('/stints?session_key='+S.sessionKey),
    apiFetch('/position?session_key='+S.sessionKey),
    apiFetch('/pit?session_key='+S.sessionKey),
    apiFetch('/weather?session_key='+S.sessionKey),
    apiFetch('/race_control?session_key='+S.sessionKey),
    apiFetch('/team_radio?session_key='+S.sessionKey),
    apiFetch('/intervals?session_key='+S.sessionKey)
  ]);
  S.drivers=drivers||[]; S.laps=laps||[];       S.stints=stints||[];
  S.positions=positions||[]; S.pits=pits||[];   S.weather=weather||[];
  S.rc=rc||[];  S.radio=radio||[];              S.intervals=intervals||[];
  renderAll();
  document.getElementById('last-update').textContent =
    'Mis à jour : '+new Date().toLocaleTimeString();
}

function renderAll() {
  renderOverview(); renderDrivers(); renderTiming(); renderTelemDriverSelect();
  renderPositions(); renderStints(); renderIntervals(); renderPits();
  renderWeather(); renderRaceControl(); renderRadio(); renderChampionship(); renderCameras();
}

// ─── OVERVIEW
function renderOverview() {
  const maxLap = S.laps.length ? Math.max(...S.laps.map(l=>l.lap_number||0)) : '--';
  document.getElementById('ov-laps').textContent    = maxLap;
  document.getElementById('ov-drivers').textContent = S.drivers.length||'--';
  const lw = S.weather[S.weather.length-1];
  document.getElementById('ov-weather').textContent = lw ? `${lw.track_temperature}°` : '--°';
  document.getElementById('ov-sc').textContent =
    (S.rc||[]).filter(m=>m.flag==='SC'||m.flag==='VSC').length;

  const top3 = getBestLapRanking().slice(0,3);
  document.getElementById('ov-top3').innerHTML = top3.length
    ? top3.map((r,i) => {
        const d  = S.drivers.find(x=>x.driver_number===r.driver_number)||{};
        const tc = TEAM_COLORS[d.team_name]||'var(--red)';
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border)">
          <span style="font-size:1.4rem">${['🥇','🥈','🥉'][i]}</span>
          <span style="font-weight:800;font-size:1.1rem;color:${tc}">${r.driver_number}</span>
          <div>
            <div style="font-weight:700">${d.full_name||'Driver '+r.driver_number}</div>
            <div style="font-size:.75rem;color:var(--muted)">${d.team_name||''}</div>
          </div>
          <span style="margin-left:auto;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums">${fmtTime(r.best)}</span>
        </div>`;
      }).join('')
    : '<div class="err">Pas encore de données de tours</div>';

  if (lw) {
    document.getElementById('ov-weather-widget').innerHTML = `
      <div class="weather-big">${lw.air_temperature}°C</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:4px">Température air</div>
      <div class="weather-row">
        <div class="weather-item"><div class="wval">${lw.track_temperature}°C</div><div class="wlbl">Piste</div></div>
        <div class="weather-item"><div class="wval">${lw.humidity}%</div><div class="wlbl">Humidité</div></div>
        <div class="weather-item"><div class="wval">${lw.wind_speed} m/s</div><div class="wlbl">Vent</div></div>
        <div class="weather-item"><div class="wval">${lw.wind_direction}°</div><div class="wlbl">Dir.</div></div>
        <div class="weather-item"><div class="wval">${lw.rainfall?'🌧 Pluie':'☀ Sec'}</div><div class="wlbl">Cond.</div></div>
        <div class="weather-item"><div class="wval">${lw.pressure} hPa</div><div class="wlbl">Pression</div></div>
      </div>`;
  } else {
    document.getElementById('ov-weather-widget').innerHTML =
      '<div class="err">Pas de données météo</div>';
  }

  const rcLast = (S.rc||[]).slice(-4).reverse();
  document.getElementById('ov-rc').innerHTML =
    rcLast.length ? rcLast.map(renderRCItem).join('') : '<div class="err">Pas de messages</div>';
}

// ─── DRIVERS
function renderDrivers() {
  if (!S.drivers.length) {
    document.getElementById('drivers-content').innerHTML = '<div class="err">Pas de données pilotes</div>';
    return;
  }
  const stintMap = {};
  (S.stints||[]).forEach(s => {
    if (!stintMap[s.driver_number] ||
        s.stint_number > (stintMap[s.driver_number].stint_number||0))
      stintMap[s.driver_number] = s;
  });
  document.getElementById('drivers-content').innerHTML =
    `<div class="driver-grid">${S.drivers.map(d => {
      const st       = stintMap[d.driver_number]||{};
      const compound = sanitizeCompound(st.compound);
      const tc       = TEAM_COLORS[d.team_name]||'var(--red)';
      return `<div class="dcard" style="border-left-color:${tc}">
        <div class="num">${d.driver_number}</div>
        <div class="name">${d.full_name||d.name_acronym}</div>
        <div class="team" style="color:${tc}">${d.team_name||''}</div>
        <div class="tyre tyre-${compound.toLowerCase()}">${getTyreEmoji(compound)} ${compound}</div>
        <div style="font-size:.72rem;color:var(--muted)">
          Tour ${st.lap_start||'?'} → ${st.lap_end||'?'} · ${st.tyre_age_at_start||0} tours usés
        </div>
      </div>`;
    }).join('')}</div>`;
}

// ─── TIMING
function renderTiming() {
  const ranking = getBestLapRanking();
  if (!ranking.length) {
    document.getElementById('timing-content').innerHTML =
      '<div class="err">Pas de données de tours</div>';
    return;
  }
  const leader = ranking[0].best;
  document.getElementById('timing-content').innerHTML = `
    <table>
      <thead><tr>
        <th>POS</th><th>#</th><th>PILOTE</th><th>ÉQUIPE</th>
        <th>MEILLEUR TOUR</th><th>ÉCART</th><th>DERNIER TOUR</th>
        <th>TOURS</th><th>S1</th><th>S2</th><th>S3</th>
      </tr></thead>
      <tbody>${ranking.map((r,i) => {
        const d   = S.drivers.find(x=>x.driver_number===r.driver_number)||{};
        const tc  = TEAM_COLORS[d.team_name]||'var(--red)';
        const gap = i===0 ? '— LEADER' : '+'+((r.best-leader)/1000).toFixed(3)+'s';
        const pc  = i===0?'p1':i===1?'p2':i===2?'p3':'';
        return `<tr>
          <td class="pos ${pc}">${i+1}</td>
          <td style="font-weight:800;color:${tc}">${r.driver_number}</td>
          <td style="font-weight:600">${d.full_name||'Driver '+r.driver_number}</td>
          <td style="color:var(--muted);font-size:.76rem">${d.team_name||''}</td>
          <td style="color:var(--green);font-weight:700;font-variant-numeric:tabular-nums">${fmtTime(r.best)}</td>
          <td style="color:${i===0?'var(--yellow)':'var(--muted)'};font-size:.78rem">${gap}</td>
          <td style="font-variant-numeric:tabular-nums">${fmtTime(r.last)}</td>
          <td style="color:var(--muted)">${r.lapCount}</td>
          <td style="color:var(--purple);font-size:.76rem">${fmtSector(r.bestS1)}</td>
          <td style="color:var(--orange);font-size:.76rem">${fmtSector(r.bestS2)}</td>
          <td style="color:var(--blue);font-size:.76rem">${fmtSector(r.bestS3)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ─── TELEMETRY SELECT
function renderTelemDriverSelect() {
  if (!S.drivers.length) return;
  document.getElementById('telem-driver-select').innerHTML = S.drivers.map(d => {
    const tc = TEAM_COLORS[d.team_name]||'#e10600';
    return `<button class="telem-btn" style="border-color:${tc}40"
      onclick="loadTelemDriver(${d.driver_number},this)">
      <span style="color:${tc};font-weight:900">${d.driver_number}</span>
      ${d.name_acronym||d.full_name}
    </button>`;
  }).join('');
}

async function loadTelemDriver(num, btn) {
  document.querySelectorAll('.telem-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const drv = S.drivers.find(x=>x.driver_number===num)||{};
  document.getElementById('telem-content').innerHTML =
    `<div class="loading">Chargement #${num}…</div>`;
  const carData = await apiFetch('/car_data?driver_number='+num+'&session_key='+S.sessionKey);
  renderTelemDetail(num, drv, carData, 'telem-content');
}

function renderTelemDetail(num, drv, carData, targetId) {
  const el = document.getElementById(targetId);
  if (!carData||!carData.length) {
    el.innerHTML = '<div class="err">Pas de télémétrie pour cette session / ce pilote</div>';
    return;
  }
  const latest   = carData[carData.length-1];
  const history  = carData.slice(-100);
  const tc       = TEAM_COLORS[drv.team_name]||'var(--red)';
  const drsOn    = [10,12,14].includes(latest.drs);
  const speeds   = history.map(c=>c.speed);
  const throttles= history.map(c=>c.throttle);
  const minS=Math.min(...speeds), maxS=Math.max(...speeds)||1;
  const W=600, H=60, H2=40;

  const sparkLine = (arr, color, h, min, max) => {
    if (arr.length < 2) return `<div style="color:var(--muted);font-size:.7rem">Pas assez de données</div>`;
    const path = arr.map((v,i) => {
      const x = i/(arr.length-1)*W;
      const y = h-(v-min)/((max-min)||1)*h;
      return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg width="${W}" height="${h}" viewBox="0 0 ${W} ${h}"
      style="display:block;max-width:100%;background:#12121e;border-radius:4px">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>
    </svg>`;
  };

  el.innerHTML = `<div class="card">
    <div class="card-title" style="color:${tc}">
      <span class="dot" style="background:${tc}"></span>
      #${num} ${drv.full_name||drv.name_acronym||''} — ${drv.team_name||''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;margin-bottom:20px">
      <div style="text-align:center;background:var(--card2);border-radius:6px;padding:12px">
        <div class="gear-display" style="color:var(--yellow)">${latest.n_gear||'N'}</div>
        <div class="gear-label">Rapport</div>
      </div>
      <div class="stat-tile"><div class="val" style="color:var(--yellow)">${latest.speed}</div><div class="lbl">km/h</div></div>
      <div class="stat-tile"><div class="val" style="color:var(--orange);font-size:1.1rem">${latest.rpm}</div><div class="lbl">RPM</div></div>
      <div class="stat-tile"><div class="val" style="color:${drsOn?'var(--green)':'var(--muted)'}">${drsOn?'ON':'OFF'}</div><div class="lbl">DRS</div></div>
      <div class="stat-tile"><div class="val" style="color:${latest.brake?'var(--red)':'var(--muted)'}">${latest.brake?'ON':'OFF'}</div><div class="lbl">Frein</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="telem-row"><span class="telem-label">Accélérateur</span><div class="bar-bg"><div class="bar-fill" style="width:${latest.throttle}%;background:var(--green)"></div></div><span class="bar-val" style="color:var(--green)">${latest.throttle}%</span></div>
      <div class="telem-row"><span class="telem-label">Freinage</span><div class="bar-bg"><div class="bar-fill" style="width:${latest.brake}%;background:var(--red)"></div></div><span class="bar-val" style="color:var(--red)">${latest.brake}%</span></div>
      <div class="telem-row"><span class="telem-label">Vitesse</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.min(latest.speed/380*100,100)}%;background:var(--yellow)"></div></div><span class="bar-val" style="color:var(--yellow)">${latest.speed} km/h</span></div>
      <div class="telem-row"><span class="telem-label">RPM</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.min(latest.rpm/15000*100,100)}%;background:var(--orange)"></div></div><span class="bar-val" style="color:var(--orange)">${latest.rpm}</span></div>
    </div>
    <div style="margin-bottom:6px;font-size:.72rem;color:var(--muted)">COURBE VITESSE — 100 derniers points</div>
    ${sparkLine(speeds, tc, H, minS, maxS)}
    <div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted);margin:2px 0 14px">
      <span>${minS} km/h</span><span>${maxS} km/h</span>
    </div>
    <div style="margin-bottom:6px;font-size:.72rem;color:var(--muted)">COURBE ACCÉLÉRATEUR (%)</div>
    ${sparkLine(throttles, 'var(--green)', H2, 0, 100)}
    <div style="margin-top:12px;font-size:.7rem;color:var(--muted)">
      Dernière donnée : ${new Date(latest.date).toLocaleTimeString()} UTC
    </div>
  </div>`;
}

// ─── POSITIONS
function renderPositions() {
  if (!S.positions.length||!S.drivers.length) {
    document.getElementById('pos-content').innerHTML =
      '<div class="err">Pas de données de position</div>';
    return;
  }
  const byDriver = {};
  S.positions.forEach(p => {
    if (!byDriver[p.driver_number]) byDriver[p.driver_number] = [];
    byDriver[p.driver_number].push({t:new Date(p.date).getTime(), pos:p.position});
  });
  const W=820, H=380, PAD={t:20,r:60,b:30,l:36};
  const allT = S.positions.map(p=>new Date(p.date).getTime()).sort((a,b)=>a-b);
  const minT=allT[0], maxT=allT[allT.length-1];
  const sx = t  => PAD.l+((t-minT)/((maxT-minT)||1))*(W-PAD.l-PAD.r);
  const sy = pos=> PAD.t+((pos-1)/19)*(H-PAD.t-PAD.b);
  let paths='', legend='';
  Object.keys(byDriver).map(Number).forEach((num,i) => {
    const pts   = byDriver[num]; if (pts.length<2) return;
    const color = DRIVER_COLORS[i%DRIVER_COLORS.length];
    const d     = pts.map((p,j)=>`${j===0?'M':'L'}${sx(p.t).toFixed(1)},${sy(p.pos).toFixed(1)}`).join(' ');
    const drv   = S.drivers.find(x=>x.driver_number===num);
    const abbr  = drv ? (drv.name_acronym||''+num) : ''+num;
    paths  += `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" opacity=".85"/>`;
    paths  += `<text x="${(sx(pts[pts.length-1].t)+4).toFixed(0)}"
      y="${(sy(pts[pts.length-1].pos)+4).toFixed(0)}"
      fill="${color}" font-size="9" font-family="monospace" font-weight="bold">${abbr}</text>`;
    legend += `<div class="pos-legend-item">
      <div class="pos-legend-dot" style="background:${color}"></div><span>${abbr}</span></div>`;
  });
  let grid='';
  [1,5,10,15,20].forEach(pos => {
    grid += `<line x1="${PAD.l-4}" y1="${sy(pos).toFixed(1)}" x2="${W-PAD.r}" y2="${sy(pos).toFixed(1)}" stroke="#2e2e45" stroke-width="1"/>`;
    grid += `<text x="${(PAD.l-6).toFixed(0)}" y="${(sy(pos)+4).toFixed(0)}"
      fill="#555" font-size="10" text-anchor="end">${pos}</text>`;
  });
  document.getElementById('pos-content').innerHTML = `
    <div class="lap-chart-wrap">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="max-width:100%">
        <rect width="${W}" height="${H}" fill="#12121e" rx="4"/>
        ${grid}${paths}
        <text x="${PAD.l}" y="${H-4}" fill="#444" font-size="10">Temps →</text>
        <text x="8" y="${H/2}" fill="#444" font-size="10"
          transform="rotate(-90,8,${H/2})">Position</text>
      </svg>
    </div>
    <div class="pos-legend">${legend}</div>`;
}

// ─── STINTS
function renderStints() {
  if (!S.stints.length) {
    document.getElementById('stints-content').innerHTML =
      '<div class="err">Pas de données de stints</div>';
    return;
  }
  const byDriver = {};
  S.stints.forEach(s => {
    if (!byDriver[s.driver_number]) byDriver[s.driver_number] = [];
    byDriver[s.driver_number].push(s);
  });
  const maxLap    = Math.max(...S.stints.map(s=>s.lap_end||s.lap_start||1));
  const rankOrder = getBestLapRanking().map(r=>r.driver_number);
  const ordered   = Object.keys(byDriver).map(Number).sort((a,b) => {
    const ia=rankOrder.indexOf(a), ib=rankOrder.indexOf(b);
    if(ia===-1&&ib===-1) return 0;
    if(ia===-1) return 1;
    if(ib===-1) return -1;
    return ia-ib;
  });
  const rows = ordered.map(num => {
    const drv  = S.drivers.find(x=>x.driver_number==num);
    const name = drv ? (drv.name_acronym||drv.full_name) : 'DRV '+num;
    const bars = byDriver[num].sort((a,b)=>a.lap_start-b.lap_start).map(s => {
      const w        = ((s.lap_end||maxLap)-s.lap_start+1)/maxLap*100;
      const compound = sanitizeCompound(s.compound); // ← toujours une classe CSS valide
      return `<div class="stint-seg compound-${compound}" style="width:${Math.max(w,2)}%"
        title="${compound} · Laps ${s.lap_start}→${s.lap_end||'?'} · ${s.tyre_age_at_start||0} usés">
        ${compound[0]}${s.lap_start}
      </div>`;
    }).join('');
    return `<div class="stint-row">
      <div class="stint-drv">${name}</div>
      <div class="stint-bars">${bars}</div>
    </div>`;
  });
  const legend = ['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'].map(c =>
    `<div style="display:flex;align-items:center;gap:5px;font-size:.72rem">
      <div class="stint-seg compound-${c}" style="width:24px;min-width:24px;height:18px">${c[0]}</div>${c}
    </div>`
  ).join('');
  document.getElementById('stints-content').innerHTML =
    `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">${legend}</div>
    ${rows.join('')}`;
}

// ─── INTERVALS
function renderIntervals() {
  if (!S.intervals.length) {
    document.getElementById('intervals-content').innerHTML =
      '<div class="err">Pas de données d\'écarts (disponible en course)</div>';
    return;
  }
  const latest = {};
  S.intervals.forEach(i => latest[i.driver_number]=i);
  const entries  = Object.values(latest).sort((a,b)=>parseGap(a.gap_to_leader)-parseGap(b.gap_to_leader));
  const maxGap   = Math.max(...entries.map(e=>parseGap(e.gap_to_leader)),1);
  document.getElementById('intervals-content').innerHTML = `
    <table>
      <thead><tr><th>#</th><th>PILOTE</th><th>GAP LEADER</th><th>INTERVALLE</th><th></th></tr></thead>
      <tbody>${entries.map((e,i) => {
        const d    = S.drivers.find(x=>x.driver_number===e.driver_number)||{};
        const barW = i===0 ? 0 : Math.min(parseGap(e.gap_to_leader)/maxGap*100,100);
        return `<tr>
          <td style="font-weight:800;color:var(--red)">${e.driver_number}</td>
          <td>${d.full_name||'Driver '+e.driver_number}</td>
          <td style="color:${i===0?'var(--yellow)':'var(--green)'};font-weight:700;font-variant-numeric:tabular-nums">${e.gap_to_leader||'LEADER'}</td>
          <td style="color:var(--muted);font-variant-numeric:tabular-nums">${e.interval||'-'}</td>
          <td style="width:160px"><div class="gap-bar" style="width:${barW}%"></div></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ─── PITS
function renderPits() {
  if (!S.pits||!S.pits.length) {
    document.getElementById('pits-content').innerHTML =
      '<div class="err">Pas d\'arrêts aux stands enregistrés</div>';
    return;
  }
  document.getElementById('pits-content').innerHTML = `
    <table>
      <thead><tr><th>#</th><th>PILOTE</th><th>TOUR</th><th>ARRÊT</th><th>DURÉE</th><th>HEURE</th></tr></thead>
      <tbody>${[...S.pits].sort((a,b)=>a.lap_number-b.lap_number).map(p => {
        const d    = S.drivers.find(x=>x.driver_number===p.driver_number)||{};
        const dur  = p.pit_duration ? `${p.pit_duration.toFixed(1)}s` : '-';
        const fast = p.pit_duration && p.pit_duration < 2.5;
        return `<tr>
          <td style="font-weight:800;color:var(--orange)">${p.driver_number}</td>
          <td>${d.full_name||'Driver '+p.driver_number}</td>
          <td>${p.lap_number}</td>
          <td><span class="pit-badge">PIT ${p.pit_number}</span></td>
          <td style="color:${fast?'var(--green)':'var(--text)'};font-weight:${fast?800:400};font-variant-numeric:tabular-nums">${dur}${fast?' ⚡':''}</td>
          <td style="color:var(--muted);font-size:.75rem">${new Date(p.date).toLocaleTimeString()}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ─── WEATHER
function renderWeather() {
  if (!S.weather.length) {
    document.getElementById('weather-content').innerHTML =
      '<div class="err">Pas de données météo</div>';
    return;
  }
  document.getElementById('weather-content').innerHTML = `
    <table>
      <thead><tr><th>HEURE</th><th>AIR</th><th>PISTE</th><th>HUMIDITÉ</th><th>VENT</th><th>DIR.</th><th>PRESSION</th><th>PLUIE</th></tr></thead>
      <tbody>${sampleArray(S.weather,25).reverse().map(w => `<tr>
        <td style="color:var(--muted);font-size:.75rem">${new Date(w.date).toLocaleTimeString()}</td>
        <td>${w.air_temperature}°C</td>
        <td style="color:${w.track_temperature>45?'var(--red)':w.track_temperature>35?'var(--orange)':'var(--green)'}">${w.track_temperature}°C</td>
        <td>${w.humidity}%</td>
        <td>${w.wind_speed} m/s</td>
        <td>${w.wind_direction}°</td>
        <td>${w.pressure} hPa</td>
        <td>${w.rainfall?'🌧':'☀'}</td>
      </tr>`).join('')}</tbody>
    </table>`;
}

// ─── RACE CONTROL
function renderRCItem(m) {
  const emojis = {GREEN:'🟢',YELLOW:'🟡',RED:'🔴',BLUE:'🔵',SC:'🟠',VSC:'🟠',CHEQUERED:'🏁',BLACK:'⚫',WHITE:'⚪'};
  return `<div class="rc-item flag-${m.flag||''}">
    <div class="rc-flag">${emojis[m.flag]||'⚑'}</div>
    <div>
      <div class="rc-msg">${m.message||''} ${m.driver_number?`<strong>(#${m.driver_number})</strong>`:''} ${m.lap_number?`Tour ${m.lap_number}`:''}</div>
      <div class="rc-time">${new Date(m.date).toLocaleTimeString()} ${m.category?'· '+m.category:''}</div>
    </div>
  </div>`;
}
function renderRaceControl() {
  if (!S.rc.length) { document.getElementById('rc-content').innerHTML='<div class="err">Pas de messages</div>'; return; }
  document.getElementById('rc-content').innerHTML = [...S.rc].reverse().map(renderRCItem).join('');
}

// ─── RADIO
function renderRadio() {
  if (!S.radio.length) { document.getElementById('radio-content').innerHTML='<div class="err">Pas de radio disponible</div>'; return; }
  document.getElementById('radio-content').innerHTML = [...S.radio].reverse().map(r => {
    const d  = S.drivers.find(x=>x.driver_number===r.driver_number)||{};
    const tc = TEAM_COLORS[d.team_name]||'var(--purple)';
    return `<div class="radio-item" style="border-left-color:${tc}">
      <div>
        <div class="rdrv" style="color:${tc}">#${r.driver_number} ${d.name_acronym||d.full_name||''}</div>
        <div style="font-size:.72rem;color:var(--muted)">${d.team_name||''}</div>
        <div class="rtime">${new Date(r.date).toLocaleTimeString()}</div>
      </div>
      ${r.recording_url
        ? `<audio controls src="${r.recording_url}" preload="none"></audio>`
        : '<span style="color:var(--muted);font-size:.75rem">Pas d\'audio</span>'}
    </div>`;
  }).join('');
}

// ─── CHAMPIONSHIP
async function renderChampionship() {
  if (!S.sessionKey) return;
  const [cd,ct] = await Promise.all([
    apiFetch('/championship_drivers?session_key='+S.sessionKey),
    apiFetch('/championship_teams?session_key='+S.sessionKey)
  ]);
  if (cd&&cd.length) {
    const sorted = [...cd].sort((a,b)=>a.position_current-b.position_current);
    const maxPts = sorted[0].points_current||1;
    document.getElementById('champ-drivers').innerHTML = sorted.map((c,i) => {
      const d  = S.drivers.find(x=>x.driver_number===c.driver_number)||{};
      const pc = i===0?'p1':i===1?'p2':i===2?'p3':'';
      return `<div class="champ-bar-wrap">
        <div class="champ-name">
          <span><span class="pos ${pc}" style="font-size:.9rem;margin-right:6px">${c.position_current}</span>${d.full_name||'#'+c.driver_number}</span>
          <span style="font-weight:700;color:var(--yellow)">${c.points_current} pts</span>
        </div>
        <div class="champ-bar"><div class="champ-fill" style="width:${(c.points_current/maxPts*100).toFixed(1)}%"></div></div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('champ-drivers').innerHTML =
      '<div class="err">Disponible seulement après une course</div>';
  }
  if (ct&&ct.length) {
    const sorted = [...ct].sort((a,b)=>a.position_current-b.position_current);
    const maxPts = sorted[0].points_current||1;
    document.getElementById('champ-teams').innerHTML = sorted.map(c => {
      const color = TEAM_COLORS[c.team_name]||'var(--red)';
      return `<div class="champ-bar-wrap">
        <div class="champ-name">
          <span style="font-weight:700">${c.position_current}. <span style="color:${color}">${c.team_name}</span></span>
          <span style="font-weight:700;color:var(--yellow)">${c.points_current} pts</span>
        </div>
        <div class="champ-bar"><div class="champ-fill" style="width:${(c.points_current/maxPts*100).toFixed(1)}%;background:${color}"></div></div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('champ-teams').innerHTML =
      '<div class="err">Disponible seulement après une course</div>';
  }
}

// ─── CAMERAS
function renderCameras() {
  if (!S.drivers.length) return;
  const rankMap = {};
  getBestLapRanking().forEach((r,i) => rankMap[r.driver_number]=i+1);
  document.getElementById('cam-grid').innerHTML = S.drivers.map(d => {
    const tc = TEAM_COLORS[d.team_name]||'var(--red)';
    return `<div class="cam-card" id="cam-${d.driver_number}"
      onclick="selectCamera(${d.driver_number})" style="border-top:3px solid ${tc}">
      <div class="cam-num" style="color:${tc}">${d.driver_number}</div>
      <div class="cam-name">${d.full_name||d.name_acronym}</div>
      <div class="cam-team" style="color:${tc}">${d.team_name}</div>
      <div style="font-size:.72rem;margin-top:4px;color:var(--muted)">P${rankMap[d.driver_number]||'?'}</div>
      <div class="cam-telem" id="cam-live-${d.driver_number}">Cliquer pour télémétrie</div>
    </div>`;
  }).join('');
}

async function selectCamera(num) {
  document.querySelectorAll('.cam-card').forEach(c=>c.classList.remove('cam-selected'));
  const card = document.getElementById('cam-'+num);
  if (card) card.classList.add('cam-selected');
  Object.values(telemTimers).forEach(clearInterval); telemTimers={};
  const drv = S.drivers.find(x=>x.driver_number===num)||{};
  document.getElementById('cam-detail').innerHTML =
    `<div class="loading">Chargement #${num}…</div>`;
  await loadCamTelem(num, drv);
  telemTimers[num] = setInterval(()=>loadCamTelem(num,drv), 10000);
}

async function loadCamTelem(num, drv) {
  const carData = await apiFetch('/car_data?driver_number='+num+'&session_key='+S.sessionKey);
  if (!carData||!carData.length) {
    document.getElementById('cam-detail').innerHTML = '<div class="err">Pas de télémétrie</div>';
    return;
  }
  const mini = document.getElementById('cam-live-'+num);
  if (mini) mini.innerHTML = `<span class="cam-speed">${carData[carData.length-1].speed} km/h</span>`;
  renderTelemDetail(num, drv, carData, 'cam-detail');
}

// ─── HELPERS
function getBestLapRanking() {
  if (!S.laps.length) return [];
  const byDriver = {};
  S.laps.forEach(lap => {
    const n = lap.driver_number;
    if (!byDriver[n]) byDriver[n] = {driver_number:n,best:Infinity,last:null,lapCount:0,bestS1:null,bestS2:null,bestS3:null};
    const d = byDriver[n]; d.lapCount++;
    if (lap.lap_duration) { d.last=lap.lap_duration*1000; if(d.last<d.best) d.best=d.last; }
    if (lap.duration_sector_1&&(d.bestS1===null||lap.duration_sector_1<d.bestS1)) d.bestS1=lap.duration_sector_1;
    if (lap.duration_sector_2&&(d.bestS2===null||lap.duration_sector_2<d.bestS2)) d.bestS2=lap.duration_sector_2;
    if (lap.duration_sector_3&&(d.bestS3===null||lap.duration_sector_3<d.bestS3)) d.bestS3=lap.duration_sector_3;
  });
  return Object.values(byDriver).filter(d=>d.best<Infinity).sort((a,b)=>a.best-b.best);
}
function fmtTime(ms) {
  if (!ms||ms===Infinity) return '--:--.---';
  const m = Math.floor(ms/60000);
  const s = ((ms%60000)/1000).toFixed(3).padStart(6,'0');
  return `${m}:${s}`;
}
function fmtSector(s) { return s ? s.toFixed(3)+'s' : '--'; }
function parseGap(gap) {
  if (!gap||(typeof gap==='string'&&gap.toUpperCase().includes('LAP'))) return 0;
  const n = parseFloat(gap); return isNaN(n) ? 0 : n;
}
function getTyreEmoji(compound) {
  return {SOFT:'🔴',MEDIUM:'🟡',HARD:'⚪',INTERMEDIATE:'🟢',WET:'🔵'}[sanitizeCompound(compound)]||'⚫';
}
function sampleArray(arr, n) {
  if (arr.length<=n) return arr;
  const step = Math.floor(arr.length/n);
  return arr.filter((_,i)=>i%step===0).slice(0,n);
}
function toggleAutoRefresh(cb) {
  clearInterval(autoRefreshTimer);
  if (cb.checked) {
    const interval = parseInt(document.getElementById('refresh-interval').value);
    autoRefreshTimer = setInterval(loadAll, interval);
  }
}

// ─── INIT
loadMeetings();