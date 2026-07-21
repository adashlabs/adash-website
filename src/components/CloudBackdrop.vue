<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref()
let frame
let clouds = []
let context
let resizeObserver
let animate = true
let lastDraw = 0
let puffs = []
let viewWidth = 0
let viewHeight = 0

function makePuff(rgb) {
  const puff = document.createElement('canvas')
  puff.width = puff.height = 128
  const ctx = puff.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, `rgba(${rgb},1)`)
  gradient.addColorStop(.48, `rgba(${rgb},.55)`)
  gradient.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  ctx.filter = 'blur(5px)'
  ctx.drawImage(puff, 0, 0)
  ctx.filter = 'none'
  return puff
}

function resize() {
  const rect = canvas.value.getBoundingClientRect()
  viewWidth = rect.width
  viewHeight = rect.height
  const ratio = .5
  canvas.value.width = Math.max(1, rect.width * ratio)
  canvas.value.height = Math.max(1, rect.height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  clouds = Array.from({ length: Math.min(24, Math.max(16, Math.floor(rect.width / 56))) }, () => ({
    x: Math.random() * rect.width,
    y: Math.random() * rect.height,
    size: 240 + Math.random() * 420,
    squeeze: .35 + Math.random() * .5,
    speed: .018 + Math.random() * .045,
    opacity: .1 + Math.random() * .2,
    puff: Math.random() > .42 ? 0 : 1,
    phase: Math.random() * Math.PI * 2,
    drift: 14 + Math.random() * 34,
  }))
}

function draw(time = 0) {
  if (animate && time - lastDraw < 40) {
    frame = requestAnimationFrame(draw)
    return
  }
  lastDraw = time

  context.clearRect(0, 0, viewWidth, viewHeight)
  clouds.forEach((cloud) => {
    if (animate) {
      cloud.x += cloud.speed
      cloud.phase += .0007
    }
    if (cloud.x - cloud.size > viewWidth) cloud.x = -cloud.size
    const y = cloud.y + Math.sin(cloud.phase) * cloud.drift
    context.save()
    context.translate(cloud.x, y)
    context.scale(1, cloud.squeeze)
    context.globalAlpha = cloud.opacity
    context.drawImage(puffs[cloud.puff], -cloud.size, -cloud.size, cloud.size * 2, cloud.size * 2)
    context.restore()
  })
  context.globalAlpha = 1

  if (animate) frame = requestAnimationFrame(draw)
}

onMounted(() => {
  context = canvas.value.getContext('2d')
  puffs = [makePuff('0,0,0'), makePuff('49,58,64')]
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)
  resize()
  animate = !matchMedia('(prefers-reduced-motion: reduce)').matches
  draw()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
</script>

<template><canvas ref="canvas" aria-hidden="true" /></template>

<style scoped>
canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
