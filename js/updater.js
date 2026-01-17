// GESTION DES MISES À JOUR
import { GITHUB_CONFIG, STORAGE_KEY_HASH, STORAGE_KEY_TIME } from './config.js';
import { updateLocalInfoDisplay } from './ui.js';

export async function fetchLatestCommit() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/commits?per_page=1&t=${Date.now()}`;
        const r = await fetch(url);
        if (r.status === 404) return 'repo_not_found';
        if (!r.ok) throw new Error("Erreur réseau GitHub");
        const d = await r.json();
        return d[0]; 
    } catch (e) {
        console.warn("GitHub inaccessible", e);
        return null;
    }
}

export async function checkGitHubUpdates(isBackgroundCheck = false) {
    const remoteEl = document.getElementById('info-remote-version');
    const statusDot = document.getElementById('connection-status');
    const btn = document.getElementById('btn-update-check');

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

    if (!isBackgroundCheck && btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Rechercher une mise à jour</span>`;
        lucide.createIcons();
    }

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

    const remoteHash = commit.sha;
    const localHash = localStorage.getItem(STORAGE_KEY_HASH);

    if(remoteEl) remoteEl.innerText = `Commit: ${remoteHash.substring(0, 7)}`;
    if(statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";

    if (!localHash) {
        localStorage.setItem(STORAGE_KEY_HASH, remoteHash);
        localStorage.setItem(STORAGE_KEY_TIME, Date.now());
        updateLocalInfoDisplay();
    } 
    else if (localHash !== remoteHash) {
        const alertBox = document.getElementById('updateAlert');
        alertBox.classList.remove('hidden');
        alertBox.classList.add('flex');
        
        if(remoteEl) remoteEl.innerHTML = `${remoteHash.substring(0, 7)} <span class="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1">NEW</span>`;
    } else {
        if (!isBackgroundCheck) alert("TwingoDash est à jour !");
    }
}

export function forceUpdate() {
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
        window.location.reload(true);
    });
}
