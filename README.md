<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Compte-tour V5</title>
  <style>
    :root {
      /* Seuils par rapport (en tr/min) */
      --rpm-up-normal-1: 2100;
      --rpm-up-normal-2: 2150;
      --rpm-up-normal-3: 2150;
      --rpm-up-normal-4: 2150;
      --rpm-up-normal-5: 5000;
      --rpm-down-normal-1: 1050;
      --rpm-down-normal-2: 1100;
      --rpm-down-normal-3: 1400;
      --rpm-down-normal-4: 1500;
      --rpm-down-normal-5: 1500;

      --rpm-up-sport-1: 3000;
      --rpm-up-sport-2: 3000;
      --rpm-up-sport-3: 3000;
      --rpm-up-sport-4: 3000;
      --rpm-up-sport-5: 4000;
      --rpm-down-sport-1: 2000;
      --rpm-down-sport-2: 2500;
      --rpm-down-sport-3: 2500;
      --rpm-down-sport-4: 2500;
      --rpm-down-sport-5: 2500;

      /* Couleurs et mise en forme */
      --bg-page      : #000;
      --text-page    : #fff;
      --bg-center    : #000;
      --text-center  : #fff;
      --bg-history   : #000;
      --text-history : #000;
      --bg-stats     : #000;
      --text-stats   : #fff;

      /* Tailles fluides */
      --font-base      : 4vw;
      --font-title     : 5vw;
      --font-mode      : 4vw;
      --font-value     : 15.5vw;
      --font-stats-val : 6.5vw;

      --gap    : 1.7vw;
      --pad    : 2.7vw;
      --radius : 4vw;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
    }
    body {
      padding: var(--pad);
      font-family: Arial, sans-serif;
      background: var(--bg-page);
      color: var(--text-page);
      font-size: var(--font-base);
      line-height: 1.2;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
      width: 100%;
    }
    h1 { margin: 0; text-align: center; font-size: var(--font-title); }
    #section-select {
      width: 100%;
      padding: var(--pad);
      font-size: var(--font-base);
      border-radius: var(--radius);
      border: 1px solid #ccc;
      background: #fff;
      color: #000;
    }
    .section {
      display: none;
      padding: var(--pad);
      border-radius: var(--radius);
      background: #111;
    }
    #center { background: var(--bg-center); color: var(--text-center); }
    #history { background: var(--bg-history); color: var(--text-history); }
    #stats   { background: var(--bg-stats);   color: var(--text-stats);   }

    #center .value {
      font-size: var(--font-value);
      text-align: center;
      margin: var(--gap) 0;
    }
    #center #modes {
      display: flex;
      justify-content: center;
      gap: var(--gap);
      flex-wrap: wrap;
    }
    #center #modes button {
      flex: 1 1 40%;
      padding: var(--pad);
      font-size: var(--font-mode);
      border: none;
      border-radius: var(--radius);
      background: #ccc;
      color: #000;
      cursor: pointer;
      transition: background .2s;
      min-width: 40%;
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
    th { background: #222; color: #fff; }
    #stats p {
      font-size: var(--font-stats-val);
      margin: calc(var(--gap)/2) 0;
    }
    #stats p span { font-weight: bold; }
    @media (min-width: 480px) {
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
      <button id="export-btn">Exporter trajets</button>
      <table id="history-table">
        <thead><tr><th>Date</th><th>Dist. (km)</th><th>Rég. moy</th><th>Rég. max</th><th>Vit. moy</th><th>Vit. max</th></tr></thead>
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
      <button id="reset-trip">Reset trajet</button>
    </div>
  </div>

  <script>
    // Historique
    let historyArr = JSON.parse(localStorage.getItem('trajets') || '[]');
    const histBody = document.querySelector('#history-table tbody');
    function renderHistory() {
      histBody.innerHTML = '';
      historyArr.forEach(t => {
        const tr = document.createElement('tr');
        ['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k => {
          const td = document.createElement('td'); td.textContent = t[k]; tr.appendChild(td);
        });
        histBody.appendChild(tr);
      });
    }
    renderHistory();
    let lastExport = historyArr.length;

    // Navigation
    const sections = { center:document.getElementById('center'), history:document.getElementById('history'), stats:document.getElementById('stats') };
    document.getElementById('section-select').onchange = e => {
      Object.values(sections).forEach(s=>s.style.display='none');
      sections[e.target.value].style.display='block';
    };
    sections.center.style.display = 'block';

    // Démultiplications
    const v1000 = {1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};

    // Chargement des seuils
    function loadThresholds(mode) {
      const up = {}, down = {};
      for (let g=1; g<=5; g++) {
        up[g]   = +getComputedStyle(document.documentElement).getPropertyValue(`--rpm-up-${mode}-${g}`);
        down[g] = +getComputedStyle(document.documentElement).getPropertyValue(`--rpm-down-${mode}-${g}`);
      }
      return { up, down };
    }

    // État global
    let mode='normal', thresholds=loadThresholds('normal'), lastGear=null;
    const btnN=document.getElementById('mode-normal'), btnS=document.getElementById('mode-sport');
    btnN.onclick = () => { mode='normal'; thresholds=loadThresholds(mode); lastGear=null; toggleButtons(); };
    btnS.onclick = () => { mode='sport';  thresholds=loadThresholds(mode); lastGear=null; toggleButtons(); };
    function toggleButtons() {
      btnN.classList.toggle('active', mode==='normal');
      btnS.classList.toggle('active', mode==='sport');
    }
    toggleButtons();

    // Détermination du rapport
    function determineGear(sp) {
      if (sp<5.5) { lastGear=null; return null; }
      if (lastGear==null) { lastGear=1; return 1; }
      const g = lastGear;
      const speedUp   = thresholds.up[g]*v1000[g]/1000;
      const speedDown = thresholds.down[g]*v1000[g]/1000;
      if (sp>speedUp && g<5) lastGear++;
      else if (sp<speedDown && g>1) lastGear--;
      return lastGear;
    }
    function calcRpm(sp,g){ return (sp<5.5||g==null)?900:Math.round(sp*1000/v1000[g]); }

    // Affichage temps réel
    const gearEl=document.getElementById('gear-value'), rpmEl=document.getElementById('rpm-value');
    let speedData=[], rpmData=[], shiftCount=0, cumDist=0;
    function updateDisplay(sp){
      const g=determineGear(sp), r=calcRpm(sp,g);
      gearEl.textContent = g!=null?g:'—';
      rpmEl.textContent  = r+' tr/min';
      if (sp!=null) { speedData.push(sp); rpmData.push(r); cumDist+=sp/3600; if (rpmData.length>1 && g!=null && r<rpmData[rpmData.length-2]) shiftCount++; }
      document.getElementById('max-rpm').textContent   = rpmData.length?Math.max(...rpmData):'—';
      document.getElementById('avg-rpm').textContent   = rpmData.length?(rpmData.reduce((a,b)=>a+b)/rpmData.length).toFixed(0):'—';
      document.getElementById('max-speed').textContent = speedData.length?Math.max(...speedData).toFixed(1):'—';
      document.getElementById('avg-speed').textContent = speedData.length?(	speedData.reduce((a,b)=>a+b)/speedData.length).toFixed(1):'—';
      document.getElementById('distance').textContent  = cumDist.toFixed(2);
      document.getElementById('shift-count').textContent = shiftCount;
    }

    // Géolocalisation
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(pos => { let s=pos.coords.speed; if(s!=null)s*=3.6; updateDisplay(s); }, console.error, { enableHighAccuracy:true, maximumAge:500, timeout:5000 });
    } else rpmEl.textContent='GPS non dispo';

    // Reset trajet
    document.getElementById('reset-trip').onclick = () => {
      if (!rpmData.length) return;
      historyArr.push({ date:new Date().toLocaleString(), distance:cumDist.toFixed(2), avgRpm:Math.round(rpmData.reduce((a,b)=>a+b)/rpmData.length), maxRpm:Math.max(...rpmData), avgSpeed:(	speedData.reduce((a,b)=>a+b)/	speedData.length).toFixed(1), maxSpeed:Math.max(...speedData).toFixed(1) });
      localStorage.setItem('trajets',JSON.stringify(historyArr));
      speedData=[], rpmData=[], shiftCount=0, cumDist=0, lastGear=null;
      renderHistory();
    };

    // Export CSV
    document.getElementById('export-btn').onclick = () => {
      const newTrips=historyArr.slice(lastExport);
      if(!newTrips.length){ alert('Aucun nouveau trajet'); return; }
      let csv='Date;Distance;Régime moyen;Régime max;Vitesse moyenne;Vitesse max\n';
      newTrips.forEach(t=>{ csv+=`${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`; });
      const blob=new Blob([csv],{type:'text/csv'}), url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download='trajets.csv'; a.click(); URL.revokeObjectURL(url);
      lastExport = historyArr.length;
    };
  </script>
</body>
</html>