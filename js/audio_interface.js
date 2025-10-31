class AudioInterface {
  constructor() {
    this.sonic = null;
    this.initialised = false;
  }

  async init() {
    if (this.initialised) return this.sonic;

    const { SuperSonic } = await import('../dist/supersonic.js');

    this.sonic = new SuperSonic();
    await this.sonic.init();

    await this.sonic.loadSynthDefs(
      ["sonic-pi-beep", "sonic-pi-dsaw", "sonic-pi-tri", "sonic-pi-fx_reverb"],
      "../dist/etc/synthdefs/"
    );
    this.setupReverb();

    this.initialised = true;
    console.log('[Audio] Initialized');
    return this.sonic;
  }

  setupReverb() {
    this.sonic.send('/s_new', 'sonic-pi-fx_reverb', -1, 1, 0,
      'out_bus', 0,
      'room', 1,
      'amp', 0.3
    );
  }

  playCollisionSound(params) {
    if (!this.initialised) return;

    const { synth, note, amp, pan, release } = params;

    this.sonic.send('/s_new', synth, -1, 0, 0,
      'note', note,
      'amp', amp,
      'pan', pan,
      'attack', 0.01,
      'release', release
    );
  }
}

export { AudioInterface };
