// LOGIQUE MÉTIER (Calculs purs)
import { state } from './state.js';
import { GEAR_LIMITS } from './config.js';

export function determineGear(speed) {
    // Sécurité arrêt
    if (speed < 5) return 1;

    let validGears = [];

    for (let g = 1; g <= 6; g++) {
        const ratio = state.ratios[g];
        if (!ratio) continue;

        const testRpm = (speed * 1000) / ratio;
        const limits = GEAR_LIMITS[g];
        
        if (limits && testRpm >= limits.min && testRpm <= limits.max) {
            validGears.push(g);
        }
    }

    // Décision
    if (validGears.length === 0) return state.gear;
    if (validGears.length === 1) return validGears[0];
    if (validGears.includes(state.gear)) return state.gear; // Hystérésis
    
    return Math.max(...validGears);
}

export function calculateRpm(speed, gear) {
    const currentRatio = state.ratios[gear];
    if (currentRatio > 0) {
        return Math.round((speed * 1000) / currentRatio);
    }
    return 0;
}
