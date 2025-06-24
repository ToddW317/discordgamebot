const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('democracy')
        .setDescription('Start a live voting session for game selection')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Voting duration (e.g., 30s, 2m, 90s) - default is 60s')
                .setRequired(false)),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const durationInput = interaction.options.getString('duration') || '60s';
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games first.',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        if (!gamesData.games || gamesData.games.length === 0) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games first.',
                ephemeral: true
            });
        }
        
        // Parse duration
        const duration = parseDuration(durationInput);
        if (!duration) {
            return await interaction.reply({
                content: '❌ Invalid duration format! Use formats like: 30s, 2m, 90s',
                ephemeral: true
            });
        }
        
        // Limit to maximum 25 games for buttons (5 rows × 5 buttons)
        const games = gamesData.games.slice(0, 25);
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', 
                       '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', 
                       '🇰', '🇱', '🇲', '🇳', '🇴'];
        
        // Create the voting embed
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🗳️ Democracy Mode - Live Voting!')
            .setDescription(`Vote for your preferred game by clicking the buttons below!\n\n**⏱️ Time remaining: ${formatTime(duration)}**`)
            .setFooter({ text: 'You can only vote for one game. Changing your vote will remove your previous vote.' })
            .setTimestamp();
        
        // Add games as fields
        games.forEach((game, index) => {
            embed.addFields({
                name: `${emojis[index]} ${game.name}`,
                value: `Added by <@${game.addedBy}>`,
                inline: true
            });
        });
        
        // Create button components (max 5 buttons per row, max 5 rows)
        const components = [];
        for (let i = 0; i < games.length; i += 5) {
            const row = new ActionRowBuilder();
            for (let j = i; j < Math.min(i + 5, games.length); j++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`vote_${j}`)
                        .setLabel(`${j + 1}`)
                        .setEmoji(emojis[j])
                        .setStyle(ButtonStyle.Primary)
                );
            }
            components.push(row);
        }
        
        // Send the voting message
        const message = await interaction.reply({
            embeds: [embed],
            components: components,
            fetchReply: true
        });
        
        // Track votes
        const votes = new Map(); // userId -> gameIndex
        const gameVotes = new Array(games.length).fill(0); // vote count per game
        
        // Create button collector
        const filter = (interaction) => {
            return interaction.customId.startsWith('vote_');
        };
        
        const collector = message.createMessageComponentCollector({ 
            filter,
            componentType: ComponentType.Button,
            time: duration * 1000
        });
        
        console.log(`Started democracy vote for ${games.length} games, duration: ${duration}s`);
        console.log(`Message ID: ${message.id}, Channel: ${message.channel.id}`);
        console.log(`Collector created: ${collector ? 'Yes' : 'No'}`);
        
        // Update timer every 5 seconds
        const startTime = Date.now();
        const timerInterval = setInterval(async () => {
            const timeLeft = Math.max(0, duration - Math.floor((Date.now() - startTime) / 1000));
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                return;
            }
            
            // Update embed with new time
            const updatedEmbed = EmbedBuilder.from(embed)
                .setDescription(`Vote for your preferred game by clicking the reactions below!\n\n**⏱️ Time remaining: ${formatTime(timeLeft)}**`)
                .setColor(timeLeft <= 10 ? 0xff0000 : timeLeft <= 30 ? 0xff9900 : 0x00ff00);
            
            // Add current vote counts
            let voteStatus = '\n**Current Votes:**\n';
            games.forEach((game, index) => {
                const voteCount = gameVotes[index];
                const bar = '█'.repeat(Math.max(1, Math.floor(voteCount / Math.max(1, Math.max(...gameVotes)) * 10)));
                voteStatus += `${emojis[index]} ${game.name}: ${voteCount} ${bar}\n`;
            });
            
            updatedEmbed.addFields({
                name: '📊 Live Results',
                value: voteStatus
            });
            
            try {
                await message.edit({ embeds: [updatedEmbed] });
            } catch (error) {
                // Message might have been deleted
                clearInterval(timerInterval);
            }
        }, 5000);
        
        collector.on('collect', async (buttonInteraction) => {
            const gameIndex = parseInt(buttonInteraction.customId.split('_')[1]);
            const user = buttonInteraction.user;
            
            console.log(`User ${user.username} voted for game ${gameIndex} (${games[gameIndex].name})`);
            
            // Remove previous vote if user voted before
            if (votes.has(user.id)) {
                const previousVote = votes.get(user.id);
                gameVotes[previousVote] = Math.max(0, gameVotes[previousVote] - 1);
                console.log(`Removed previous vote for game ${previousVote}, now has ${gameVotes[previousVote]} votes`);
            }
            
            // Add new vote
            votes.set(user.id, gameIndex);
            gameVotes[gameIndex]++;
            console.log(`Added vote for game ${gameIndex}, now has ${gameVotes[gameIndex]} votes`);
            console.log('Current vote counts:', gameVotes);
            
            // Acknowledge the button click
            await buttonInteraction.reply({
                content: `✅ You voted for **${games[gameIndex].name}**!`,
                ephemeral: true
            });
        });
        
        collector.on('end', async () => {
            clearInterval(timerInterval);
            
            console.log('Democracy voting ended');
            console.log('Final vote counts:', gameVotes);
            console.log('Total votes collected:', votes.size);
            
            // Find winner(s)
            const maxVotes = Math.max(...gameVotes);
            const winners = [];
            
            gameVotes.forEach((voteCount, index) => {
                if (voteCount === maxVotes && voteCount > 0) {
                    winners.push(index);
                }
            });
            
            console.log(`Max votes: ${maxVotes}, Winners: ${winners}`);
            
            let selectedGame;
            let winnerText;
            
            if (winners.length === 0) {
                // No votes - random selection
                selectedGame = games[Math.floor(Math.random() * games.length)];
                winnerText = '🎲 No votes received! Random selection:';
            } else if (winners.length === 1) {
                // Clear winner
                selectedGame = games[winners[0]];
                winnerText = `🏆 Democracy has spoken! Winner with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}:`;
            } else {
                // Tie - random from winners
                const randomWinner = winners[Math.floor(Math.random() * winners.length)];
                selectedGame = games[randomWinner];
                winnerText = `🤝 Tie between ${winners.length} games! Random selection from tied games:`;
            }
            
            // Create results embed
            const resultsEmbed = new EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🗳️ Democracy Results')
                .setDescription(winnerText)
                .addFields({
                    name: '🎮 Selected Game',
                    value: `**${selectedGame.name}**\nLet's play! 🎉`
                })
                .setTimestamp();
            
            // Add final vote breakdown
            let finalResults = '';
            games.forEach((game, index) => {
                const voteCount = gameVotes[index];
                const isWinner = winners.includes(index);
                const medal = isWinner ? '🏆' : '▫️';
                finalResults += `${medal} ${emojis[index]} ${game.name}: ${voteCount} vote${voteCount !== 1 ? 's' : ''}\n`;
            });
            
            resultsEmbed.addFields({
                name: '📊 Final Results',
                value: finalResults || 'No votes recorded'
            });
            
            // Disable all buttons
            const disabledComponents = components.map(row => {
                const newRow = new ActionRowBuilder();
                row.components.forEach(button => {
                    newRow.addComponents(
                        ButtonBuilder.from(button).setDisabled(true)
                    );
                });
                return newRow;
            });
            
            await message.edit({ 
                embeds: [resultsEmbed],
                components: disabledComponents
            });
        });
    },
};

function parseDuration(input) {
    const match = input.match(/^(\d+)([sm])$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit === 's') {
        return Math.min(Math.max(value, 10), 300); // 10s to 5m
    } else if (unit === 'm') {
        return Math.min(Math.max(value * 60, 10), 300); // 10s to 5m
    }
    
    return null;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
} 