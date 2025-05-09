<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"> <!-- Encodage UTF-8 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Responsive mobile -->
  <title>Compte-tour V3</title>
  <style>
    :root {
      /* Plages RPM fixes */
      --rpm-min-normal: 1000;
      --rpm-max-normal: 2150;
      --rpm-min-sport : 2000;
      --rpm-max-sport : 4000;

      /* Couleurs */
      --bg-center   : #000;
      --text-center : #fff;
      --bg-history  : #e3f2fd;
      --text-history: #000;
      --bg-stats    : #e8f5e9;
      --text-stats  : #000;

      /* Tailles fluides (mobile first) */
      --font-base  : 4vw;
      --font-title : 8vw;
      --font-mode  : 5vw;
      --font-value : 10vw;

      /* Espacements */
      --gap    : 2vw;
      --pad    : 3vw;
      --radius : 4vw;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin:0;
      padding:var(--pad);
      font-family:Arial,sans-serif;
      background:#f4f7fa;
      font-size:var(--font-base);
      line-height:1.2;
    }
    .container {
      width:100%;
      display:flex;
      flex-direction:column;
      gap:var(--gap);
    }
    h1 {
      margin:0;
      text-align:center;
      font-size:var(--font-title);
      color:var(--bg-center);
    }
    /* Sélecteur de section */
    #section-select {
      padding:var(--pad);
      border:1px solid #ccc;
      border-radius:var(--radius);
      font-size:var(--font-base);
    }
    /* Sections communes */
    .section {
      display:none;
      padding:var(--pad);
      border-radius:var(--radius);
      box-shadow:0 2px 5px rgba(0,0,0,0.1);
    }
    #center {
      background:var(--bg-center);
      color:var(--text-center);
    }
    #history {
      background:var(--bg-history);
      color:var(--text-history);
    }
    #stats {
      background:var(--bg-stats);
      color:var(--text-stats);
    }
    /* Contenu Compte-tour */
    #center .value {
      font-size:var(--font-value);
      text-align:center;
      margin:var(--gap) 0;
    }
    /* Boutons mode uniquement dans Compte-tour */
    #center #modes {
      display:flex;
      justify-content:center;
      gap:var(--gap);
      flex-wrap:wrap;
      margin-bottom:var(--gap);
    }
    #center #modes button {
      flex:1 1 auto;
      padding:var(--pad);
      font-size:var(--font-mode);
      border:none;
      border-radius:var(--radius);
      background:#ccc;
      cursor:pointer;
      transition:background .2s;
      min-width:30%;
    }
    #center #modes button.active {
      background:var(--bg-center);
      color:var(--text-center);
    }
    /* Table Historique */
    table {
      width:100%;
      border-collapse:collapse;
      margin-top:var(--gap);
      font-size:var(--font-base);
    }
    th, td {
      border:1px solid #ccc;
      padding:calc(var(--pad)/2);
      text-align:center;
    }
    th { background:#bbdefb; }

    /* Breakpoint desktop */
    @media(min-width:480px) {
      :root {
        --font-base: 1.2rem;
        --font-title: 2.5rem;
        --font-mode: 1.7rem;
        --font-value: 4rem;
        --gap: 1rem;
        --pad: 0.5rem;
        --radius: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Compte-tour</h1>

    <!-- Selecteur de section -->
    <select id="section-select">
      <option value="center">Compte-tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <!-- SECTION COMPTE-TOUR -->
    <div id="center" class="section">
      <div id="modes">
        <button id="mode-normal" class="active">Normal</button>
        <button id="mode-sport">Sport</button>
      </div>
      <p id="gear-value" class="value">—</p>
      <p id="rpm-value" class="value">— tr/min</p>
    </div>

    <!-- SECTION HISTORIQUE -->
    <div id="history" class="section">
      <h2 style="margin-top:0; font-size:var(--font-base)">Historique des trajets</h2>
      <button id="export-btn" style="font-size:var(--font-base); padding:var(--pad)">Exporter nouveaux trajets</button>
      <table id="history-table">
        <thead>
          <tr><th>Date</th><th>Distance</th><th>Rég. moy</th><th>Rég. max</th><th>Vit. moy</th><th>Vit. max</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <!-- SECTION VALEURS -->
    <div id="stats" class="section">
      <h2 style="margin-top:0; font-size:var(--font-base)">Valeurs du trajet</h2>
      <p style="font-size:var(--font-base)">Régime max   : <span id="max-rpm">—</span> tr/min</p>
      <p style="font-size:var(--font-base)">Régime moyen : <span id="avg-rpm">—</span> tr/min</p>
      <p style="font-size:var(--font-base)">Vitesse max  : <span id="max-speed">—</span> km/h</p>
      <p style="font-size:var(--font-base)">Vitesse moy  : <span id="avg-speed">—</span> km/h</p>
      <p style="font-size:var(--font-base)">Distance     : <span id="distance">—</span> km</p>
      <p style="font-size:var(--font-base)">Chgt rapport : <span id="shift-count">0</span></p>
      <button id="reset-trip" style="font-size:var(--font-base); padding:var(--pad)">Reset trajet</button>
    </div>
  </div>

  <script>
    // --- Navigation entre sections ---
    const sections = {
      center:  document.getElementById('center'),
      history: document.getElementById('history'),
      stats:   document.getElementById('stats')
    };
    document.getElementById('section-select').onchange = e => {
      Object.values(sections).forEach(s => s.style.display = 'none');
      sections[e.target.value].style.display = 'block';
    };
    sections.center.style.display = 'block';

    // --- Mode Normal/Sport & initialisation ---
    const ranges = {
      normal: { min: 1000, max: 2100 },
      sport:  { min: 2000, max: 4000 }
    };
    let mode = 'normal';
    const btnN   = document.getElementById('mode-normal');
    const btnS   = document.getElementById('mode-sport');
    const gearEl = document.getElementById('gear-value');
    const rpmEl  = document.getElementById('rpm-value');

    function switchMode(m) {
      mode = m;
      btnN.classList.toggle('active', m === 'normal');
      btnS.classList.toggle('active', m === 'sport');
    }
    btnN.onclick = () => switchMode('normal');
    btnS.onclick = () => switchMode('sport');
    switchMode('normal');

    // --- Variables de suivi trajet ---
    let speedData = [], rpmData = [], shiftCount = 0, cumulativeDistance = 0;
    let lastGear = null, historyArr = [], lastExport = 0;
    const histBody = document.querySelector('#history-table tbody');

    // --- Calcul des rapports/rpm ---
    const v1000 = {1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};
    function determineGear(sp) {
      if (sp < 6) return null;
      let best=1, delta=Infinity, {min, max} = ranges[mode];
      for (let g=1; g<=5; g++) {
        const r = sp*1000/v1000[g];
        if (r>=min && r<=max) return g;
        const d = Math.min(Math.abs(r-min), Math.abs(r-max));
        if (d<delta) { delta=d; best=g; }
      }
      return best;
    }
    function calcRpm(sp, g) {
      if (sp < 6) return 900;
      return Math.round(sp*1000/v1000[g]);
    }

    // --- Mise à jour temps réel ---
    function updateDisplay(sp) {
      const g = determineGear(sp);
      const r = calcRpm(sp, g);
      // affichage compte-tour
      gearEl.textContent = g != null ? g : '—';
      rpmEl.textContent  = r + ' tr/min';
      // stocker
      if (sp!=null) {
        speedData.push(sp);
        rpmData.push(r);
        if (lastGear!=null && g!=null && g!== lastGear) shiftCount++;
        lastGear = g;
        cumulativeDistance += sp/3600; // km
      }
      // mettre à jour section Valeurs en temps réel
      document.getElementById('max-rpm').textContent   = rpmData.length ? Math.max(...rpmData) : '—';
      document.getElementById('avg-rpm').textContent   = rpmData.length ? Math.round(rpmData.reduce((a,b)=>a+b,0)/rpmData.length) : '—';
      document.getElementById('max-speed').textContent = speedData.length ? Math.max(...speedData).toFixed(1) : '—';
      document.getElementById('avg-speed').textContent = speedData.length ? (speedData.reduce((a,b)=>a+b,0)/speedData.length).toFixed(1) : '—';
      document.getElementById('distance').textContent  = cumulativeDistance.toFixed(2);
      document.getElementById('shift-count').textContent = shiftCount;
    }

    // --- Géolocalisation ---
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(pos => {
        let s = pos.coords.speed;
        if (s!=null) s *= 3.6;
        updateDisplay(s);
      }, console.error, { enableHighAccuracy:true, maximumAge:500, timeout:5000 });
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
      // réinitialiser
      speedData = []; rpmData = []; shiftCount = 0; cumulativeDistance = 0; lastGear = null;
      // réafficher historique
      histBody.innerHTML = '';
      historyArr.forEach(t => {
        const tr = document.createElement('tr');
        ['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k => {
          const td = document.createElement('td'); td.textContent = t[k]; tr.appendChild(td);
        });
        histBody.appendChild(tr);
      });
    };

    // --- Export CSV intelligent ---
    document.getElementById('export-btn').onclick = () => {
      const newTrips = historyArr.slice(lastExport);
      if (!newTrips.length) { alert('Aucun nouveau trajet'); return; }
      let csv = 'Date;Distance;Régime moyen;Régime max;Vitesse moyenne;Vitesse max\n';
      newTrips.forEach(t => {
        csv += `${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`;
      });
      const blob = new Blob([csv], { type:'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'trajets.csv'; a.click();
      URL.revokeObjectURL(url);
      lastExport = historyArr.length;
    };
  </script>
</body>
</html>
