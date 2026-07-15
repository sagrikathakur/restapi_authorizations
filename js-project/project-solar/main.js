import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================================================
// Simulation State
// ==========================================================================
let isPaused = false;
let speedMultiplier = 1.0;
let realisticLighting = true;
let showPaths = true;
let starFieldTwinkle = true;
let isAudioEnabled = false;

// Time tracking
let simYear = 0;
let simDay = 0;

// Camera Tracking
let focusedPlanet = null;
let isFocusMode = false;
let cameraTargetDistance = 30;

// Web Audio API Procedural Synth
let audioCtx = null;
let droneOsc = null;
let droneGain = null;
let lowpassFilter = null;

// ==========================================================================
// 3D Scene Setup
// ==========================================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(-60, 95, 180);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// Controls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.05;
orbit.maxDistance = 600;
orbit.minDistance = 8;

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// ==========================================================================
// Planet Metadata & Specifications
// ==========================================================================
const planetData = [
  {
    id: 'sun',
    name: 'Sun',
    subtitle: 'Sol',
    classification: 'Yellow Dwarf Star',
    size: 14.5,
    distance: 0,
    speed: 0,
    rotationSpeed: 0.002,
    texture: './assets/sun.jpeg',
    desc: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. It accounts for 99.86% of all mass in the solar system.',
    stats: {
      type: 'Star',
      radius: '696,340 km',
      mass: '333,000 Earths',
      temp: '5,500 °C (Surface)',
      period: '25-35 Days (Rotation)'
    },
    facts: [
      'Core temperature is approximately 15 million °C.',
      'Generates energy through nuclear fusion of Hydrogen into Helium.',
      'Light from the Sun takes 8 minutes and 19 seconds to reach Earth.'
    ]
  },
  {
    id: 'mercury',
    name: 'Mercury',
    subtitle: 'Hermes',
    classification: 'Terrestrial Planet',
    size: 2.1,
    distance: 28,
    speed: 0.03,
    rotationSpeed: 0.004,
    texture: './assets/mercury.jpeg',
    desc: 'Mercury is the smallest planet in our solar system and the nearest to the Sun. Due to its thin atmosphere, it experience extreme temperatures ranging from freezing cold to scorching hot.',
    stats: {
      type: 'Terrestrial',
      radius: '2,439 km',
      distance: '0.39 AU',
      temp: '-180 °C to 430 °C',
      period: '88 Earth Days'
    },
    facts: [
      'It has the shortest year in our solar system.',
      'Despite being closest to the Sun, it is not the hottest planet (Venus is).',
      'It is super dense, composed mostly of iron and metals.'
    ]
  },
  {
    id: 'venus',
    name: 'Venus',
    subtitle: 'Aphrodite',
    classification: 'Terrestrial Planet',
    size: 3.4,
    distance: 42,
    speed: 0.018,
    rotationSpeed: 0.001,
    texture: './assets/venus.jpeg',
    desc: 'Venus is the second planet from the Sun and the hottest planet in our solar system. Its dense atmosphere of Carbon Dioxide traps heat in a runaway greenhouse effect, with crushing atmospheric pressures.',
    stats: {
      type: 'Terrestrial',
      radius: '6,051 km',
      distance: '0.72 AU',
      temp: '475 °C (Constant)',
      period: '225 Earth Days'
    },
    facts: [
      'Rotates backwards (retrograde) compared to most other planets.',
      'A day on Venus (rotation) is longer than its year (orbit).',
      'Atmospheric pressure is 90 times greater than Earth\'s sea level.'
    ]
  },
  {
    id: 'earth',
    name: 'Earth',
    subtitle: 'Terra',
    classification: 'Terrestrial Planet',
    size: 3.6,
    distance: 58,
    speed: 0.012,
    rotationSpeed: 0.015,
    texture: './assets/earth.webp',
    desc: 'Earth is our home planet and the only known astronomical object to harbor life. It is covered in liquid water, contains a nitrogen-oxygen atmosphere, and is protected by a strong magnetosphere.',
    stats: {
      type: 'Terrestrial',
      radius: '6,371 km',
      distance: '1.0 AU',
      temp: '-89 °C to 58 °C',
      period: '365.25 Days'
    },
    facts: [
      'Only planet in the universe known to sustain liquid water on its surface.',
      'The atmosphere protect us from incoming meteoroids, which burn up before striking.',
      'Has one natural satellite: the Moon, which stabilizes our orbital wobble.'
    ]
  },
  {
    id: 'mars',
    name: 'Mars',
    subtitle: 'Ares',
    classification: 'Terrestrial Planet',
    size: 2.6,
    distance: 74,
    speed: 0.009,
    rotationSpeed: 0.014,
    texture: './assets/mars.jpeg',
    desc: 'Mars is a cold desert world with a thin carbon dioxide atmosphere. It is known as the "Red Planet" due to iron minerals in its soil that rust, giving the landscape a rusty red appearance.',
    stats: {
      type: 'Terrestrial',
      radius: '3,389 km',
      distance: '1.52 AU',
      temp: '-140 °C to 20 °C',
      period: '687 Earth Days'
    },
    facts: [
      'Home to Olympus Mons, the tallest volcano in the solar system (3x height of Everest).',
      'Has two small moons, Phobos and Deimos, which may be captured asteroids.',
      'Liquid water cannot exist on Mars\' surface for long due to low atmospheric pressure.'
    ]
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    subtitle: 'Zeus',
    classification: 'Gas Giant',
    size: 8.8,
    distance: 98,
    speed: 0.004,
    rotationSpeed: 0.03,
    texture: './assets/jupiter.jpeg',
    desc: 'Jupiter is the largest planet in our solar system—more than twice as massive as all the other planets combined. It is a gas giant primarily made of hydrogen and helium, featuring complex cloud bands.',
    stats: {
      type: 'Gas Giant',
      radius: '69,911 km',
      distance: '5.20 AU',
      temp: '-110 °C',
      period: '12 Earth Years'
    },
    facts: [
      'The Great Red Spot is a giant hurricane-like storm wider than Earth, active for centuries.',
      'Possesses the strongest magnetic field of any planet in the solar system.',
      'Has at least 95 moons, including Ganymede (largest moon in the solar system).'
    ]
  },
  {
    id: 'saturn',
    name: 'Saturn',
    subtitle: 'Cronus',
    classification: 'Gas Giant',
    size: 7.2,
    distance: 130,
    speed: 0.002,
    rotationSpeed: 0.026,
    texture: './assets/saturn.jpeg',
    hasRings: true,
    ringInner: 8.5,
    ringOuter: 18.0,
    desc: 'Saturn is the second-largest planet in our solar system and is famous for its spectacular, complex ring system made of billions of ice and rock particles. It has a low average density.',
    stats: {
      type: 'Gas Giant',
      radius: '58,232 km',
      distance: '9.58 AU',
      temp: '-140 °C',
      period: '29 Earth Years'
    },
    facts: [
      'It has the lowest density of any planet; it could float in a giant bathtub of water.',
      'The rings are extremely thin, averaging only about 10 meters (30 feet) in thickness.',
      'Winds in Saturn\'s atmosphere are incredibly fast, reaching up to 1,800 km/h.'
    ]
  },
  {
    id: 'uranus',
    name: 'Uranus',
    subtitle: 'Caelus',
    classification: 'Ice Giant',
    size: 5.0,
    distance: 164,
    speed: 0.001,
    rotationSpeed: 0.02,
    texture: './assets/uranus.jpeg',
    hasRings: true,
    ringInner: 5.8,
    ringOuter: 9.0,
    desc: 'Uranus is an ice giant planet that rotates on its side. It is the coldest planet in the solar system and has a unique cyan tint from methane gas absorbing red light.',
    stats: {
      type: 'Ice Giant',
      radius: '25,362 km',
      distance: '19.2 AU',
      temp: '-224 °C (Min)',
      period: '84 Earth Years'
    },
    facts: [
      'Rotates on its side with a massive tilt of 98°, basically rolling around the Sun.',
      'It was the first planet discovered using a telescope (by William Herschel in 1781).',
      'Possesses 13 faint, vertical rings of dark rock particles.'
    ]
  },
  {
    id: 'neptune',
    name: 'Neptune',
    subtitle: 'Poseidon',
    classification: 'Ice Giant',
    size: 4.8,
    distance: 190,
    speed: 0.0006,
    rotationSpeed: 0.022,
    texture: './assets/neptune.jpeg',
    desc: 'Neptune is the most distant planet in our solar system. It is a cold, dark ice giant whipped by supersonic winds, featuring a deep blue hue and an active atmosphere with giant storms.',
    stats: {
      type: 'Ice Giant',
      radius: '24,622 km',
      distance: '30.05 AU',
      temp: '-200 °C',
      period: '165 Earth Years'
    },
    facts: [
      'It has the strongest winds in the solar system, reaching speeds up to 2,100 km/h.',
      'Was discovered through mathematical predictions before it was ever seen through a lens.',
      'Its moon Triton orbits backwards (retrograde orbit), suggesting it was captured.'
    ]
  }
];

