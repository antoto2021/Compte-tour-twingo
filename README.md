<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-tour V4</title>
  <style>
    :root {
      /* Seuils d’hystérésis */
      --rpm-down-normal: 1300;   /* seuil rétrograde normal */
      --rpm-up-normal:   2150;   /* seuil passage supérieur normal */
      --rpm-down-sport:  2500;   /* seuil rétrograde sport */
      --rpm-up-sport:    3500;   /* seuil passage supérieur sport */

      /* Couleurs */
      --bg-page      : #000;
      --text-page    : #fff;
      --bg-center    : #000;
      --text-center  : #fff;
      --bg-history   : #000;
      --text-history : #000;
      --bg-stats     : #000;
      --text-stats   : #000;

      /* Tailles fluides (mobile first) */
      --font-base      : 4vw;
      --font-title     : 5vw;
      --font-mode      : 4vw;
      --font-value     : 15.5vw;
      --font-stats-val : 6.5vw;

      /* Espacements */
      --gap    : 1.7vw;
      --pad    : 2.7vw;
      --radius : 4vw;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: var(--pad);
      font-family: Arial, sans-serif;
      background: var(--bg-page);
      color: var(--text-page);
      font-size: var(--font-base);
      line-height: 1.2;
    }
    .container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }
    h1, h2 {
      margin: 0;
      text-align: center;
      color: var(--text-page);
    }
    h1 { font-size: var(--font-title); }
    h2 { font-size: var(--font-base); }
    #section-select {
      padding: var(--pad);
      border: 1px solid #ccc;
      border-radius: var(--radius);
      font-size: var(--font-base);
      background: #fff;
      color: #000;
    }
    .section {
      display: none;
      padding: var(--pad);
      border-radius: var(--radius);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    #center { background: var(--bg-center); color: var(--text-center); }
    #history { background: var(--bg-history); color: var(--text-history); }
    #stats { background: var(--bg-stats); color: var(--text-stats); }
    #center .value {
      font-size: var(--font-value);
      text-align: center;
      margin: var(--gap) 0;
      color: var(--text-center) !important;
    }
    #center #modes {
      display: flex;
      justify-content: center;
      gap: var(--gap);
      flex-wrap: wrap;
      margin-bottom: var(--gap);
    }
    #center #modes button {
      flex: 1 1 auto;
      padding: var(--pad);
      font-size: var(--font-mode);
      border: none;
      border-radius: var(--radius);
      background: #ccc;
      color: #000;
      cursor: pointer;
      transition: background .2s;
      min-width: 30%;
    }
    #center #modes button.active {
      background: var(--bg-center);
      color: var(--text-center);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--gap);
      font-size: var(--font-base);
    }
    th, td {
      border: 1px solid #ccc;
      padding: calc(var(--pad)/2);
      text-align: center;
    }
    th { background: #bbdefb; color: #000; }
    #stats p {
      font-size: var(--font-stats-val);
      margin: calc(var(--gap)/2) 0;
      color: var(--text-page) !important;
    }
    #stats p span { color: var(--text-page) !important; }
    @media(min-width:480px) {
      :root {
        --font-base      : 1.5rem;
        --font-title     : 2.5rem;
        --font-mode      : 1.7rem;
        --font-value     : 5rem;
        --font-stats-val : 2rem;
        --gap            : 1rem;
        --pad            : 0.5rem;
        --radius         : 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Compte-tour</h1>

    <select id="section-select">
      <option value="center">Compte-tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <div id="center" class="section">
      <div id="modes">
        <button id="mode-normal" class="active">Normal</button>
        <button id="mode-sport">Sport</button>
      </div>
      <p id="gear-value" class="value">—</p>
      <p id="rpm-value" class="value">— tr/min</p>
    </div>

    <div id="history" class="section">
      <button id="export-btn" style="font-size:var(--font-base); padding:var(--pad)">Exporter nouveaux trajets</button>
      <table id="history-table">
        <thead><tr><th>Date</th><th>Distance</th><th>Rég. moy</th><th>Rég. max</th><th>Vit. moy</th><th>Vit. max</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <div id="stats" class="section">
      <p>Régime max   : <span id="max-rpm">—</span> tr/min</p>
      <p>Régime moyen : <span id="avg-rpm">—</span> tr/min</p>
      <p>Vitesse max  : <span id="max-speed">—</span> km/h</p>
      <p>Vitesse moy  : <span id="avg-speed">—</span> km/h</p>
      <p>Distance     : <span id="distance">—</span> km</p>
      <p>Chgt rapport : <span id="shift-count">0</span></p>
      <button id="reset-trip" style="font-size:var(--font-base); padding:var(--pad)">Reset trajet</button>
    </div>
  </div>

  <script>
    // Charger historique
    let historyArr = JSON.parse(localStorage.getItem('trajets') || '[]');
    const histBody = document.querySelector('#history-table tbody');
    function renderHistory() {
      histBody.innerHTML = '';
      historyArr.forEach(t => {
        const tr = document.createElement('tr');
        ['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed']
          .forEach(k => { const td = document.createElement('td'); td.textContent = t[k]; tr.appendChild(td); });
        histBody.appendChild(tr);
      });
    }
    renderHistory();
    let lastExport = historyArr.length;

    // Navigation sections
    const sections = { center: document.getElementById('center'), history: document.getElementById('history'), stats: document.getElementById('stats') };
    document.getElementById('section-select').onchange = e => {
      Object.values(sections).forEach(s => s.style.display = 'none');
      sections[e.target.value].style.display = 'block';
    };
    sections.center.style.display = 'block';

    // Config modes et seuils
    const ranges = { normal:{down:1300,up:2150}, sport:{down:1800,up:3500} };
    let mode = 'normal';
    let lastGear = null;
    const v1000 = {1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};
    const btnN = document.getElementById('mode-normal'), btnS = document.getElementById('mode-sport');
    const gearEl = document.getElementById('gear-value'), rpmEl = document.getElementById('rpm-value');

    function switchMode(m) {
      mode = m;
      btnN.classList.toggle('active', m === 'normal');
      btnS.classList.toggle('active', m === 'sport');
      lastGear = null;
    }
    btnN.onclick = () => switchMode('normal');
    btnS.onclick = () => switchMode('sport');
    switchMode('normal');

    // Détection du rapport
    function determineGear(sp) {
      if (sp < 5.5) { lastGear = null; return null; }
      if (lastGear == null) { lastGear = 1; return 1; }
      const r = Math.round(sp*1000/v1000[lastGear]);
      const {up:UPSET, down:DOWNSET} = ranges[mode];
      if (r > UPSET && lastGear < 5) lastGear++;
      else if (r < DOWNSET && lastGear > 1) lastGear--;
      return lastGear;
    }

    // Calcul RPM
    function calcRpm(sp,g) {
      if (sp < 5.5 || g == null) return 900;
      return Math.round(sp*1000/v1000[g]);
    }

    // Mise à jour temps réel
    let speedData=[], rpmData=[], shiftCount=0, cumulativeDistance=0;
    function updateDisplay(sp) {
      const g = determineGear(sp);
      const r = calcRpm(sp,g);
      gearEl.textContent = g !== null ? g : '—';
      rpmEl.textContent  = r + ' tr/min';
      if (sp != null) {
        speedData.push(sp); rpmData.push(r);
        if (g !== null && g !== lastGear) shiftCount++;
        lastGear = g;
        cumulativeDistance += sp/3600;
      }
      document.getElementById('max-rpm').textContent   = rpmData.length ? Math.max(...rpmData) : '—';
      document.getElementById('avg-rpm').textContent   = rpmData.length ? Math.round(rpmData.reduce((a,b)=>a+b,0)/rpmData.length) : '—';
      document.getElementById('max-speed').textContent = speedData.length ? Math.max(...speedData).toFixed(1) : '—';
      document.getElementById('avg-speed').textContent = speedData.length ? (speedData.reduce((a,b)=>a+b,0)/speedData.length).toFixed(1) : '—';
      document.getElementById('distance').textContent  = cumulativeDistance.toFixed(2);
      document.getElementById('shift-count').textContent = shiftCount;
    }

    // Géoloc
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(pos => {
        let s = pos.coords.speed; if (s!=null) s*=3.6;
        updateDisplay(s);
      }, console.error, {enableHighAccuracy:true, maximumAge:500, timeout:5000});
    } else {
      rpmEl.textContent = 'GPS non dispo';
    }
                                          
    // --- Reset trajet (historique & stats) ---
    document.getElementById('reset-trip').onclick = () => {
      if (!rpmData.length) return;
      historyArr.push({
        date: new Date().toLocaleString(),
        distance: cumulativeDistance.toFixed(2),
        avgRpm: Math.round(rpmData.reduce((a,b)=>a+b,0)/rpmData.length),
        maxRpm: Math.max(...rpmData),
        avgSpeed: (speedData.reduce((a,b)=>a+b,0)/speedData.length).toFixed(1),
        maxSpeed: Math.max(...speedData).toFixed(1)
      });
      // sauvegarde locale
      localStorage.setItem('trajets', JSON.stringify(historyArr));
      // réinitialiser données trajet
      speedData = []; rpmData = []; shiftCount = 0; cumulativeDistance = 0; lastGear = null;
      renderHistory();
    };

    // --- Export CSV intelligent ---
    document.getElementById('export-btn').onclick = () => {
      const newTrips = historyArr.slice(lastExport);
      if (!newTrips.length) { alert('Aucun nouveau trajet'); return; }
      let csv = 'Date;Distance;Régime moyen;Régime max;Vitesse moyenne;Vitesse max\n';
      newTrips.forEach(t => { csv += `${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`; });
      const blob = new Blob([csv], { type:'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url; a.download = 'trajets.csv'; a.click(); URL.revokeObjectURL(url);
      lastExport = historyArr.length;
    };
  </script>
</body>
</html>
