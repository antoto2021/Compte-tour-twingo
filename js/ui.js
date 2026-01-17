// GESTION DE L'INTERFACE UTILISATEUR (UI)
import { state } from './state.js';
import { MAX_GAUGE_RPM, CIRCUMFERENCE } from './config.js';

// Cache des éléments DOM
export const els = {
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
    ratiosInputs: document.getElementById('ratios-inputs'),
    updateAlert: document.getElementById('updateAlert')
};

export function updateDashboard() {
    els.speedValue.textContent = Math.round(state.speed);
    els.gearValue.textContent = state.gear;
    els.rpmValue.textContent = state.rpm;

    // GESTION AFFICHAGE RAPPORT ET MODE
    // On affiche le rapport, et on peut colorer le "ESTIMÉ" selon le mode
    els.gearValue.textContent = state.gear;
    
    const labelEstimated = els.gearValue.parentElement.querySelector('.text-blue-500'); // Le petit texte "ESTIMÉ"
    
    if (state.mode === 'SPORT') {
        // En mode sport, on change le style
        if(labelEstimated) {
            labelEstimated.textContent = "SPORT";
            labelEstimated.className = "text-red-500 text-[10px] font-bold mt-1 animate-pulse";
        }
    } else {
        // En mode Eco
        if(labelEstimated) {
            labelEstimated.textContent = "ECO";
            labelEstimated.className = "text-emerald-500 text-[10px] font-bold mt-1";
        }
    }

    // Couleurs RPM
    let colorClass = 'text-emerald-400';
    if (state.rpm > 3500) colorClass = 'text-blue-400';
    if (state.rpm > 5000) colorClass = 'text-orange-400';
    if (state.rpm > 6200) colorClass = 'text-red-500';

    els.rpmValue.className = `text-7xl font-bold tracking-tighter tabular-nums transition-colors duration-300 ${colorClass}`;
    els.rpmCircle.setAttribute('class', `gauge-circle transition-all duration-300 ${colorClass}`);

    // Jauge Circulaire
    const progress = Math.min(state.rpm / MAX_GAUGE_RPM, 1);
    const offset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);
    els.rpmCircle.style.strokeDashoffset = offset;
    
    els.pointsCount.textContent = state.tripData.length;

    // Couleur du Neutre
    if (state.gear === 'N') {
        els.gearValue.classList.add('text-emerald-400');
        els.gearValue.classList.remove('text-white');
    } else {
        els.gearValue.classList.add('text-white');
        els.gearValue.classList.remove('text-emerald-400');
    }
}

export function updateGpsStatus(active) {
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

export function renderHistory() {
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

export function renderSettingsInputs() {
    let html = '';
    for (let g = 1; g <= 6; g++) {
        html += `
            <div class="space-y-1">
                <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">Rapport ${g}</label>
                <input type="number" step="0.01" value="${state.ratios[g]}" 
                    data-gear="${g}"
                    class="ratio-input w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono">
            </div>`;
    }
    // Note: l'ajout du bouton "Update" et "Reset" est déjà dans le HTML statique, 
    // ou généré ici si vous préférez. Ici on injecte juste les inputs.
    els.ratiosInputs.innerHTML = html;
}

export function updateLocalInfoDisplay() {
    const STORAGE_KEY_HASH = 'twingo_version_hash';
    const STORAGE_KEY_TIME = 'twingo_update_timestamp';
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
