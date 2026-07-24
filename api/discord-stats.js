export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  // Fallback defaults
  const fallbackStats = {
    success: true,
    online: 10,
    offline: 19,
    total: 29,
    isFallback: true
  };

  try {
    if (botToken && guildId) {
      const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const online = data.approximate_presence_count ?? 10;
        const total = data.approximate_member_count ?? 29;
        const offline = Math.max(0, total - online);

        return res.status(200).json({
          success: true,
          online,
          offline,
          total,
          guildName: data.name || 'ADASH Labs',
          isFallback: false
        });
      }
    }

    // Try public widget fallback if guildId is available
    if (guildId) {
      const widgetRes = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
      if (widgetRes.ok) {
        const widgetData = await widgetRes.json();
        const online = widgetData.presence_count ?? 10;
        const members = widgetData.members ? widgetData.members.length : 10;
        const total = Math.max(members, online, 29);
        const offline = Math.max(0, total - online);

        return res.status(200).json({
          success: true,
          online,
          offline,
          total,
          guildName: widgetData.name || 'ADASH Labs',
          isFallback: true
        });
      }
    }

    // Return friendly default stats if env variables are not configured yet
    return res.status(200).json(fallbackStats);
  } catch (error) {
    console.error('Discord API Error:', error);
    return res.status(200).json(fallbackStats);
  }
}
