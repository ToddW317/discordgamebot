const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('votes')
        .setDescription('Show current vote standings for all games'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 The game list is empty!',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        if (!gamesData.games || gamesData.games.length === 0) {
            return await interaction.reply({
                content: '📋 The game list is empty!',
                ephemeral: true
            });
        }
        
        // Create array of games with vote data
        const gamesWithVotes = gamesData.games.map(game => {
            const voteData = gamesData.votes && gamesData.votes[game.name] ? gamesData.votes[game.name] : { totalVotes: 0, voters: [] };
            const bonus = Math.min(voteData.totalVotes * 10, 50);
            
            return {
                name: game.name,
                votes: voteData.totalVotes,
                bonus: bonus,
                voters: voteData.voters
            };
        });
        
        // Sort by votes (descending)
        gamesWithVotes.sort((a, b) => b.votes - a.votes);
        
        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🗳️ Current Vote Standings')
            .setDescription('Each vote adds 10% selection chance (max 50%)')
            .setTimestamp();
        
        // Add games with votes
        if (gamesWithVotes.some(g => g.votes > 0)) {
            let description = '';
            
            gamesWithVotes.forEach((game, index) => {
                if (game.votes > 0) {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                    const maxIndicator = game.bonus >= 50 ? ' 🔥 **MAX**' : '';
                    description += `${medal} **${game.name}**\n`;
                    description += `   ${game.votes} vote${game.votes !== 1 ? 's' : ''} (+${game.bonus}%)${maxIndicator}\n\n`;
                }
            });
            
            embed.addFields({
                name: 'Games with Votes',
                value: description || 'No votes yet!'
            });
        } else {
            embed.addFields({
                name: 'No Votes Yet',
                value: 'Use `/votegame` to vote for your favorite games!'
            });
        }
        
        // Add games without votes in a compact format
        const gamesWithoutVotes = gamesWithVotes.filter(g => g.votes === 0);
        if (gamesWithoutVotes.length > 0) {
            embed.addFields({
                name: 'Games without votes',
                value: gamesWithoutVotes.map(g => g.name).join(', ') || 'None'
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    },
}; 