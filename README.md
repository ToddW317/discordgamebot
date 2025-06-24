# Discord Game Selector Bot 🎮

A Discord bot that helps parties/lobbies randomly select games to play together! Users can add games to a shared list and let the bot randomly pick one when it's time to play.

## Features

- 📝 **Add games** to your server's game list
- 📋 **View all games** in the list with vote counts
- 🎲 **Randomly select** a game to play (weighted by votes)
- 🗳️ **Vote for games** to increase their selection chances
- 🗑️ **Remove games** from the list
- 💾 Persistent storage per server
- 🎨 Beautiful embed messages
- ⚖️ **Weighted selection** - Each vote adds 10% chance (max 50%)

## Commands

### Game Management
- `/addgame <game>` - Add a game to the list
- `/listgames` - Show all games in the list with vote counts
- `/removegame <game>` - Remove a specific game from the list
- `/cleargames` - Remove all games (keeps vote data)

### Voting System
- `/votegame <game>` - Vote for a game (+10% selection chance per vote, max 50%)
- `/votes` - Show current vote standings
- `/clearvotes` - Clear all votes only

### Game Selection
- `/playgame` - Randomly select a game to play (weighted by votes)
- `/democracy [duration]` - Live voting with reactions (default 60s, e.g., `/democracy 30s`)

### Reset
- `/reset` - Complete reset - removes all games and votes (requires confirmation)

## Setup Instructions

### Prerequisites

- Node.js v16.9.0 or higher
- A Discord account
- Your bot token from Discord Developer Portal

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure the Bot

1. Copy `env.example` to `.env`:
   ```bash
   copy env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```
   DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
   GUILD_ID=YOUR_TEST_SERVER_ID (optional)
   ```

### Step 3: Get Your Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on your application (you already have one with ID: 1387107853143248997)
3. Go to the "Bot" section in the left sidebar
4. Click "Reset Token" to get a new token (save it securely!)
5. Copy the token and paste it in your `.env` file

### Step 4: Set Bot Permissions

In the Discord Developer Portal:
1. Go to "Bot" section
2. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent (if needed)
   - ✅ Message Content Intent (if needed)

### Step 5: Invite Your Bot

1. In Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Read Message History
4. Copy the generated URL and open it to invite your bot

### Step 6: Deploy Commands & Run

1. Deploy slash commands:
   ```bash
   npm run deploy
   ```

2. Start the bot:
   ```bash
   npm start
   ```

## File Structure

```
discordbot/
├── commands/
│   └── games/
│       ├── addgame.js
│       ├── listgames.js
│       ├── playgame.js
│       └── removegame.js
├── events/
│   ├── ready.js
│   └── interactionCreate.js
├── data/
│   └── (game data stored here per server)
├── index.js
├── deploy-commands.js
├── config.json
├── package.json
└── .env
```

## Troubleshooting

### Bot is not responding to commands
- Make sure you've deployed the commands with `npm run deploy`
- Check that your bot has the proper permissions in your server
- Verify your bot token is correct in `.env`

### Commands not showing up
- If testing in a specific server, add the `GUILD_ID` to `.env`
- Global commands can take up to 1 hour to appear
- Try kicking and re-inviting the bot

### Bot goes offline
- Check the console for error messages
- Verify your token hasn't been regenerated
- Ensure Node.js version is 16.9.0 or higher

## How the Voting System Works

1. **Each user can vote once per game** using `/votegame <game>`
2. **Each vote adds 10% to selection chance** (base chance is 100%)
3. **Maximum bonus is 50%** (reached at 5 votes)
4. **Votes are cleared after game selection** or manually with `/clearvotes`
5. **Check standings anytime** with `/votes` command

### Example:
- Game A: 0 votes = 100% weight (normal chance)
- Game B: 3 votes = 130% weight (+30% chance)
- Game C: 5 votes = 150% weight (+50% chance, MAX)

## Democracy Mode Features

The `/democracy` command creates an interactive live voting session:

1. **Reaction-based voting** - Click number emojis to vote
2. **Exclusive voting** - One vote per person, changing vote removes previous
3. **Live updates** - Vote counts update every 5 seconds with progress bars
4. **Customizable timer** - Set duration from 10s to 5m (e.g., `30s`, `2m`)
5. **Visual countdown** - Embed color changes as time runs out
6. **Smart results** - Handles ties with random selection from winners
7. **Up to 10 games** - Limited by Discord's reaction system

### Usage Examples:
- `/democracy` - Default 60-second vote
- `/democracy 30s` - Quick 30-second vote
- `/democracy 2m` - Extended 2-minute vote

## Next Steps

You can extend this bot by:
- Adding categories for games
- Adding game descriptions and player counts
- Creating user-specific game lists
- Adding cooldowns to prevent spam
- Implementing vote expiration times
- Adding minimum player requirements for games

## Support

If you need help, check the [Discord.js Guide](https://discordjs.guide/) or the [Discord Developer Documentation](https://discord.com/developers/docs).

---

Made with ❤️ for Discord gaming communities! 