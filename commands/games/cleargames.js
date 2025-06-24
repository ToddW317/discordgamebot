const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleargames')
        .setDescription('Remove all games from the list (keeps votes for next session)'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 There is no game list to clear!',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        if (!gamesData.games || gamesData.games.length === 0) {
            return await interaction.reply({
                content: '📋 The game list is already empty!',
                ephemeral: true
            });
        }
        
        const gameCount = gamesData.games.length;
        
        // Clear only the games array
        gamesData.games = [];
        
        // Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(gamesData, null, 2));
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ Games Cleared!')
            .setDescription(`All ${gameCount} games have been removed from the list.`)
            .setFooter({ text: 'Vote data has been preserved for future use' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
}; 