<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const loading = ref(true)
const stats = ref({
  online: 10,
  offline: 19,
  total: 29,
  isFallback: true
})

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/discord-stats')
    if (res.ok) {
      const data = await res.json()
      stats.value = data
    }
  } catch (err) {
    // Fallback if local dev server without Vercel CLI
    console.log('Discord Stats API using local fallback:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
  // Refresh stats every 2 minutes
  const timer = setInterval(fetchStats, 120000)
  return () => clearInterval(timer)
})
</script>

<template>
  <div class="discord-stats-badge" :class="{ compact }">
    <div class="stats-container">
      <!-- Active / Online Badge -->
      <div class="stat-item active" title="Şu an Discord'da aktif olan üyeler">
        <span class="pulse-indicator">
          <span class="ping"></span>
          <span class="dot"></span>
        </span>
        <div class="stat-info">
          <span class="count">{{ loading ? '...' : stats.online }}</span>
          <span class="label">Aktif Üye</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Offline Badge -->
      <div class="stat-item offline" title="Şu an çevrimdışı olan üyeler">
        <span class="offline-dot"></span>
        <div class="stat-info">
          <span class="count">{{ loading ? '...' : stats.offline }}</span>
          <span class="label">Çevrimdışı</span>
        </div>
      </div>

      <div class="divider hidden-mobile"></div>

      <!-- Total Badge -->
      <div class="stat-item total hidden-mobile" title="Topuluktaki toplam kayıtlı üye sayısı">
        <svg class="discord-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.5 1a14 14 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.6 16.6 0 0 0 5 2.5l1.2-1.7a10.6 10.6 0 0 1-1.8-.9l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.2 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.2-.8-7.9-3-11.1ZM8.6 14.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" />
        </svg>
        <div class="stat-info">
          <span class="count">{{ loading ? '...' : stats.total }}</span>
          <span class="label">Toplam Üye</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discord-stats-badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(18, 20, 24, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(88, 101, 242, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  user-select: none;
}

.discord-stats-badge:hover {
  transform: translateY(-2px);
  border-color: rgba(88, 101, 242, 0.45);
  box-shadow: 0 12px 40px rgba(88, 101, 242, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.discord-stats-badge.compact {
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(18, 20, 24, 0.6);
}

.stats-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-info {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.count {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  letter-spacing: -0.02em;
}

.compact .count {
  font-size: 13px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #949ba4;
}

.compact .label {
  font-size: 11px;
}

/* Active Pulse Indicator */
.pulse-indicator {
  position: relative;
  display: flex;
  width: 10px;
  height: 10px;
}

.pulse-indicator .ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: #23a55a;
  opacity: 0.75;
  animation: pulse-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.pulse-indicator .dot {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #23a55a;
  box-shadow: 0 0 10px #23a55a;
}

@keyframes pulse-ping {
  75%, 100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

/* Offline Indicator */
.offline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: #80848e;
  border: 2px solid #2b2d31;
}

/* Discord Icon */
.discord-icon {
  width: 16px;
  height: 16px;
  fill: #5865f2;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
}

@media (max-width: 640px) {
  .hidden-mobile {
    display: none !important;
  }
  .stats-container {
    gap: 12px;
  }
}
</style>
