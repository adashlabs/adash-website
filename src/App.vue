<script setup>
import { onMounted, ref } from 'vue'
import CloudBackdrop from './components/CloudBackdrop.vue'
import CloudIntro from './components/CloudIntro.vue'
import { site } from './config/site'

const logoFailed = ref(false)
const introDone = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return
      target.classList.add('visible')
      observer.unobserve(target)
    })
  }, { threshold: .12 })

  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element))
})
</script>

<template>
  <div class="page">
    <CloudIntro v-if="!introDone" @done="introDone = true" />
    <CloudBackdrop class="global-fog" />
    <header class="header">
      <a class="logo" href="#top" :aria-label="`${site.name} ana sayfa`">
        <img v-if="!logoFailed" :src="site.logo" :alt="site.name" @error="logoFailed = true" />
        <span v-else>{{ site.name }}</span>
      </a>
      <a class="discord small" :href="site.discordUrl" target="_blank" rel="noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
        <span>{{ site.hero.button }}</span>
      </a>
    </header>

    <main>
      <section id="top" class="hero">
        <div class="hero-shade" aria-hidden="true" />
        <div class="hero-clouds" aria-hidden="true">
          <span class="cloud cloud-one"></span>
          <span class="cloud cloud-two"></span>
          <span class="cloud cloud-three"></span>
        </div>
        <span class="hero-watermark" aria-hidden="true">{{ site.name }}</span>
        <div class="hero-content">
          <p class="eyebrow">{{ site.hero.eyebrow }}</p>
          <h1>
            <span>{{ site.hero.title }}</span>
            <span class="title-accent">{{ site.hero.titleAccent }}</span>
          </h1>
          <div class="hero-bottom">
            <div class="hero-copy">
              <p>{{ site.hero.description }}</p>
              <ul class="hero-points" aria-label="Topluluk avantajları">
                <li v-for="point in site.hero.points" :key="point">{{ point }}</li>
              </ul>
            </div>
            <a class="discord" :href="site.discordUrl" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
              <span>{{ site.hero.button }}</span><b>↗</b>
            </a>
          </div>
        </div>
        <span class="scroll">Aşağı kaydır</span>
      </section>

      <section class="about section">
        <div class="section-label" data-reveal>01 — {{ site.about.label }}</div>
        <div class="about-grid">
          <h2 data-reveal>{{ site.about.title }}</h2>
          <p data-reveal>{{ site.about.description }}</p>
        </div>
      </section>

      <section class="purposes section" aria-label="Topluluk alanları">
        <article v-for="purpose in site.purposes" :key="purpose.number" data-reveal>
          <span>{{ purpose.number }}</span>
          <h3>{{ purpose.title }}</h3>
          <p>{{ purpose.text }}</p>
        </article>
      </section>

      <section class="closing section">
        <div class="closing-content" data-reveal>
          <span>{{ site.closing.label }}</span>
          <h2>{{ site.closing.title }}</h2>
          <p>{{ site.closing.description }}</p>
          <a class="discord" :href="site.discordUrl" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
            <span>{{ site.closing.button }}</span><b>↗</b>
          </a>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div>
        <a class="footer-logo" href="#top">{{ site.name }}</a>
        <p>{{ site.footerText }}</p>
      </div>
      <nav aria-label="Sosyal medya bağlantıları">
        <a v-for="social in site.socials" :key="social.name" :href="social.url" target="_blank" rel="noreferrer">{{ social.name }} ↗</a>
      </nav>
      <div class="footer-bottom">
        <span>{{ site.copyright }}</span>
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  color-scheme: dark;
  font-family: Inter, Arial, sans-serif;
  color: #f5f5f3;
  background: #090a0a;
  font-synthesis: none;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; background: #090a0a; }
