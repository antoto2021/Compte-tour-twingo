// --- CONSTANTES & CONFIG ---
const DEFAULT_RATIOS = { 1: 7.45, 2: 13.45, 3: 18.97, 4: 24.35, 5: 30.55, 6: 36.08 };
const MIN_RPM = 1500;
const MAX_RPM = 3000;
const MAX_GAUGE_RPM = 7000;
const CIRCUMFERENCE = 2 * Math.PI * 120; // r=120 dans le SVG

// --- STATE ---
let state = {
    speed: 0,
    rpm: 0,
    gear: 1,
    gpsActive: false,
    isRecording: false,
    tripData: [],
    ratios: { ...DEFAULT_RATIOS },
    wakeLock: null,
    lastRecordTime: 0
};

// --- DOM ELEMENTS ---
const els = {
    rpmCircle: document.getElementById('rpm-circle'),
    rpmValue: document.getElementById('rpm-value'),
    speedValue: document.getElementById('speed-value'),
    gearValue: document.getElementById('gear-value'),
    gpsDot: document.getElementById('gps-status-dot'),
    gpsText: document.getElementById('gps-status-text'),
    recordBtn: document.getElementById('btn-record'),
    pointsCount: document.getElementById('points-count'),
    historyList: document.getElementById('history-list'),
    wakeLockBtn: document.getElementById('btn-wakelock'),
    ratiosInputs: document.getElementById('ratios-inputs')
};

// --- INITIALISATION ---
function init() {
    // Charger LocalStorage
    const savedRatios = localStorage.getItem('twingo_ratios');
    if (savedRatios) state.ratios = JSON.parse(savedRatios);
    
    const savedHistory = localStorage.getItem('twingo_trip_history');
    if (savedHistory) state.tripData = JSON.parse(savedHistory);

    // Initialiser UI
    renderSettingsInputs();
    updateDashboard();
    renderHistory();
    lucide.createIcons();

    // Démarrer GPS
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
        });
    } else {
        alert("Géolocalisation non supportée par ce navigateur.");
    }
}

// --- LOGIQUE METIER ---
function handleGpsSuccess(pos) {
    if (!state.gpsActive) {
        state.gpsActive = true;
        updateGpsStatus(true);
    }

    let speedMs = pos.coords.speed;
    if (speedMs === null || speedMs < 0) speedMs = 0;
    const speedKmh = speedMs * 3.6;

    state.speed = speedKmh;
    state.gear = determineGear(speedKmh);
    state.rpm = Math.round((speedKmh * 1000) / state.ratios[state.gear]);

    // Enregistrement
    if (state.isRecording) {
        const now = Date.now();
        if (now - state.lastRecordTime > 1000) { // Max 1 point / sec
            const point = {
                id: now,
                time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
                speed: Math.round(state.speed),
                rpm: state.rpm,
                gear: state.gear,
                lat: pos.coords.latitude.toFixed(5),
                lon: pos.coords.longitude.toFixed(5)
            };
            state.tripData.unshift(point); // Ajout au début
            state.lastRecordTime = now;
            localStorage.setItem('twingo_trip_history', JSON.stringify(state.tripData));
            
            // Mise à jour partielle pour perf
            els.pointsCount.textContent = state.tripData.length;
            if (!document.getElementById('view-history').classList.contains('hidden')) {
                renderHistory();
            }
        }
    }

    updateDashboard();
}

function handleGpsError(err) {
    console.error(err);
    state.gpsActive = false;
    updateGpsStatus(false);
}

function determineGear(speed) {
    if (speed < 5) return 1;
    let bestGear = 1;
    let bestScore = Infinity;

    for (let g = 1; g <= 6; g++) {
        const calculatedRpm = (speed * 1000) / state.ratios[g];
        if (calculatedRpm >= MIN_RPM && calculatedRpm <= MAX_RPM) return g;
        
        const score = Math.min(Math.abs(calculatedRpm - MIN_RPM), Math.abs(calculatedRpm - MAX_RPM));
        if (score < bestScore) {
            bestScore = score;
            bestGear = g;
        }
    }
    return bestGear;
}

