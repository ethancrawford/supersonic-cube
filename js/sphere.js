import { quantizeToScale, calculateCollisionNote, calculateCollisionAmp } from './utils.js';
import { AUDIO_CONSTANTS } from './config.js';

class Sphere {
  constructor(world, scene, radius, isAttract, config, audioInterface) {
    this.radius = radius;
    this.isAttract = isAttract;
    this.config = config;
    this.audioInterface = audioInterface;

    this.initPhysics(world, radius, config);
    this.initGraphics(scene, radius, isAttract);
    this.initFlipTimer();

  }

  initPhysics(world, radius, config) {
    const range = config.cubeSize / 2 - radius * 2;
    const randomPos = () => (Math.random() - 0.5) * 2 * range;
    const randomVel = () => (Math.random() - 0.5) * 4;

    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape,
      position: new CANNON.Vec3(randomPos(), randomPos(), randomPos()),
      velocity: new CANNON.Vec3(randomVel(), randomVel(), randomVel()),
      linearDamping: 0.01
    });

    this.body.addEventListener('collide', (e) => this.onCollision(e));
    world.addBody(this.body);
  }

  initGraphics(scene, radius, isAttract) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: isAttract ? 0xff4444 : 0x4444ff,
      metalness: 0.3,
      roughness: 0.4,
      emissive: isAttract ? 0x440000 : 0x000044,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    this.originalColor = this.mesh.material.color.clone();
    this.originalEmissive = this.mesh.material.emissive.clone();
  }

  initFlipTimer() {
    this.nextFlipTime = this.randomFlipDelay();
    this.flipTimer = 0;
  }

  randomFlipDelay() {
    const min = this.config.minFlipTime;
    const max = this.config.maxFlipTime;
    return min + Math.random() * (max - min);
  }

  updateFlipTimer(deltaTime) {
    this.flipTimer += deltaTime * 1000; // Convert to ms
    if (this.flipTimer >= this.nextFlipTime) {
      this.flip();
      this.flipTimer = 0;
      this.nextFlipTime = this.randomFlipDelay();
    }
  }

  flip() {
    this.isAttract = !this.isAttract;
    this.mesh.material.color.setHex(this.isAttract ? 0xff4444 : 0x4444ff);
    this.mesh.material.emissive.setHex(this.isAttract ? 0x440000 : 0x000044);
  }

  onCollision(event) {
    const velocity = Math.abs(event.contact.getImpactVelocityAlongNormal());
    const hitWall = event.body.mass === 0;

    this.flashCollision(velocity);
    this.playCollisionSound(velocity, hitWall);
  }

  playCollisionSound(velocity, hitWall) {
    const baseNote = hitWall
      ? this.config.rootNote + AUDIO_CONSTANTS.WALL_OCTAVE_OFFSET
      : this.isAttract
        ? this.config.rootNote
        : this.config.rootNote + AUDIO_CONSTANTS.REPEL_OCTAVE_OFFSET;

    const note = calculateCollisionNote(baseNote, velocity, this.config);
    const amp = calculateCollisionAmp(velocity);
    const pan = this.body.position.x / (this.config.cubeSize / 2);
    const release = hitWall ? AUDIO_CONSTANTS.WALL_RELEASE : AUDIO_CONSTANTS.SPHERE_RELEASE;
    const synth = this.getSynthType(hitWall);

    this.audioInterface.playCollisionSound({
      synth,
      note,
      amp,
      pan,
      release,
      isWall: hitWall,
      isAttract: this.isAttract,
      velocity
    });
  }

  getSynthType(hitWall) {
    if (hitWall) return 'sonic-pi-tri';
    return this.isAttract ? 'sonic-pi-beep' : 'sonic-pi-dsaw';
  }

  flashCollision(intensity) {
    const flashAmount = Math.min(intensity * 0.15, 0.8);
    this.mesh.material.color.lerp(new THREE.Color(0xffffff), flashAmount);
    this.mesh.material.emissiveIntensity = Math.min(0.3 + intensity * 0.1, 1.0);

    this.fadeToOriginalColor();
  }

  fadeToOriginalColor() {
    if (this.flashTimeout) clearTimeout(this.flashTimeout);

    const fadeSteps = 10;
    let currentStep = 0;

    const fade = () => {
      currentStep++;
      this.mesh.material.color.lerp(this.originalColor, 0.3);
      this.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        this.mesh.material.emissiveIntensity,
        0.3,
        0.3
      );

      if (currentStep < fadeSteps) {
        this.flashTimeout = setTimeout(fade, 50);
      }
    };

    this.flashTimeout = setTimeout(fade, 50);
  }

  update() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }

  cleanup(world, scene) {
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    world.removeBody(this.body);
    scene.remove(this.mesh);
  }
}

export { Sphere };
