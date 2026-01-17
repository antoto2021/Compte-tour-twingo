// ÉTAT DE L'APPLICATION (STATE)
import { DEFAULT_RATIOS } from './config.js';

export let state = {
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

// Fonctions pour modifier le state proprement
export function setState(key, value) {
    state[key] = value;
}

// Recharger les ratios depuis le stockage
export function loadSavedState() {
    const savedRatios = localStorage.getItem('twingo_ratios');
    if (savedRatios) state.ratios = JSON.parse(savedRatios);
    
    const savedHistory = localStorage.getItem('twingo_trip_history');
    if (savedHistory) state.tripData = JSON.parse(savedHistory);
}
