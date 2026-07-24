<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CloudIntro from '../components/CloudIntro.vue'
import DiscordStats from '../components/DiscordStats.vue'
import { site } from '../config/site'

const introDone = ref(false)
const router = useRouter()

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const goToPost = (slug) => {
  router.push(`/blog/${slug}`)
}

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
  <CloudIntro v-if="!introDone" @done="introDone = true" />

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
          <div class="cta-box">
            <DiscordStats />
            <a class="discord" :href="site.discordUrl" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
              <span>{{ site.hero.button }}</span><b>↗</b>
            </a>
          </div>
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

    <section id="blog" class="blog section" aria-label="Blog yazıları">
      <div class="section-label" data-reveal>04 — {{ site.blog.label }}</div>
      <h2 class="blog-title" data-reveal>{{ site.blog.title }}</h2>
      <div class="blog-grid">
        <article
          v-for="(post, index) in site.blog.posts"
          :key="post.slug"
          class="blog-card"
          data-reveal
          :style="{ animationDelay: `${index * 0.08}s` }"
          @click="goToPost(post.slug)"
        >
          <div class="blog-card-header">
            <span class="blog-category">{{ post.category }}</span>
            <span class="blog-date">{{ formatDate(post.date) }}</span>
          </div>
          <h3>{{ post.title }}</h3>
          <p>{{ post.excerpt }}</p>
          <div class="blog-card-footer">
            <span class="blog-read-time">{{ post.readTime }} okuma</span>
            <span class="blog-read-more">Devamını oku →</span>
          </div>
        </article>
      </div>
    </section>

    <section class="closing section">
      <div class="closing-content" data-reveal>
        <span>{{ site.closing.label }}</span>
        <h2>{{ site.closing.title }}</h2>
        <p>{{ site.closing.description }}</p>
        <div class="closing-cta">
          <DiscordStats />
          <a class="discord" :href="site.discordUrl" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
            <span>{{ site.closing.button }}</span><b>↗</b>
          </a>
        </div>
      </div>
    </section>
  </main>

  <!-- SEO: Hidden semantic content for search engines -->
  <div class="seo-content" aria-hidden="true">
    <h2>ADASH Labs - Discord Yazılım Topluluğu</h2>
    <p>ADASH Labs, Türkiye'nin en büyük Discord yazılım topluluğu ve Discord yapay zeka topluluğudur. Yazılımcılar, AI geliştiriciler ve teknoloji meraklıları için ücretsiz katılım. Discord yazılım sunucusu arayanlar, Discord yapay zeka sunucusu arayanlar ve Türk yazılım topluluğu arayanlar için ideal platform. Adash Lab olarak da bilinen ADASH Labs, yazılım geliştirme, yapay zeka ile kodlama ve açık kaynak projelerde işbirliği sunar.</p>
  </div>
</template>

<style scoped>
.cta-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.closing-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

@media (max-width: 900px) {
  .cta-box {
    align-items: flex-start;
  }
}
</style>

