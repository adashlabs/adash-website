<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits(['done'])
const canvas = ref()
const fading = ref(false)

let raf
let context
let width = 0
let height = 0
let baseGradient
const sprites = []
const instances = []
const DURATION = 2600
const FADE_START = 1950
const SWEEP = 1900

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const smoothstep = (a, b, t) => {
  t = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const fadeFn = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const easeInOutCubic = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function makeSprite(seed) {
  const N = 168
  const M = 104
  const rand = mulberry32(seed)
  const layers = []
  for (let o = 0; o < 4; o += 1) {
    const cw = 5 << o
    const ch = 3 << o
    const grid = new Float32Array((cw + 1) * (ch + 1))
    for (let i = 0; i < grid.length; i += 1) grid[i] = rand()
    layers.push({ cw, ch, grid })
  }

  const image = new ImageData(N, M)
  const px = image.data
  for (let y = 0; y < M; y += 1) {
    for (let x = 0; x < N; x += 1) {
      let noise = 0
      let amp = .52
      let norm = 0
      for (const { cw, ch, grid } of layers) {
        const fx = x / N * cw
        const fy = y / M * ch
        const x0 = fx | 0
        const y0 = fy | 0
        const tx = fadeFn(fx - x0)
        const ty = fadeFn(fy - y0)
        const i = y0 * (cw + 1) + x0
        const a = grid[i]
        const b = grid[i + 1]
        const c = grid[i + cw + 1]
        const d = grid[i + cw + 2]
        noise += (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) * amp
        norm += amp
        amp *= .55
      }
      noise /= norm

      const dx = (x / N - .5) * 2
      const dy = (y / M - .5) * 2.15
      const dome = Math.max(0, 1 - Math.hypot(dx, dy) ** 2)
      const alpha = smoothstep(.3, .68, noise) * Math.pow(dome, 1.15)
      const shade = 1 - (y / M) * .24
      const i4 = (y * N + x) * 4
      px[i4] = 255 * shade
      px[i4 + 1] = 253 * shade
      px[i4 + 2] = 250 * shade
      px[i4 + 3] = Math.min(255, alpha * 330)
    }
  }

  const small = document.createElement('canvas')
  small.width = N
  small.height = M
  small.getContext('2d').putImageData(image, 0, 0)

  const big = document.createElement('canvas')
  big.width = 640
  big.height = 400
  const bctx = big.getContext('2d')
  bctx.imageSmoothingEnabled = true
  bctx.imageSmoothingQuality = 'high'
  bctx.drawImage(small, 0, 0, 640, 400)
  return big
}

const BANDS = [
  { cy: .02, dir: 1, delay: 0, dist: 1.55, alpha: 1 },
  { cy: .5, dir: -1, delay: .14, dist: 1.5, alpha: .96 },
  { cy: .97, dir: 1, delay: .28, dist: 1.6, alpha: 1 },
]
const COLUMN_CENTERS = [.04, .36, .67, .98]

function build() {
  instances.length = 0
  const rand = mulberry32(11)
  BANDS.forEach((band, bi) => {
    COLUMN_CENTERS.forEach((cx, i) => {
      instances.push({
        sprite: sprites[(bi * 3 + i) % sprites.length],
        cx: cx + (rand() - .5) * .05,
        cy: band.cy + (rand() - .5) * .05,
        wF: .6 + rand() * .16,
        hF: .58 + rand() * .12,
        dir: band.dir,
        delay: band.delay + rand() * .08,
        dist: band.dist,
        alpha: band.alpha,
      })
    })
  })
}

function resize() {
  const ratio = Math.min(devicePixelRatio, 1.25)
  width = innerWidth
  height = innerHeight
  canvas.value.width = width * ratio
  canvas.value.height = height * ratio
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  baseGradient = context.createLinearGradient(0, 0, 0, height)
  baseGradient.addColorStop(0, '#f8fafb')
  baseGradient.addColorStop(.55, '#eef2f4')
  baseGradient.addColorStop(1, '#dde4e9')
  build()
}

function render(now) {
  const t = now - start
  const fade = t < FADE_START ? 1 : Math.max(0, 1 - (t - FADE_START) / (DURATION - FADE_START))

  context.clearRect(0, 0, width, height)
  context.globalAlpha = fade
  context.fillStyle = baseGradient
  context.fillRect(0, 0, width, height)

  instances.forEach((inst) => {
    const progress = Math.min(1, Math.max(0, (t - inst.delay * 1000) / SWEEP))
    const dx = inst.dir * inst.dist * width * easeInOutCubic(progress)
    const iw = width * inst.wF
    const ih = height * inst.hF
    context.globalAlpha = inst.alpha * fade
    context.drawImage(inst.sprite, inst.cx * width - iw / 2 + dx, inst.cy * height - ih / 2, iw, ih)
  })

  context.globalAlpha = 1

  if (t >= DURATION) {
    fading.value = true
    setTimeout(() => emit('done'), 480)
    return
  }
  raf = requestAnimationFrame(render)
}

let start = 0
onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    emit('done')
    return
  }
  context = canvas.value.getContext('2d')
  for (let i = 0; i < 6; i += 1) sprites.push(makeSprite(100 + i * 37))
  resize()
  addEventListener('resize', resize, { passive: true })
  start = performance.now()
  raf = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvas" class="cloud-intro" :class="{ fade: fading }" aria-hidden="true" />
</template>

<style scoped>
.cloud-intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100%;
  height: 100%;
  pointer-events: none;
  filter: blur(1.5px);
  transition: opacity .48s ease;
}
.cloud-intro.fade { opacity: 0; }
</style>
