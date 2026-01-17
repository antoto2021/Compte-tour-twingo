// CONFIGURATION ET CONSTANTES

export const DEFAULT_RATIOS = { 1: 7.45, 2: 13.45, 3: 18.97, 4: 24.35, 5: 30.55, 6: 36.08 };

// Configuration graphique
export const MAX_GAUGE_RPM = 7000;
export const CIRCUMFERENCE = 2 * Math.PI * 120; // r=120 dans le SVG

// Configuration Comportement
export const SMOOTHING_FACTOR = 0.2; // 0.1 = lent, 0.9 = rapide

// Plages de rapports personnalisées
export const GEAR_LIMITS = {
    1: { min: 0,    max: 2500 },
    2: { min: 1000, max: 3000 },
    3: { min: 1500, max: 3500 },
    4: { min: 1800, max: 4000 },
    5: { min: 2000, max: 8000 },
    6: { min: 2000, max: 8000 }
};

// Configuration GitHub
export const GITHUB_CONFIG = {
    username: 'antoto2021',
    repo: 'Appli-Compte-tour-twingo'
};

export const STORAGE_KEY_HASH = 'twingo_version_hash';
export const STORAGE_KEY_TIME = 'twingo_update_timestamp';
