import { AUDIO_CONSTANTS, SCALES } from "./config.js";

// function debounce(func, wait) {
//   let timeout;
//   return function(...args) {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func.apply(this, args), wait);
//   };
// }


function debounce(simulation, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      simulation.createSpheres(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


function quantizeToScale(rawNote, config) {
  if (config.currentScale === 'No Scale') return rawNote;

  const scaleIntervals = SCALES[config.currentScale];
  const octave = Math.floor((rawNote - config.rootNote) / 12);
  const noteInOctave = (rawNote - config.rootNote) % 12;

  let closestInterval = scaleIntervals[0];
  let minDistance = Math.abs(noteInOctave - closestInterval);

  for (let i = 1; i < scaleIntervals.length; i++) {
    const interval = scaleIntervals[i];
    const distance = Math.abs(noteInOctave - interval);
    if (distance < minDistance) {
      minDistance = distance;
      closestInterval = interval;
    }
  }

  return config.rootNote + (octave * 12) + closestInterval;
}

function calculateCollisionNote(baseNote, velocity, config) {
  const rawNote = baseNote + Math.min(
    Math.floor(velocity * AUDIO_CONSTANTS.VELOCITY_TO_NOTE_SCALE),
    AUDIO_CONSTANTS.MAX_NOTE_RANGE
  );
  return quantizeToScale(rawNote, config);
}

function calculateCollisionAmp(velocity) {
  return Math.min(
    AUDIO_CONSTANTS.MIN_AMP + (velocity * AUDIO_CONSTANTS.AMP_MULTIPLIER),
    AUDIO_CONSTANTS.MAX_AMP
  );
}

async function loadExternalLibrary(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export { debounce, quantizeToScale, calculateCollisionAmp, calculateCollisionNote, loadExternalLibrary };
