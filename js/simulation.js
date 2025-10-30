import { loadExternalLibrary } from "./utils.js";
import { Sphere } from "./sphere.js";
import { AudioInterface } from "./audio_interface.js";

// Load libraries
async function loadLibraries() {
  if (!window.THREE) {
    await loadExternalLibrary('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
  }

  if (!window.CANNON) {
    await loadExternalLibrary('https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js');
  }

  if (!window.THREE.OrbitControls) {
    await loadExternalLibrary('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
  }
}

class Simulation {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.isPlaying = false;
    this.spheres = [];
    this.audioInterface = new AudioInterface();
  }

  async init() {
    await loadLibraries();

    const THREE = window.THREE;
    const CANNON = window.CANNON;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(25, 25, 25);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 10);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x4488ff, 0.3);
    directionalLight2.position.set(-10, -10, -5);
    this.scene.add(directionalLight2);

    // Physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, 0)
    });
    this.world.defaultContactMaterial.restitution = 0.8;

    // Glass-like cube container
    const cubeSize = this.config.cubeSize;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.1,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      envMapIntensity: 1,
      side: THREE.BackSide
    });
    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.scene.add(cubeMesh);

    // Cube edges
    const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3
    });
    const cubeEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.scene.add(cubeEdges);

    // Create cube walls for physics
    const halfExtents = cubeSize / 2;
    const wallThickness = 0.1;
    const walls = [
      { pos: [0, halfExtents, 0], rot: [0, 0, 0] },
      { pos: [0, -halfExtents, 0], rot: [0, 0, 0] },
      { pos: [halfExtents, 0, 0], rot: [0, 0, Math.PI / 2] },
      { pos: [-halfExtents, 0, 0], rot: [0, 0, Math.PI / 2] },
      { pos: [0, 0, halfExtents], rot: [Math.PI / 2, 0, 0] },
      { pos: [0, 0, -halfExtents], rot: [Math.PI / 2, 0, 0] }
    ];

    const wallShape = new CANNON.Box(new CANNON.Vec3(cubeSize / 2, wallThickness, cubeSize / 2));
    walls.forEach(wall => {
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(wall.pos[0], wall.pos[1], wall.pos[2])
      });
      wallBody.quaternion.setFromEuler(wall.rot[0], wall.rot[1], wall.rot[2]);
      this.world.addBody(wallBody);
    });

    // Create spheres
    this.createSpheres();

    // Handle resize
    this.handleResize = () => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.handleResize);

    // Start animation
    this.animate();
  }

  createSpheres() {
    this.spheres.forEach(s => s.cleanup(this.world, this.scene));
    this.spheres = [];

    for (let i = 0; i < this.config.sphereCount; i++) {
      const isAttract = i < this.config.sphereCount / 2;
      this.spheres.push(new Sphere(this.world, this.scene, this.config.sphereRadius, isAttract, this.config, this.audioInterface));
    }
  }

  applyForces() {
    for (let i = 0; i < this.spheres.length; i++) {
      for (let j = i + 1; j < this.spheres.length; j++) {
        const s1 = this.spheres[i];
        const s2 = this.spheres[j];

        const diff = s2.body.position.vsub(s1.body.position);
        const distance = diff.length();

        if (distance > this.config.maxDistance) continue;
        if (distance < 0.01) continue;

        const forceMagnitude = this.config.forceStrength / (distance * distance);
        const forceDir = diff.unit();

        const s1Force = s1.isAttract ? 1 : -1;
        const s2Force = s2.isAttract ? 1 : -1;
        const combinedForce = s1Force * s2Force;

        const force = forceDir.scale(forceMagnitude * combinedForce);

        s1.body.applyForce(force, s1.body.position);
        s2.body.applyForce(force.negate(), s2.body.position);
      }
    }
  }

  animate() {
    if (!this.lastTime) this.lastTime = performance.now();

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.isPlaying) {
      this.applyForces();
      this.world.step(1 / 60, deltaTime, 3);
      this.spheres.forEach(s => {
        s.update();
        s.updateFlipTimer(deltaTime);
      });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
  }

  reset() {
    this.createSpheres();
  }

  cleanup() {
    window.removeEventListener('resize', this.handleResize);
    this.spheres.forEach(s => s.cleanup(this.world, this.scene));
    this.renderer.dispose();
  }
}

export { Simulation };
