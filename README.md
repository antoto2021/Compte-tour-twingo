<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Compte-tour V7</title>
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
      --bg-page: #000;
      --text-page: #fff;
      --bg-center: #000;
      --text-center: #fff;
      --bg-history: #000;
      --text-history: #000;
      --bg-stats: #000;
      --text-stats: #fff;

      --font-base: 4vw;
      --font-title: 5vw;
      --font-mode: 4vw;
      --font-value: 15.5vw;
      --font-stats-val: 6.5vw;
      --gap: 1.7vw;
      --pad: 2.7vw;
      --radius: 4vw;
    }
    *,*::before,*::after{box-sizing:border-box;}
    html,body{margin:0;padding:0;width:100%;height:100%;overflow-x:hidden;}
    body{padding:var(--pad);font-family:Arial,sans-serif;background:var(--bg-page);color:var(--text-page);font-size:var(--font-base);}
    .container{display:flex;flex-direction:column;gap:var(--gap);width:100%;}
    h1{text-align:center;font-size:var(--font-title);margin:0;}
    select,button{padding:var(--pad);font-size:var(--font-base);border-radius:var(--radius);}
    .section{display:none;padding:var(--pad);background:#111;border-radius:var(--radius);}
    #center{background:var(--bg-center);color:var(--text-center);}
    #history{background:var(--bg-history);color:var(--text-history);}
    #stats{background:var(--bg-stats);color:var(--text-stats);}
    table{width:100%;border-collapse:collapse;margin-top:var(--gap);font-size:var(--font-base);}
    th,td{border:1px solid #ccc;padding:calc(var(--pad)/2);text-align:center;}
    th{background:#222;color:#fff;}
    @media(min-width:480px){:root{--font-base:1.5rem;--font-title:2.5rem;--font-mode:1.7rem;--font-value:5rem;--font-stats-val:2rem;--gap:1rem;--pad:0.5rem;--radius:8px;}}
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
      <button id="mode-toggle">Mode: Normal</button>
      <p id="gear" style="font-size:var(--font-value)">—</p>
      <p id="rpm" style="font-size:var(--font-value)">— tr/min</p>
      <button id="reset-trip">Terminer trajet</button>
    </div>

    <div id="history" class="section">
      <button id="export-btn">Exporter trajets</button>
      <table>
        <thead><tr><th>Date</th><th>Dist. (km)</th><th>Durée</th><th>Rég. moy</th><th>Rég. max</th><th>Vit. moy</th><th>Vit. max</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <div id="stats" class="section">
      <p>Régime max: <span id="max-rpm">—</span> tr/min</p>
      <p>Régime moy: <span id="avg-rpm">—</span> tr/min</p>
      <p>Vit. max:   <span id="max-speed">—</span> km/h</p>
      <p>Vit. moy:   <span id="avg-speed">—</span> km/h</p>
      <p>Distance:   <span id="distance">—</span> km</p>
      <p>Chgt rap.:  <span id="shift-count">0</span></p>
    </div>
  </div>

  <script>
    // Init historique
    let historyArr = JSON.parse(localStorage.getItem('trajets')||'[]');
    let lastExport = parseInt(localStorage.getItem('lastExport')||'0',10);
    const histBody=document.querySelector('#history-table tbody');
    function renderHistory(){histBody.innerHTML='';historyArr.forEach(t=>{const tr=document.createElement('tr');['date','distance','duration','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k=>{const td=document.createElement('td');td.textContent=t[k];tr.appendChild(td);});histBody.appendChild(tr);});}
    renderHistory();

    // Seuils et démultiplications
    const v1000=[,7.45,13.45,18.97,24.35,30.55];
    const thr={ normal:{up:[,2100,2150,2150,2150,5000],down:[,1050,1100,1400,1500,1500]}, sport:{up:[,3000,3000,3000,3000,4000],down:[,2000,2500,2500,2500,2500]}};
    let mode='normal',lastGear=null;
    function detGear(sp){if(sp<5.5)return lastGear=null;if(lastGear==null)return lastGear=1;let g=lastGear,r=Math.round(sp*1000/v1000[g]);if(r>thr[mode].up[g]&&g<5)g++;else if(r<thr[mode].down[g]&&g>1)g--;return lastGear=g;}
    function calcRpm(sp,g){return(sp<5.5||!g)?900:Math.round(sp*1000/v1000[g]);}

    // Variables et références
    let speedData=[],rpmData=[],shiftCount=0,cumDist=0,startTime=Date.now();
    const gearEl=document.getElementById('gear'),rpmEl=document.getElementById('rpm');
    const statEls={maxRpm:'#max-rpm',avgRpm:'#avg-rpm',maxSpeed:'#max-speed',avgSpeed:'#avg-speed',distance:'#distance',shiftCount:'#shift-count'};
    function updateStats(){document.querySelector(statEls.maxRpm).textContent=Math.max(...rpmData)||'—';document.querySelector(statEls.avgRpm).textContent=(rpmData.reduce((a,b)=>a+b)/rpmData.length||0).toFixed(0);document.querySelector(statEls.maxSpeed).textContent=Math.max(...speedData)||'—';document.querySelector(statEls.avgSpeed).textContent=(speedData.reduce((a,b)=>a+b)/speedData.length||0).toFixed(1);document.querySelector(statEls.distance).textContent=cumDist.toFixed(2);document.querySelector(statEls.shiftCount).textContent=shiftCount;}

    function update(sp){const g=detGear(sp),r=calcRpm(sp,g);gearEl.textContent=g||'—';rpmEl.textContent=r+' tr/min';if(sp!=null){speedData.push(sp);rpmData.push(r);cumDist+=sp/3600;if(rpmData.length>1&&r<rpmData[rpmData.length-2])shiftCount++;}updateStats();}

    // Géoloc rapide
    if(navigator.geolocation){setInterval(()=>navigator.geolocation.getCurrentPosition(p=>update(p.coords.speed*3.6),()=>{}),200);}else rpmEl.textContent='GPS non dispo';

    // Mode toggle
    document.getElementById('mode-toggle').onclick=()=>{mode=mode==='normal'?'sport':'normal';this.textContent='Mode: '+mode;lastGear=null;};

    // Section nav
    const sections={center:document.getElementById('center'),history:document.getElementById('history'),stats:document.getElementById('stats')};
    document.getElementById('section-select').onchange=e=>{Object.values(sections).forEach(s=>s.style.display='none');sections[e.target.value].style.display='block';};sections.center.style.display='block';

    // Reset trajet (calcul duration)
    document.getElementById('reset-trip').onclick=()=>{if(!rpmData.length)return;const durationSec=Math.round((Date.now()-startTime)/1000);const hh=Math.floor(durationSec/3600).toString().padStart(2,'0');const mm=Math.floor((durationSec%3600)/60).toString().padStart(2,'0');const ss=(durationSec%60).toString().padStart(2,'0');const duration=`${hh}:${mm}:${ss}`;historyArr.push({date:new Date().toLocaleString(),distance:cumDist.toFixed(2),duration,avgRpm:(rpmData.reduce((a,b)=>a+b)/rpmData.length).toFixed(0),maxRpm:Math.max(...rpmData),avgSpeed:(speedData.reduce((a,b)=>a+b)/speedData.length).toFixed(1),maxSpeed:Math.max(...speedData)});
    localStorage.setItem('trajets',JSON.stringify(historyArr));speedData=[];rpmData=[];shiftCount=0;cumDist=0;startTime=Date.now();renderHistory();};

    // Export CSV
    document.getElementById('export-btn').onclick=()=>{const newTrips=historyArr.slice(lastExport);if(!newTrips.length){alert('Aucun nouveau trajet');return;}let csv='Date;Distance;Durée;Régime moyen;Régime max;Vitesse moyenne;Vitesse max\n';newTrips.forEach(t=>{csv+=`${t.date};${t.distance};${t.duration};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`;});const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='trajets.csv';a.click();URL.revokeObjectURL(url);lastExport=historyArr.length;localStorage.setItem('lastExport',lastExport);};
  </script>
</body>
</html>
