import { createApp } from 'vue'
import App from './App.vue'
import { site } from './config/site'

const setMeta = (selector, attribute, value) => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

document.title = site.seo.title
setMeta('meta[name="description"]', 'content', site.seo.description)
setMeta('meta[name="keywords"]', 'content', site.seo.keywords)
setMeta('meta[property="og:title"]', 'content', site.seo.title)
setMeta('meta[property="og:description"]', 'content', site.seo.description)
setMeta('link[rel="canonical"]', 'href', site.seo.canonicalUrl)

createApp(App).mount('#app')
