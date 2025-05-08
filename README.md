<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-tour V3</title>
  <style>
    :root {
      /* Plages RPM fixes */
      --rpm-min-normal: 1000;
      --rpm-max-normal: 2100;
      --rpm-min-sport: 2000;
      --rpm-max-sport: 4000;
	  
      /* Couleurs & tailles */
      --bg-center: #000;
      --text-center: #fff;
      --bg-history: #e3f2fd;
      --text-history: #000;
      --bg-stats: #e8f5e9;
      --text-stats: #000;
      --font-base: 1rem;
      --font-title: 2.5rem;
      --font-mode: 1.5rem;
      --font-value: 3rem;
      --gap: 1.2rem;
      --pad: 0.5rem;
      --radius: 8px;
    }
    *,*::before,*::after{box-sizing:border-box}
    body{
      margin:0;padding:var(--pad);
      font-family:Arial,sans-serif;
      background:#f4f7fa;
      font-size:var(--font-base);
    }
    .container{
      max-width:600px;margin:0 auto;
      display:flex;flex-direction:column;gap:var(--gap)
    }
    h1{
      margin:0;text-align:center;
      font-size:var(--font-title);
      color:var(--bg-center)
    }
    /* Mode buttons */
    #modes{
      display:flex;justify-content:center;gap:var(--gap);
      margin-bottom:var(--gap)
    }
    #modes button{
      padding:0.5rem 1rem;
      font-size:var(--font-mode);
      border:none;border-radius:var(--radius);
      cursor:pointer;
      background:#ccc;color:#000;
      transition:0.2s
    }
    #modes button.active{
      background:var(--bg-center);
      color:var(--text-center)
    }
    /* Section selector */
    #section-select{
      padding:0.5rem;border-radius:var(--radius);
      border:1px solid #ccc;margin-bottom:var(--gap);
      width:100%
    }
    /* Sections */
    .section{display:none;padding:var(--pad);border-radius:var(--radius);box-shadow:0 2px 5px rgba(0,0,0,0.1)}
    .center{background:var(--bg-center);color:var(--text-center)}
    .history{background:var(--bg-history);color:var(--text-history)}
    .stats{background:var(--bg-stats);color:var(--text-stats)}
    /* Values center */
    #center .value{
      font-size:var(--font-value);
      margin:var(--gap) 0;
      text-align:center;
    }
    /* Table */
    table{width:100%;border-collapse:collapse;margin-top:var(--gap)}
    th,td{border:1px solid #ccc;padding:0.4rem;text-align:center}
    th{background:#bbdefb}
    @media(max-width:480px){#center .value{font-size:1.5rem}#modes button{font-size:1rem}}  
  </style>
</head>
<body>
  <div class="container">
    <h1>Compte-tour</h1>
    <div id="modes">
      <button id="mode-normal" class="active">Normal</button>
      <button id="mode-sport">Sport</button>
    </div>
    <select id="section-select">
      <option value="center">Compte-tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <!-- Compte-tour -->
    <div id="center" class="section center">
      <p id="gear-value" class="value">—</p>
      <p id="rpm-value" class="value">— tr/min</p>
    </div>

    <!-- Historique -->
    <div id="history" class="section history">
      <h2>Historique des trajets</h2>
      <button id="export-btn">Exporter nouveaux trajets</button>
      <table id="history-table">
        <thead>
          <tr><th>Date</th><th>Distance</th><th>Rég région</th><th>Rég max</th><th>Vit moy</th><th>Vit max</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <!-- Valeurs -->
    <div id="stats" class="section stats">
      <h2>Valeurs du trajet</h2>
      <p>Régime max : <span id="max-rpm">—</span> tr/min</p>
      <p>Régime moyen : <span id="avg-rpm">—</span> tr/min</p>
      <p>Vitesse max : <span id="max-speed">—</span> km/h</p>
      <p>Vitesse moyenne : <span id="avg-speed">—</span> km/h</p>
      <p>Distance : <span id="distance">—</span> km</p>
      <p>Chgt rapport : <span id="shift-count">0</span></p>
      <button id="reset-trip">Reset trajet</button>
    </div>
  </div>

  <script>
    // Navigation sections
    const secs={center:0,history:0,stats:0};
    secs.center=document.getElementById('center');
    secs.history=document.getElementById('history');
    secs.stats=document.getElementById('stats');
    document.getElementById('section-select').onchange=e=>{
      Object.values(secs).forEach(s=>s.style.display='none');
      secs[e.target.value].style.display='block';
    };
    secs.center.style.display='block';

    // Modes
    const ranges={normal:{min:1000,max:2100},sport:{min:2000,max:4000}};
    let mode='normal';
    const btnN=document.getElementById('mode-normal');
    const btnS=document.getElementById('mode-sport');
    function switchMode(m){mode=m;btnN.classList.toggle('active',m==='normal');btnS.classList.toggle('active',m==='sport');}
    btnN.onclick=()=>switchMode('normal');btnS.onclick=()=>switchMode('sport');
    switchMode('normal');

    // Calcul compte-tour
    const v1000={1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};
    const gearEl=document.getElementById('gear-value');
    const rpmEl=document.getElementById('rpm-value');
    function determineGear(sp){if(sp<3)return null;let b=1,d=1e9;const r= ranges[mode];for(let g=1;g<=5;g++){const rpm=sp*1000/v1000[g];if(rpm>=r.min&&rpm<=r.max)return g;const delta=Math.min(Math.abs(rpm-r.min),Math.abs(rpm-r.max));if(delta<d){d=delta;b=g;}}return b;}
    function calcRpm(sp,g){if(sp<3)return 900;return Math.round(sp*1000/v1000[g]);}
    function update(sp){const g=determineGear(sp);gearEl.textContent=g?g+'ᵉ':'—';rpmEl.textContent=calcRpm(sp,g)+' tr/min';}
    if(navigator.geolocation){navigator.geolocation.watchPosition(p=>{let s=p.coords.speed;if(s!=null)s*=3.6;update(s);},console.error,{enableHighAccuracy:true,maximumAge:500,timeout:5000});}

    // Historique & export
    let hist=[],lastExp=0;
    const histBody=document.querySelector('#history-table tbody');
    document.getElementById('reset-trip').onclick=()=>{const r=parseInt(rpmEl.textContent)||0;hist.push({date:new Date().toLocaleString(),distance:'—',avgRpm:r,maxRpm:r,avgSpeed:'—',maxSpeed:'—'});histBody.innerHTML='';hist.forEach(t=>{const tr=document.createElement('tr');['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k=>{const td=document.createElement('td');td.textContent=t[k];tr.appendChild(td)});histBody.appendChild(tr)});};
    document.getElementById('export-btn').onclick=()=>{const slice=hist.slice(lastExp);if(!slice.length){alert('Aucun nouveau trajet');return;}let csv='Date;Distance;avgRpm;maxRpm;avgSpeed;maxSpeed\n';slice.forEach(t=>{csv+=`${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`});const b=new Blob([csv],{type:'text/csv'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='trajets.csv';a.click();URL.revokeObjectURL(u);lastExp=hist.length;};
  </script>
</body>
</html>
