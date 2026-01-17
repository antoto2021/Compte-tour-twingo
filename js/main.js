// POINT D'ENTRÉE PRINCIPAL
import { state, setState, loadSavedState } from './state.js';
import { SMOOTHING_FACTOR, DEFAULT_RATIOS } from './config.js';
import { determineGear, calculateRpm, updateDrivingMode } from './logic.js';
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
    // 1. Activation initiale du statut GPS
    if (!state.gpsActive) {
        setState('gpsActive', true);
        updateGpsStatus(true);
    }

    // 2. Récupération des données brutes
    let speedMs = pos.coords.speed;
    if (speedMs === null || speedMs < 0) speedMs = 0;
    const rawKmh = speedMs * 3.6;
    
    // IMPORTANT : On capture l'heure actuelle pour le calcul d'accélération et l'enregistrement
    const now = Date.now(); 

    // 3. Lissage de la vitesse (éviter les sauts)
    if (state.speed === 0 || Math.abs(state.speed - rawKmh) > 20) {
        // Si c'est le début ou s'il y a un écart énorme (tunnel sortie), on prend la valeur brute
        state.speed = rawKmh;
    } else {
        // Sinon moyenne pondérée
        state.speed = (rawKmh * SMOOTHING_FACTOR) + (state.speed * (1 - SMOOTHING_FACTOR));
    }

    // 4. MISE À JOUR DU MODE DE CONDUITE (ECO vs SPORT)
    // C'est ici qu'on vérifie l'accélération grâce au temps 'now'
    updateDrivingMode(state.speed, now);

    // 5. Calcul du Rapport et RPM
    if (state.speed < 3) {
        // --- CAS 1 : ARRÊT / RALENTI ---
        state.gear = 'N';
        
        // Simulation d'un ralenti vivant (oscillation autour de 800tr/min)
        const idleBase = 800;
        const variation = Math.floor(Math.random() * 40) - 20;
        state.rpm = idleBase + variation;

    } else {
        // --- CAS 2 : ROULAGE ---
        // determineGear utilise maintenant le mode (Eco/Sport) mis à jour juste avant
        state.gear = determineGear(state.speed);
        state.rpm = calculateRpm(state.speed, state.gear);
        
        // Sécurité visuelle : ne pas descendre sous 800tr/min si on roule
        if (state.rpm < 800) state.rpm = 800 + (Math.floor(Math.random() * 20));
    }

        // 6. LOGIQUE D'ENREGISTREMENT (CORRIGÉE)
    if (state.isRecording) {
        // Calcul du temps écoulé depuis la dernière mise à jour GPS
        const timeDelta = now - state.lastGpsTime; // en ms
        
        // On accepte un délai max de 2 secondes entre deux points pour éviter les bugs
        if (timeDelta > 0 && timeDelta < 2000) {
            // Distance (mètres) = Vitesse (m/s) * Temps (secondes)
            // state.speed est en km/h -> diviser par 3.6 pour m/s
            const speedMs = state.speed / 3.6;
            const distSeg = speedMs * (timeDelta / 1000);
            
            // On ajoute à la distance totale
            state.currentTrip.distanceMeters += distSeg;
        }

        // MISE À JOUR VISUELLE IMMÉDIATE
        const distKm = (state.currentTrip.distanceMeters / 1000).toFixed(2);
        els.pointsCount.textContent = distKm + " km";
    }

    // On met à jour le temps GPS pour le prochain calcul
    state.lastGpsTime = now;

    // 7. Mise à jour finale
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
        // --- DÉMARRAGE ENREGISTREMENT ---
        btn.className = "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95 animate-pulse";
        btn.innerHTML = `<i data-lucide="square" class="w-4 h-4 fill-current"></i><span>STOP</span>`;
        
        // Init nouveau trajet
        state.currentTrip = {
            startTime: Date.now(),
            distanceMeters: 0,
            startCoords: null // Optionnel
        };
        els.pointsCount.textContent = "0.00 km";

    } else {
        // --- ARRÊT ENREGISTREMENT & SAUVEGARDE ---
        btn.className = "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95";
        btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>REC</span>`;
        
        // Finalisation du trajet
        const endTime = Date.now();
        const duration = endTime - state.currentTrip.startTime;
        
        // On ne sauvegarde que si le trajet fait plus de 10 mètres ou 10 secondes (anti faux-clic)
        if (state.currentTrip.distanceMeters > 10 || duration > 10000) {
            
            // Calcul Vitesse Moyenne : V = D / T
            // D en km, T en heures
            const distKm = state.currentTrip.distanceMeters / 1000;
            const hours = duration / 1000 / 3600;
            const avgSpeed = hours > 0 ? Math.round(distKm / hours) : 0;

            const newTrip = {
                id: endTime,
                date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                startTimeStr: new Date(state.currentTrip.startTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                duration: duration, // en ms
                distance: state.currentTrip.distanceMeters, // en m
                avgSpeed: avgSpeed // km/h
            };

            state.tripData.unshift(newTrip);
            localStorage.setItem('twingo_trips_log', JSON.stringify(state.tripData));
            
            if (!document.getElementById('view-history').classList.contains('hidden')) {
                renderHistory();
            }
        }
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
    if (confirm("Supprimer tout l'historique des trajets ?")) {
        state.tripData = [];
        localStorage.setItem('twingo_trips_log', JSON.stringify([])); // Nouvelle clé
        renderHistory();
        els.pointsCount.textContent = "0";
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