// ==========================================================================
// Lights Setup
// ==========================================================================
// Realistic Central Point Light (representing Sun heat and light)
const sunLight = new THREE.PointLight(0xffffff, 3.5, 500, 0.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 300;
scene.add(sunLight);

// Soft ambient lighting for shadows in realistic view
const ambientLight = new THREE.AmbientLight(0x222233, 0.15);
scene.add(ambientLight);

// Omnipresent directional light (Full View mode)
const viewLight = new THREE.DirectionalLight(0xffffff, 1.0);
viewLight.position.set(0, 1, 0);
scene.add(viewLight);

// Setup initial lighting intensities
function updateLighting() {
  if (realisticLighting) {
    sunLight.intensity = 3.5;
    ambientLight.intensity = 0.15;
    viewLight.intensity = 0.0;
  } else {
    sunLight.intensity = 1.0;
    ambientLight.intensity = 0.9;
    viewLight.intensity = 0.5;
  }
}
updateLighting();

// ==========================================================================
// Stars particle system (Twinkling space background)
// ==========================================================================
const starCount = 8000;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starSpeeds = new Float32Array(starCount);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  // Random placement on a sphere of radius between 350 and 800
  const radius = 350 + Math.random() * 450;
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = radius * Math.cos(phi);
  
  // Twinkle speed factor
  starSpeeds[i] = 0.5 + Math.random() * 2.0;

  // Star color temperature (mostly white, some cyan/blue, some warm gold)
  const randColor = Math.random();
  if (randColor < 0.15) {
    // Blue-white
    starColors[i * 3] = 0.75;
    starColors[i * 3 + 1] = 0.85;
    starColors[i * 3 + 2] = 1.0;
  } else if (randColor < 0.25) {
    // Soft amber/gold
    starColors[i * 3] = 1.0;
    starColors[i * 3 + 1] = 0.90;
    starColors[i * 3 + 2] = 0.70;
  } else {
    // Pure White
    starColors[i * 3] = 1.0;
    starColors[i * 3 + 1] = 1.0;
    starColors[i * 3 + 2] = 1.0;
  }
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

// High quality glowing star texture generated dynamically using Canvas
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

const starMaterial = new THREE.PointsMaterial({
  size: 2.2,
  map: createStarTexture(),
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  sizeAttenuation: true,
  depthWrite: false
});

const starField = new THREE.Points(starGeo, starMaterial);
scene.add(starField);

// ==========================================================================
// Procedural Ring Textures (Canvas-based)
// ==========================================================================
function createProceduralRingTexture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 512, 0);

  if (type === 'saturn') {
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.2, 'rgba(195, 175, 140, 0.15)'); // Inner dusty ring
    grad.addColorStop(0.4, 'rgba(215, 195, 160, 0.8)');  // Bright ring B
    grad.addColorStop(0.65, 'rgba(180, 160, 130, 0.9)'); // Ring A boundary
    grad.addColorStop(0.67, 'rgba(0, 0, 0, 0)');          // Cassini Division (transparent)
    grad.addColorStop(0.72, 'rgba(150, 130, 105, 0.6)'); // Ring A
    grad.addColorStop(0.92, 'rgba(110, 95, 80, 0.3)');   // Outer faint ring
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  } else {
    // Uranus rings (thin, icy-cyan)
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(175, 230, 255, 0.05)');
    grad.addColorStop(0.75, 'rgba(175, 230, 255, 0.7)'); // Main bright ring
    grad.addColorStop(0.78, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.85, 'rgba(150, 210, 240, 0.25)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 16);

  // Draw some subtle line bands for high fidelity
  if (type === 'saturn') {
    for (let i = 0; i < 512; i++) {
      if (Math.random() > 0.45 && i > 100 && i < 480) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
        ctx.fillRect(i, 0, 1, 16);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ==========================================================================
// Earth Moon Procedural Texture
// ==========================================================================
function createMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Base gray color
  ctx.fillStyle = '#8b8b8b';
  ctx.fillRect(0, 0, 128, 128);

  // Draw craters
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = 2 + Math.random() * 8;
    
    // Crater shadow
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();

    // Crater rim highlights
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ==========================================================================
// Create Solar System Bodies
// ==========================================================================
const bodies = [];
const orbitLines = [];
let earthSystem = null; // Used to hold earth-moon parent group
let moonMesh = null;

// Orbit lines material
const pathMaterial = new THREE.LineBasicMaterial({
  color: 0x00f2fe,
  transparent: true,
  opacity: 0.16,
  linewidth: 1
});

// Build orbits & planets
planetData.forEach((data) => {
  // 1. Create Orbit Line Loop (skip Sun)
  if (data.distance > 0) {
    const orbitGeometry = new THREE.BufferGeometry();
    const pointsCount = 128;
    const points = [];
    
    for (let j = 0; j <= pointsCount; j++) {
      const angle = (j / pointsCount) * Math.PI * 2;
      points.push(data.distance * Math.cos(angle), 0, data.distance * Math.sin(angle));
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const orbitLine = new THREE.LineLoop(orbitGeometry, pathMaterial);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);
  }

  // 2. Planet & Pivot Group Structure
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Mesh Geometry & Material
  const geometry = new THREE.SphereGeometry(data.size, 64, 64);
  let material;

  if (data.id === 'sun') {
    // Sun Basic glowing material (ignores exterior lighting shadows)
    const sunTex = textureLoader.load(data.texture);
    material = new THREE.MeshBasicMaterial({ map: sunTex });
  } else {
    // Standard planet material
    const texture = textureLoader.load(data.texture);
    material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
      bumpScale: 0.05
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  
  if (data.id === 'sun') {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  } else {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Set starting random orbit position angle to avoid aligned line pattern
    pivot.rotation.y = Math.random() * Math.PI * 2;
  }

  // Place planet offset distance on the X axis
  mesh.position.set(data.distance, 0, 0);
  pivot.add(mesh);

  // Specific modifications per body
  // ==========================================
  
  // A. Sun Corona Glowing Atmosphere Layers
  if (data.id === 'sun') {
    // Inner Glow Layer
    const glowInnerGeo = new THREE.SphereGeometry(data.size * 1.08, 32, 32);
    const glowInnerMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide
    });
    const glowInner = new THREE.Mesh(glowInnerGeo, glowInnerMat);
    mesh.add(glowInner);

    // Outer Corona Layer
    const glowOuterGeo = new THREE.SphereGeometry(data.size * 1.18, 32, 32);
    const glowOuterMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.10,
      side: THREE.BackSide
    });
    const glowOuter = new THREE.Mesh(glowOuterGeo, glowOuterMat);
    mesh.add(glowOuter);
  }

  // B. Planet Rings (Saturn / Uranus)
  if (data.hasRings) {
    const ringGeometry = new THREE.RingGeometry(data.ringInner, data.ringOuter, 64);
    
    // Rotate ring plane coordinates to map horizontally
    // BufferGeometry vertex manipulation is safer to ensure correct texturing
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const u = (v3.length() - data.ringInner) / (data.ringOuter - data.ringInner);
      ringGeometry.attributes.uv.setXY(i, u, 1);
    }

    const ringTexture = createProceduralRingTexture(data.id);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.6
    });

    const ringMesh = new THREE.Mesh(ringGeometry, ringMat);
    ringMesh.rotation.x = Math.PI / 2; // Flat horizontal layout
    
    // Tilt the rings slightly for realistic aesthetic
    ringMesh.rotation.y = 0.15; 
    
    mesh.add(ringMesh);
  }

  // C. Earth System with Moon
  if (data.id === 'earth') {
    earthSystem = new THREE.Group();
    earthSystem.position.set(data.distance, 0, 0);
    pivot.add(earthSystem);
    
    // Move earth mesh to the center of the local earthSystem group
    mesh.position.set(0, 0, 0);
    earthSystem.add(mesh);

    // Create Earth Moon
    const moonGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      map: createMoonTexture(),
      roughness: 0.9,
      metalness: 0.05
    });
    
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(6.5, 0.2, 0); // Offset from Earth
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    earthSystem.add(moonMesh);

    // Soft Blue Earth Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(data.size * 1.04, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x5599ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    earthSystem.add(atmosphere);
  }

  // D. Glowing Atmosphere for Neptune/Venus
  if (data.id === 'neptune') {
    const atmosGeo = new THREE.SphereGeometry(data.size * 1.04, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    mesh.add(atmosphere);
  }
  if (data.id === 'venus') {
    const atmosGeo = new THREE.SphereGeometry(data.size * 1.03, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xffddaa,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    mesh.add(atmosphere);
  }

  // Save reference for interactive loops and selection
  bodies.push({
    id: data.id,
    name: data.name,
    size: data.size,
    speed: data.speed,
    rotationSpeed: data.rotationSpeed,
    pivot: pivot,
    planetMesh: data.id === 'earth' ? earthSystem : mesh, // Reference root interactive object
    spinMesh: mesh, // Mesh that does the self spin rotation
    meta: data
  });
});

