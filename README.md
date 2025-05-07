<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-tour automatique</title>
  <style>
    /* ====== CONFIGURATION ====== */
    :root {
      /* Tailles de police */
      --font-size-line: 1.5rem;
      --font-size-speed: 2rem;
      --font-size-gear: 1.8rem;
      --font-size-rpm: 2rem;
	  .
      /* Couleurs */
      --color-bg: #f4f7fa;
      --color-center: #ffffff;
      --color-left: #e3f2fd;
      --color-right: #e8f5e9;
      --color-primary: #1976d2;
      --color-secondary: #388e3c;
      --color-text: #333;
      /* Autres */
      --border-radius: 8px;
      --padding: 1rem;
      --gap: 1rem;
      --transition: 0.2s ease;
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: var(--font-size-line);
      line-height: 1.4;
    }

    /* Conteneur central */
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: var(--padding);
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }

    /* Sections */
    .section {
      border-radius: var(--border-radius);
      padding: var(--padding);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: background var(--transition);
    }
    .center { background: linear-gradient(135deg, #FFB3B3, #FFD6D6); }
    .history { background: linear-gradient(135deg, var(--color-left), #d3eaffe0); }
    .stats   { background: linear-gradient(135deg, var(--color-right), #c8e6c9e0); }

    h2 {
      margin-top: 0;
      color: var(--color-primary);
      font-size: calc(var(--font-size-line) * 1.2);
    }

    /* Mode buttons */
    #modes {
      display: flex;
      gap: 0.5rem;
      margin-bottom: var(--gap);
    }
    #modes button {
      flex: 1;
      padding: 0.6rem;
      border: none;
      background: #fff;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: background var(--transition), box-shadow var(--transition);
    }
    #modes button.active {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 0 5px rgba(0,0,0,0.2);
    }

    /* Contrôles de police */
    .font-controls {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: var(--gap);
    }
    .font-controls button {
      padding: 0.4rem;
      border: none;
      background: var(--color-secondary);
      color: #fff;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: opacity var(--transition);
    }
    .font-controls button:active { opacity: 0.7; }

    /* RPM range */
    .rpm-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: var(--gap);
    }

    /* Labels, selects, buttons génériques */
    label, select, button {
      font-size: var(--font-size-line);
    }
    select, button {
      padding: 0.5rem;
      border-radius: var(--border-radius);
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      font-size: var(--font-size-line);
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.4rem;
      text-align: center;
    }
    th { background: #bbdefb; }

    /* Sortie de valeurs */
    #output span#speed { font-size: var(--font-size-speed); }
    #gear-output       { font-size: var(--font-size-gear); }
    #rpm               { font-size: var(--font-size-rpm); }

    /* Responsive mobile */
    @media (max-width: 480px) {
      .rpm-range {
        flex-direction: column;
        align-items: flex-start;
      }
      #modes { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Section Compte‑tour -->
    <div id="section-center" class="section center">
      <h2>Compte‑tour automatique</h2>

      <!-- Modes -->
      <div id="modes">
        <button id="mode-normal" class="active">Normal</button>
        <button id="mode-sport">Sport</button>
      </div>

      <!-- Plage RPM dynamique -->
      <div class="rpm-range">
        <label>Min RPM (<span id="mode-label-min">Normal</span>): 
          <span id="min-rpm-val">1500</span>
        </label>
        <button id="min-rpm-decrease">–</button>
        <button id="min-rpm-increase">+</button>
      </div>
      <div class="rpm-range">
        <label>Max RPM (<span id="mode-label-max">Normal</span>): 
          <span id="max-rpm-val">3000</span>
        </label>
        <button id="max-rpm-decrease">–</button>
        <button id="max-rpm-increase">+</button>
      </div>

      <!-- Sélecteur de rapport -->
      <label>Rapport engagé (automatique)</label>
      <select id="gear">
        <option value="1">1ère</option>
        <option value="2">2ème</option>
        <option value="3">3ème</option>
        <option value="4">4ème</option>
        <option value="5">5ème</option>
      </select>

      <!-- Affichage des mesures -->
      <div id="output">
        <p>Vitesse : <span id="speed">–</span> km/h</p>
        <p>Rapport estimé : <span id="gear-output">–</span></p>
        <p>Régime moteur : <span id="rpm">–</span> tr/min</p>
      </div>
    </div>

    <!-- Navigation vers les autres sections -->
    <select id="section-select">
      <option value="center">Compte‑tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <!-- Section Historique -->
    <div id="section-history" class="section history" style="display:none">
      <h2>Historique des trajets</h2>
      <button id="export-btn">Exporter nouveaux trajets</button>
      <table id="history">
        <thead>
          <tr>
            <th>Date</th>
            <th>Distance (km)</th>
            <th>Régime moyen</th>
            <th>Régime max</th>
            <th>Vitesse moyenne</th>
            <th>Vitesse max</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <!-- Section Valeurs -->
    <div id="section-stats" class="section stats" style="display:none">
      <h2>Valeurs du trajet</h2>
      <p>Régime max : <span id="max-rpm">–</span> tr/min</p>
      <p>Régime moyen : <span id="avg-rpm">–</span> tr/min</p>
      <p>Vitesse max : <span id="max-speed">–</span> km/h</p>
      <p>Vitesse moyenne : <span id="avg-speed">–</span> km/h</p>
      <p>Distance parcourue : <span id="distance">–</span> km</p>
      <p>Changements de rapport : <span id="shift-count">0</span></p>
      <button id="reset-trip">Reset trajet</button>
    </div>
  </div>

  <script>
    // -- VARIABLES / ÉTAT --
    const rpmRanges = { 
		normal:{min:1100,max:2200}, 
		sport:{min:1800,max:4000} 
	};
    let currentMode = 'normal';
    let lastSpeed=null, lastGear=null, shiftCount=0, cumulativeDistance=0;
    let speedData=[], rpmData=[], history=[] , lastExportIndex=0;

    // -- ELEMENTS DOM --
    const secs = {
      center: document.getElementById('section-center'),
      history: document.getElementById('section-history'),
      stats:   document.getElementById('section-stats')
    };
    const selectSec = document.getElementById('section-select');
    const btnNormal = document.getElementById('mode-normal');
    const btnSport  = document.getElementById('mode-sport');
    const lblMin    = document.getElementById('min-rpm-val');
    const lblMax    = document.getElementById('max-rpm-val');
    const lblMinMode= document.getElementById('mode-label-min');
    const lblMaxMode= document.getElementById('mode-label-max');
    const gearEl    = document.getElementById('gear');
    const speedEl   = document.getElementById('speed');
    const gearOut   = document.getElementById('gear-output');
    const rpmEl     = document.getElementById('rpm');
    const historyBody = document.querySelector('#history tbody');

    // -- RESPONSIVE SECTIONS --
    selectSec.onchange = () => {
      Object.values(secs).forEach(s=>s.style.display='none');
      secs[ selectSec.value ].style.display='block';
    };
    secs.center.style.display='block';

    // -- MODE & PLAGES RPM --
    function switchMode(mode){
      currentMode = mode;
      [btnNormal, btnSport].forEach(b=> b.classList.toggle('active', b.id==='mode-'+mode));
      const txt = mode[0].toUpperCase()+mode.slice(1);
      lblMinMode.textContent = txt;
      lblMaxMode.textContent = txt;
      lblMin.textContent = rpmRanges[mode].min;
      lblMax.textContent = rpmRanges[mode].max;
    }
    btnNormal.onclick = ()=>switchMode('normal');
    btnSport.onclick  = ()=>switchMode('sport');
    document.getElementById('min-rpm-increase').onclick = ()=>{ rpmRanges[currentMode].min+=100; switchMode(currentMode); };
    document.getElementById('min-rpm-decrease').onclick = ()=>{ rpmRanges[currentMode].min = Math.max(0,rpmRanges[currentMode].min-100); switchMode(currentMode); };
    document.getElementById('max-rpm-increase').onclick = ()=>{ rpmRanges[currentMode].max+=100; switchMode(currentMode); };
    document.getElementById('max-rpm-decrease').onclick = ()=>{ rpmRanges[currentMode].max = Math.max(rpmRanges[currentMode].min, rpmRanges[currentMode].max-100); switchMode(currentMode); };
    switchMode('normal');

    // -- CALCULS & AFFICHAGE --
    const v1000 = {1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};

    function determineGear(speed){
      let best=1,score=1e9;
      for(let g=1;g<=5;g++){
        const rpm = speed*1000/v1000[g];
        if(rpm>=rpmRanges[currentMode].min && rpm<=rpmRanges[currentMode].max) return g;
        const s = Math.min(Math.abs(rpm-rpmRanges[currentMode].min),Math.abs(rpm-rpmRanges[currentMode].max));
        if(s<score){score=s;best=g;}
      }
      return best;
    }
    function calcRpm(speed,gear){ return Math.round(speed*1000/v1000[gear]); }
    function updateDisplay(speed){
      if(speed===null){ speedEl.textContent='–'; gearOut.textContent='–'; rpmEl.textContent='–'; return; }
      speedEl.textContent = speed.toFixed(1);
      cumulativeDistance += speed/3600;
      const gear = determineGear(speed);
      gearEl.value=gear; gearOut.textContent=`${gear}ᵉ`;
      const rpm = calcRpm(speed,gear);
      rpmEl.textContent = rpm;
      // stats
      speedData.push(speed); rpmData.push(rpm);
      if(lastGear!==null && gear!==lastGear) shiftCount++;
      lastGear = gear;
    }

    // -- GÉOLOCALISATION --
    if('geolocation' in navigator){
      navigator.geolocation.watchPosition(pos=>{
        let sp = pos.coords.speed;
        if(sp!==null) sp*=3.6;
        lastSpeed = sp;
        updateDisplay(sp);
      },console.error,{enableHighAccuracy:true,maximumAge:1000,timeout:5000});
    }

    // -- HISTORIQUE & RESET --
    function renderHistory(){
      historyBody.innerHTML='';
      history.forEach(t=>{
        const row=document.createElement('tr');
        ['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k=>{
          const td=document.createElement('td'); td.textContent=t[k]; row.appendChild(td);
        });
        historyBody.appendChild(row);
      });
    }
    document.getElementById('reset-trip').onclick = ()=>{
      if(!rpmData.length) return;
      const avgRpm = Math.round(rpmData.reduce((a,b)=>a+b,0)/rpmData.length);
      const maxRpm = Math.max(...rpmData);
      const avgSp  = (speedData.reduce((a,b)=>a+b,0)/speedData.length).toFixed(1);
      const maxSp  = Math.max(...speedData).toFixed(1);
      history.push({
        date: new Date().toLocaleString(),
        distance: cumulativeDistance.toFixed(2),
        avgRpm, maxRpm, avgSpeed:avgSp, maxSpeed:maxSp
      });
      renderHistory();
      // Réinit
      lastGear=null; shiftCount=0; speedData=[]; rpmData=[]; cumulativeDistance=0;
      document.getElementById('max-rpm').textContent='–';
      document.getElementById('avg-rpm').textContent='–';
      document.getElementById('max-speed').textContent='–';
      document.getElementById('avg-speed').textContent='–';
      document.getElementById('distance').textContent='–';
      document.getElementById('shift-count').textContent='0';
    };

    // -- EXPORT CSV INTELLIGENT --
    document.getElementById('export-btn').onclick = ()=>{
      const newTrips = history.slice(lastExportIndex);
      if(!newTrips.length){ alert('Aucun nouveau trajet à exporter'); return; }
      let csv = 'Date;Distance;Régime moyen;Régime max;Vitesse moyenne;Vitesse max\n';
      newTrips.forEach(t=>{ csv+=`${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`; });
      const blob = new Blob([csv],{type:'text/csv'}), url=URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='trajets_nouveaux.csv'; a.click();
      URL.revokeObjectURL(url);
      lastExportIndex = history.length;
    };

  </script>
</body>
</html>