body { margin: 0; overflow-x: hidden; background: radial-gradient(ellipse at 65% 35%, #17191a 0, #0b0c0c 42%, #030303 100%); }
a { color: inherit; }
::selection { color: #050505; background: #fff; }
.page { position: relative; min-width: 320px; overflow: hidden; }
.page::after { content: ''; position: fixed; inset: 0; z-index: 4; pointer-events: none; opacity: .025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
canvas.global-fog { position: fixed; inset: -10%; z-index: 0; width: 120%; height: 120%; opacity: 1; }
main, .footer { position: relative; z-index: 1; }
.header { position: absolute; inset: 0 0 auto; z-index: 10; height: 118px; padding: 0 clamp(24px, 5vw, 80px); display: flex; align-items: center; justify-content: space-between; }
.logo { display: block; flex: 0 0 auto; color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -.06em; text-decoration: none; }
.logo img { display: block; width: auto; max-width: min(280px, 48vw); height: 62px; object-fit: contain; object-position: left center; }
.discord { display: flex; align-items: center; gap: 14px; width: fit-content; min-width: 230px; padding: 18px 20px; border-radius: 5px; color: #fff; background: #5865f2; font-size: 13px; font-weight: 700; text-decoration: none; transition: background .2s, transform .2s; }
.discord:hover { background: #4752c4; transform: translateY(-2px); }
.discord svg { width: 22px; fill: currentColor; }
.discord b { margin-left: auto; font-size: 18px; }
.discord.small { min-width: auto; padding: 12px 16px; font-size: 12px; }
.discord.small svg { width: 18px; }
.hero { position: relative; min-height: 100svh; padding: 160px clamp(24px, 5vw, 80px) 60px; display: flex; align-items: flex-end; isolation: isolate; overflow: hidden; border-bottom: 1px solid rgba(160,175,185,.14); }
.hero::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at 82% 24%, rgba(122,141,152,.08), transparent 46%), radial-gradient(ellipse at 46% 78%, rgba(70,79,84,.07), transparent 44%); filter: blur(16px); }
.hero-shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(0,0,0,.44), rgba(0,0,0,.08) 58%, rgba(0,0,0,.28)), radial-gradient(ellipse at 50% 54%, transparent 32%, rgba(1,1,1,.68) 100%); }
.hero-clouds { position: absolute; inset: -12%; z-index: 0; overflow: hidden; pointer-events: none; mix-blend-mode: screen; }
.cloud { position: absolute; display: block; border-radius: 50%; filter: blur(16px); opacity: 0; will-change: transform; }
.hero-content > * { opacity: 0; transform: translateY(28px); animation: hero-reveal .95s cubic-bezier(.16,1,.3,1) forwards; }
.hero-content > :nth-child(1) { animation-delay: 1.6s; }
.hero-content > :nth-child(2) { animation-delay: 1.72s; }
.hero-content > :nth-child(3) { animation-delay: 1.85s; }
@keyframes hero-reveal { to { opacity: 1; transform: translateY(0); } }
.cloud-one { animation-delay: 1.35s, 4.3s; top: -28%; right: -9%; width: min(74vw, 1120px); height: min(54vw, 820px); background: radial-gradient(ellipse at 50% 52%, rgba(247,249,250,.28) 0 7%, rgba(224,232,235,.17) 24%, rgba(180,194,201,.065) 45%, transparent 70%); transform: translate3d(14%, -8%, 0) scale(1.18); animation: cloud-enter-one 2.7s cubic-bezier(.16,1,.3,1) .08s forwards, cloud-float-one 18s ease-in-out 2.8s infinite alternate; }
.cloud-two { animation-delay: 1.55s, 4.75s; right: 18%; bottom: -47%; width: min(68vw, 980px); height: min(40vw, 590px); background: radial-gradient(ellipse at 56% 42%, rgba(242,245,246,.16) 0 10%, rgba(187,199,205,.1) 30%, rgba(140,159,170,.035) 51%, transparent 72%); transform: translate3d(-18%, 18%, 0) scale(1.28); animation: cloud-enter-two 3.2s cubic-bezier(.16,1,.3,1) .25s forwards, cloud-float-two 22s ease-in-out 3.45s infinite alternate; }
.cloud-three { animation-delay: 1.75s, 5.05s; top: 28%; left: -28%; width: min(57vw, 860px); height: min(45vw, 670px); background: radial-gradient(ellipse at 58% 48%, rgba(246,248,248,.11) 0 12%, rgba(194,205,210,.065) 37%, transparent 70%); transform: translate3d(-23%, 8%, 0) scale(1.15); animation: cloud-enter-three 3.5s cubic-bezier(.16,1,.3,1) .48s forwards, cloud-float-three 25s ease-in-out 3.8s infinite alternate; }
@keyframes cloud-enter-one { to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
@keyframes cloud-enter-two { to { opacity: .9; transform: translate3d(0, 0, 0) scale(1); } }
@keyframes cloud-enter-three { to { opacity: .72; transform: translate3d(0, 0, 0) scale(1); } }
@keyframes cloud-float-one { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(-5%, 5%, 0) scale(1.08); } }
@keyframes cloud-float-two { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(6%, -5%, 0) scale(1.06); } }
@keyframes cloud-float-three { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(8%, -4%, 0) scale(1.08); } }
.hero-watermark { position: absolute; z-index: -1; top: 10%; right: -2vw; color: rgba(217,229,235,.025); font-size: clamp(180px, 29vw, 470px); line-height: .8; font-weight: 800; letter-spacing: -.1em; pointer-events: none; }
.hero-content { position: relative; z-index: 1; width: 100%; max-width: 1500px; margin: 0 auto; }
.eyebrow, .section-label, .closing-content > span { margin: 0 0 32px; color: #9aa3a8; font: 500 11px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .13em; text-transform: uppercase; }
.eyebrow::before { content: ''; display: inline-block; width: 30px; height: 1px; margin: 0 12px 3px 0; background: #73818a; }
h1 { max-width: 1380px; margin: 0; font-size: clamp(64px, 9.2vw, 144px); line-height: .84; letter-spacing: -.075em; font-weight: 600; }
h1 > span { display: block; }
.title-accent { padding-bottom: .08em; color: #f5f5f3; }
.hero-bottom { margin-top: clamp(45px, 6vw, 85px); padding-top: 24px; border-top: 1px solid rgba(160,175,185,.18); display: flex; justify-content: space-between; align-items: flex-end; gap: 50px; }
.hero-copy { max-width: 620px; }
.hero-copy > p { margin: 0; color: #b1b6b8; font-size: 15px; line-height: 1.75; }
.hero-points { display: flex; flex-wrap: wrap; gap: 10px 25px; margin: 22px 0 0; padding: 0; list-style: none; color: #7f898f; font: 10px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.hero-points li::before { content: '—'; margin-right: 8px; color: #aeb8bd; }
.scroll { position: absolute; right: 22px; bottom: 60px; color: #667177; font: 9px ui-monospace, monospace; letter-spacing: .13em; text-transform: uppercase; writing-mode: vertical-rl; }
.section { padding: clamp(100px, 13vw, 190px) clamp(24px, 5vw, 80px); }
.about { background: rgba(4, 4, 4, .84); }
.about-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 9vw; align-items: end; }
.about h2 { max-width: 920px; margin: 0; font-size: clamp(45px, 6.5vw, 100px); line-height: 1; letter-spacing: -.06em; font-weight: 500; }
.about-grid > p { max-width: 500px; margin: 0 0 8px; color: #999; font-size: 15px; line-height: 1.85; }
.purposes { padding-top: 0; padding-bottom: clamp(100px, 11vw, 160px); }
.purposes article { display: grid; grid-template-columns: 80px minmax(240px, .8fr) 1fr; gap: 50px; padding: 46px 0; border-top: 1px solid #262626; align-items: start; }
.purposes article:last-child { border-bottom: 1px solid #262626; }
.purposes article > span { color: #777; font: 11px ui-monospace, monospace; }
.purposes h3 { margin: 0; font-size: clamp(30px, 3.2vw, 50px); line-height: 1; letter-spacing: -.045em; font-weight: 500; }
.purposes p { max-width: 570px; margin: 0; color: #999; font-size: 14px; line-height: 1.8; }
.closing { position: relative; min-height: 90svh; display: grid; place-items: center; text-align: center; isolation: isolate; overflow: hidden; border-top: 1px solid #202020; }
.closing::after { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle, rgba(20,22,23,.08), rgba(2,2,2,.8) 88%); }
.closing-content { position: relative; z-index: 1; max-width: 1000px; }
.closing h2 { margin: 0; font-size: clamp(55px, 8vw, 120px); line-height: .92; letter-spacing: -.07em; font-weight: 600; }
.closing p { max-width: 550px; margin: 35px auto 45px; color: #aaa; font-size: 15px; line-height: 1.75; }
.closing .discord { margin: 0 auto; }
.footer { padding: 90px clamp(24px, 5vw, 80px) 30px; border-top: 1px solid #202020; background: #020202; }
.footer > div:first-child { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 60px; }
.footer-logo { font-size: clamp(70px, 14vw, 210px); line-height: .7; letter-spacing: -.09em; font-weight: 800; text-decoration: none; }
.footer p { margin: 0; color: #777; font-size: 13px; }
.footer nav { display: flex; flex-wrap: wrap; gap: 13px 30px; padding: 40px 0 80px; border-top: 1px solid #202020; }
.footer nav a { color: #aaa; font-size: 13px; text-decoration: none; }
.footer nav a:hover { color: #fff; }
.footer-bottom { display: flex; justify-content: flex-start; padding-top: 25px; border-top: 1px solid #202020; color: #666; font: 10px ui-monospace, monospace; letter-spacing: .08em; }
[data-reveal] { opacity: 0; transform: translateY(25px); transition: opacity .8s, transform .8s; }
[data-reveal].visible { opacity: 1; transform: none; }
@media (max-width: 700px) {
  .header { height: 92px; }
  .logo img { max-width: 52vw; height: 48px; }
  .discord.small { min-width: 44px; width: 44px; height: 44px; padding: 0; justify-content: center; border-radius: 50%; }
  .discord.small span { display: none; }
  .hero { min-height: 860px; padding-top: 145px; padding-bottom: 42px; align-items: center; }
  .hero-clouds { inset: -22%; opacity: .82; }
  .cloud-one { top: -13%; right: -55%; width: 155vw; height: 115vw; filter: blur(12px); }
  .cloud-two { right: -55%; bottom: -9%; width: 150vw; height: 92vw; filter: blur(12px); }
  .cloud-three { top: 14%; left: -70%; width: 130vw; height: 110vw; filter: blur(12px); }
  .hero-watermark { top: 18%; right: -20vw; font-size: 74vw; }
  h1 { font-size: clamp(54px, 15.5vw, 76px); line-height: .88; }
  .hero-bottom { margin-top: 55px; flex-direction: column; align-items: stretch; gap: 34px; }
  .hero-points { gap: 9px 16px; margin-top: 18px; }
  .hero-bottom .discord { width: 100%; }
  .scroll { display: none; }
  .about-grid { display: block; }
  .about h2 { font-size: 44px; }
  .about-grid > p { margin-top: 40px; }
  .purposes article { grid-template-columns: 42px 1fr; gap: 22px; padding: 38px 0; }
  .purposes article p { grid-column: 2; }
  .closing { min-height: 720px; }
  .closing h2 { font-size: 58px; }
  .closing .discord { width: 100%; }
  .footer > div:first-child { display: block; }
  .footer p { margin-top: 35px; }
  .footer nav { gap: 20px 28px; }
  .footer-bottom { flex-direction: column; gap: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
</style>
