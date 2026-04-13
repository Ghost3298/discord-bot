# Discord Playtime Tracker Bot

## Overview
A Node.js Discord bot that tracks guild member game presence time and reports leaderboards through chat commands.

## Project Structure
- `bot.js` — main Discord bot process and command handlers.
- `data.json` — local JSON persistence for tracked playtime totals.
- `package.json` / `package-lock.json` — Node.js dependency manifest using `discord.js`.

## Runtime
- Node.js 20
- Start command: `npm start`
- Required secret: `TOKEN` containing the Discord bot token. `DISCORD_TOKEN` is also accepted as a fallback.

## Replit Setup
- This is a background bot, not a web frontend.
- The workflow should run as a console process with `npm start`.
- Production deployment should use an always-running VM target with `npm start` so the bot can remain connected to Discord.