// --- UI UPDATES ---
function updateDashboard() {
    // Speed & Gear
    els.speedValue.textContent = Math.round(state.speed);
    els.gearValue.textContent = state.gear;
    els.rpmValue.textContent = state.rpm;

    // Gauge Color logic
    let colorClass = 'text-emerald-400';
    if (state.rpm > 3500) colorClass = 'text-blue-400';
    if (state.rpm > 5000) colorClass = 'text-orange-400';
    if (state.rpm > 6200) colorClass = 'text-red-500';

    els.rpmValue.className = `text-7xl font-bold tracking-tighter tabular-nums transition-colors duration-300 ${colorClass}`;
    els.rpmCircle.setAttribute('class', `gauge-circle transition-all duration-300 ${colorClass}`);

    // Gauge Progress
    const progress = Math.min(state.rpm / MAX_GAUGE_RPM, 1);
    const offset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);
    els.rpmCircle.style.strokeDashoffset = offset;
    
    els.pointsCount.textContent = state.tripData.length;
}

function updateGpsStatus(active) {
    if (active) {
        els.gpsDot.className = "w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#22c55e] transition-colors duration-500";
        els.gpsText.textContent = "GPS CONNECTÉ";
        els.gpsText.className = "text-xs font-bold tracking-widest text-emerald-400 uppercase";
    } else {
        els.gpsDot.className = "w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-colors duration-500 animate-pulse";
        els.gpsText.textContent = "RECHERCHE GPS...";
        els.gpsText.className = "text-xs font-bold tracking-widest text-red-400 uppercase";
    }
}

function renderHistory() {
    if (state.tripData.length === 0) {
        els.historyList.innerHTML = `
            <div class="text-center py-20 text-slate-600">
                <i data-lucide="activity" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                <p class="text-sm">Aucune donnée.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    const html = state.tripData.map(pt => `
        <div class="grid grid-cols-4 gap-2 py-3 px-2 bg-white/5 rounded-xl text-sm text-center items-center hover:bg-white/10 transition-colors border border-white/5">
            <div class="text-slate-300 font-mono text-xs">${pt.time}</div>
            <div class="font-bold text-white">${pt.speed}</div>
            <div class="font-medium ${pt.rpm > 4000 ? 'text-orange-400' : 'text-emerald-400'}">${pt.rpm}</div>
            <div class="text-slate-400 font-bold">${pt.gear}</div>
        </div>
    `).join('');
    
    els.historyList.innerHTML = html;
}

function renderSettingsInputs() {
    let html = '';
    for (let g = 1; g <= 6; g++) {
        html += `
            <div class="space-y-1">
                <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">Rapport ${g}</label>
                <input type="number" step="0.01" value="${state.ratios[g]}" 
                    onchange="updateRatio(${g}, this.value)"
                    class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono">
            </div>`;
    }
    els.ratiosInputs.innerHTML = html;
}

// --- ACTIONS UTILISATEUR ---

function toggleRecording() {
    state.isRecording = !state.isRecording;
    const btn = els.recordBtn;
    if (state.isRecording) {
        btn.className = "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95 animate-pulse";
        btn.innerHTML = `<i data-lucide="square" class="w-4 h-4 fill-current"></i><span>STOP</span>`;
    } else {
        btn.className = "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95";
        btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>REC</span>`;
    }
    lucide.createIcons();
}

function switchTab(tab) {
    const dashView = document.getElementById('view-dashboard');
    const histView = document.getElementById('view-history');
    const navDash = document.getElementById('nav-dash');
    const navHist = document.getElementById('nav-hist');

    if (tab === 'dashboard') {
        dashView.classList.remove('hidden');
        histView.classList.add('hidden');
        
        navDash.className = "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all bg-white text-black shadow-lg";
        navHist.className = "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all text-slate-400 hover:text-white";
    } else {
        dashView.classList.add('hidden');
        histView.classList.remove('hidden');
        renderHistory(); // Refresh list

        navDash.className = "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all text-slate-400 hover:text-white";
        navHist.className = "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all bg-white text-black shadow-lg";
    }
}

