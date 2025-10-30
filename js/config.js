
const SCALES = {
  'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
  'Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const AUDIO_CONSTANTS = {
  MIN_AMP: 0.15,
  AMP_MULTIPLIER: 0.05,
  MAX_AMP: 0.3,
  WALL_RELEASE: 0.5,
  SPHERE_RELEASE: 0.2,
  WALL_OCTAVE_OFFSET: -24,
  REPEL_OCTAVE_OFFSET: -12,
  VELOCITY_TO_NOTE_SCALE: 2,
  MAX_NOTE_RANGE: 24
};

let config = {
  sphereCount: 10,
  forceStrength: 50,
  maxDistance: 15,
  minFlipTime: 2000,
  maxFlipTime: 8000,
  sphereRadius: 0.5,
  cubeSize: 20,
  currentScale: 'Pentatonic Major',
  rootNote: 60
};

export { SCALES, AUDIO_CONSTANTS, config }