// ==========================================================================
// Raycaster & Planet Clicks
// ==========================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onCanvasClick(event) {
  // Only detect click on target if overlay displays pointer-events auto
  if (event.target.tagName !== 'CANVAS') return;

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Collect active target meshes (excluding helper glowing backfaces and rings)
  const targets = [];
  bodies.forEach(body => {
    // If earth, interact with earthSystem children
    if (body.id === 'earth') {
      targets.push(body.spinMesh);
    } else {
      targets.push(body.spinMesh);
    }
  });

  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    // Match mesh to corresponding body object
    const matchedBody = bodies.find(body => body.spinMesh === clickedMesh);
    if (matchedBody) {
      selectPlanet(matchedBody);
    }
  }
}

window.addEventListener('click', onCanvasClick);

// ==========================================================================
// Selector GUI & Footer Dock
// ==========================================================================
const planetDeck = document.getElementById('planet-deck-items');

// Populate bottom navigation dock
planetData.forEach((data) => {
  const item = document.createElement('div');
  item.className = 'deck-item';
  item.id = `deck-${data.id}`;
  
  // Custom styled visual preview using planet texture
  const avatar = document.createElement('div');
  avatar.className = 'deck-item-avatar';
  avatar.style.backgroundImage = `url('${data.texture}')`;
  
  if (data.id === 'sun') {
    avatar.style.boxShadow = `0 0 10px var(--glow-gold)`;
  }
  
  const name = document.createElement('div');
  name.className = 'deck-item-name';
  name.innerText = data.name;
  
  item.appendChild(avatar);
  item.appendChild(name);
  
  item.addEventListener('click', () => {
    const matchedBody = bodies.find(b => b.id === data.id);
    if (matchedBody) selectPlanet(matchedBody);
  });
  
  planetDeck.appendChild(item);
});

