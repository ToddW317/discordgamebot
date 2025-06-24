const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removegame')
        .setDescription('Remove a game from the party game list')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('The name of the game to remove')
                .setRequired(true)),
    async execute(interaction) {
        const gameName = interaction.options.getString('game');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        
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
        
        // Find the game
        const gameIndex = gamesData.games.findIndex(g => g.name.toLowerCase() === gameName.toLowerCase());
        
        if (gameIndex === -1) {
            return await interaction.reply({
                content: `❌ **${gameName}** was not found in the game list!`,
                ephemeral: true
            });
        }
        
        // Remove the game
        const removedGame = gamesData.games.splice(gameIndex, 1)[0];
        
        // Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(gamesData, null, 2));
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🗑️ Game Removed!')
            .setDescription(`**${removedGame.name}** has been removed from the party game list!`)
            .addFields(
                { name: 'Remaining Games', value: `${gamesData.games.length}`, inline: true },
                { name: 'Removed By', value: `<@${userId}>`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
}; 