import { debounce } from "./utils.js";

class ControlsInitialisation {
  constructor(config, simulation) {
    this.config = config;
    this.simulation = simulation;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle controls panel
    document.getElementById('toggleControls').addEventListener('click', () => {
      document.getElementById('controlsPanel').classList.toggle('hidden');
    });

    const updateSphereCount = (simulation) => { return debounce(simulation, 300)() };
    // Sphere count
    document.getElementById('sphereCount').addEventListener('input', (e) => {
      this.config.sphereCount = parseInt(e.target.value);
      document.getElementById('sphereCountValue').textContent = e.target.value;
      updateSphereCount(this.simulation);
    });

    // Force strength
    document.getElementById('forceStrength').addEventListener('input', (e) => {
      this.config.forceStrength = parseFloat(e.target.value);
      document.getElementById('forceStrengthValue').textContent = e.target.value;
    });

    // Max distance
    document.getElementById('maxDistance').addEventListener('input', (e) => {
      this.config.maxDistance = parseFloat(e.target.value);
      document.getElementById('maxDistanceValue').textContent = parseFloat(e.target.value).toFixed(1);
    });

    // Min flip time
    document.getElementById('minFlipTime').addEventListener('input', (e) => {
      this.config.minFlipTime = parseInt(e.target.value);
      document.getElementById('minFlipTimeValue').textContent = (parseInt(e.target.value) / 1000).toFixed(1);
    });

    // Max flip time
    document.getElementById('maxFlipTime').addEventListener('input', (e) => {
      this.config.maxFlipTime = parseInt(e.target.value);
      document.getElementById('maxFlipTimeValue').textContent = (parseInt(e.target.value) / 1000).toFixed(1);
    });

    const rootNoteSlider = document.getElementById('rootNote');
    const rootNoteValue = document.getElementById('rootNoteValue');
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const updateRootNote = () => {
      this.config.rootNote = parseInt(rootNoteSlider.value);
      const octave = Math.floor(this.config.rootNote / 12) - 1;
      const noteName = noteNames[this.config.rootNote % 12];
      rootNoteValue.textContent = `${noteName}${octave}`;
    };

    const scaleSelect = document.getElementById('scaleSelect');
    if (scaleSelect) {
      scaleSelect.addEventListener('change', (e) => {
        this.config.currentScale = e.target.value;
        console.log('[Audio] Scale changed to:', this.config.currentScale);
        if (e.target.value == 'No Scale') {
          /* config.rootNote = null; */
          document.getElementById('rootNote').disabled = true;
          document.getElementById('rootNoteValue').textContent = '-';
        } else {
          document.getElementById('rootNote').disabled = false;
          updateRootNote();
        }
      });
    }


    // Root note selection
    if (rootNoteSlider) {
      // MIDI note to name conversion

      rootNoteSlider.addEventListener('input', updateRootNote);
      updateRootNote(); // Initialize display
    }

    // Play/Pause
    document.getElementById('playPause').addEventListener('click', async () => {
      if (!this.simulation.audioInterface.initialised) {
        await this.simulation.audioInterface.init();
      }
      this.simulation.togglePlay();
      const isPlaying = this.simulation.isPlaying;
      document.getElementById('playPauseText').textContent = isPlaying ? 'Pause' : 'Play';
      document.getElementById('pauseIcon').classList.toggle('hidden', !isPlaying);
      document.getElementById('playIcon').classList.toggle('hidden', isPlaying);
    });

    // Reset
    document.getElementById('reset').addEventListener('click', () => {
      this.simulation.reset();
    });
  }
}

export { ControlsInitialisation };
