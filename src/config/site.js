const discordUrl = 'https://go.adash.me/discord'

export const site = {
  name: 'ADASH',
  logo: '/logo-cropped.webp',
  discordUrl,

  seo: {
    title: 'ADASH | Yazılım, Yapay Zekâ ve Teknoloji Topluluğu',
    description: 'ADASH; yazılım geliştirme, yapay zekâ ile kodlama ve teknoloji projeleri üretenlerin Discord topluluğudur. Projeni paylaş, geri bildirim al ve ekip arkadaşını bul.',
    keywords: 'yazılım topluluğu, yapay zeka topluluğu, yapay zeka ile kodlama, yazılımcı discord, teknoloji topluluğu, proje geliştirme, discord yazılım sunucusu, AI coding, açık kaynak topluluğu',
    canonicalUrl: 'https://adash.me/',
    ogImage: '/og-image.png',
    favicon: '/favicon.ico',
  },

  hero: {
    eyebrow: 'Bağımsız yazılım ve yapay zekâ topluluğu',
    title: 'Üretenler burada',
    titleAccent: 'birbirini bulur.',
    description: 'Fikrini projeye dönüştürmek için doğru insanlarla tanış. Ürettiğini paylaş, gerçek geri bildirim al ve ekibini kur.',
    points: ['Projeni sun', 'Geri bildirim al', 'Ekibini bul'],
    button: "Discord'a katıl",
  },

  about: {
    label: 'Topluluğun amacı',
    title: 'Bilgiyi paylaş. Projeni göster. Birlikte geliştir.',
    description: 'ADASH; fikirlerin konuşulduğu, projelerin topluluğa sunulduğu ve doğru insanların birbirini bulduğu bir üretim alanıdır. Deneyimin ne olursa olsun burada soru sorabilir, öğrendiğini paylaşabilir ve yeni ekipler kurabilirsin.',
  },

  purposes: [
    {
      number: '01',
      title: 'Yazılım',
      text: 'Web, mobil, backend ve açık kaynak projelerini paylaş; geri bildirim al ve ekip arkadaşını bul.',
    },
    {
      number: '02',
      title: 'Yapay zekâ ile kodlama',
      text: 'Yeni nesil yapay zekâ araçlarını, üretim yöntemlerini ve gerçek kullanım deneyimlerini birlikte keşfet.',
    },
    {
      number: '03',
      title: 'Teknoloji ve proje',
      text: 'Fikrini topluluğa sun, geliştirme sürecini paylaş ve ürününü daha iyi hâle getirecek insanlarla tanış.',
    },
  ],

  closing: {
    label: 'ADASH Discord topluluğu',
    title: 'Fikrini tek başına tutma.',
    description: 'Topluluğa katıl, ürettiklerini paylaş ve birlikte geliştireceğin insanlarla tanış.',
    button: "Discord'a katıl",
  },

  socials: [
    { name: 'Discord', url: discordUrl },
   // { name: 'Instagram', url: 'https://instagram.com/ADASH_HESABINIZ' },
   /// { name: 'X', url: 'https://x.com/ADASH_HESABINIZ' },
    /// { name: 'YouTube', url: 'https://youtube.com/@ADASH_HESABINIZ' },
    /// { name: 'GitHub', url: 'https://github.com/ADASH_HESABINIZ' },
    /// { name: 'LinkedIn', url: 'https://linkedin.com/company/ADASH_HESABINIZ' },
  ],

  footerText: 'Yazılım, yapay zekâ ve teknoloji topluluğu.',
  copyright: `© ${new Date().getFullYear()} ADASH`,
}
