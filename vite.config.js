import { mkdir, writeFile } from 'node:fs/promises'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { site } from './src/config/site.js'

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const absoluteUrl = (path) => new URL(path, site.seo.canonicalUrl).href

const robotsTxt = () => `# ADASH public crawler policy
User-agent: *
Allow: /

# AI search and assistant crawlers
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`

const sitemapXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(site.seo.canonicalUrl)}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

const llmsTxt = () => `# ${site.name}

> ${site.seo.description}

## About
${site.about.description}

## Community focus
${site.purposes.map(({ title, text }) => `- **${title}**: ${text}`).join('\n')}

## Key information
- Website: ${site.seo.canonicalUrl}
- Discord community: ${site.discordUrl}
- Language: Turkish (tr-TR)
- Audience: Developers, AI-assisted coders, technology builders, and project teams.

## Primary topics
${site.seo.keywords.split(', ').map((keyword) => `- ${keyword}`).join('\n')}

## Social links
${site.socials.map(({ name, url }) => `- ${name}: ${url}`).join('\n')}
`

const generatedFiles = () => ({
  '/robots.txt': robotsTxt(),
  '/sitemap.xml': sitemapXml(),
  '/llms.txt': llmsTxt(),
})

const siteConfigPlugin = () => ({
  name: 'adash-site-config',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      const organizationId = `${site.seo.canonicalUrl}#organization`
      const structuredData = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': organizationId,
            name: site.name,
            url: site.seo.canonicalUrl,
            logo: absoluteUrl(site.logo),
            description: site.seo.description,
            knowsAbout: ['Yazılım geliştirme', 'Yapay zekâ ile kodlama', 'Teknoloji projeleri', 'Açık kaynak'],
            sameAs: site.socials.map(({ url }) => url),
          },
          {
            '@type': 'WebSite',
            '@id': `${site.seo.canonicalUrl}#website`,
            url: site.seo.canonicalUrl,
            name: site.name,
            description: site.seo.description,
            inLanguage: 'tr-TR',
            publisher: { '@id': organizationId },
          },
        ],
      }).replaceAll('<', '\\u003c')

      const values = {
        '{{SITE_NAME}}': escapeHtml(site.name),
        '{{TITLE}}': escapeHtml(site.seo.title),
        '{{DESCRIPTION}}': escapeHtml(site.seo.description),
        '{{KEYWORDS}}': escapeHtml(site.seo.keywords),
        '{{CANONICAL_URL}}': escapeHtml(site.seo.canonicalUrl),
        '{{OG_IMAGE}}': escapeHtml(absoluteUrl(site.seo.ogImage)),
        '{{FAVICON}}': escapeHtml(site.seo.favicon),
        '{{JSON_LD}}': structuredData,
      }

      return Object.entries(values).reduce(
        (output, [token, value]) => output.replaceAll(token, value),
        html,
      )
    },
  },
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const path = (request.url || '').split('?')[0]
      const content = generatedFiles()[path]
      if (!content) return next()
      response.setHeader('Content-Type', path.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8')
      response.end(content)
    })
  },
  async closeBundle() {
    await mkdir('dist', { recursive: true })
    await Promise.all(
      Object.entries(generatedFiles()).map(([path, content]) => writeFile(`dist${path}`, content)),
    )
  },
})

export default defineConfig({
  plugins: [siteConfigPlugin(), vue()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },
})
