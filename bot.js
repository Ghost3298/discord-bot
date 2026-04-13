const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(3000, () => {
  console.log('🌐 Web server running');
});

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN =  process.env.TOKEN;

// Game aliases
const gameMap = {
  cs2: "Counter-Strike 2",
  apex: "Apex Legends",
  cod: "Call of Duty",
  ba: "Broken Arrow",
  lol: "League of Legends",
  dota2: "Dota 2",
  val: "VALORANT"
};

let data = {};
if (fs.existsSync('data.json')) {
  data = JSON.parse(fs.readFileSync('data.json'));
}

const sessions = {};

function save() {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

client.on('clientReady', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
});

// 🎮 TRACK PLAYTIME
client.on('presenceUpdate', (oldP, newP) => {
  try {
    if (!newP || !newP.user) return;

    const userId = newP.user.id;
    const activity = newP.activities.find(a => a.type === 0);

    // START PLAYING
    if (activity && activity.name) {
      sessions[userId] = {
        game: activity.name,
        start: Date.now()
      };
    } 
    // STOP PLAYING
    else if (sessions[userId]) {
      const session = sessions[userId];

      // 🔥 SAFETY CHECK
      if (!session.game) {
        delete sessions[userId];
        return;
      }

      const duration = Date.now() - session.start;
      const game = session.game;

      // 🔥 FULL SAFE INIT
      if (!data[userId]) data[userId] = {};
      if (!data[userId].total) data[userId].total = 0;
      if (!data[userId].games || typeof data[userId].games !== "object") {
        data[userId].games = {};
      }
      if (!data[userId].games[game]) data[userId].games[game] = 0;

      data[userId].total += duration;
      data[userId].games[game] += duration;

      save();
      delete sessions[userId];
    }

  } catch (err) {
    console.log("⚠️ ERROR CAUGHT:", err.message);
  }
});

// 💬 COMMANDS
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");
  const command = args[0].toLowerCase();

  // 🏓 PING
  if (command === "!ping") {
    return msg.reply("🏓 Pong!");
  }

  // 🏆 TOTAL LEADERBOARD
  if (command === "!leaderboard" && args.length === 1) {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);

    let text = "🏆 Top Players (Total Time)\n\n";

    for (let i = 0; i < sorted.length; i++) {
      const user = await client.users.fetch(sorted[i][0]);
      const hours = (sorted[i][1].total / 3600000).toFixed(1);

      text += `${i + 1}. ${user.username} — ${hours}h\n`;
    }

    return msg.reply(text || "No data yet.");
  }

  // 🎮 GAME LEADERBOARD
  if (command === "!leaderboard" && args[1]) {
    const input = args[1].toLowerCase();
    const gameName = gameMap[input];

    if (!gameName) {
      return msg.reply("❌ Unknown game.");
    }

    let results = [];

    for (const userId in data) {
      const games = data[userId].games;
      if (!games || !games[gameName]) continue;

      results.push({
        userId,
        time: games[gameName]
      });
    }

    results.sort((a, b) => b.time - a.time);

    let text = `🎮 ${gameName} Leaderboard\n\n`;

    for (let i = 0; i < results.length && i < 10; i++) {
      const user = await client.users.fetch(results[i].userId);
      const hours = (results[i].time / 3600000).toFixed(1);

      text += `${i + 1}. ${user.username} — ${hours}h\n`;
    }

    return msg.reply(text || "No data yet.");
  }

  // 🥇 TOP GAME PER PLAYER
  if (command === "!topgame") {
    const input = args[1]?.toLowerCase();
    const filterGame = gameMap[input];

    let results = [];

    for (const userId in data) {
      const games = data[userId].games;
      if (!games) continue;

      // 🎯 IF specific game requested
      if (filterGame) {
        if (!games[filterGame]) continue;

        const user = await client.users.fetch(userId);
        results.push({
          name: user.username,
          game: filterGame,
          time: games[filterGame]
        });
      } 
      // 🧠 NORMAL MODE (top game per user)
      else {
        let topGame = null;
        let maxTime = 0;

        for (const game in games) {
          if (games[game] > maxTime) {
            maxTime = games[game];
            topGame = game;
          }
        }

        if (topGame) {
          const user = await client.users.fetch(userId);
          results.push({
            name: user.username,
            game: topGame,
            time: maxTime
          });
        }
      }
    }

    results.sort((a, b) => b.time - a.time);

    let text = filterGame
      ? `🎮 Top Players in ${filterGame}\n\n`
      : "🎮 Top Players & Their Main Game\n\n";

    for (let i = 0; i < results.length && i < 5; i++) {
      const hours = (results[i].time / 3600000).toFixed(1);
      text += `${i + 1}. ${results[i].name} — ${hours}h — ${results[i].game}\n`;
    }

    return msg.reply(text || "No data yet.");
  }
});

client.login(TOKEN);