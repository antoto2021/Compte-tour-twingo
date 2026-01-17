// POINT D'ENTRÉE PRINCIPAL
import { state, setState, loadSavedState } from './state.js';
import { SMOOTHING_FACTOR, DEFAULT_RATIOS } from './config.js';
import { determineGear, calculateRpm } from './logic.js';
import { els, updateDashboard, renderHistory, renderSettingsInputs, updateGpsStatus, updateLocalInfoDisplay } from './ui.js';
import { checkGitHubUpdates, forceUpdate } from './updater.js';

// --- INITIALISATION ---
function init() {
    loadSavedState();
    renderSettingsInputs();
    updateDashboard();
    renderHistory();
    lucide.createIcons();
    
    // Attacher les Events Listeners aux Inputs de Ratio générés dynamiquement
    document.querySelectorAll('.ratio-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const g = e.target.getAttribute('data-gear');
            updateRatio(g, e.target.value);
        });
    });

    updateLocalInfoDisplay();
    setTimeout(() => checkGitHubUpdates(true), 2000);

    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
        });
    } else {
        alert("Géolocalisation non supportée.");
    }
}

// --- LOGIQUE GPS ---
function handleGpsSuccess(pos) {
    if (!state.gpsActive) {
        setState('gpsActive', true);
        updateGpsStatus(true);
    }

    let speedMs = pos.coords.speed;
    if (speedMs === null || speedMs < 0) speedMs = 0;
    const rawKmh = speedMs * 3.6;

    // Lissage
    if (state.speed === 0 || Math.abs(state.speed - rawKmh) > 20) {
        state.speed = rawKmh;
    } else {
        state.speed = (rawKmh * SMOOTHING_FACTOR) + (state.speed * (1 - SMOOTHING_FACTOR));
    }

    // Ralenti vs Roulage
    if (state.speed < 3) {
        state.gear = 'N';
        const idleBase = 800;
        const variation = Math.floor(Math.random() * 40) - 20;
        state.rpm = idleBase + variation;
    } else {
        state.gear = determineGear(state.speed);
        state.rpm = calculateRpm(state.speed, state.gear);
        
        // Sécurité chute de régime
        if (state.rpm < 800) state.rpm = 800 + (Math.floor(Math.random() * 20));
    }

    // Enregistrement
    if (state.isRecording) {
        const now = Date.now();
        if (now - state.lastRecordTime > 1000) {
            const point = {
                id: now,
                time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
                speed: Math.round(state.speed),
                rpm: state.rpm,
                gear: state.gear,
                lat: pos.coords.latitude.toFixed(5),
                lon: pos.coords.longitude.toFixed(5)
            };
            state.tripData.unshift(point);
            state.lastRecordTime = now;
            localStorage.setItem('twingo_trip_history', JSON.stringify(state.tripData));
            
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
    setState('gpsActive', false);
    updateGpsStatus(false);
}

// --- ACTIONS GLOBALES (Attachées à window car appelées via onclick dans le HTML) ---

window.toggleRecording = function() {
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
};

window.switchTab = function(tab) {
    const dashView = document.getElementById('view-dashboard');
    const histView = document.getElementById('view-history');
    const navDash = document.getElementById('nav-dash');
    const navHist = document.getElementById('nav-hist');

    if (tab === 'dashboard') {
        dashView.classList.remove('hidden');
        histView.classList.add('hidden');
        navDash.className = "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all bg-white text-black shadow-lg";
        navHist.className = "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all text-slate-400 hover:text-white";
    } else {
        dashView.classList.add('hidden');
        histView.classList.remove('hidden');
        renderHistory();
        navDash.className = "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all text-slate-400 hover:text-white";
        navHist.className = "flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all bg-white text-black shadow-lg";
    }
};

window.toggleWakeLock = async function() {
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
                window.toggleWakeLock(); 
            });
        } catch (err) {
            console.error(err);
            alert("Mode 'écran toujours allumé' non supporté.");
        }
    }
    lucide.createIcons();
};

window.toggleSettings = function(show) {
    const modal = document.getElementById('settings-modal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
};

// Fonctions internes exposées à window pour les événements HTML
window.updateRatio = function(gear, val) {
    state.ratios[gear] = parseFloat(val) || 0;
    localStorage.setItem('twingo_ratios', JSON.stringify(state.ratios));
};

window.resetRatios = function() {
    state.ratios = { ...DEFAULT_RATIOS };
    localStorage.setItem('twingo_ratios', JSON.stringify(state.ratios));
    renderSettingsInputs();
    // Re-attacher les events car le HTML a changé
    document.querySelectorAll('.ratio-input').forEach(input => {
        input.addEventListener('change', (e) => window.updateRatio(e.target.getAttribute('data-gear'), e.target.value));
    });
};

window.clearHistory = function() {
    if (confirm("Supprimer tout l'historique ?")) {
        state.tripData = [];
        localStorage.setItem('twingo_trip_history', JSON.stringify([]));
        renderHistory();
        els.pointsCount.textContent = 0;
    }
};

window.exportCSV = function() {
    if (state.tripData.length === 0) return alert("Rien à exporter !");
    const headers = ["Heure", "Vitesse (km/h)", "RPM", "Rapport", "Latitude", "Longitude"];
    const rows = state.tripData.map(row => 
        [row.time, row.speed, row.rpm, row.gear, row.lat, row.lon].join(";")
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(";") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trajet_twingo_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Gestionnaires de mise à jour exposés
window.checkGitHubUpdates = checkGitHubUpdates;
window.forceUpdate = forceUpdate;
window.closeInfoModal = function() {
    document.getElementById('info-modal-overlay').classList.add('hidden');
    window.toggleSettings(true);
};
window.openInfoModal = function() {
    window.toggleSettings(false);
    document.getElementById('info-modal-overlay').classList.remove('hidden');
    updateLocalInfoDisplay();
    checkGitHubUpdates(false);
    lucide.createIcons();
};

window.handleBottomNavRefresh = async function() {
    const icon = document.getElementById('nav-refresh-icon');
    icon.classList.add('rotating');
    await checkGitHubUpdates(true);
    const alertBox = document.getElementById('updateAlert');
    const updateFound = alertBox && !alertBox.classList.contains('hidden');
    if (updateFound) {
        icon.classList.remove('rotating');
        alertBox.classList.add('animate-pulse');
        setTimeout(() => alertBox.classList.remove('animate-pulse'), 1000);
    } else {
        window.location.reload();
    }
};

// Lancement
window.addEventListener('DOMContentLoaded', init);