// Deck Scroll controls
const deckPrev = document.getElementById('deck-prev');
const deckNext = document.getElementById('deck-next');

deckPrev.addEventListener('click', () => {
  planetDeck.scrollBy({ left: -200, behavior: 'smooth' });
});
deckNext.addEventListener('click', () => {
  planetDeck.scrollBy({ left: 200, behavior: 'smooth' });
});

// Update selected visual state in CSS
function selectPlanet(body) {
  focusedPlanet = body;
  
  // Update Deck CSS
  document.querySelectorAll('.deck-item').forEach(el => el.classList.remove('active'));
  const activeDeckItem = document.getElementById(`deck-${body.id}`);
  if (activeDeckItem) {
    activeDeckItem.classList.add('active');
    activeDeckItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Update HUD info card sidebar
  const infoPanel = document.getElementById('planet-info-panel');
  const infoContent = document.getElementById('planet-info-content');
  
  // Animate open
  infoPanel.classList.add('open');
  
  // Populate statistics card
  let statsHTML = '';
  Object.entries(body.meta.stats).forEach(([label, value]) => {
    let accent = 'accent-cyan';
    if (label === 'temp') accent = 'accent-gold';
    if (label === 'type') accent = 'accent-purple';
    
    statsHTML += `
      <div class="stat-row ${accent}">
        <span class="stat-label">${label.toUpperCase()}</span>
        <span class="stat-value">${value}</span>
      </div>
    `;
  });

  let factsHTML = '';
  body.meta.facts.forEach(fact => {
    factsHTML += `<li>${fact}</li>`;
  });

  infoContent.className = 'info-content-filled';
  infoContent.innerHTML = `
    <div class="info-header">
      <div class="info-classification">${body.meta.classification}</div>
      <div class="info-title-container">
        <h2 class="info-title">${body.meta.name}</h2>
        <span class="info-subtitle">${body.meta.subtitle}</span>
      </div>
    </div>
    
    <p class="info-desc">${body.meta.desc}</p>
    
    <div class="info-stats-grid">
      ${statsHTML}
    </div>
    
    <div class="info-facts">
      <h4>MISSION KNOWLEDGE</h4>
      <ul class="facts-list">
        ${factsHTML}
      </ul>
    </div>

    <div class="info-actions">
      <button class="btn btn-primary" id="btn-focus-cam">
        <span class="icon">🔍</span> LOCK CAMERA
      </button>
    </div>
  `;

  // Connect lock camera button
  document.getElementById('btn-focus-cam').addEventListener('click', () => {
    enableFocusMode();
  });

  // Enable/Disable target focus mode tab button
  document.getElementById('cam-focus').disabled = false;
}

// Close Planet details panel
document.getElementById('btn-close-info').addEventListener('click', () => {
  document.getElementById('planet-info-panel').classList.remove('open');
  disableFocusMode();
});

// Camera Focus mode triggers
const tabFree = document.getElementById('cam-free');
const tabFocus = document.getElementById('cam-focus');

function enableFocusMode() {
  if (!focusedPlanet) return;
  isFocusMode = true;
  tabFree.classList.remove('active');
  tabFocus.classList.add('active');
  
  // Scale target distance based on planet size
  cameraTargetDistance = focusedPlanet.size * 3.5;
}

function disableFocusMode() {
  isFocusMode = false;
  tabFree.classList.add('active');
  tabFocus.classList.remove('active');
}

tabFree.addEventListener('click', disableFocusMode);
tabFocus.addEventListener('click', enableFocusMode);

// ==========================================================================
// Control Center UI Elements
// ==========================================================================
const btnPlayPause = document.getElementById('btn-play-pause');
const btnReset = document.getElementById('btn-reset');
const sliderSpeed = document.getElementById('slider-speed');
const speedBadge = document.getElementById('speed-badge');

const toggleRealView = document.getElementById('toggle-real-view');
const toggleShowPaths = document.getElementById('toggle-show-paths');
const toggleStarsTwinkle = document.getElementById('toggle-stars-twinkle');
const toggleAmbientSound = document.getElementById('toggle-ambient-sound');

// Play Pause toggle
btnPlayPause.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    btnPlayPause.className = 'btn btn-secondary';
    btnPlayPause.innerHTML = '<span class="icon">▶</span> <span class="text">PLAY</span>';
  } else {
    btnPlayPause.className = 'btn btn-primary';
    btnPlayPause.innerHTML = '<span class="icon">⏸</span> <span class="text">PAUSE</span>';
  }
});

