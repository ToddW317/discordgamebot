const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearvotes')
        .setDescription('Clear all votes for games'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 No game data found!',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        // Check if there are any votes
        if (!gamesData.votes || Object.keys(gamesData.votes).length === 0) {
            return await interaction.reply({
                content: '🗳️ There are no votes to clear!',
                ephemeral: true
            });
        }
        
        // Count total votes before clearing
        let totalVotes = 0;
        let gamesWithVotes = 0;
        
        for (const game in gamesData.votes) {
            if (gamesData.votes[game].totalVotes > 0) {
                totalVotes += gamesData.votes[game].totalVotes;
                gamesWithVotes++;
            }
        }
        
        // Clear all votes
        gamesData.votes = {};
        
        // Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(gamesData, null, 2));
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ Votes Cleared!')
            .setDescription('All game votes have been reset.')
            .addFields(
                { name: 'Total Votes Cleared', value: `${totalVotes}`, inline: true },
                { name: 'Games Affected', value: `${gamesWithVotes}`, inline: true }
            )
            .setFooter({ text: 'Ready for a new round of voting!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
}; 