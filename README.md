<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"> <!-- Encodage UTF-8 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Responsive -->
  <title>Compte-tour V3</title>
  <style>
    :root {
      /* Plages RPM fixes */
      --rpm-min-normal: 1000;
      --rpm-max-normal: 2100;
      --rpm-min-sport: 2000;
      --rpm-max-sport: 4000;

      /* Couleurs */
      --bg-center: #000;
      --text-center: #fff;
      --bg-history: #e3f2fd;
      --text-history: #000;
      --bg-stats: #e8f5e9;
      --text-stats: #000;

      /* Tailles fluides */
      --font-base: 4vw;       /* taille de base (mobile first) */
      --font-title: 8vw;      /* titre */
      --font-mode: 5vw;       /* boutons mode */
      --font-value: 10vw;     /* valeurs centre */

      /* Espacements */
      --gap: 2vw;
      --pad: 3vw;
      --radius: 4vw;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: var(--pad);
      font-family: Arial, sans-serif;
      background: #f4f7fa;
      font-size: var(--font-base);
      line-height: 1.2;
    }
    .container {
      width: 100%;             /* pleine largeur */
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: var(--font-title);
      color: var(--bg-center);
    }
    /* Boutons mode */
    #modes {
      display: flex;
      justify-content: center;
      gap: var(--gap);
      flex-wrap: wrap;         /* wrap si écran trop étroit */
    }
    #modes button {
      flex: 1 1 auto;
      padding: var(--pad) var(--gap);
      font-size: var(--font-mode);
      border: none;
      border-radius: var(--radius);
      background: #ccc;
      cursor: pointer;
      transition: background 0.2s;
      min-width: 30%;
    }
    #modes button.active {
      background: var(--bg-center);
      color: var(--text-center);
    }
    /* Sélecteur de section */
    #section-select {
      padding: var(--pad);
      border-radius: var(--radius);
      border: 1px solid #ccc;
      width: 100%;
      font-size: var(--font-base);
    }
    /* Sections communes */
    .section {
      display: none;
      padding: var(--pad);
      border-radius: var(--radius);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    #center {
      background: var(--bg-center);
      color: var(--text-center);
    }
    #history {
      background: var(--bg-history);
      color: var(--text-history);
    }
    #stats {
      background: var(--bg-stats);
      color: var(--text-stats);
    }
    /* Contenu Compte-tour */
    #center .value {
      font-size: var(--font-value);
      text-align: center;
      margin: var(--gap) 0;
    }
    /* Table Historique */
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
    th { background: #bbdefb; }

    /* Augmentation légère sur petits écrans (portrait) */
    @media (min-width: 480px) {
      :root {
        --font-base: 1rem;
        --font-title: 2.5rem;
        --font-mode: 1.5rem;
        --font-value: 3rem;
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

    <!-- Boutons Normal/Sport -->
    <div id="modes">
      <button id="mode-normal" class="active">Normal</button>
      <button id="mode-sport">Sport</button>
    </div>

    <!-- Sélecteur de section -->
    <select id="section-select">
      <option value="center">Compte-tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <!-- SECTION COMPTE-TOUR -->
    <div id="center" class="section">
      <!-- Indicateur de mode -->
      <p id="mode-indicator" class="value">Normal</p>
      <!-- Rapport engagé -->
      <p id="gear-value" class="value">—ᵉ</p>
      <!-- Régime moteur -->
      <p id="rpm-value" class="value">— tr/min</p>
    </div>

    <!-- SECTION HISTORIQUE -->
    <div id="history" class="section">
      <h2 style="font-size: var(--font-base); margin-top:0;">Historique des trajets</h2>
      <button id="export-btn" style="font-size: var(--font-base); padding: var(--pad);">Exporter nouveaux trajets</button>
      <table id="history-table">
        <thead>
          <tr>
            <th>Date</th><th>Distance</th><th>Rég. moy</th><th>Rég. max</th><th>Vit. moy</th><th>Vit. max</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <!-- SECTION VALEURS -->
    <div id="stats" class="section">
      <h2 style="font-size: var(--font-base); margin-top:0;">Valeurs du trajet</h2>
      <p style="font-size: var(--font-base)">Régime max : <span id="max-rpm">—</span> tr/min</p>
      <p style="font-size: var(--font-base)">Régime moyen : <span id="avg-rpm">—</span> tr/min</p>
      <p style="font-size: var(--font-base)">Vitesse max : <span id="max-speed">—</span> km/h</p>
      <p style="font-size: var(--font-base)">Vitesse moy : <span id="avg-speed">—</span> km/h</p>
      <p style="font-size: var(--font-base)">Distance : <span id="distance">—</span> km</p>
      <p style="font-size: var(--font-base)">Chgt rapport : <span id="shift-count">0</span></p>
      <button id="reset-trip" style="font-size: var(--font-base); padding: var(--pad);">Reset trajet</button>
    </div>
  </div>

  <script>
    // gestion sections
    const sections = {
      center: document.getElementById('center'),
      history: document.getElementById('history'),
      stats:   document.getElementById('stats')
    };
    document.getElementById('section-select').onchange = e => {
      Object.values(sections).forEach(s => s.style.display='none');
      sections[e.target.value].style.display='block';
    };
    sections.center.style.display='block';

    // mode Normal/Sport
    const ranges = {
      normal: { min: 1000, max: 2100 },
      sport:  { min: 2000, max: 4000 }
    };
    let mode='normal';
    const btnN=document.getElementById('mode-normal'),
          btnS=document.getElementById('mode-sport'),
          modeInd=document.getElementById('mode-indicator');
    function switchMode(m){
      mode=m;
      btnN.classList.toggle('active',m==='normal');
      btnS.classList.toggle('active',m==='sport');
      modeInd.textContent = m.charAt(0).toUpperCase()+m.slice(1);
    }
    btnN.onclick=()=>switchMode('normal');
    btnS.onclick=()=>switchMode('sport');
    switchMode('normal');

    // objets DOM pour valeurs
    const gearEl = document.getElementById('gear-value'),
          rpmEl  = document.getElementById('rpm-value');

    // calculs rapport et rpm
    const v1000={1:7.45,2:13.45,3:18.97,4:24.35,5:30.55};
    function determineGear(sp){
      if(sp<3) return null;
      let best=1, delta=Infinity, {min,max}=ranges[mode];
      for(let g=1;g<=5;g++){
        const r=sp*1000/v1000[g];
        if(r>=min&&r<=max) return g;
        const d=Math.min(Math.abs(r-min),Math.abs(r-max));
        if(d<delta){delta=d;best=g;}
      }
      return best;
    }
    function calcRpm(sp,g){
      if(sp<3) return 900;
      return Math.round(sp*1000/v1000[g]);
    }

    // maj affichage
    function update(sp){
      const g=determineGear(sp);
      gearEl.textContent = g!=null? g+'ᵉ':'—ᵉ';
      rpmEl.textContent  = calcRpm(sp,g)+' tr/min';
    }
    if('geolocation' in navigator){
      navigator.geolocation.watchPosition(p=>{
        let s=p.coords.speed;
        if(s!=null) s*=3.6;
        update(s);
      },console.error,{enableHighAccuracy:true,maximumAge:500,timeout:5000});
    } else {
      rpmEl.textContent='GPS non dispo';
    }

    // historique & export
    let hist=[], lastExp=0;
    const histBody=document.querySelector('#history-table tbody');
    document.getElementById('reset-trip').onclick=()=>{
      const rpm=parseInt(rpmEl.textContent)||0;
      hist.push({date:new Date().toLocaleString(),distance:'—',avgRpm:rpm,maxRpm:rpm,avgSpeed:'—',maxSpeed:'—'});
      histBody.innerHTML='';
      hist.forEach(t=>{const tr=document.createElement('tr');
        ['date','distance','avgRpm','maxRpm','avgSpeed','maxSpeed'].forEach(k=>{
          const td=document.createElement('td');td.textContent=t[k];tr.appendChild(td);
        });
        histBody.appendChild(tr);
      });
    };
    document.getElementById('export-btn').onclick=()=>{
      const slice=hist.slice(lastExp);
      if(!slice.length){alert('Aucun nouveau trajet');return;}
      let csv='Date;Distance;avgRpm;maxRpm;avgSpeed;maxSpeed\n';
      slice.forEach(t=>csv+=`${t.date};${t.distance};${t.avgRpm};${t.maxRpm};${t.avgSpeed};${t.maxSpeed}\n`);
      const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),
            a=document.createElement('a');
      a.href=url; a.download='trajets.csv'; a.click(); URL.revokeObjectURL(url);
      lastExp=hist.length;
    };
  </script>
</body>
</html>
