<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { site } from '../config/site'

const route = useRoute()
const router = useRouter()

const post = computed(() => {
  return site.blog.posts.find((p) => p.slug === route.params.slug)
})

const relatedPosts = computed(() => {
  if (!post.value) return []
  return site.blog.posts
    .filter((p) => p.slug !== post.value.slug)
    .slice(0, 3)
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const paragraphs = computed(() => {
  if (!post.value) return []
  return post.value.content.split('\n\n')
})

const formatParagraph = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/•/g, '<br>•')
}

const updateMeta = () => {
  if (!post.value) return
  document.title = `${post.value.title} | ADASH Labs Blog`
  const setMeta = (selector, attr, value) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }
  setMeta('meta[name="description"]', 'content', post.value.excerpt)
  setMeta('meta[property="og:title"]', 'content', `${post.value.title} | ADASH Labs Blog`)
  setMeta('meta[property="og:description"]', 'content', post.value.excerpt)
  setMeta('meta[property="og:url"]', 'content', `${site.seo.canonicalUrl}blog/${post.value.slug}`)
  setMeta('link[rel="canonical"]', 'href', `${site.seo.canonicalUrl}blog/${post.value.slug}`)
}

onMounted(() => {
  if (!post.value) {
    router.replace('/')
    return
  }
  updateMeta()
  window.scrollTo(0, 0)
})

watch(() => route.params.slug, () => {
  if (!post.value) {
    router.replace('/')
    return
  }
  updateMeta()
  window.scrollTo(0, 0)
})
</script>

<template>
  <main class="blog-page" v-if="post">
    <article class="blog-post">
      <div class="blog-post-hero">
        <router-link to="/" class="blog-back">← Ana sayfaya dön</router-link>
        <div class="blog-post-meta">
          <span class="blog-category">{{ post.category }}</span>
          <span class="blog-meta-date">{{ formatDate(post.date) }} · {{ post.readTime }} okuma</span>
        </div>
        <h1>{{ post.title }}</h1>
        <p class="blog-post-excerpt">{{ post.excerpt }}</p>
      </div>

      <div class="blog-post-body">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          v-html="formatParagraph(paragraph)"
        ></p>
      </div>

      <div class="blog-post-cta">
        <p>Bu konuları toplulukta tartışmak ister misin?</p>
        <a class="discord" :href="site.discordUrl" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" /></svg>
          <span>Discord'a katıl</span><b>↗</b>
        </a>
      </div>

      <!-- Related Posts -->
      <div class="blog-related" v-if="relatedPosts.length">
        <h2>Diğer Yazılar</h2>
        <div class="blog-related-grid">
          <router-link
            v-for="related in relatedPosts"
            :key="related.slug"
            :to="`/blog/${related.slug}`"
            class="blog-related-card"
          >
            <span class="blog-category">{{ related.category }}</span>
            <h3>{{ related.title }}</h3>
            <span class="blog-meta-date">{{ formatDate(related.date) }}</span>
          </router-link>
        </div>
      </div>
    </article>

    <!-- Blog Post SEO Content -->
    <div class="seo-content" aria-hidden="true">
      <h2>{{ post.title }} — ADASH Labs Blog</h2>
      <p>{{ post.excerpt }} ADASH Labs Discord yazılım topluluğu ve yapay zeka topluluğu blog yazısı.</p>
    </div>
  </main>
</template>

<style scoped>
.blog-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding-top: 118px;
}
.blog-post {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 clamp(24px, 5vw, 80px);
}
.blog-back {
  display: inline-block;
  margin-bottom: 40px;
  color: #8b9cf7;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: .02em;
  transition: color .2s, transform .2s;
}
.blog-back:hover {
  color: #a5b4fc;
  transform: translateX(-4px);
}
.blog-post-hero {
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  margin-bottom: 48px;
}
.blog-post-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.blog-meta-date {
  color: #666;
  font: 12px ui-monospace, monospace;
}
.blog-post-hero h1 {
  margin: 0 0 20px;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.15;
  letter-spacing: -.04em;
  font-weight: 600;
}
.blog-post-excerpt {
  margin: 0;
  color: #999;
  font-size: 17px;
  line-height: 1.7;
}
.blog-post-body {
  margin-bottom: 56px;
}
.blog-post-body p {
  margin: 0 0 22px;
  color: #ccc;
  font-size: 16px;
  line-height: 1.9;
}
.blog-post-body :deep(strong) {
  color: #f0f0f0;
  font-weight: 600;
  display: block;
  margin-top: 36px;
  margin-bottom: 10px;
  font-size: 20px;
  letter-spacing: -.02em;
}
.blog-post-cta {
  padding: 36px;
  border-radius: 16px;
  background: rgba(88, 101, 242, .06);
  border: 1px solid rgba(88, 101, 242, .15);
  text-align: center;
  margin-bottom: 72px;
}
.blog-post-cta > p {
  margin: 0 0 22px;
  color: #ccc;
  font-size: 16px;
}
.blog-post-cta .discord {
  margin: 0 auto;
}
.blog-related {
  padding: 56px 0 80px;
  border-top: 1px solid rgba(255, 255, 255, .08);
}
.blog-related h2 {
  margin: 0 0 32px;
  font-size: 28px;
  letter-spacing: -.03em;
  font-weight: 500;
}
.blog-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.blog-related-card {
  display: block;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, .06);
  border-radius: 12px;
  background: rgba(255, 255, 255, .02);
  text-decoration: none;
  transition: transform .3s, border-color .3s, background .3s;
}
.blog-related-card:hover {
  transform: translateY(-3px);
  border-color: rgba(88, 101, 242, .3);
  background: rgba(88, 101, 242, .04);
}
.blog-related-card h3 {
  margin: 12px 0;
  font-size: 16px;
  line-height: 1.35;
  letter-spacing: -.02em;
  font-weight: 500;
  color: #e8e8e8;
}

@media (max-width: 700px) {
  .blog-page { padding-top: 92px; }
  .blog-post-hero h1 { font-size: 28px; }
  .blog-post-cta { padding: 24px; }
  .blog-related-grid { grid-template-columns: 1fr; }
}
</style>
