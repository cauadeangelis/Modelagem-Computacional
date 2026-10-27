// Todos os números de "sensação" (tempos, velocidades, cores) moram aqui — seção 16.3.

export const HERO_NAME = 'Nurupi';

export const CONFIG = {
  saveKey: 'calculandia-save-v1',
  maxDt: 1 / 20,
  maxPixelRatio: 2,

  camera: {
    fov: 35, near: 0.5, far: 400,
    offset: [22, 26, 22],
    lookOffsetY: 1.2,
    followK: 6,
    zoomMin: 0.7, zoomMax: 1.5, zoomStep: 0.08,
    rotateTime: 0.4,
    cityZoom: 0.85, cityZoomTime: 0.8,
    enterZoom: 0.6, enterZoomTime: 0.8,
    shakeTime: 0.5,
  },

  light: {
    hemiSky: '#bfe3ff', hemiGround: '#7a8f5a', hemiIntensity: 0.9,
    sunColor: '#fff1d6', sunIntensity: 1.4, sunOffset: [30, 50, 20],
    shadowMapSize: 2048, shadowBox: 45,
    background: '#bfe3ff', fogColor: '#cfe8ff', fogNear: 120, fogFar: 260,
  },

  water: {
    y: -0.25, color: '#4fb3d9', opacity: 0.9, waveAmp: 0.12, wavePeriod: 4,
    foamMin: 0.4, foamMax: 0.8, foamPeriod: 3,
  },

  world: { half: 140, chunks: 7, chunkSeg: 24, islandRadius: 115, settlementCull: 95 },

  hero: {
    walkSpeed: 4.2, runSpeed: 7.0, accel: 25, friction: 18, radius: 0.45, turnK: 14, phaseK: 1.9,
    jumpHeight: 1.1, jumpAnticip: 0.1, jumpRise: 0.28, jumpFall: 0.28, jumpLand: 0.12,
    mudFactor: 0.6, clickStop: 0.3, groundK: 18, unwalkable: -0.2,
    colors: { pele: '#f2c9a0', macacao: '#2f6fdd', colete: '#f2c14e', capacete: '#f5a623' },
  },

  companion: {
    followDist: 1.8, hopPeriod: 0.45, hopHeight: 0.18, sitAfter: 1.5, speed: 6.5, teleportDist: 14,
    lookDist: 8, bubbleMax: 70, bubbleTime: 3, idleTalkMin: 35, idleTalkMax: 70,
  },

  triggers: { city: 20, door: 2.2, animal: 3.5, collectable: 1.5, campfire: 2.5, sign: 2.5, bush: 3, tree: 2.2, bell: 2.2, chest: 2 },

  animals: {
    noticeDist: 8, approachDist: 4, approachStop: 2.2, introDist: 6, sleepAfter: 30,
    wanderMin: 3, wanderMax: 6, headLimit: Math.PI / 3, walkSpeed: 1.1, trotSpeed: 2.6,
  },

  npc: { radius: 4, speed: 1.0, talkDist: 3.2, talkCooldown: 9 },

  roots: { perRegion: 8, triggerDist: 3, speed: 5.5, zigzag: 0.6, escapeTime: 6, catchDist: 0.95, respawn: 25 },

  seeds: { start: 3, max: 99, tree: 1, bell: 1, chestMin: 2, chestMax: 4, root: 2, apple: 1, win: { F: 1, M: 2, D: 3 }, threeStars: 1 },

  hints: { costs: [0, 0, 1, 3], raizinhaWait: 10, reactiveDefeats: 2, reactiveIdle: 90, maxStarsWithL3: 2, xpFactorL3: 0.8 },

  // Baterias por missão: fases/levels.js. XP numérico: fases/session.js.

  fog: { cube: 2, opacity: 0.55, color: '#8a7fa6', dissolveTime: 3, count: 70 },

  ui: { typewriterCps: 40, regionBannerTime: 2.5, irisTime: 0.5, enterWalk: 0.8, seedFlyTime: 0.8, flagRise: 1.2 },

  music: { bpm: 96, crossfade: 2, volume: 0.55 },
  particles: { pool: 600 },

  ambient: {
    butterfliesPerRegion: 6, clouds: 6, fishMin: 8, fishMax: 15, footprintLife: 6,
    birdsReturn: 20, birdTriggerDist: 5, grassBendDist: 1.2,
  },

  cinematicLength: 45,
};

// Paletas por região (seção 2)
export const PALETTE = {
  base: { chao: '#f0dca0', veg: '#9ccc5a', destaque: '#e8654a', destaque2: '#f2c14e' },
  r0: { chao: '#e8c872', veg: '#b7d15a', destaque: '#d9803a' },
  r1: { chao: '#5c8a3a', veg: '#2f6b3a', veg2: '#1f4f2c', destaque: '#8b5a2b' },
  r2: { chao: '#d9b38c', veg: '#b5754a', destaque: '#8a96a3', destaque2: '#e07a3f' },
  r3: { chao: '#9ad37a', veg: '#3cc0a0', destaque: '#e8554a', destaque2: '#f2c14e' },
  r4: { chao: '#f3e0a8', veg: '#3aa6d8', destaque: '#a8764a', destaque2: '#d94f4f' },
  usina: { chao: '#8d9199', veg: '#4a4f57', destaque: '#b7ff3c', destaque2: '#6b6f78' },
};