// Reset Camera & speed
btnReset.addEventListener('click', () => {
  disableFocusMode();
  focusedPlanet = null;
  document.querySelectorAll('.deck-item').forEach(el => el.classList.remove('active'));
  document.getElementById('planet-info-panel').classList.remove('open');
  document.getElementById('cam-focus').disabled = true;
  
  // Smoothly fly camera back to center overview
  const targetCamPos = new THREE.Vector3(-60, 95, 180);
  camera.position.copy(targetCamPos);
  orbit.target.set(0, 0, 0);
  orbit.update();
  
  // Reset speed multiplier
  speedMultiplier = 1.0;
  sliderSpeed.value = 1.0;
  speedBadge.innerText = '1.0x';
});

// Speed slider
sliderSpeed.addEventListener('input', (e) => {
  speedMultiplier = parseFloat(e.target.value);
  speedBadge.innerText = speedMultiplier.toFixed(1) + 'x';
});

// Simulation settings toggles
toggleRealView.addEventListener('change', (e) => {
  realisticLighting = e.target.checked;
  updateLighting();
});

toggleShowPaths.addEventListener('change', (e) => {
  showPaths = e.target.checked;
  orbitLines.forEach(line => line.visible = showPaths);
});

toggleStarsTwinkle.addEventListener('change', (e) => {
  starFieldTwinkle = e.target.checked;
});

