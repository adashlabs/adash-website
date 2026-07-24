# ADASH Labs — Web Platformu

Yazılım geliştiriciler, yapay zekâ meraklıları ve teknoloji üretenler için tasarlanmış bağımsız topluluk platformu web sitesi.

Proje; **Vue 3**, **Vite** ve **Vercel Serverless Functions** mimarisi kullanılarak geliştirilmiş modern, performanslı ve responsive bir web uygulamasıdır.

---

## ⚡ Özellikler

* **Modern Dark Mode Tasarım:** Glassmorphism, akıcı tipografi ve dinamik CSS/Canvas sis & bulut arka plan efektleri.
* **Canlı Discord Üye Durumu:** Serverless API desteğiyle güvenli bir şekilde sunucudaki anlık **Aktif (Online)**, **Çevrimdışı (Offline)** ve **Toplam Üye** sayılarını gösteren canlı sayaç.
* **Blog & İçerik Yönetimi:** Topluluk rehberleri ve blog yazıları için dinamik sayfa yönlendirmeleri.
* **SEO ve Mobil Uyumlu:** Arama motorları için optimize edilmiş meta etiketleri ve tüm ekran boyutlarına tam uyum.

---

## 🛠 Geliştirme ve Yerel Kurulum

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Üretim (Production) derlemesi alın
npm run build
```

---

## ☁️ Vercel Dağıtımı ve Çevre Değişkenleri

Proje **Vercel** platformu üzerinde sorunsuz dağıtılacak şekilde yapılandırılmıştır. Anlık Discord canlı üye verilerinin çekilebilmesi için Vercel panelinde aşağıdaki çevre değişkenlerinin (*Environment Variables*) tanımlanması gerekmektedir:

| Çevre Değişkeni | Açıklama |
| :--- | :--- |
| `DISCORD_BOT_TOKEN` | Discord Developer Portal üzerinden alınan gizli Bot Token |
| `DISCORD_GUILD_ID` | Discord Sunucunuzun benzersiz ID değeri (Server ID) |

*Not: Çevre değişkenleri tanımlanmadığı durumlarda sistem tasarımı bozmayacak şekilde otomatik yedek (fallback) verilerle çalışmaya devam eder.*

---

## 📜 Kullanım, Dağıtım ve Lisans Koşulları

Bu projenin kaynak kodları açık şekilde inceleme, öğrenme, uyarlama ve geliştirme amacıyla paylaşılmıştır. Kaynak kodları aşağıdaki şartlara uyulması kaydıyla serbestçe kullanılabilir ve dağıtılabilir:

> [!IMPORTANT]
> **Marka ve Kimlik Hakları Korunması:**
> * Bu kaynak kodlar veya türetilmiş sürümleri; **ADASH Labs** markasını, logosunu, resmi kimliğini veya topluluğunu **taklit etmemek** ve **doğrudan/dolaylı olarak resmi bir ADASH servisiymiş izlenimi vermemek** kaydıyla özgürce dağıtılabilir, uyarlanabilir ve geliştirilebilir.
> * Kullanım esnasında ADASH Labs kimliği altında yanıltıcı faaliyetlerde bulunulması kesinlikle yasaktır.

---

<p align="center">
  <b>ADASH Labs</b> — Üretenler burada birbirini bulur.
</p>
