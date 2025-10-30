import { getSynthDefHex } from '../dist/etc/synthdefs.js';

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

    await this.loadAllSynthDefs();
    this.setupReverb();

    this.initialised = true;
    console.log('[Audio] Initialized');
    return this.sonic;
  }

  async loadAllSynthDefs() {
    const synthNames = [
      'sonic-pi-beep', 'sonic-pi-tb303', 'sonic-pi-chiplead',
      'sonic-pi-dsaw', 'sonic-pi-dpulse', 'sonic-pi-bnoise',
      'sonic-pi-prophet', 'sonic-pi-fm', 'sonic-pi-tri',
      'sonic-pi-fx_reverb'
    ];

    synthNames.forEach(name => {
      const hex = getSynthDefHex(name);
      if (hex) {
        const bytes = this.hexToBytes(hex);
        this.sonic.send('/d_recv', bytes);
        console.log(`[Audio] Loaded ${name}`);
      }
    });
  }

  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  setupReverb() {
    this.sonic.send('/s_new', 'sonic-pi-fx_reverb', -1, 1, 0,
      'out_bus', 0,
      'room', 1,
      'amp', 0.4
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