toggleAmbientSound.addEventListener('change', (e) => {
  isAudioEnabled = e.target.checked;
  if (isAudioEnabled) {
    initAndStartAudio();
  } else {
    stopAudio();
  }
});

// ==========================================================================
// Procedural Deep Space Audio Synth
// ==========================================================================
function initAndStartAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Main deep space oscillator (Low A, 55Hz)
      droneOsc = audioCtx.createOscillator();
      droneGain = audioCtx.createGain();
      
      // Lowpass filter to make it a deep, soothing background hum
      lowpassFilter = audioCtx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(110, audioCtx.currentTime);
      
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(55, audioCtx.currentTime); 
      
      // Connect nodes
      droneOsc.connect(lowpassFilter);
      lowpassFilter.connect(droneGain);
      droneGain.connect(audioCtx.destination);
      
      // Soft start
      droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
      droneOsc.start();
    }
    
    // Resumes context if suspended (browser security block)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Fade in
    droneGain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1.5);
  } catch (err) {
    console.error('Audio initialization failed: ', err);
  }
}

function stopAudio() {
  if (droneGain && audioCtx) {
    // Fade out
    droneGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
  }
}

// Modify audio filter frequency in response to speed slider changes for premium micro-feedback
function updateAudioFilterSpeed() {
  if (lowpassFilter && audioCtx) {
    // Higher speed = higher filter frequency cutoff = brighter sound!
    const targetFreq = 90 + (speedMultiplier * 25);
    lowpassFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.2);
  }
}

