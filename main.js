/* ---------------- THREE.JS SETUP ---------------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------------- PARTICLES ---------------- */
const COUNT = 12000;
let geometry = new THREE.BufferGeometry();
let positions = new Float32Array(COUNT * 3);
let basePositions = new Float32Array(COUNT * 3);

function generateSphere() {
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.set([x, y, z], i * 3);
    basePositions.set([x, y, z], i * 3);
  }
}

generateSphere();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  size: 0.03,
  color: 0x00ffff,
  transparent: true,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

/* ---------------- UI ---------------- */
document.getElementById("colorPicker").oninput = e => {
  material.color.set(e.target.value);
};

document.getElementById("fullscreen").onclick = () => {
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.body.requestFullscreen();
};

/* ---------------- GESTURE HANDLING ---------------- */
let openness = 0; // 0 closed → 1 open

const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  if (!results.multiHandLandmarks) return;
  const lm = results.multiHandLandmarks[0];

  // Simple openness metric: distance index tip ↔ palm
  const tip = lm[8];
  const palm = lm[0];
  const dist = Math.hypot(tip.x - palm.x, tip.y - palm.y);
  openness = THREE.MathUtils.clamp(dist * 3, 0, 1);
});

const video = document.getElementById("video");
const cam = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480
});
cam.start();

/* ---------------- ANIMATION LOOP ---------------- */
function animate() {
  requestAnimationFrame(animate);

  const scale = THREE.MathUtils.lerp(0.4, 2.2, openness);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = basePositions[i3]     * scale;
    positions[i3 + 1] = basePositions[i3 + 1] * scale;
    positions[i3 + 2] = basePositions[i3 + 2] * scale;
  }

  geometry.attributes.position.needsUpdate = true;
  particles.rotation.y += 0.002;

  renderer.render(scene, camera);
}

animate();