async function toggleWakeLock() {
    const btn = els.wakeLockBtn;
    if (state.wakeLock) {
        await state.wakeLock.release();
        state.wakeLock = null;
        btn.className = "w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent";
        btn.innerHTML = `<i data-lucide="unlock" class="w-4 h-4"></i><span>Activer Mode Conduite</span>`;
    } else {
        try {
            state.wakeLock = await navigator.wakeLock.request('screen');
            btn.className = "w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
            btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i><span>Mode Conduite Actif (Écran ON)</span>`;
            
            state.wakeLock.addEventListener('release', () => {
                state.wakeLock = null;
                toggleWakeLock(); // Reset UI logic
            });
        } catch (err) {
            console.error(err);
            alert("Le mode 'écran toujours allumé' n'est pas supporté ou a été refusé.");
        }
    }
    lucide.createIcons();
}

function toggleSettings(show) {
    const modal = document.getElementById('settings-modal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function updateRatio(gear, val) {
    state.ratios[gear] = parseFloat(val) || 0;
    localStorage.setItem('twingo_ratios', JSON.stringify(state.ratios));
}

function resetRatios() {
    state.ratios = { ...DEFAULT_RATIOS };
    localStorage.setItem('twingo_ratios', JSON.stringify(state.ratios));
    renderSettingsInputs();
}

function clearHistory() {
    if (confirm("Supprimer tout l'historique ?")) {
        state.tripData = [];
        localStorage.setItem('twingo_trip_history', JSON.stringify([]));
        renderHistory();
        els.pointsCount.textContent = 0;
    }
}

function exportCSV() {
    if (state.tripData.length === 0) return alert("Rien à exporter !");
    
    const headers = ["Heure", "Vitesse (km/h)", "RPM", "Rapport", "Latitude", "Longitude"];
    const rows = state.tripData.map(row => 
        [row.time, row.speed, row.rpm, row.gear, row.lat, row.lon].join(";")
    );
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(";") + "\n" 
        + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trajet_twingo_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================================
//          GESTION DES MISES À JOUR (GITHUB API)
// ============================================================

// 1. CONFIGURATION (A REMPLACER PAR TES INFOS)
const GITHUB_CONFIG = { 
    username: 'antoto2021',
    repo: 'Appli-Compte-tour-twingo'
};

const STORAGE_KEY_HASH = 'twingo_version_hash';
const STORAGE_KEY_TIME = 'twingo_update_timestamp';

// 2. FONCTION : Récupérer le dernier commit sur GitHub
async function fetchLatestCommit() {
    try {
        // Ajout d'un timestamp pour éviter le cache navigateur
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/commits?per_page=1&t=${Date.now()}`;
        const r = await fetch(url);
        
        if (r.status === 404) return 'repo_not_found';
        if (!r.ok) throw new Error("Erreur réseau GitHub");
        
        const d = await r.json();
        return d[0]; 
    } catch (e) {
        console.warn("GitHub inaccessible (Hors ligne ?)", e);
        return null;
    }
}

// 3. FONCTION : Vérifier les mises à jour
async function checkGitHubUpdates(isBackgroundCheck = false) {
    const remoteEl = document.getElementById('info-remote-version');
    const statusDot = document.getElementById('connection-status');
    const btn = document.getElementById('btn-update-check');

    // UI : Chargement
    if (!isBackgroundCheck) {
        if(remoteEl) remoteEl.innerText = "Connexion...";
        if(statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse";
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Recherche...</span>`;
            lucide.createIcons();
        }
    }

    const commit = await fetchLatestCommit();

    // UI : Reset Bouton
    if (!isBackgroundCheck && btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Rechercher une mise à jour</span>`;
        lucide.createIcons();
    }

    // Erreurs
    if (commit === 'repo_not_found') {
        if (!isBackgroundCheck) alert("Erreur : Repo GitHub introuvable.");
        if (statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
        return;
    }
    if (!commit) {
        if (!isBackgroundCheck) {
            if(remoteEl) remoteEl.innerText = "Hors ligne";
            if(statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-slate-600";
        }
        return;
    }

    // Succès
    const remoteHash = commit.sha;
    const localHash = localStorage.getItem(STORAGE_KEY_HASH);

    if(remoteEl) remoteEl.innerText = `Commit: ${remoteHash.substring(0, 7)}`;
    if(statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";

    // Premier lancement
    if (!localHash) {
        localStorage.setItem(STORAGE_KEY_HASH, remoteHash);
        localStorage.setItem(STORAGE_KEY_TIME, Date.now());
        updateLocalInfoDisplay();
    } 
    // Mise à jour dispo
    else if (localHash !== remoteHash) {
        const alertBox = document.getElementById('updateAlert');
        alertBox.classList.remove('hidden');
        alertBox.classList.add('flex');
        
        if(remoteEl) remoteEl.innerHTML = `${remoteHash.substring(0, 7)} <span class="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1">NEW</span>`;
    } else {
        if (!isBackgroundCheck) alert("TwingoDash est à jour !");
    }
}

// 4. FONCTION : Forcer la mise à jour
function forceUpdate() {
    const btn = document.getElementById('refreshBtn');
    if(btn) {
        btn.innerHTML = "CHARGEMENT...";
        btn.classList.add('rotating'); 
    }

    fetchLatestCommit().then(commit => {
        if (commit && typeof commit === 'object') {
            localStorage.setItem(STORAGE_KEY_HASH, commit.sha);
            localStorage.setItem(STORAGE_KEY_TIME, Date.now());
        }
        // Force le rechargement serveur (ignorer cache)
        window.location.reload(true);
    });
}

// 5. FONCTION : Affichage infos locales
function updateLocalInfoDisplay() {
    const localHash = localStorage.getItem(STORAGE_KEY_HASH);
    const localTime = localStorage.getItem(STORAGE_KEY_TIME);
    
    const elVer = document.getElementById('info-app-version');
    const elTime = document.getElementById('info-local-time');

    if(elVer) elVer.innerText = localHash ? localHash.substring(0, 7) : 'Non installé';
    
    if (elTime && localTime) {
        const date = new Date(parseInt(localTime));
        elTime.innerText = date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }
}

// 6. FONCTION : BOUTON NAVIGATION (RAFRAÎCHIR)
async function handleBottomNavRefresh() {
    const icon = document.getElementById('nav-refresh-icon');
    
    // 1. Activer l'animation de rotation
    icon.classList.add('rotating'); // Utilise la classe CSS définie précédemment

    // 2. Vérifier les mises à jour GitHub (mode background = true pour ne pas afficher de popup "à jour")
    // On attend la réponse de GitHub...
    await checkGitHubUpdates(true);

    // 3. Vérifier si la bannière de mise à jour est apparue
    const alertBox = document.getElementById('updateAlert');
    const updateFound = alertBox && !alertBox.classList.contains('hidden');

    if (updateFound) {
        // CAS A : Une mise à jour est dispo
        // On arrête l'animation et on NE recharge PAS la page 
        // (pour laisser l'utilisateur cliquer sur "INSTALLER" dans la bannière)
        icon.classList.remove('rotating');
        
        // Petit effet visuel pour attirer l'attention sur la bannière
        alertBox.classList.add('animate-pulse');
        setTimeout(() => alertBox.classList.remove('animate-pulse'), 1000);
        
    } else {
        // CAS B : Pas de mise à jour
        // On recharge la page pour rafraîchir les données (API, cache, etc.)
        window.location.reload();
    }
}


// Gestion des Modales (Overlay)
window.closeInfoModal = function() {
    document.getElementById('info-modal-overlay').classList.add('hidden');
    // Rouvrir les réglages si on veut revenir en arrière
    toggleSettings(true);
};

window.openInfoModal = function() {
    // Fermer les réglages d'abord
    toggleSettings(false);
    
    document.getElementById('info-modal-overlay').classList.remove('hidden');
    updateLocalInfoDisplay();
    checkGitHubUpdates(false); // Check manuel
    lucide.createIcons();
};

// Vérification auto au démarrage (après 2s)
window.addEventListener('load', () => {
    updateLocalInfoDisplay();
    setTimeout(() => checkGitHubUpdates(true), 2000);
});

// Exposer pour le HTML
window.checkGitHubUpdates = checkGitHubUpdates;
window.forceUpdate = forceUpdate;

// Boot
window.addEventListener('DOMContentLoaded', init);