// ==========================================================================
// Resize Handler
// ==========================================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================================================
// Render & Animation Loop
// ==========================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speedFactor = isPaused ? 0 : speedMultiplier;

  // 1. Twinkling Stars effect (Oscillate points sizes and colors)
  if (starFieldTwinkle) {
    const time = clock.getElapsedTime();
    const positions = starField.geometry.attributes.position.array;
    // Rotate background very slowly for astronomical scale motion
    starField.rotation.y = time * 0.0002;
    starField.rotation.x = time * 0.0001;
  }

  // 2. Animate Orbits & Self Spins
  bodies.forEach((body) => {
    // Orbit rotation around Sun (skip Sun itself)
    if (body.id !== 'sun') {
      body.pivot.rotation.y += body.speed * speedFactor * 0.15;
    }
    
    // Self rotation of the planet mesh on its axis
    body.spinMesh.rotation.y += body.rotationSpeed * speedFactor * 0.4;
  });

  // 3. Moon rotation around Earth
  if (moonMesh && !isPaused) {
    moonMesh.rotation.y += 0.01 * speedFactor;
    // Rotate moon position inside Earth local system coordinates
    const time = clock.getElapsedTime() * speedFactor;
    moonMesh.position.x = 6.5 * Math.cos(time * 0.2);
    moonMesh.position.z = 6.5 * Math.sin(time * 0.2);
  }

  // 4. Update Simulation Time display HUD
  if (!isPaused) {
    simDay += delta * speedMultiplier * 18.0;
    if (simDay >= 365) {
      simYear += Math.floor(simDay / 365);
      simDay = simDay % 365;
    }
    document.getElementById('sim-time-display').innerText = `Year ${simYear}, Day ${Math.floor(simDay).toString().padStart(3, '0')}`;
  }

  // 5. Dynamic Camera Glide Focus & Tracking
  if (focusedPlanet) {
    const planetWorldPos = new THREE.Vector3();
    focusedPlanet.planetMesh.getWorldPosition(planetWorldPos);
    
    // Smoothly interpolate the OrbitControls focus target onto the active planet
    orbit.target.lerp(planetWorldPos, 0.06);

    if (isFocusMode) {
      // Find vector offset pointing from target back to camera
      const cameraOffset = camera.position.clone().sub(planetWorldPos);
      
      // Interpolate the camera distance to target focus length
      const currentDist = cameraOffset.length();
      cameraOffset.setLength(THREE.MathUtils.lerp(currentDist, cameraTargetDistance, 0.06));
      
      // Update camera position smoothly
      camera.position.copy(planetWorldPos).add(cameraOffset);
    }
  }

  // Update audio drone parameters based on speed
  updateAudioFilterSpeed();

  // Controls damping
  orbit.update();

  // Render Viewport
  renderer.render(scene, camera);
}

// Start Loop
animate();
