// js/state.js
import { DEFAULT_RATIOS } from './config.js';

export let state = {
    speed: 0,
    prevSpeed: 0,
    acceleration: 0,
    mode: 'ECO',
    sportModeTimer: 0,
    
    rpm: 0,
    gear: 1,
    gpsActive: false,
    
    // NOUVEAU : Gestion de l'enregistrement de Trajet
    isRecording: false,
    currentTrip: {
        startTime: 0,
        distanceMeters: 0,
        speedSum: 0, // Pour calculer la moyenne (ou on fera dist/temps)
        samples: 0
    },
    
    tripData: [], // Contiendra maintenant la liste des TRAJETS finis, pas les points
    ratios: { ...DEFAULT_RATIOS },
    wakeLock: null,
    lastRecordTime: 0, // Ne sert plus qu'à l'affichage compteur temps réel si besoin
    lastGpsTime: 0
};

export function setState(key, value) {
    state[key] = value;
}

export function loadSavedState() {
    const savedRatios = localStorage.getItem('twingo_ratios');
    if (savedRatios) state.ratios = JSON.parse(savedRatios);
    
    const savedHistory = localStorage.getItem('twingo_trips_log'); // Changement de nom pour éviter conflit
    if (savedHistory) state.tripData = JSON.parse(savedHistory);
}
