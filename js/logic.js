// LOGIQUE MÉTIER (Calculs purs)
import { state, setState } from './state.js';
// CORRECTION ICI : On n'importe plus GEAR_LIMITS, mais les versions ECO et SPORT
import { GEAR_LIMITS_ECO, GEAR_LIMITS_SPORT, ACCELERATION_THRESHOLD, SPORT_MODE_DURATION } from './config.js';

// Fonction principale pour mettre à jour le mode de conduite
export function updateDrivingMode(currentSpeed, now) {
    // Calcul du delta de temps en secondes
    const deltaTime = (now - state.lastGpsTime) / 1000;
    
    // On évite les divisions par zéro ou les temps trop longs (reprise après pause)
    if (deltaTime > 0 && deltaTime < 5) {
        // Accélération = (Vitesse actuelle - Vitesse précédente) / temps écoulé
        const accel = (currentSpeed - state.prevSpeed) / deltaTime;
        setState('acceleration', accel);

        // DÉTECTION MODE SPORT
        if (accel > ACCELERATION_THRESHOLD) {
            // Grosse accélération détectée !
            setState('mode', 'SPORT');
            setState('sportModeTimer', now + SPORT_MODE_DURATION); // On prolonge le timer
        }
    }

    // RETOUR EN MODE ECO
    // Si le timer est écoulé et qu'on n'accélère plus fort
    if (state.mode === 'SPORT' && now > state.sportModeTimer) {
        setState('mode', 'ECO');
    }

    // Mise à jour des variables pour le prochain tour
    setState('prevSpeed', currentSpeed);
    setState('lastGpsTime', now);
}

export function determineGear(speed) {
    // Sécurité arrêt
    if (speed < 5) return 1;

    // CHOIX DU PROFIL selon le mode actif
    const currentLimits = (state.mode === 'SPORT') ? GEAR_LIMITS_SPORT : GEAR_LIMITS_ECO;

    let validGears = [];

    for (let g = 1; g <= 6; g++) {
        const ratio = state.ratios[g];
        if (!ratio) continue;

        const testRpm = (speed * 1000) / ratio;
        
        // On utilise le profil sélectionné (currentLimits)
        const limits = currentLimits[g]; 
        
        if (limits && testRpm >= limits.min && testRpm <= limits.max) {
            validGears.push(g);
        }
    }

    // Décision
    if (validGears.length === 0) return state.gear;
    if (validGears.length === 1) return validGears[0];
    // Hystérésis : Si le rapport actuel fait partie des choix valides, on le garde
    if (validGears.includes(state.gear)) return state.gear; 
    
    return Math.max(...validGears);
}

export function calculateRpm(speed, gear) {
    const currentRatio = state.ratios[gear];
    if (currentRatio > 0) {
        return Math.round((speed * 1000) / currentRatio);
    }
    return 0;
}
