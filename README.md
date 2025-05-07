<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-tour automatique</title>
  <style>
    /* -------- CONFIGURATION (modifiable directement dans le code) -------- */
    :root {
      /* Tailles de police */
      --font-size-line: 1.5rem;
      --font-size-speed: 2rem;
      --font-size-gear: 1.7rem;
      --font-size-rpm: 2rem;

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
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: var(--font-size-line);
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--padding);
      gap: var(--gap);
    }

    /* Sections */
    .section {
      width: auto; max-width: 900px;
      border-radius: var(--border-radius);
      padding: var(--padding);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-bottom: var(--gap);
    }
    .section.center  { background: linear-gradient(135deg, #FFB3B3, #FFD6D6); }
    .section.history { background: linear-gradient(135deg, var(--color-left), #d3eaffe0); }
    .section.stats   { background: linear-gradient(135deg, var(--color-right), #c8e6c9e0); }

    h2 {
      margin-top: 0;
      color: var(--color-primary);
      font-size: calc(var(--font-size-line) * 1.2);
    }

    label, select, button, th, td {
      font-size: var(--font-size-line);
    }

    select, button {
      padding: 0.5rem;
      border-radius: var(--border-radius);
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
    }

    /* Mode buttons */
    #modes {
      display: flex;
      gap: 0.5rem;
      margin-bottom: var(--gap);
    }
    #modes button.active {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 0 5px rgba(0,0,0,0.2);
    }

    /* RPM range controls */
    .rpm-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: var(--gap);
    }

    /* Output text sizes */
    #output span#speed { font-size: var(--font-size-speed); }
    #gear-output       { font-size: var(--font-size-gear); }
    #rpm               { font-size: var(--font-size-rpm); }

    /* Table */
    table {
      width: 100%; border-collapse: collapse;
      margin-top: 0.5rem;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: center;
    }
    th { background: #bbdefb; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Section Compte-tour -->
    <div id="section-center" class="section center">
      <h2>Compte-tour automatique</h2>

      <!-- Mode selection -->
      <div id="modes">
        <button id="mode-normal" class="active">Normal</button>
        <button id="mode-sport">Sport</button>
      </div>

      <!-- RPM range per mode -->
      <div class="rpm-range">
        <label>Min RPM (<span id="mode-label-min">Normal</span>): <span id="min-rpm-val">1500</span></label>
        <button id="min-rpm-decrease">-</button>
        <button id="min-rpm-increase">+</button>
      </div>
      <div class="rpm-range">
        <label>Max RPM (<span id="mode-label-max">Normal</span>): <span id="max-rpm-val">3000</span></label>
        <button id="max-rpm-decrease">-</button>
        <button id="max-rpm-increase">+</button>
      </div>

      <!-- Gear selector -->
      <label>Rapport engagé (automatique)</label>
      <select id="gear">
        <option value="1">1ère</option>
        <option value="2">2ème</option>
        <option value="3">3ème</option>
        <option value="4">4ème</option>
        <option value="5">5ème</option>
      </select>

      <!-- Output -->
      <div id="output">
        <p>Vitesse : <span id="speed">–</span> km/h</p>
        <p>Rapport estimé : <span id="gear-output">–</span></p>
        <p>Régime moteur : <span id="rpm">–</span> tr/min</p>
      </div>
    </div>

    <!-- Section selector -->
    <select id="section-select">
      <option value="center">Compte-tour</option>
      <option value="history">Historique</option>
      <option value="stats">Valeurs</option>
    </select>

    <!-- Section Historique -->
    <div id="section-history" class="section history" style="display:none;">
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

    <!-- Section Stats -->
    <div id="section-stats" class="section stats" style="display:none;">
      <h2>Valeurs du trajet</h2>
      <div id="stats">
        <p>Régime max : <span id="max-rpm">–</span> tr/min</p>
        <p>Régime moyen : <span id="avg-rpm">–</span> tr/min</p>
        <p>Vitesse max : <span id="max-speed">–</span> km/h</p>
        <p>Vitesse moyenne : <span id="avg-speed">–</span> km/h</p>
        <p>Distance parcourue : <span id="distance">–</span> km</p>
        <p>Changements de rapport : <span id="shift-count">0</span></p>
        <button id="reset-trip">Reset trajet</button>
      </div>
    </div>
  </div>

  <script>
    // RPM ranges per mode
    const rpmRanges = {
      normal: { min: 1100, max: 2200 },
      sport:  { min: 1800, max: 4000 }
    };
    let currentMode = 'normal';

    const btnNormal = document.getElementById('mode-normal');
    const btnSport  = document.getElementById('mode-sport');
    const modeLabelMin = document.getElementById('mode-label-min');
    const modeLabelMax = document.getElementById('mode-label-max');
    const minVal   = document.getElementById('min-rpm-val');
    const maxVal   = document.getElementById('max-rpm-val');

    function updateMode(mode) {
      currentMode = mode;
      // Visual state
      btnNormal.classList.toggle('active', mode==='normal');
      btnSport .classList.toggle('active', mode==='sport');
      // Update labels
      const text = mode.charAt(0).toUpperCase() + mode.slice(1);
      modeLabelMin.textContent = text;
      modeLabelMax.textContent = text;
      // Load values
      minVal.textContent = rpmRanges[mode].min;
      maxVal.textContent = rpmRanges[mode].max;
    }
    btnNormal.onclick = () => updateMode('normal');
    btnSport.onclick  = () => updateMode('sport');

    document.getElementById('min-rpm-increase').onclick = () => { rpmRanges[currentMode].min += 100; updateMode(currentMode); };
    document.getElementById('min-rpm-decrease').onclick = () => { rpmRanges[currentMode].min = Math.max(0, rpmRanges[currentMode].min - 100); updateMode(currentMode); };
    document.getElementById('max-rpm-increase').onclick = () => { rpmRanges[currentMode].max += 100; updateMode(currentMode); };
    document.getElementById('max-rpm-decrease').onclick = () => { rpmRanges[currentMode].max = Math.max(rpmRanges[currentMode].min, rpmRanges[currentMode].max - 100); updateMode(currentMode); };

    // Section navigation
    const selector = document.getElementById('section-select');
    const secs = {
      center:  document.getElementById('section-center'),
      history: document.getElementById('section-history'),
      stats:   document.getElementById('section-stats')
    };
    selector.onchange = () => {
      Object.values(secs).forEach(s => s.style.display = 'none');
      secs[selector.value].style.display = 'block';
    };
    // Initial display
    secs.center.style.display = 'block';
    updateMode('normal');
  </script>
</body>
</html>
