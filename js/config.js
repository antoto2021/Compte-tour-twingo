// CONFIGURATION ET CONSTANTES

export const DEFAULT_RATIOS = { 1: 7.45, 2: 13.45, 3: 18.97, 4: 24.35, 5: 30.55, 6: 36.08 };

// Configuration graphique
export const MAX_GAUGE_RPM = 7000;
export const CIRCUMFERENCE = 2 * Math.PI * 120; // r=120 dans le SVG

// Configuration Comportement
export const SMOOTHING_FACTOR = 0.2; // 0.1 = lent, 0.9 = rapide

// SEUIL D'ACCÉLÉRATION (en km/h par seconde)
// Si la vitesse augmente de plus de 7 km/h en 1 seconde, on passe en SPORT
export const ACCELERATION_THRESHOLD = 7; 

// TEMPS DE MAINTIEN DU MODE SPORT (en ms)
// Une fois activé, le mode sport reste actif au moins 5 secondes
export const SPORT_MODE_DURATION = 5000;

// Profil ECO (Passage des vitesses tôt pour économiser)
export const GEAR_LIMITS_ECO = {
    1: { min: 0,    max: 2000 },
    2: { min: 1200, max: 2300 }, // Votre exemple
    3: { min: 1500, max: 2500 },
    4: { min: 1800, max: 2800 },
    5: { min: 2000, max: 8000 },
    6: { min: 2000, max: 8000 }
};

// Profil SPORT (On tire les rapports)
export const GEAR_LIMITS_SPORT = {
    1: { min: 0,    max: 3500 },
    2: { min: 1900, max: 4500 }, // Votre exemple
    3: { min: 2500, max: 5000 },
    4: { min: 3000, max: 5500 },
    5: { min: 3500, max: 8000 },
    6: { min: 3500, max: 8000 }
};

// Configuration GitHub
export const GITHUB_CONFIG = {
    username: 'antoto2021',
    repo: 'Appli-Compte-tour-twingo'
};

export const STORAGE_KEY_HASH = 'twingo_version_hash';
export const STORAGE_KEY_TIME = 'twingo_update_timestamp';
